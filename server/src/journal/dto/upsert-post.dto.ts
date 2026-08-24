import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertPostDto {
  @ApiProperty({
    description: 'Editor.js-compatible structured content.',
    example: { time: 1724630400000, blocks: [], version: '2.30.0' },
  })
  @IsObject()
  content: Record<string, unknown>;

  @ApiPropertyOptional({ example: '🌱', maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  icon?: string | null;
}
