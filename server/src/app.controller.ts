import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health/database')
  async checkDatabase(): Promise<{ status: 'ok'; database: 'connected' }> {
    await this.dataSource.query('SELECT 1');

    return { status: 'ok', database: 'connected' };
  }
}
