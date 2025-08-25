import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  InjectQueue,
} from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { Logger } from '@nestjs/common';
import { EMAIL_MESSAGE_QUEUE } from '../constants/constants';
import {
  SendEmailToContactJobData,
  SendEmailToGroupJobData,
} from '../utils/interfaces/email-messages.interfaces';
import { EmailMessageService } from '../service/email-message.service';

@Processor(EMAIL_MESSAGE_QUEUE)
export class EmailMessagesQueue {
  private readonly logger = new Logger(EmailMessagesQueue.name);

  constructor(
    private readonly emailMessageService: EmailMessageService,
    @InjectQueue(EMAIL_MESSAGE_QUEUE) private readonly queue: Queue,
  ) {}

  @Process('send-to-contact')
  async handleSendToContact(job: Job<SendEmailToContactJobData>) {
    this.logger.log(`Processing send-to-contact job ${job.id}`);
    
    const { payload, user_id, balance } = job.data;
    
    try {
      // Convert to SendEmailDto format
      const sendEmailDto = {
        recipient_emails: [payload.email],
        email_template_id: payload.email_template_id,
      };

      const result = await this.emailMessageService.sendEmail(user_id, sendEmailDto);
      
      this.logger.log(`Email queued successfully for job ${job.id}: ${result.queued} emails`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to process send-to-contact job ${job.id}:`, error);
      throw error;
    }
  }

  @Process('send-to-group')
  async handleSendToGroup(job: Job<SendEmailToGroupJobData>) {
    this.logger.log(`Processing send-to-group job ${job.id}`);
    
    const { payload, user_id, balance } = job.data;
    
    try {
      // Convert to SendEmailDto format
      const sendEmailDto = {
        group_id: payload.group_id,
        email_template_id: payload.email_template_id,
      };

      const result = await this.emailMessageService.sendEmail(user_id, sendEmailDto);
      
      this.logger.log(`Group emails queued successfully for job ${job.id}: ${result.queued} emails`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to process send-to-group job ${job.id}:`, error);
      throw error;
    }
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} of type ${job.name} is now active`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} of type ${job.name} completed successfully`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: any) {
    this.logger.error(`Job ${job.id} of type ${job.name} failed:`, error);
  }
}
