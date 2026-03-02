import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest, getSchoolId } from '../middleware/auth';

// ========== Chat Conversations ==========

const getOrCreateConversation = async (user1Id: number, user2Id: number, schoolId: number, db: any) => {
  const [id1, id2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

  const [existing] = await db.execute(
    'SELECT * FROM chat_conversations WHERE user1_id = ? AND user2_id = ? AND school_id = ?',
    [id1, id2, schoolId]
  ) as any[];

  if (existing.length > 0) {
    return existing[0];
  }

  const [result] = await db.execute(
    'INSERT INTO chat_conversations (school_id, user1_id, user2_id) VALUES (?, ?, ?)',
    [schoolId, id1, id2]
  ) as any;

  const [newConv] = await db.execute(
    'SELECT * FROM chat_conversations WHERE id = ? AND school_id = ?',
    [result.insertId, schoolId]
  ) as any[];

  return newConv[0];
};

export const getConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const [conversations] = await db.execute(
      `SELECT 
        c.*,
        CASE 
          WHEN c.user1_id = ? THEN c.user2_id
          ELSE c.user1_id
        END as other_user_id,
        CASE 
          WHEN c.user1_id = ? THEN c.user1_unread_count
          ELSE c.user2_unread_count
        END as unread_count,
        u.name as other_user_name,
        u.email as other_user_email,
        s.photo as other_user_photo,
        st.photo as other_user_student_photo
      FROM chat_conversations c
      LEFT JOIN users u ON (
        CASE 
          WHEN c.user1_id = ? THEN c.user2_id
          ELSE c.user1_id
        END = u.id
      )
      LEFT JOIN staff s ON u.id = s.user_id
      LEFT JOIN students st ON u.id = st.user_id
      WHERE c.school_id = ? AND (c.user1_id = ? OR c.user2_id = ?)
      ORDER BY c.last_message_at DESC, c.updated_at DESC`,
      [userId, userId, userId, schoolId, userId, userId]
    ) as any[];

    // Format conversations with other user info
    const formattedConversations = conversations.map((conv: any) => ({
      id: conv.id,
      other_user_id: conv.other_user_id,
      other_user_name: conv.other_user_name,
      other_user_email: conv.other_user_email,
      other_user_photo: conv.other_user_photo || conv.other_user_student_photo,
      unread_count: conv.unread_count || 0,
      last_message_at: conv.last_message_at,
      created_at: conv.created_at,
    }));

    res.json({
      success: true,
      data: formattedConversations,
    });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const [conversations] = await db.execute(
      'SELECT * FROM chat_conversations WHERE id = ? AND school_id = ? AND (user1_id = ? OR user2_id = ?)',
      [conversationId, schoolId, userId, userId]
    ) as any[];

    if (conversations.length === 0) {
      throw createError('Conversation not found', 404);
    }

    const offset = (Number(page) - 1) * Number(limit);

    const [messages] = await db.execute(
      `SELECT 
        m.*,
        u.name as sender_name,
        u.email as sender_email,
        s.photo as sender_photo,
        st.photo as sender_student_photo
      FROM chat_messages m
      LEFT JOIN users u ON m.sender_id = u.id
      LEFT JOIN staff s ON u.id = s.user_id
      LEFT JOIN students st ON u.id = st.user_id
      WHERE m.conversation_id = ? AND m.school_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?`,
      [conversationId, schoolId, Number(limit), offset]
    ) as any[];

    // Format messages
    const formattedMessages = messages.map((msg: any) => ({
      id: msg.id,
      conversation_id: msg.conversation_id,
      sender_id: msg.sender_id,
      receiver_id: msg.receiver_id,
      message: msg.message,
      is_read: msg.is_read,
      read_at: msg.read_at,
      created_at: msg.created_at,
      sender_name: msg.sender_name,
      sender_email: msg.sender_email,
      sender_photo: msg.sender_photo || msg.sender_student_photo,
      is_sender: msg.sender_id === Number(userId),
    })).reverse(); // Reverse to show oldest first

    await db.execute(
      'UPDATE chat_messages SET is_read = TRUE, read_at = NOW() WHERE conversation_id = ? AND school_id = ? AND receiver_id = ? AND is_read = FALSE',
      [conversationId, schoolId, userId]
    );

    const conversation = conversations[0];
    if (conversation.user1_id === Number(userId)) {
      await db.execute(
        'UPDATE chat_conversations SET user1_unread_count = 0 WHERE id = ? AND school_id = ?',
        [conversationId, schoolId]
      );
    } else {
      await db.execute(
        'UPDATE chat_conversations SET user2_unread_count = 0 WHERE id = ? AND school_id = ?',
        [conversationId, schoolId]
      );
    }

    res.json({
      success: true,
      data: formattedMessages,
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { receiver_id, message } = req.body;
    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    if (!receiver_id || !message || !message.trim()) {
      throw createError('Receiver ID and message are required', 400);
    }

    if (Number(receiver_id) === Number(userId)) {
      throw createError('Cannot send message to yourself', 400);
    }

    const [receivers] = await db.execute(
      'SELECT id FROM users WHERE id = ? AND school_id = ?',
      [receiver_id, schoolId]
    ) as any[];

    if (receivers.length === 0) {
      throw createError('Receiver not found', 404);
    }

    const conversation = await getOrCreateConversation(Number(userId), Number(receiver_id), schoolId, db);

    const [id1, id2] = Number(userId) < Number(receiver_id) 
      ? [Number(userId), Number(receiver_id)] 
      : [Number(receiver_id), Number(userId)];

    const [result] = await db.execute(
      'INSERT INTO chat_messages (school_id, conversation_id, sender_id, receiver_id, message) VALUES (?, ?, ?, ?, ?)',
      [schoolId, conversation.id, userId, receiver_id, message.trim()]
    ) as any;

    // Update conversation
    const unreadField = conversation.user1_id === Number(receiver_id) ? 'user1_unread_count' : 'user2_unread_count';
    await db.execute(
      `UPDATE chat_conversations 
       SET last_message_id = ?, 
           last_message_at = NOW(), 
           ${unreadField} = ${unreadField} + 1,
           updated_at = NOW()
       WHERE id = ?`,
      [result.insertId, conversation.id]
    );

    const [messages] = await db.execute(
      `SELECT 
        m.*,
        u.name as sender_name,
        u.email as sender_email,
        s.photo as sender_photo,
        st.photo as sender_student_photo
      FROM chat_messages m
      LEFT JOIN users u ON m.sender_id = u.id
      LEFT JOIN staff s ON u.id = s.user_id
      LEFT JOIN students st ON u.id = st.user_id
      WHERE m.id = ? AND m.school_id = ?`,
      [result.insertId, schoolId]
    ) as any[];

    const formattedMessage = {
      ...messages[0],
      sender_photo: messages[0].sender_photo || messages[0].sender_student_photo,
      is_sender: true,
    };

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: formattedMessage,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { search } = req.query;
    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    let query = `
      SELECT DISTINCT
        u.id,
        u.name,
        u.email,
        s.photo as photo,
        st.photo as student_photo,
        s.first_name as staff_first_name,
        s.last_name as staff_last_name,
        st.first_name as student_first_name,
        st.last_name as student_last_name,
        r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN staff s ON u.id = s.user_id
      LEFT JOIN students st ON u.id = st.user_id
      WHERE u.school_id = ? AND u.id != ? AND u.is_active = 1
    `;
    const params: any[] = [schoolId, userId];

    if (search) {
      query += ' AND (u.name LIKE ? OR u.email LIKE ? OR s.first_name LIKE ? OR st.first_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY u.name ASC LIMIT 50';

    const [users] = await db.execute(query, params) as any[];

    const formattedUsers = users.map((user: any) => ({
      id: user.id,
      name: user.name || `${user.staff_first_name || user.student_first_name} ${user.staff_last_name || user.student_last_name || ''}`.trim(),
      email: user.email,
      photo: user.photo || user.student_photo,
      role_name: user.role_name,
    }));

    res.json({
      success: true,
      data: formattedUsers,
    });
  } catch (error) {
    next(error);
  }
};

