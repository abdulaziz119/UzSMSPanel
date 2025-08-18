import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { MessagesService } from '../service/messages.service';
import { SMS_MESSAGE_QUEUE } from '../constants/constants';
import { 
  SendToContactDto, 
  SendToGroupDto 
} from '../frontend/v1/modules/messages/dto/messages.dto';
import { ContactTypeEnum } from '../utils/enum/contact.enum';

export interface SendToContactJobData {
  payload: SendToContactDto;
  user_id: number;
  balance?: ContactTypeEnum;
  meta?: Record<string, any>;
}

export interface SendToGroupJobData {
  payload: SendToGroupDto;
  user_id: number;
  balance?: ContactTypeEnum;
  meta?: Record<string, any>;
}

@Processor(SMS_MESSAGE_QUEUE)
@Injectable()
export class MessagesQueue {
  private readonly logger = new Logger(MessagesQueue.name);

  constructor(private readonly messagesService: MessagesService) {
    this.logger.log(
      `Messages Queue processor initialized for queue: ${SMS_MESSAGE_QUEUE}`,
    );
  }

  @Process({ name: 'send-to-contact', concurrency: 3 })
  async sendMessageToContact(job: Job<SendToContactJobData>): Promise<{
    success: boolean;
    messageId?: number;
    error?: string;
  }> {
    try {
      this.logger.log(`Processing send-to-contact job ${job.id} for user ${job.data.user_id}`);
      
      const result = await this.messagesService.sendToContact(
        job.data.payload,
        job.data.user_id,
        job.data.balance
      );

      await job.progress(100);
      
      this.logger.log(`Successfully sent message to contact: ${job.data.payload.phone}`);
      
      return {
        success: true,
        messageId: result.result.id,
      };
    } catch (error: any) {
      this.logger.error(`Failed to send message to contact: ${error.message}`, error.stack);
      
      return {
        success: false,
        error: error.message || 'Failed to send message',
      };
    }
  }

  @Process({ name: 'send-to-group', concurrency: 2 })
  async sendMessageToGroup(job: Job<SendToGroupJobData>): Promise<{
    success: boolean;
    messageCount?: number;
    error?: string;
  }> {
    try {
      this.logger.log(`Processing send-to-group job ${job.id} for user ${job.data.user_id}, group ${job.data.payload.group_id}`);
      
      const result = await this.messagesService.sendToGroup(
        job.data.payload,
        job.data.user_id,
        job.data.balance
      );

      await job.progress(100);
      
      this.logger.log(`Successfully sent messages to group ${job.data.payload.group_id}: ${result.result.length} messages`);
      
      return {
        success: true,
        messageCount: result.result.length,
      };
    } catch (error: any) {
      this.logger.error(`Failed to send messages to group: ${error.message}`, error.stack);
      
      return {
        success: false,
        error: error.message || 'Failed to send messages to group',
      };
    }
  }

  @Process({ name: 'bulk-send', concurrency: 1 })
  async bulkSendMessages(job: Job<{
    contacts: Array<{ phone: string; message: string }>;
    user_id: number;
    meta?: Record<string, any>;
  }>): Promise<{
    success: boolean;
    processed: number;
    failed: number;
    errors: Array<{ phone: string; error: string }>;
  }> {
    try {
      this.logger.log(`Processing bulk-send job ${job.id} with ${job.data.contacts.length} contacts`);
      
      let processed = 0;
      let failed = 0;
      const errors: Array<{ phone: string; error: string }> = [];
      
      const totalContacts = job.data.contacts.length;
      
      for (let i = 0; i < job.data.contacts.length; i++) {
        const contact = job.data.contacts[i];
        
        try {
          await this.messagesService.sendToContact(
            {
              phone: contact.phone,
              message: contact.message,
            },
            job.data.user_id
          );
          
          processed++;
        } catch (error: any) {
          failed++;
          errors.push({
            phone: contact.phone,
            error: error.message || 'Failed to send',
          });
        }
        
        // Update progress
        const progress = Math.round(((i + 1) / totalContacts) * 100);
        await job.progress(progress);
      }
      
      this.logger.log(`Bulk send completed: ${processed} processed, ${failed} failed`);
      
      return {
        success: true,
        processed,
        failed,
        errors,
      };
    } catch (error: any) {
      this.logger.error(`Bulk send job failed: ${error.message}`, error.stack);
      
      return {
        success: false,
        processed: 0,
        failed: job.data.contacts.length,
        errors: [{ phone: 'all', error: error.message || 'Bulk operation failed' }],
      };
    }
  }
}
