import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CommentVote } from './entities/comment-vote.entity';
import { Post } from './entities/post.entity';
import { Profile } from './entities/profile.entity';
import { InitialSchema1774281600000 } from './migrations/1774281600000-initial-schema';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [Profile, Post, Comment, CommentVote],
  migrations: [InitialSchema1774281600000],
  migrationsTransactionMode: 'all',
});
