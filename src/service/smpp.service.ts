import { Injectable, Logger, Inject } from '@nestjs/common';
import * as smpp from 'smpp';
import {
  SMPP_HOST,
  SMPP_PORT,
  SMPP_SYSTEM_ID,
  SMPP_PASSWORD,
} from '../utils/env/env';
import { MODELS } from '../constants/constants';
import { Repository } from 'typeorm';
import { MessageEntity } from '../entity/message.entity';
import { createClient, RedisClientType } from 'redis';
import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } from '../utils/env/env';

export interface SmppConfig {
  host: string;
  port: number;
  system_id: string;
  password: string;
}

export interface SmppMessageParams {
  source_addr_ton: number;
  source_addr_npi: number;
  source_addr: string;
  dest_addr_ton: number;
  dest_addr_npi: number;
  destination_addr: string;
  short_message: string;
  service_type?: string;
  registered_delivery?: number;
  data_coding?: number;
}

@Injectable()
export class SmppService {
  private readonly logger = new Logger(SmppService.name);
  private session: any = null;
  private isConnected = false;
  private config: SmppConfig;
  private redisClient: RedisClientType;

  constructor(
    @Inject(MODELS.SMPP) private readonly smppClient: typeof smpp,
    @Inject(MODELS.MESSAGE)
    private readonly messageRepo: Repository<MessageEntity>,
  ) {
    this.config = {
      host: SMPP_HOST,
      port: SMPP_PORT,
      system_id: SMPP_SYSTEM_ID,
      password: SMPP_PASSWORD,
    };

    this.redisClient = createClient({
      url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
      password: REDIS_PASSWORD || undefined,
    });

    this.redisClient.on('error', (err) =>
      this.logger.error('Redis Client Error', err),
    );
    this.redisClient.connect();
  }

  /**
   * SMPP serverga ulanish
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected && this.session) {
        this.logger.log('SMPP already connected');
        resolve();
        return;
      }

      try {
        this.session = this.smppClient.connect(
          {
            url: `smpp://${this.config.host}:${this.config.port}`,
            debug: true,
          },
          (session: any) => {
            session.bind_transceiver(
              {
                system_id: this.config.system_id,
                password: this.config.password,
              },
              (pdu: any) => {
                if (pdu.command_status === 0) {
                  this.isConnected = true;
                  this.logger.log('SMPP connected successfully');
                  resolve();
                } else {
                  this.logger.error(`SMPP bind failed: ${pdu.command_status}`);
                  reject(new Error(`SMPP bind failed: ${pdu.command_status}`));
                }
              },
            );
          },
        );

        this.session.on('error', (error: any) => {
          this.logger.error('SMPP connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        this.session.on('close', () => {
          this.logger.log('SMPP connection closed');
          this.isConnected = false;
        });

        // Delivery report larni handle qilish
        this.session.on('deliver_sm', (pdu: any) => {
          this.handleDeliveryReport(pdu);
        });
      } catch (error) {
        this.logger.error('Failed to create SMPP session:', error);
        reject(error);
      }
    });
  }

  /**
   * SMPP serverdan uzilish
   */
  async disconnect(): Promise<void> {
    if (this.session && this.isConnected) {
      return new Promise((resolve) => {
        this.session.close();
        this.session.on('close', () => {
          this.isConnected = false;
          this.logger.log('SMPP disconnected');
          resolve();
        });
      });
    }
  }

