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
export class MobiUzSmppService {
  private readonly logger: Logger = new Logger(MobiUzSmppService.name);
  private session: any = null;
  private isConnected: boolean = false;
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

    this.redisClient.on('error', (err): void =>
      this.logger.error('Redis Client Error', err),
    );
    this.redisClient.connect();
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject): void => {
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
          (session: any): void => {
            session.bind_transceiver(
              {
                system_id: this.config.system_id,
                password: this.config.password,
              },
              (pdu: any): void => {
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

        this.session.on('error', (error: any): void => {
          this.logger.error('SMPP connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        this.session.on('close', (): void => {
          this.logger.log('SMPP connection closed');
          this.isConnected = false;
        });

        this.session.on('deliver_sm', (pdu: any): void => {
          this.handleDeliveryReport(pdu);
        });
      } catch (error) {
        this.logger.error('Failed to create SMPP session:', error);
        reject(error);
      }
    });
  }

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
                const pending: string = await this.redisClient.get(
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
          this.logger.error(`SMS send failed: ${pdu.command_status}`);
          reject(new Error(`SMS send failed: ${pdu.command_status} `));
        }
      });
    });
  }

  isSmppConnected(): boolean {
    return this.isConnected && this.session !== null;
  }

  async ensureConnection(): Promise<void> {
    if (!this.isSmppConnected()) {
      this.logger.log('SMPP not connected, attempting to reconnect...');
      await this.connect();
    }
  }

  private async handleDeliveryReport(pdu: any): Promise<void> {
    try {
      this.logger.log('Received delivery report PDU:');
      this.logger.log(JSON.stringify(pdu));

      let reportString: string = '';
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

      if (Object.keys(deliveryReport).length === 1 && deliveryReport.id) {
        this.logger.log(
          `Partial report received for ID: ${deliveryReport.id}. Storing in Redis and marking as pending.`,
        );

        const nowIso: string = new Date().toISOString();

        const message: MessageEntity = await this.messageRepo.findOne({
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

        const payload: string = JSON.stringify({ pdu, since: nowIso });
        await this.redisClient.set(
          `smpp:pending:${deliveryReport.id}`,
          payload,
          { EX: 86400 },
        );
        return;
      }

      if (deliveryReport.id && deliveryReport.stat) {
        this.logger.log(
          `Full delivery report parsed for message ${deliveryReport.id}: ${deliveryReport.stat}`,
        );

        await this.redisClient.del(`smpp:pending:${deliveryReport.id}`);

        await this.messageRepo
          .createQueryBuilder()
          .update(MessageEntity)
          .set({ redis_removed_at: new Date() })
          .where('smpp_message_id = :smppMessageId', {
            smppMessageId: deliveryReport.id,
          })
          .execute();

        this.logger.log(
          `Removed pending record(s) from Redis for ID: ${deliveryReport.id} and saved redis_removed_at`,
        );

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

  private parseDeliveryReportString(reportString: string): any {
    const deliveryReport: any = {};

    const idMatch = reportString.match(
      /^(?:id:)?([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
    );
    if (idMatch && reportString.split(' ').length <= 2) {
      deliveryReport.id = idMatch[1];
      return deliveryReport;
    }

    const fields: string[] = reportString.split(' ');

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
            deliveryReport.text = reportString.substring(
              reportString.indexOf('text:') + 5,
            );
            break;
        }
      }
    }

    return deliveryReport;
  }

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
      }

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
