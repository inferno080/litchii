import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../database/entities/profile.entity';
import { AuthenticatedUser } from './authenticated-user.interface';
import { CreateProfileDto } from './dto/create-profile.dto';
import { SignInDto } from './dto/sign-in.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
    private readonly configService: ConfigService,
  ) {}

  async signIn(dto: SignInDto): Promise<unknown> {
    const supabaseUrl = this.configService
      .getOrThrow<string>('SUPABASE_URL')
      .replace(/\/$/, '');
    const publishableKey = this.configService.getOrThrow<string>(
      'SUPABASE_PUBLISHABLE_KEY',
    );

    const response = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          apikey: publishableKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(dto),
      },
    );

    if (!response.ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const session: unknown = await response.json();
    if (
      !session ||
      typeof session !== 'object' ||
      typeof (session as { access_token?: unknown }).access_token !== 'string'
    ) {
      throw new InternalServerErrorException(
        'Supabase did not return an access token',
      );
    }

    return session;
  }

  async getCurrentUser(user: AuthenticatedUser): Promise<{
    user: AuthenticatedUser;
    profile: Profile | null;
  }> {
    const profile = await this.profilesRepository.findOneBy({ id: user.id });
    return { user, profile };
  }

  async createProfile(
    user: AuthenticatedUser,
    dto: CreateProfileDto,
  ): Promise<Profile> {
    const existingProfile = await this.profilesRepository.findOneBy({
      id: user.id,
    });
    if (existingProfile) {
      if (existingProfile.username === dto.username) {
        return existingProfile;
      }

      throw new ConflictException('A profile already exists for this user');
    }

    const usernameOwner = await this.profilesRepository.findOneBy({
      username: dto.username,
    });
    if (usernameOwner) {
      throw new ConflictException('Username is already taken');
    }

    const profile = this.profilesRepository.create({
      id: user.id,
      username: dto.username,
    });

    try {
      return await this.profilesRepository.save(profile);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Username is already taken');
      }
      throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const databaseError = error as {
      code?: string;
      driverError?: { code?: string };
    };
    return (
      databaseError.code === '23505' || databaseError.driverError?.code === '23505'
    );
  }
}
