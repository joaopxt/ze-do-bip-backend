import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('health')
  healthCheck(): object {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('connections')
  async connections(): Promise<object> {
    return this.appService.connections();
  }
}
