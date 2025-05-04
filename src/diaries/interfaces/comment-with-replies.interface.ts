import { Comment } from '../entities/comment.entity';

export interface CommentWithReplies extends Comment {
  replies?: Comment[];
} 