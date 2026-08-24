import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Comment } from './comment.entity';
import { Profile } from './profile.entity';

@Entity({ name: 'comment_votes' })
@Check('"value" IN (-1, 1)')
export class CommentVote {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Profile;

  @PrimaryColumn({ name: 'comment_id', type: 'uuid' })
  commentId: string;

  @ManyToOne(() => Comment, (comment) => comment.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @Column({ type: 'smallint' })
  value: -1 | 1;
}
