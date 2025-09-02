import { Injectable, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } from '../utils/env/env';

@Injectable()
export class RedisHealthService {
  private readonly logger = new Logger(RedisHealthService.name);
  private redisClient: RedisClientType;
  private isConnected = false;
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';

  constructor() {
    this.initializeRedisClient();
  }

  private initializeRedisClient() {
    const redisConfig: any = {
      socket: {
        host: REDIS_HOST,
        port: Number(REDIS_PORT),
      },
    };

    if (REDIS_PASSWORD) {
      redisConfig.password = REDIS_PASSWORD;
    }

    this.redisClient = createClient(redisConfig);

    this.redisClient.on('connect', () => {
      this.connectionStatus = 'connecting';
      this.logger.log('🔄 Redis bilan ulanish jarayoni boshlandi...');
    });

    this.redisClient.on('ready', () => {
      this.connectionStatus = 'connected';
      this.isConnected = true;
      this.logger.log('✅ Redis muvaffaqiyatli ulandi va ishga tayyor!');
      this.logger.log(`📍 Redis server: ${REDIS_HOST}:${REDIS_PORT}`);
    });

    this.redisClient.on('error', (error) => {
      this.connectionStatus = 'error';
      this.isConnected = false;
      this.logger.error('❌ Redis ulanishida xatolik yuz berdi:', error.message);
      this.logger.error(`📍 Tekshirilayotgan server: ${REDIS_HOST}:${REDIS_PORT}`);
    });

    this.redisClient.on('end', () => {
      this.connectionStatus = 'disconnected';
      this.isConnected = false;
      this.logger.warn('⚠️ Redis ulanishi uzildi');
    });

    this.redisClient.on('reconnecting', () => {
      this.connectionStatus = 'connecting';
      this.logger.log('🔄 Redis ga qayta ulanishga harakat qilinmoqda...');
    });
  }

  async checkConnection(): Promise<boolean> {
    try {
      if (!this.redisClient.isOpen) {
        this.logger.log('🔄 Redis ulanishini ochishga harakat qilinmoqda...');
        await this.redisClient.connect();
      }

      // Ping test
      const pong = await this.redisClient.ping();
      if (pong === 'PONG') {
        this.isConnected = true;
        this.connectionStatus = 'connected';
        return true;
      }
    } catch (error) {
      this.isConnected = false;
      this.connectionStatus = 'error';
      this.logger.error('❌ Redis ping testida xatolik:', error.message);
    }

    return false;
  }

  getConnectionStatus(): {
    isConnected: boolean;
    status: string;
    host: string;
    port: number;
  } {
    return {
      isConnected: this.isConnected,
      status: this.connectionStatus,
      host: REDIS_HOST,
      port: Number(REDIS_PORT),
    };
  }

  async getQueueStats(): Promise<{
    messagesQueue: any;
    contactsQueue: any;
  } | null> {
    try {
      if (!this.isConnected) {
        return null;
      }

      // Get queue statistics using Redis commands
      const messagesQueueKeys = await this.redisClient.keys('bull:smsMessageNtfQueueGF:*');
      const contactsQueueKeys = await this.redisClient.keys('bull:smsContactNtfQueueGF:*');

      return {
        messagesQueue: {
          totalKeys: messagesQueueKeys.length,
          activeJobs: messagesQueueKeys.filter(key => key.includes(':active')).length,
          waitingJobs: messagesQueueKeys.filter(key => key.includes(':waiting')).length,
          completedJobs: messagesQueueKeys.filter(key => key.includes(':completed')).length,
          failedJobs: messagesQueueKeys.filter(key => key.includes(':failed')).length,
        },
        contactsQueue: {
          totalKeys: contactsQueueKeys.length,
          activeJobs: contactsQueueKeys.filter(key => key.includes(':active')).length,
          waitingJobs: contactsQueueKeys.filter(key => key.includes(':waiting')).length,
          completedJobs: contactsQueueKeys.filter(key => key.includes(':completed')).length,
          failedJobs: contactsQueueKeys.filter(key => key.includes(':failed')).length,
        },
      };
    } catch (error) {
      this.logger.error('❌ Queue statistikasini olishda xatolik:', error.message);
      return null;
    }
  }

  async logQueueStatus(): Promise<void> {
    const status = this.getConnectionStatus();
    
    if (status.isConnected) {
      this.logger.log('🟢 QUEUE HOLATI: ISHLAYAPTI');
      this.logger.log(`📊 Redis Server: ${status.host}:${status.port}`);
      
      const stats = await this.getQueueStats();
      if (stats) {
        this.logger.log('📈 Queue Statistikasi:');
        this.logger.log(`   📨 Messages Queue: Active(${stats.messagesQueue.activeJobs}), Waiting(${stats.messagesQueue.waitingJobs}), Completed(${stats.messagesQueue.completedJobs}), Failed(${stats.messagesQueue.failedJobs})`);
        this.logger.log(`   👥 Contacts Queue: Active(${stats.contactsQueue.activeJobs}), Waiting(${stats.contactsQueue.waitingJobs}), Completed(${stats.contactsQueue.completedJobs}), Failed(${stats.contactsQueue.failedJobs})`);
      }
    } else {
      this.logger.error('🔴 QUEUE HOLATI: ISHLAMAYAPTI');
      this.logger.error(`❌ Redis Server: ${status.host}:${status.port} - Status: ${status.status}`);
      this.logger.error('⚠️ Queue xizmatlari ishlamaydi. Redis serverini tekshiring!');
    }
  }

  async onApplicationShutdown() {
    if (this.redisClient && this.redisClient.isOpen) {
      await this.redisClient.quit();
      this.logger.log('🔌 Redis ulanishi yopildi');
    }
  }
}
