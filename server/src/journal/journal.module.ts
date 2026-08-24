import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentVote } from '../database/entities/comment-vote.entity';
import { Comment } from '../database/entities/comment.entity';
import { Post } from '../database/entities/post.entity';
import { Profile } from '../database/entities/profile.entity';
import { JournalController } from './journal.controller';
import { JournalService } from './journal.service';

@Module({
  imports: [TypeOrmModule.forFeature([Profile, Post, Comment, CommentVote])],
  controllers: [JournalController],
  providers: [JournalService],
})
export class JournalModule {}
