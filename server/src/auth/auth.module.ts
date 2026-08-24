import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../database/entities/profile.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseJwtGuard } from './supabase-jwt.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Profile])],
  controllers: [AuthController],
  providers: [AuthService, SupabaseJwtGuard],
  exports: [SupabaseJwtGuard],
})
export class AuthModule {}