  /**
   * SMS yuborish
   */
  async sendSms(
    params: SmppMessageParams,
    messageId?: number,
  ): Promise<{ success: boolean; smppMessageId?: string }> {
    if (!this.isConnected || !this.session) {
      this.logger.error('SMPP not connected. Attempting to connect...');
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const submitSmParams = {
        service_type: params.service_type || '',
        source_addr_ton: params.source_addr_ton,
        source_addr_npi: params.source_addr_npi,
        source_addr: params.source_addr,
        dest_addr_ton: params.dest_addr_ton,
        dest_addr_npi: params.dest_addr_npi,
        destination_addr: params.destination_addr,
        short_message: params.short_message,
        registered_delivery: params.registered_delivery || 1,
        data_coding: params.data_coding || 0,
      };

      this.session.submit_sm(submitSmParams, async (pdu: any) => {
        if (pdu.command_status === 0) {
          this.logger.log(
            `SMS sent successfully to ${params.destination_addr}. Message ID: ${pdu.message_id}`,
          );

          // SMPP message ID ni database ga saqlash
          if (messageId && pdu.message_id) {
            try {
              await this.messageRepo.update(
                { id: messageId },
                { smpp_message_id: pdu.message_id },
              );
              this.logger.log(
                `SMPP message ID saved: ${pdu.message_id} for message ${messageId}`,
              );

              try {
                const pending = await this.redisClient.get(
                  `smpp:pending:${pdu.message_id}`,
                );
                if (pending) {
                  try {
                    const parsed = JSON.parse(pending);
                    if (parsed && parsed.since) {
                      await this.messageRepo.update(
                        { id: messageId },
                        { pending_since: new Date(parsed.since) },
                      );
                      this.logger.log(
                        `Applied pending_since (${parsed.since}) from Redis to message ${messageId}`,
                      );
                    }
                  } catch (parseErr) {
                    this.logger.error(
                      'Failed to parse pending payload from Redis:',
                      parseErr,
                    );
                  }
                }
              } catch (e) {
                this.logger.error(
                  'Failed to apply pending_since from Redis:',
                  e,
                );
              }
            } catch (error) {
              this.logger.error('Error saving SMPP message ID:', error);
            }
          }

          resolve({ success: true, smppMessageId: pdu.message_id });
        } else {
          const errorMessage = this.getSmppErrorMessage(pdu.command_status);
          this.logger.error(
            `SMS send failed: ${pdu.command_status} - ${errorMessage}`,
          );
          reject(
            new Error(
              `SMS send failed: ${pdu.command_status} - ${errorMessage}`,
            ),
          );
        }
      });
    });
  }

  /**
   * Ulanish holatini tekshirish
   */
  isSmppConnected(): boolean {
    return this.isConnected && this.session !== null;
  }

  /**
   * Ulanish holatini tekshirish va kerak bo'lsa qayta ulanish
   */
  async ensureConnection(): Promise<void> {
    if (!this.isSmppConnected()) {
      this.logger.log('SMPP not connected, attempting to reconnect...');
      await this.connect();
    }
  }

  /**
   * SMPP xatolik kodlarini tushuntirish
   */
  private getSmppErrorMessage(errorCode: number): string {
    const errorMessages: { [key: number]: string } = {
      0: 'No Error',
      1: 'Message Length is invalid',
      2: 'Command Length is invalid',
      3: 'Invalid Command ID',
      4: 'Bind Failed',
      5: 'Invalid Priority Flag',
      6: 'Registered Delivery Flag is invalid',
      7: 'System Error',
      8: 'Invalid Source Address TON',
      9: 'Invalid Dest Addr TON',
      10: 'Invalid Dest Addr NPI',
      11: 'Invalid Destination Address',
      12: 'Invalid Source Address NPI',
      13: 'Invalid Source Address',
      14: 'Invalid ESME Address',
      15: 'Invalid Dest Addr Subunit',
      16: 'Invalid Source Addr Subunit',
      17: 'Invalid Dest Network Type',
      18: 'Invalid Source Network Type',
      19: 'Invalid Dest Bearer Type',
      20: 'Invalid Source Bearer Type',
      21: 'Invalid Dest Telematics ID',
      22: 'Invalid Source Telematics ID',
      23: 'Invalid Source Port',
      24: 'Invalid Dest Port',
      25: 'Invalid Registration Flag',
      26: 'Invalid Addr Range',
      27: 'Invalid Parameter Replace',
      28: 'Invalid Number of Messages',
      29: 'Throttling Error',
      30: 'Invalid Scheduled Delivery Time',
      31: 'Invalid Validity Period',
      32: 'Pre-emption Error',
      33: 'Provisioning Error',
      34: 'Invalid Message ID',
      35: 'Invalid Message Length',
      36: 'Invalid Message Type',
      37: 'Invalid Message State',
      38: 'Invalid Error Code',
      39: 'Invalid Service Type',
      40: 'Invalid Source Address Subunit',
      41: 'Invalid Dest Address Subunit',
      42: 'Invalid Broadcast Type',
      43: 'Invalid Broadcast Area Identifier',
      44: 'Invalid Broadcast Frequency Interval',
      45: 'Invalid Broadcast Content Type',
      46: 'Invalid Broadcast Content Name',
      47: 'Invalid Broadcast Message Class',
      48: 'Invalid Broadcast Repetition',
      49: 'Invalid Broadcast Service Group',
      50: 'Query SM Failed',
      51: 'Replace SM Failed',
      52: 'Cancel SM Failed',
      53: 'Invalid Message ID Range',
      54: 'Invalid Number of Destinations',
      55: 'Invalid Dest Flag',
      56: 'Invalid Submit with Replace',
      57: 'Invalid Submit with Replace',
      58: 'Invalid Submit with Replace',
      59: 'Invalid Submit with Replace',
      60: 'Invalid Submit with Replace',
      61: 'Invalid Submit with Replace',
      62: 'Invalid Submit with Replace',
      63: 'Invalid Submit with Replace',
      64: 'Invalid Submit with Replace',
      65: 'Invalid Submit with Replace',
      66: 'Invalid Submit with Replace',
      67: 'Invalid Submit with Replace',
      68: 'Invalid Submit with Replace',
      69: 'Invalid Submit with Replace',
      70: 'Invalid Submit with Replace',
      71: 'Invalid Submit with Replace',
      72: 'Invalid Submit with Replace',
      73: 'Invalid Submit with Replace',
      74: 'Invalid Submit with Replace',
      75: 'Invalid Submit with Replace',
      76: 'Invalid Submit with Replace',
      77: 'Invalid Submit with Replace',
      78: 'Invalid Submit with Replace',
      79: 'Invalid Submit with Replace',
      80: 'Invalid Submit with Replace',
      81: 'Invalid Submit with Replace',
      82: 'Invalid Submit with Replace',
      83: 'Invalid Submit with Replace',
      84: 'Invalid Submit with Replace',
      85: 'Invalid Submit with Replace',
      86: 'Invalid Submit with Replace',
      87: 'Invalid Submit with Replace',
      88: 'Invalid Submit with Replace',
      89: 'Invalid Submit with Replace',
      90: 'Invalid Submit with Replace',
      91: 'Invalid Submit with Replace',
      92: 'Invalid Submit with Replace',
      93: 'Invalid Submit with Replace',
      94: 'Invalid Submit with Replace',
      95: 'Invalid Submit with Replace',
      96: 'Invalid Submit with Replace',
      97: 'Invalid Submit with Replace',
      98: 'Invalid Submit with Replace',
      99: 'Invalid Submit with Replace',
      100: 'Invalid Submit with Replace',
    };

    return errorMessages[errorCode] || `Unknown error code: ${errorCode}`;
  }

  /**
   * Delivery report larni handle qilish
   */
  private async handleDeliveryReport(pdu: any): Promise<void> {
    try {
      this.logger.log('Received delivery report PDU:');
      this.logger.log(JSON.stringify(pdu));

      // SMPP delivery report string ni parse qilish
      let reportString = '';
      if (pdu.short_message) {
        if (typeof pdu.short_message === 'string') {
          reportString = pdu.short_message;
        } else if (pdu.short_message.message) {
          reportString = pdu.short_message.message;
        } else if (Buffer.isBuffer(pdu.short_message)) {
          reportString = pdu.short_message.toString();
        }
      }

      this.logger.log(`Parsing delivery report string: "${reportString}"`);

      const deliveryReport = this.parseDeliveryReportString(reportString);

      if (pdu.receipted_message_id && !deliveryReport.id) {
        deliveryReport.id = pdu.receipted_message_id;
      }

      if (!deliveryReport.id) {
        this.logger.warn('Delivery report ID not found, skipping.');
        return;
      }

      // Agar faqat ID kelsa (to'liq bo'lmagan report)
      if (Object.keys(deliveryReport).length === 1 && deliveryReport.id) {
        this.logger.log(
          `Partial report received for ID: ${deliveryReport.id}. Storing in Redis and marking as pending.`,
        );

        const nowIso = new Date().toISOString();

        // Redisga 24 soatga saqlash (86400 soniya) — bitta kalit: { pdu, since }
        const message = await this.messageRepo.findOne({
          where: { smpp_message_id: deliveryReport.id },
        });

        if (message && !message.pending_since) {
          await this.messageRepo.update(
            { id: message.id },
            { pending_since: new Date(nowIso) },
          );
          this.logger.log(
            `Set pending_since=${nowIso} for message ${message.id}`,
          );
        }

        const payload = JSON.stringify({ pdu, since: nowIso });
        await this.redisClient.set(
          `smpp:pending:${deliveryReport.id}`,
          payload,
          { EX: 86400 },
        );
        return; // Boshqa ishlov berishni to'xtatish
      }

      // To'liq report kelganda
      if (deliveryReport.id && deliveryReport.stat) {
        this.logger.log(
          `Full delivery report parsed for message ${deliveryReport.id}: ${deliveryReport.stat}`,
        );

        // Redisdan bu IDga tegishli vaqtinchalik yozuvni o'chirish (bitta kalit)
        await this.redisClient.del(`smpp:pending:${deliveryReport.id}`);
        this.logger.log(
          `Removed pending record(s) from Redis for ID: ${deliveryReport.id}`,
        );

        // Message ni database da yangilash
        await this.updateMessageDeliveryReport(deliveryReport, true);
      } else {
        this.logger.warn(
          `Could not process delivery report, missing 'id' or 'stat': ${reportString}`,
        );
      }
    } catch (error) {
      this.logger.error('Error handling delivery report:', error);
    }
  }

  /**
   * SMPP delivery report string ni parse qilish
   */
  private parseDeliveryReportString(reportString: string): any {
    const deliveryReport: any = {};

    // Agar string faqat ID ni o'z ichiga olsa (masalan, "id:xxxx" yoki faqat "xxxx")
    const idMatch = reportString.match(
      /^(?:id:)?([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
    );
    if (idMatch && reportString.split(' ').length <= 2) {
      deliveryReport.id = idMatch[1];
      return deliveryReport;
    }

    // Misol: "id:8af6f73a-92e0-11f0-9e65-000c29b7938f sub:001 dlvrd:001 submit date:2509161435 done date:2509161435 stat:DELIVRD err:000 text:"
    const fields = reportString.split(' ');

    for (const field of fields) {
      const [key, value] = field.split(':');
      if (key && value !== undefined) {
        switch (key.toLowerCase()) {
          case 'id':
            deliveryReport.id = value;
            break;
          case 'sub':
            deliveryReport.sub = value;
            break;
          case 'dlvrd':
            deliveryReport.dlvrd = value;
            break;
          case 'submit date':
            deliveryReport.submit_date = value;
            break;
          case 'done date':
            deliveryReport.done_date = value;
            break;
          case 'stat':
            deliveryReport.stat = value;
            break;
          case 'err':
            deliveryReport.err = value;
            break;
          case 'text':
            // Text eng oxirida bo'ladi va bo'sh bo'lishi mumkin
            deliveryReport.text = reportString.substring(
              reportString.indexOf('text:') + 5,
            );
            break;
        }
      }
    }

    return deliveryReport;
  }

  /**
   * Message entity ga delivery report ni saqlash
   */
  private async updateMessageDeliveryReport(
    deliveryReport: any,
    isFullReport: boolean = false,
  ): Promise<void> {
    try {
      if (!deliveryReport.id) {
        this.logger.warn('Delivery report ID not found, skipping update');
        return;
      }

      const updateData: Partial<MessageEntity> = {
        delivery_report: deliveryReport,
      };

      if (isFullReport) {
        updateData.response_received_at = new Date();
        // Preserve existing pending_since value; do not set to null here
      }

      // SMPP message ID bo'yicha message topish va delivery report ni saqlash
      const result = await this.messageRepo
        .createQueryBuilder()
        .update(MessageEntity)
        .set(updateData)
        .where('smpp_message_id = :smppMessageId', {
          smppMessageId: deliveryReport.id,
        })
        .execute();

      if (result.affected === 0) {
        this.logger.warn(
          `Message not found for SMPP message ID: ${deliveryReport.id}`,
        );
      } else {
        this.logger.log(
          `Delivery report saved for SMPP message ID: ${deliveryReport.id}`,
        );
      }
    } catch (error) {
      this.logger.error('Error updating message delivery report:', error);
    }
  }
}
