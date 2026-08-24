import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class DateRangeDto {
  @ApiProperty({ example: '2026-08-01', format: 'date' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be YYYY-MM-DD' })
  startDate: string;

  @ApiProperty({ example: '2026-08-31', format: 'date' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be YYYY-MM-DD' })
  endDate: string;
}
