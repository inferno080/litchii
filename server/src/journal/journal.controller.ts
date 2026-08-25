import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { CastVoteDto } from './dto/cast-vote.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { DateRangeDto } from './dto/date-range.dto';
import { UpsertPostDto } from './dto/upsert-post.dto';
import { JournalService } from './journal.service';
import type { UploadedImageFile } from './journal.service';

@Controller()
@ApiTags('Journals')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post(':username')
  @ApiOperation({ summary: 'List a user’s post summaries in a date range' })
  @ApiParam({ name: 'username', example: 'your_username' })
  @ApiBody({ type: DateRangeDto })
  @ApiOkResponse({
    description: 'Post summaries for the requested inclusive range.',
  })
  listPosts(@Param('username') username: string, @Body() range: DateRangeDto) {
    return this.journalService.listPosts(username, range);
  }

  @Get(':username/:date')
  @ApiOperation({
    summary: 'View one public journal entry and its comment tree',
  })
  @ApiParam({ name: 'username', example: 'your_username' })
  @ApiParam({ name: 'date', example: '2026-08-24', description: 'YYYY-MM-DD' })
  @ApiOkResponse({
    description: 'The journal entry, author, and nested comments.',
  })
  getPost(
    @Param('username') username: string,
    @Param('date') date: string,
  ): Promise<unknown> {
    return this.journalService.getPost(username, date);
  }

  @Post(':username/:date')
  @UseGuards(SupabaseJwtGuard)
  @ApiBearerAuth('SupabaseAccessToken')
  @ApiOperation({ summary: 'Create or update your journal entry for a date' })
  @ApiParam({ name: 'username', example: 'your_username' })
  @ApiParam({ name: 'date', example: '2026-08-24', description: 'YYYY-MM-DD' })
  @ApiBody({ type: UpsertPostDto })
  @ApiCreatedResponse({ description: 'Created or updated journal entry.' })
  upsertPost(
    @Param('username') username: string,
    @Param('date') date: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertPostDto,
  ) {
    return this.journalService.upsertPost(username, date, user, dto);
  }

  @Post(':username/:date/image')
  @UseGuards(SupabaseJwtGuard)
  @UseInterceptors(
    FileInterceptor('image', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  @ApiBearerAuth('SupabaseAccessToken')
  @ApiOperation({ summary: 'Upload an image for a journal entry' })
  @ApiParam({ name: 'username', example: 'your_username' })
  @ApiParam({ name: 'date', example: '2026-08-24', description: 'YYYY-MM-DD' })
  uploadImage(
    @Param('username') username: string,
    @Param('date') date: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedImageFile,
  ) {
    return this.journalService.uploadImage(username, date, user, file);
  }

  @Post(':username/:date/comment')
  @UseGuards(SupabaseJwtGuard)
  @ApiBearerAuth('SupabaseAccessToken')
  @ApiOperation({ summary: 'Add a comment or reply to a public journal entry' })
  @ApiParam({ name: 'username', example: 'your_username' })
  @ApiParam({ name: 'date', example: '2026-08-24', description: 'YYYY-MM-DD' })
  @ApiBody({ type: CreateCommentDto })
  @ApiCreatedResponse({ description: 'Created comment.' })
  createComment(
    @Param('username') username: string,
    @Param('date') date: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommentDto,
  ) {
    return this.journalService.createComment(username, date, user, dto);
  }

  @Post(':username/:date/comment/vote')
  @UseGuards(SupabaseJwtGuard)
  @ApiBearerAuth('SupabaseAccessToken')
  @ApiOperation({ summary: 'Cast or change an upvote/downvote on a comment' })
  @ApiParam({ name: 'username', example: 'your_username' })
  @ApiParam({ name: 'date', example: '2026-08-24', description: 'YYYY-MM-DD' })
  @ApiBody({ type: CastVoteDto })
  @ApiOkResponse({ description: 'The current vote and updated vote totals.' })
  castVote(
    @Param('username') username: string,
    @Param('date') date: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CastVoteDto,
  ) {
    return this.journalService.castVote(username, date, user, dto);
  }
}
