import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SMS_MESSAGE_QUEUE, SMS_CONTACT_QUEUE } from '../constants/constants';
import { RedisHealthService } from './redis-health.service';

@Injectable()
export class QueueMonitorService implements OnApplicationBootstrap {
  private readonly logger = new Logger(QueueMonitorService.name);

  constructor(
    private readonly redisHealthService: RedisHealthService,
    @InjectQueue(SMS_MESSAGE_QUEUE) private readonly messageQueue: Queue,
    @InjectQueue(SMS_CONTACT_QUEUE) private readonly contactQueue: Queue,
  ) {}

  async onApplicationBootstrap() {
    // Wait a bit for Redis connection to establish
    setTimeout(async () => {
      await this.performStartupCheck();
    }, 2000);
  }

  private async performStartupCheck(): Promise<void> {
    this.logger.log('🔍 Queue xizmatlarini tekshirish boshlandi...');
    this.logger.log('═══════════════════════════════════════════════════════');

    // Check Redis connection
    const isRedisConnected = await this.redisHealthService.checkConnection();
    
    if (isRedisConnected) {
      await this.logQueueDetails();
      await this.testQueueConnections();
    } else {
      this.logger.error('❌ REDIS ULANISHI MUVAFFAQIYATSIZ!');
      this.logger.error('⚠️ Queue xizmatlari ishlamaydi!');
    }

    // Log final status
    await this.redisHealthService.logQueueStatus();
    this.logger.log('═══════════════════════════════════════════════════════');
  }

  private async logQueueDetails(): Promise<void> {
    try {
      this.logger.log('📊 QUEUE TAFSILOTLARI:');
      
      // Messages Queue
      const messageQueueCounts = await this.messageQueue.getJobCounts();
      this.logger.log(`📨 Messages Queue (${SMS_MESSAGE_QUEUE}):`);
      this.logger.log(`   ⏳ Kutilayotgan: ${messageQueueCounts.waiting}`);
      this.logger.log(`   🔄 Jarayonda: ${messageQueueCounts.active}`);
      this.logger.log(`   ✅ Bajarilgan: ${messageQueueCounts.completed}`);
      this.logger.log(`   ❌ Muvaffaqiyatsiz: ${messageQueueCounts.failed}`);
      this.logger.log(`   ⏸️ Kechiktirilgan: ${messageQueueCounts.delayed}`);

      // Contacts Queue
      const contactQueueCounts = await this.contactQueue.getJobCounts();
      this.logger.log(`👥 Contacts Queue (${SMS_CONTACT_QUEUE}):`);
      this.logger.log(`   ⏳ Kutilayotgan: ${contactQueueCounts.waiting}`);
      this.logger.log(`   🔄 Jarayonda: ${contactQueueCounts.active}`);
      this.logger.log(`   ✅ Bajarilgan: ${contactQueueCounts.completed}`);
      this.logger.log(`   ❌ Muvaffaqiyatsiz: ${contactQueueCounts.failed}`);
      this.logger.log(`   ⏸️ Kechiktirilgan: ${contactQueueCounts.delayed}`);

    } catch (error) {
      this.logger.error('❌ Queue tafsilotlarini olishda xatolik:', error.message);
    }
  }

  private async testQueueConnections(): Promise<void> {
    try {
      this.logger.log('🔬 QUEUE ULANISHLARINI SINOVDAN O\'TKAZISH:');

      // Test message queue
      const messageQueueHealth = await this.messageQueue.client.ping();
      if (messageQueueHealth === 'PONG') {
        this.logger.log('✅ Messages Queue: SALOM, ISHLAYAPMAN!');
      } else {
        this.logger.error('❌ Messages Queue: JAVOB BERMAYAPTI');
      }

      // Test contact queue
      const contactQueueHealth = await this.contactQueue.client.ping();
      if (contactQueueHealth === 'PONG') {
        this.logger.log('✅ Contacts Queue: SALOM, ISHLAYAPMAN!');
      } else {
        this.logger.error('❌ Contacts Queue: JAVOB BERMAYAPTI');
      }

    } catch (error) {
      this.logger.error('❌ Queue ulanishlarini sinovdan o\'tkazishda xatolik:', error.message);
    }
  }

  async getQueueStatus(): Promise<{
    redis: any;
    messageQueue: any;
    contactQueue: any;
    overall: 'healthy' | 'unhealthy' | 'partial';
  }> {
    const redisStatus = this.redisHealthService.getConnectionStatus();
    
    let messageQueueStatus = null;
    let contactQueueStatus = null;
    let overall: 'healthy' | 'unhealthy' | 'partial' = 'unhealthy';

    try {
      if (redisStatus.isConnected) {
        messageQueueStatus = await this.messageQueue.getJobCounts();
        contactQueueStatus = await this.contactQueue.getJobCounts();
        overall = 'healthy';
      }
    } catch (error) {
      this.logger.error('Queue status olishda xatolik:', error.message);
      overall = 'partial';
    }

    return {
      redis: redisStatus,
      messageQueue: messageQueueStatus,
      contactQueue: contactQueueStatus,
      overall,
    };
  }

  async logPeriodicStatus(): Promise<void> {
    const status = await this.getQueueStatus();
    
    if (status.overall === 'healthy') {
      this.logger.log('🟢 Barcha queue xizmatlari normal ishlayapti');
    } else if (status.overall === 'partial') {
      this.logger.warn('🟡 Queue xizmatlarida qisman muammolar mavjud');
    } else {
      this.logger.error('🔴 Queue xizmatlari ishlamayapti');
    }
  }
}
