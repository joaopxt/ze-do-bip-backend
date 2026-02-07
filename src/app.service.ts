import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { GuardaProdService } from './guarda_prod/guarda/guarda_prod.service';

@Injectable()
export class AppService {
  constructor(
    @InjectDataSource() private readonly mysqlDataSource: DataSource,
    @InjectDataSource('postgresConnection')
    private readonly postgresDataSource: DataSource,
    private readonly guardaProdService: GuardaProdService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async connections(): Promise<object> {
    const mysqlStatus = {
      isConnected: this.mysqlDataSource.isInitialized,
      database: this.mysqlDataSource.options.database,
    };

    const postgresStatus = {
      isConnected: this.postgresDataSource.isInitialized,
      database: this.postgresDataSource.options.database,
    };

    const siacStatus = await this.guardaProdService.testarConectividade();

    return {
      env: process.env.NODE_ENV,
      mysql: mysqlStatus,
      postgres: postgresStatus,
      siac: siacStatus,
      timestamp: new Date().toISOString(),
    };
  }
}
