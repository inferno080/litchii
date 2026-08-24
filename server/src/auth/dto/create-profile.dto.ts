import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @Matches(/^[a-z0-9_]{3,30}$/, {
    message:
      'username must contain 3-30 lowercase letters, numbers, or underscores',
  })
  username: string;
}
