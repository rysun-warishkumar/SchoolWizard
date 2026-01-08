import express from 'express';
import {
  getConversations,
  getMessages,
  sendMessage,
  getUsers,
} from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
// import { chatRateLimiter } from '../middleware/rateLimiter'; // Commented out - rate limiting disabled

const router = express.Router();

router.use(authenticate);

// Chat Routes with specific rate limiting - COMMENTED OUT
router.get('/conversations', /* chatRateLimiter, */ checkPermission('chat', 'view'), getConversations);
router.get('/messages/:conversationId', /* chatRateLimiter, */ checkPermission('chat', 'view'), getMessages);
router.post('/messages', /* chatRateLimiter, */ checkPermission('chat', 'add'), sendMessage);
router.get('/users', /* chatRateLimiter, */ checkPermission('chat', 'view'), getUsers);

export default router;

