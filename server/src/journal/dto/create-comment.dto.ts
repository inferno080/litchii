import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'This was a thoughtful entry.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text: string;

  @ApiPropertyOptional({
    description: 'The parent comment ID when creating a reply.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
