import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { CommentVote } from '../database/entities/comment-vote.entity';
import { Comment } from '../database/entities/comment.entity';
import { Post } from '../database/entities/post.entity';
import { Profile } from '../database/entities/profile.entity';
import { CastVoteDto } from './dto/cast-vote.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { DateRangeDto } from './dto/date-range.dto';
import { UpsertPostDto } from './dto/upsert-post.dto';

interface CommentTreeNode {
  id: string;
  parentId: string | null;
  text: string;
  createdAt: Date;
  author: { username: string };
  likeCount: number;
  dislikeCount: number;
  children: CommentTreeNode[];
}

@Injectable()
export class JournalService {
  constructor(
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    @InjectRepository(CommentVote)
    private readonly votesRepository: Repository<CommentVote>,
  ) {}

  async listPosts(username: string, range: DateRangeDto) {
    this.assertDate(range.startDate, 'startDate');
    this.assertDate(range.endDate, 'endDate');
    if (range.startDate > range.endDate) {
      throw new BadRequestException('startDate must not be after endDate');
    }

    const profile = await this.getProfileByUsername(username);
    const posts = await this.postsRepository.find({
      where: {
        authorId: profile.id,
        entryDate: Between(range.startDate, range.endDate),
      },
      order: { entryDate: 'ASC' },
    });

    return posts.map((post) => ({
        id: post.id,
        date: post.entryDate,
        icon: post.icon,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      }));
  }

  async getPost(username: string, date: string) {
    const post = await this.getPostByUsernameAndDate(username, date);
    const comments = await this.commentsRepository.find({
      where: { postId: post.id },
      relations: { author: true },
      order: { createdAt: 'ASC' },
    });

    return {
      id: post.id,
      date: post.entryDate,
      icon: post.icon,
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: { username: post.author.username },
      comments: await this.buildCommentTree(comments),
    };
  }

  async upsertPost(
    username: string,
    date: string,
    user: AuthenticatedUser,
    dto: UpsertPostDto,
  ) {
    this.assertDate(date, 'date');
    const profile = await this.getProfileForUser(user);
    this.assertUsernameOwnership(username, profile);

    let post = await this.postsRepository.findOneBy({
      authorId: profile.id,
      entryDate: date,
    });

    if (post) {
      post.content = dto.content;
      post.icon = dto.icon ?? null;
    } else {
      post = this.postsRepository.create({
        authorId: profile.id,
        entryDate: date,
        content: dto.content,
        icon: dto.icon ?? null,
      });
    }

    return this.postsRepository.save(post);
  }

  async createComment(
    username: string,
    date: string,
    user: AuthenticatedUser,
    dto: CreateCommentDto,
  ) {
    const post = await this.getPostByUsernameAndDate(username, date);
    const profile = await this.getProfileForUser(user);

    if (dto.parentId) {
      const parent = await this.commentsRepository.findOneBy({ id: dto.parentId });
      if (!parent || parent.postId !== post.id) {
        throw new BadRequestException('parentId must belong to this journal entry');
      }
    }

    const comment = this.commentsRepository.create({
      postId: post.id,
      authorId: profile.id,
      parentId: dto.parentId ?? null,
      text: dto.text,
    });
    const savedComment = await this.commentsRepository.save(comment);

    return {
      id: savedComment.id,
      parentId: savedComment.parentId,
      text: savedComment.text,
      createdAt: savedComment.createdAt,
      author: { username: profile.username },
      likeCount: 0,
      dislikeCount: 0,
      children: [],
    };
  }

  async castVote(
    username: string,
    date: string,
    user: AuthenticatedUser,
    dto: CastVoteDto,
  ) {
    const post = await this.getPostByUsernameAndDate(username, date);
    const profile = await this.getProfileForUser(user);
    const comment = await this.commentsRepository.findOneBy({ id: dto.commentId });
    if (!comment || comment.postId !== post.id) {
      throw new NotFoundException('Comment not found for this journal entry');
    }

    const vote = await this.votesRepository.findOneBy({
      userId: profile.id,
      commentId: comment.id,
    });
    const savedVote = await this.votesRepository.save(
      vote
        ? { ...vote, value: dto.value }
        : { userId: profile.id, commentId: comment.id, value: dto.value },
    );
    const totals = await this.getVoteTotals([comment.id]);

    return {
      commentId: comment.id,
      value: savedVote.value,
      ...(totals.get(comment.id) ?? { likeCount: 0, dislikeCount: 0 }),
    };
  }

  private async getPostByUsernameAndDate(username: string, date: string): Promise<Post> {
    this.assertDate(date, 'date');
    const profile = await this.getProfileByUsername(username);
    const post = await this.postsRepository.findOne({
      where: { authorId: profile.id, entryDate: date },
      relations: { author: true },
    });
    if (!post) {
      throw new NotFoundException('Journal entry not found');
    }
    return post;
  }

  private async getProfileByUsername(username: string): Promise<Profile> {
    const profile = await this.profilesRepository.findOneBy({
      username: username.toLowerCase(),
    });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  private async getProfileForUser(user: AuthenticatedUser): Promise<Profile> {
    const profile = await this.profilesRepository.findOneBy({ id: user.id });
    if (!profile) {
      throw new ForbiddenException('Create a profile before writing posts or comments');
    }
    return profile;
  }

  private assertUsernameOwnership(username: string, profile: Profile): void {
    if (username.toLowerCase() !== profile.username) {
      throw new ForbiddenException('You can only edit your own journal entries');
    }
  }

  private assertDate(value: string, name: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(`${name} must be YYYY-MM-DD`);
    }

    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
      throw new BadRequestException(`${name} must be a valid calendar date`);
    }
  }

  private async buildCommentTree(comments: Comment[]): Promise<CommentTreeNode[]> {
    const totals = await this.getVoteTotals(comments.map((comment) => comment.id));
    const nodes = new Map<string, CommentTreeNode>();
    const roots: CommentTreeNode[] = [];

    for (const comment of comments) {
      const voteTotals = totals.get(comment.id) ?? { likeCount: 0, dislikeCount: 0 };
      nodes.set(comment.id, {
        id: comment.id,
        parentId: comment.parentId,
        text: comment.text,
        createdAt: comment.createdAt,
        author: { username: comment.author.username },
        ...voteTotals,
        children: [],
      });
    }

    for (const node of nodes.values()) {
      const parent = node.parentId ? nodes.get(node.parentId) : undefined;
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  private async getVoteTotals(commentIds: string[]): Promise<
    Map<string, { likeCount: number; dislikeCount: number }>
  > {
    if (commentIds.length === 0) {
      return new Map();
    }

    const rows = await this.votesRepository
      .createQueryBuilder('vote')
      .select('vote.comment_id', 'commentId')
      .addSelect("COUNT(*) FILTER (WHERE vote.value = 1)", 'likeCount')
      .addSelect("COUNT(*) FILTER (WHERE vote.value = -1)", 'dislikeCount')
      .where('vote.comment_id IN (:...commentIds)', { commentIds })
      .groupBy('vote.comment_id')
      .getRawMany<{ commentId: string; likeCount: string; dislikeCount: string }>();

    return new Map(
      rows.map((row) => [
        row.commentId,
        { likeCount: Number(row.likeCount), dislikeCount: Number(row.dislikeCount) },
      ]),
    );
  }
}
