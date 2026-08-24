import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUUID } from 'class-validator';

export class CastVoteDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  commentId: string;

  @ApiProperty({ enum: [1, -1], example: 1 })
  @IsIn([1, -1])
  value: 1 | -1;
}
