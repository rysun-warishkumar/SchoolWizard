import express from 'express';
import {
  getConversations,
  getMessages,
  sendMessage,
  getUsers,
  queryAssistant,
  getAssistantMenu,
  selectAssistantMenuOption,
} from '../controllers/chat.controller';
import { authenticate, requireSchool } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
// import { chatRateLimiter } from '../middleware/rateLimiter'; // Commented out - rate limiting disabled

const router = express.Router();

router.use(authenticate);

// Assistant is available for authenticated users.
// Controller handles school-scoped vs no-school context safely.
router.post('/assistant/query', /* chatRateLimiter, */ checkPermission('chat', 'view'), queryAssistant);
router.get('/assistant/menu', /* chatRateLimiter, */ checkPermission('chat', 'view'), getAssistantMenu);
router.post('/assistant/menu/select', /* chatRateLimiter, */ checkPermission('chat', 'view'), selectAssistantMenuOption);

router.use(requireSchool);

// Chat Routes with specific rate limiting - COMMENTED OUT
router.get('/conversations', /* chatRateLimiter, */ checkPermission('chat', 'view'), getConversations);
router.get('/messages/:conversationId', /* chatRateLimiter, */ checkPermission('chat', 'view'), getMessages);
router.post('/messages', /* chatRateLimiter, */ checkPermission('chat', 'add'), sendMessage);
router.get('/users', /* chatRateLimiter, */ checkPermission('chat', 'view'), getUsers);

export default router;

