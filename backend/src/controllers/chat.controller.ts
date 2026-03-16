import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest, getSchoolId } from '../middleware/auth';
import { generateAssistantReply } from '../services/assistantLlm.service';
import { getUserPermissions } from '../middleware/permissions';

type AssistantIntent =
  | 'greeting'
  | 'help'
  | 'student_count'
  | 'staff_count'
  | 'class_count'
  | 'list_recent_students'
  | 'list_recent_staff'
  | 'students_in_class'
  | 'my_profile'
  | 'unknown';

const ADMIN_LIKE_ROLES = new Set([
  'superadmin',
  'admin',
  'teacher',
  'staff',
  'accountant',
  'librarian',
  'receptionist',
]);

const normalizeAssistantText = (value: string): string =>
  String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const detectAssistantIntent = (text: string): AssistantIntent => {
  const normalized = normalizeAssistantText(text);

  if (/^(hi|hello|hey|namaste)\b/.test(normalized)) return 'greeting';
  if (/(help|what can you do|commands|options)/.test(normalized)) return 'help';
  if (/(my profile|my details|who am i)/.test(normalized)) return 'my_profile';
  if (/(student count|total students|how many students)/.test(normalized)) return 'student_count';
  if (/(staff count|total staff|how many staff|teacher count|total teachers)/.test(normalized)) return 'staff_count';
  if (/(class count|total classes|how many classes)/.test(normalized)) return 'class_count';
  if (/(recent students|latest students|new students)/.test(normalized)) return 'list_recent_students';
  if (/(recent staff|latest staff|new staff|recent teachers|latest teachers)/.test(normalized)) return 'list_recent_staff';
  if (/students?.*class|class.*students?/.test(normalized)) return 'students_in_class';

  return 'unknown';
};

const extractClassName = (text: string): string | null => {
  const normalized = normalizeAssistantText(text);
  const withClassToken = normalized.match(/class\s+([a-z0-9\- ]{1,40})/i);
  if (withClassToken?.[1]) return withClassToken[1].trim();
  return null;
};

const buildAssistantSuggestions = (isAdminLike: boolean): string[] => {
  if (isAdminLike) {
    return [
      'Total students',
      'Total staff',
      'Total classes',
      'Recent students',
      'Students in class 10',
      'My details',
    ];
  }
  return ['My details', 'Help'];
};

type AssistantMenuOption = {
  id: string;
  label: string;
  description?: string;
};

type AssistantTableData = {
  columns: string[];
  rows: string[][];
};

type AssistantMenuContext = {
  schoolId: number | null;
  userId: number;
  userRole: string;
  userEmail: string;
  modulePermissions: Record<string, string[]>;
  isAdminLike: boolean;
};

const hasModuleViewPermission = (ctx: AssistantMenuContext, moduleName: string): boolean => {
  if (ctx.userRole === 'superadmin') return true;
  return Boolean(ctx.modulePermissions?.[moduleName]?.includes('view'));
};

const canAccessModule = (ctx: AssistantMenuContext, moduleName: string): boolean => {
  if (ctx.schoolId == null && moduleName !== 'profile') return false;
  if (hasModuleViewPermission(ctx, moduleName)) return true;

  // Self-service allowances for guided assistant.
  if (moduleName === 'students' && (ctx.userRole === 'student' || ctx.userRole === 'parent')) return true;
  if (moduleName === 'attendance' && (ctx.userRole === 'student' || ctx.userRole === 'parent')) return true;
  if (moduleName === 'fees' && (ctx.userRole === 'student' || ctx.userRole === 'parent')) return true;
  if (moduleName === 'homework' && (ctx.userRole === 'student' || ctx.userRole === 'parent')) return true;
  if (moduleName === 'profile') return true;
  return false;
};

const mapOptions = (items: AssistantMenuOption[]): AssistantMenuOption[] =>
  items.map((item) => ({
    id: item.id,
    label: item.label,
    description: item.description || undefined,
  }));

const buildAssistantTableMeta = (columns: string[], rows: string[][]): Record<string, any> => ({
  table: {
    columns,
    rows,
  } as AssistantTableData,
});

const buildRootAssistantMenu = (ctx: AssistantMenuContext): AssistantMenuOption[] => {
  const options: AssistantMenuOption[] = [];

  if (canAccessModule(ctx, 'academics')) options.push({ id: 'module:academics', label: 'Academics' });
  if (canAccessModule(ctx, 'students')) options.push({ id: 'module:students', label: 'Students' });
  if (canAccessModule(ctx, 'examinations')) options.push({ id: 'module:examination', label: 'Examination' });
  if (canAccessModule(ctx, 'homework')) options.push({ id: 'module:homework', label: 'Homework' });
  if (canAccessModule(ctx, 'front-office')) options.push({ id: 'module:frontoffice', label: 'Front Office' });
  if (canAccessModule(ctx, 'hr')) options.push({ id: 'module:hr', label: 'HR' });
  if (canAccessModule(ctx, 'fees')) options.push({ id: 'module:fees', label: 'Fee Collection' });
  if (canAccessModule(ctx, 'attendance')) options.push({ id: 'module:attendance', label: 'Attendance' });

  options.push({ id: 'profile:me', label: 'My Profile' });
  return options;
};

const buildModuleMenu = (moduleId: string, ctx: AssistantMenuContext): AssistantMenuOption[] => {
  const options: AssistantMenuOption[] = [];

  if (moduleId === 'module:academics' && canAccessModule(ctx, 'academics')) {
    options.push(
      { id: 'academics:class_count', label: 'Total Classes' },
      { id: 'academics:section_count', label: 'Total Sections' },
      { id: 'academics:subject_count', label: 'Total Subjects' }
    );
  } else if (moduleId === 'module:students' && canAccessModule(ctx, 'students')) {
    if (ctx.isAdminLike || hasModuleViewPermission(ctx, 'students')) {
      options.push(
        { id: 'students:total_active', label: 'Total Active Students' },
        { id: 'students:recent', label: 'Recent Admissions' }
      );
    }
    if (ctx.userRole === 'student') {
      options.push({ id: 'students:my_class_section', label: 'My Class and Section' });
    }
    if (ctx.userRole === 'parent') {
      options.push({ id: 'students:my_children_count', label: 'My Children Count' });
    }
  } else if (moduleId === 'module:examination' && canAccessModule(ctx, 'examinations')) {
    options.push(
      { id: 'examination:exam_group_count', label: 'Exam Groups Count' },
      { id: 'examination:exam_count', label: 'Total Exams Count' }
    );
  } else if (moduleId === 'module:homework' && canAccessModule(ctx, 'homework')) {
    if (ctx.userRole === 'student') {
      options.push({ id: 'homework:my_pending', label: 'My Pending Homework' });
    } else if (ctx.userRole === 'parent') {
      options.push({ id: 'homework:children_pending', label: 'My Children Pending Homework' });
    } else {
      options.push({ id: 'homework:active_count', label: 'Active Homework Items' });
    }
  } else if (moduleId === 'module:frontoffice' && canAccessModule(ctx, 'front-office')) {
    options.push(
      { id: 'frontoffice:visitors_today', label: 'Visitors Today' },
      { id: 'frontoffice:pending_enquiries', label: 'Pending Enquiries' }
    );
  } else if (moduleId === 'module:hr' && canAccessModule(ctx, 'hr')) {
    options.push(
      { id: 'hr:active_staff_count', label: 'Active Staff Count' },
      { id: 'hr:pending_leave_requests', label: 'Pending Staff Leave Requests' }
    );
  } else if (moduleId === 'module:fees' && canAccessModule(ctx, 'fees')) {
    if (ctx.userRole === 'student') {
      options.push({ id: 'fees:my_unpaid_invoices', label: 'My Unpaid Invoices' });
    } else if (ctx.userRole === 'parent') {
      options.push({ id: 'fees:children_unpaid_invoices', label: 'Children Unpaid Invoices' });
    } else {
      options.push({ id: 'fees:pending_invoices_count', label: 'Pending Invoices Count' });
    }
  } else if (moduleId === 'module:attendance' && canAccessModule(ctx, 'attendance')) {
    if (ctx.userRole === 'student') {
      options.push({ id: 'attendance:my_monthly_summary', label: 'My This Month Attendance' });
    } else if (ctx.userRole === 'parent') {
      options.push({ id: 'attendance:children_monthly_summary', label: 'Children This Month Attendance' });
    } else {
      options.push({ id: 'attendance:today_marked_count', label: 'Today Marked Attendance' });
    }
  }

  if (options.length > 0) {
    options.push({ id: 'assistant:home', label: 'Back to Main Menu' });
  }
  return options;
};

const buildHrDynamicMenu = async (db: any, schoolId: number, ctx: AssistantMenuContext): Promise<AssistantMenuOption[]> => {
  if (!canAccessModule(ctx, 'hr')) return [];

  const [rows] = await db.execute(
    `SELECT LOWER(COALESCE(r.name, '')) AS role_name, COUNT(*) AS total
     FROM staff s
     INNER JOIN users u ON u.id = s.user_id AND u.school_id = s.school_id
     LEFT JOIN roles r ON r.id = u.role_id
     WHERE s.school_id = ? AND s.is_active = 1
     GROUP BY LOWER(COALESCE(r.name, ''))`,
    [schoolId]
  ) as any[];

  let teacherCount = 0;
  let librarianCount = 0;
  let otherCount = 0;

  (rows || []).forEach((row: any) => {
    const roleName = String(row.role_name || '').trim();
    const total = Number(row.total || 0);
    if (roleName === 'teacher') teacherCount += total;
    else if (roleName === 'librarian') librarianCount += total;
    else if (!['admin', 'superadmin', 'student', 'parent'].includes(roleName)) otherCount += total;
  });

  const options: AssistantMenuOption[] = [
    { id: 'hr:active_staff_count', label: 'Active Staff Count' },
    { id: 'hr:pending_leave_requests', label: 'Pending Staff Leave Requests' },
  ];

  if (teacherCount > 0) options.push({ id: 'hr:list_teachers', label: `Teacher List (${teacherCount})` });
  if (librarianCount > 0) options.push({ id: 'hr:list_librarians', label: `Librarian List (${librarianCount})` });
  if (otherCount > 0) options.push({ id: 'hr:list_other_staff', label: `Other Staff List (${otherCount})` });

  options.push({ id: 'assistant:home', label: 'Back to Main Menu' });
  return options;
};

const getHrStaffListByCategory = async (
  db: any,
  schoolId: number,
  category: 'teacher' | 'librarian' | 'other'
): Promise<Array<Record<string, any>>> => {
  let roleClause = '';
  if (category === 'teacher') roleClause = `AND LOWER(COALESCE(r.name, '')) = 'teacher'`;
  if (category === 'librarian') roleClause = `AND LOWER(COALESCE(r.name, '')) = 'librarian'`;
  if (category === 'other') {
    roleClause = `AND LOWER(COALESCE(r.name, '')) NOT IN ('teacher', 'librarian', 'admin', 'superadmin', 'student', 'parent')`;
  }

  const [rows] = await db.execute(
    `SELECT
       s.staff_id,
       CONCAT_WS(' ', s.first_name, s.last_name) AS staff_name,
       COALESCE(r.name, 'staff') AS role_name,
       COALESCE(d.name, 'N/A') AS department_name,
       COALESCE(ds.name, 'N/A') AS designation_name,
       COALESCE(u.email, 'N/A') AS email
     FROM staff s
     INNER JOIN users u ON u.id = s.user_id AND u.school_id = s.school_id
     LEFT JOIN roles r ON r.id = u.role_id
     LEFT JOIN departments d ON d.id = s.department_id AND d.school_id = s.school_id
     LEFT JOIN designations ds ON ds.id = s.designation_id AND ds.school_id = s.school_id
     WHERE s.school_id = ? AND s.is_active = 1
     ${roleClause}
     ORDER BY s.staff_id ASC
     LIMIT 50`,
    [schoolId]
  ) as any[];

  return rows || [];
};

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

export const queryAssistant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    const db = getDatabase();
    const user = (req as AuthRequest).user;
    const userId = Number(user?.id || 0);
    const userRole = normalizeAssistantText(String(user?.role || ''));
    const message = String(req.body?.message || '');

    if (!userId) throw createError('User not authenticated', 401);
    if (!message.trim()) throw createError('Message is required', 400);
    if (message.length > 500) throw createError('Message is too long. Maximum 500 characters.', 400);

    const intent = detectAssistantIntent(message);
    const isAdminLike = ADMIN_LIKE_ROLES.has(userRole);
    const suggestions = buildAssistantSuggestions(isAdminLike);

    const successResponse = (answer: string, meta: Record<string, any> = {}) =>
      res.json({
        success: true,
        data: {
          intent,
          answer,
          suggestions,
          meta,
        },
      });

    if (intent === 'greeting') {
      successResponse('Hello! I am your School Assistant. Ask me about students, staff, classes, or your own profile.');
      return;
    }

    if (intent === 'help') {
      successResponse(
        isAdminLike
          ? 'You can ask: total students, total staff, total classes, recent students, recent staff, students in class 10, or my details.'
          : 'You can ask: my details. For detailed school-level analytics, please contact your school admin.'
      );
      return;
    }

    if (intent === 'my_profile') {
      let rows: any[] = [];
      if (schoolId == null) {
        const [userRows] = await db.execute(
          `SELECT u.name, u.email, r.name AS role_name
           FROM users u
           LEFT JOIN roles r ON r.id = u.role_id
           WHERE u.id = ? LIMIT 1`,
          [userId]
        ) as any[];
        rows = userRows || [];
      } else {
        const [userRows] = await db.execute(
          `SELECT u.name, u.email, r.name AS role_name
           FROM users u
           LEFT JOIN roles r ON r.id = u.role_id
           WHERE u.id = ? AND u.school_id = ? LIMIT 1`,
          [userId, schoolId]
        ) as any[];
        rows = userRows || [];
      }

      if (!rows.length) throw createError('User profile not found', 404);
      const row = rows[0];
      successResponse(`You are logged in as ${row.name} (${row.email}) with role ${row.role_name || userRole}.`, {
        profile: {
          name: row.name,
          email: row.email,
          role: row.role_name || userRole,
        },
      });
      return;
    }

    if (schoolId == null) {
      successResponse(
        'School-scoped analytics are not available in platform context. Please open a school account to query student/staff/class data.'
      );
      return;
    }

    if (!isAdminLike) {
      successResponse(
        'This information is restricted. You can ask for your own details, or contact your school admin for school-level data.'
      );
      return;
    }

    if (intent === 'student_count') {
      const [rows] = await db.execute(
        'SELECT COUNT(*) AS total FROM students WHERE school_id = ? AND is_active = 1',
        [schoolId]
      ) as any[];
      const total = Number(rows?.[0]?.total || 0);
      successResponse(`Total active students in your school: ${total}.`, { total });
      return;
    }

    if (intent === 'staff_count') {
      const [rows] = await db.execute(
        'SELECT COUNT(*) AS total FROM staff WHERE school_id = ? AND is_active = 1',
        [schoolId]
      ) as any[];
      const total = Number(rows?.[0]?.total || 0);
      successResponse(`Total active staff in your school: ${total}.`, { total });
      return;
    }

    if (intent === 'class_count') {
      const [rows] = await db.execute(
        'SELECT COUNT(*) AS total FROM classes WHERE school_id = ?',
        [schoolId]
      ) as any[];
      const total = Number(rows?.[0]?.total || 0);
      successResponse(`Total classes configured in your school: ${total}.`, { total });
      return;
    }

    if (intent === 'list_recent_students') {
      const [rows] = await db.execute(
        `SELECT first_name, last_name, admission_no
         FROM students
         WHERE school_id = ?
         ORDER BY id DESC
         LIMIT 5`,
        [schoolId]
      ) as any[];

      if (!rows.length) {
        successResponse('No students found for your school yet.');
        return;
      }
      const list = rows
        .map((r: any) => `${[r.first_name, r.last_name].filter(Boolean).join(' ').trim()} (${r.admission_no || 'N/A'})`)
        .join(', ');
      successResponse(`Most recent students: ${list}.`, { totalReturned: rows.length });
      return;
    }

    if (intent === 'list_recent_staff') {
      const [rows] = await db.execute(
        `SELECT first_name, last_name, staff_id
         FROM staff
         WHERE school_id = ?
         ORDER BY id DESC
         LIMIT 5`,
        [schoolId]
      ) as any[];

      if (!rows.length) {
        successResponse('No staff records found for your school yet.');
        return;
      }
      const list = rows
        .map((r: any) => `${[r.first_name, r.last_name].filter(Boolean).join(' ').trim()} (${r.staff_id || 'N/A'})`)
        .join(', ');
      successResponse(`Most recent staff members: ${list}.`, { totalReturned: rows.length });
      return;
    }

    if (intent === 'students_in_class') {
      const classNameRaw = extractClassName(message);
      if (!classNameRaw) {
        successResponse('Please specify class name, for example: "students in class 10".');
        return;
      }
      const [classRows] = await db.execute(
        'SELECT id, name FROM classes WHERE school_id = ? AND LOWER(name) = LOWER(?) LIMIT 1',
        [schoolId, classNameRaw]
      ) as any[];

      if (!classRows.length) {
        successResponse(`Class "${classNameRaw}" not found in your school.`);
        return;
      }

      const classId = Number(classRows[0].id);
      const className = String(classRows[0].name);
      const [countRows] = await db.execute(
        'SELECT COUNT(*) AS total FROM students WHERE school_id = ? AND class_id = ? AND is_active = 1',
        [schoolId, classId]
      ) as any[];

      const total = Number(countRows?.[0]?.total || 0);
      successResponse(`Total active students in class ${className}: ${total}.`, {
        class_id: classId,
        class_name: className,
        total,
      });
      return;
    }

    const llmContext: Record<string, any> = {
      detectedIntent: intent,
      suggestions,
      constraints: {
        schoolScoped: schoolId != null,
        role: userRole,
        isAdminLike,
      },
    };

    if (schoolId != null && isAdminLike) {
      const [studentRows, staffRows, classRows] = await Promise.all([
        db.execute('SELECT COUNT(*) AS total FROM students WHERE school_id = ? AND is_active = 1', [schoolId]),
        db.execute('SELECT COUNT(*) AS total FROM staff WHERE school_id = ? AND is_active = 1', [schoolId]),
        db.execute('SELECT COUNT(*) AS total FROM classes WHERE school_id = ?', [schoolId]),
      ]) as any[];

      llmContext.snapshot = {
        total_students: Number(studentRows?.[0]?.[0]?.total || 0),
        total_staff: Number(staffRows?.[0]?.[0]?.total || 0),
        total_classes: Number(classRows?.[0]?.[0]?.total || 0),
      };
    }

    const llmReply = await generateAssistantReply({
      userMessage: message,
      schoolId,
      userRole,
      userName: String(user?.email || ''),
      context: llmContext,
    });

    if (llmReply) {
      successResponse(llmReply, { used_llm: true });
      return;
    }

    successResponse(
      'I could not understand that request. Try: total students, total staff, total classes, recent students, students in class 10, or my details.'
    );
  } catch (error) {
    next(error);
  }
};

const getSelfStudentId = async (db: any, schoolId: number, userId: number): Promise<number | null> => {
  const [rows] = await db.execute(
    'SELECT id FROM students WHERE user_id = ? AND school_id = ? LIMIT 1',
    [userId, schoolId]
  ) as any[];
  if (!rows?.length) return null;
  return Number(rows[0].id || 0) || null;
};

const getParentChildrenIds = async (db: any, schoolId: number, parentEmail: string): Promise<number[]> => {
  if (!parentEmail) return [];
  const [rows] = await db.execute(
    `SELECT id
     FROM students
     WHERE school_id = ?
       AND (father_email = ? OR mother_email = ? OR guardian_email = ?)`,
    [schoolId, parentEmail, parentEmail, parentEmail]
  ) as any[];
  return (rows || []).map((r: any) => Number(r.id)).filter((id: number) => Number.isInteger(id) && id > 0);
};

const sendAssistantMenuResponse = (
  res: Response,
  message: string,
  options: AssistantMenuOption[],
  meta: Record<string, any> = {}
) => {
  res.json({
    success: true,
    data: {
      mode: 'menu',
      message,
      options: mapOptions(options),
      meta,
    },
  });
};

const sendAssistantAnswerResponse = (
  res: Response,
  answer: string,
  nextOptions: AssistantMenuOption[] = [],
  meta: Record<string, any> = {}
) => {
  res.json({
    success: true,
    data: {
      mode: 'answer',
      answer,
      options: mapOptions(nextOptions),
      meta,
    },
  });
};

export const getAssistantMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    const user = (req as AuthRequest).user;
    const userId = Number(user?.id || 0);
    const userRole = normalizeAssistantText(String(user?.role || ''));
    const userEmail = String(user?.email || '').trim();

    if (!userId) throw createError('User not authenticated', 401);

    const permissions = await getUserPermissions(userId);
    const ctx: AssistantMenuContext = {
      schoolId,
      userId,
      userRole,
      userEmail,
      modulePermissions: permissions,
      isAdminLike: ADMIN_LIKE_ROLES.has(userRole),
    };

    if (schoolId == null) {
      sendAssistantMenuResponse(
        res,
        'Platform context detected. School modules are hidden. You can check your profile.',
        [{ id: 'profile:me', label: 'My Profile' }]
      );
      return;
    }

    sendAssistantMenuResponse(
      res,
      'Choose a module to continue. Options are filtered by your role and permissions.',
      buildRootAssistantMenu(ctx)
    );
  } catch (error) {
    next(error);
  }
};

export const selectAssistantMenuOption = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const schoolId = getSchoolId(req as AuthRequest);
    const user = (req as AuthRequest).user;
    const userId = Number(user?.id || 0);
    const userRole = normalizeAssistantText(String(user?.role || ''));
    const userEmail = String(user?.email || '').trim();
    const optionId = String(req.body?.optionId || '').trim();

    if (!userId) throw createError('User not authenticated', 401);
    if (!optionId) throw createError('Option ID is required', 400);

    const permissions = await getUserPermissions(userId);
    const ctx: AssistantMenuContext = {
      schoolId,
      userId,
      userRole,
      userEmail,
      modulePermissions: permissions,
      isAdminLike: ADMIN_LIKE_ROLES.has(userRole),
    };

    if (optionId === 'assistant:home') {
      if (schoolId == null) {
        sendAssistantMenuResponse(res, 'Back to main menu.', [{ id: 'profile:me', label: 'My Profile' }]);
        return;
      }
      sendAssistantMenuResponse(res, 'Back to main menu.', buildRootAssistantMenu(ctx));
      return;
    }

    if (optionId.startsWith('module:')) {
      const submenu =
        optionId === 'module:hr' && schoolId != null
          ? await buildHrDynamicMenu(db, schoolId, ctx)
          : buildModuleMenu(optionId, ctx);
      if (!submenu.length) {
        sendAssistantAnswerResponse(
          res,
          'This module is not available for your role/permissions.',
          schoolId == null ? [{ id: 'profile:me', label: 'My Profile' }] : buildRootAssistantMenu(ctx)
        );
        return;
      }
      sendAssistantMenuResponse(res, 'Choose an option from this module.', submenu, { module: optionId });
      return;
    }

    if (optionId === 'profile:me') {
      let rows: any[] = [];
      if (schoolId == null) {
        const [userRows] = await db.execute(
          `SELECT u.name, u.email, r.name AS role_name
           FROM users u
           LEFT JOIN roles r ON r.id = u.role_id
           WHERE u.id = ? LIMIT 1`,
          [userId]
        ) as any[];
        rows = userRows || [];
      } else {
        const [userRows] = await db.execute(
          `SELECT u.name, u.email, r.name AS role_name
           FROM users u
           LEFT JOIN roles r ON r.id = u.role_id
           WHERE u.id = ? AND u.school_id = ? LIMIT 1`,
          [userId, schoolId]
        ) as any[];
        rows = userRows || [];
      }
      if (!rows.length) throw createError('User profile not found', 404);
      const row = rows[0];
      sendAssistantAnswerResponse(
        res,
        `You are logged in as ${row.name} (${row.email}) with role ${row.role_name || userRole}.`,
        schoolId == null ? [{ id: 'assistant:home', label: 'Back to Main Menu' }] : buildRootAssistantMenu(ctx)
      );
      return;
    }

    if (schoolId == null) {
      sendAssistantAnswerResponse(
        res,
        'School-scoped assistant options are not available in platform context.',
        [{ id: 'assistant:home', label: 'Back to Main Menu' }]
      );
      return;
    }

    if (optionId === 'academics:class_count' && canAccessModule(ctx, 'academics')) {
      const [rows] = await db.execute('SELECT COUNT(*) AS total FROM classes WHERE school_id = ?', [schoolId]) as any[];
      sendAssistantAnswerResponse(res, `Total classes configured: ${Number(rows?.[0]?.total || 0)}.`, buildModuleMenu('module:academics', ctx));
      return;
    }

    if (optionId === 'academics:section_count' && canAccessModule(ctx, 'academics')) {
      const [rows] = await db.execute('SELECT COUNT(*) AS total FROM sections WHERE school_id = ?', [schoolId]) as any[];
      sendAssistantAnswerResponse(res, `Total sections configured: ${Number(rows?.[0]?.total || 0)}.`, buildModuleMenu('module:academics', ctx));
      return;
    }

    if (optionId === 'academics:subject_count' && canAccessModule(ctx, 'academics')) {
      const [rows] = await db.execute('SELECT COUNT(*) AS total FROM subjects WHERE school_id = ?', [schoolId]) as any[];
      sendAssistantAnswerResponse(res, `Total subjects configured: ${Number(rows?.[0]?.total || 0)}.`, buildModuleMenu('module:academics', ctx));
      return;
    }

    if (optionId === 'students:total_active' && (ctx.isAdminLike || hasModuleViewPermission(ctx, 'students'))) {
      const [rows] = await db.execute('SELECT COUNT(*) AS total FROM students WHERE school_id = ? AND is_active = 1', [schoolId]) as any[];
      sendAssistantAnswerResponse(res, `Total active students: ${Number(rows?.[0]?.total || 0)}.`, buildModuleMenu('module:students', ctx));
      return;
    }

    if (optionId === 'students:recent' && (ctx.isAdminLike || hasModuleViewPermission(ctx, 'students'))) {
      const [rows] = await db.execute(
        `SELECT first_name, last_name, admission_no
         FROM students
         WHERE school_id = ?
         ORDER BY id DESC
         LIMIT 5`,
        [schoolId]
      ) as any[];
      if (!rows?.length) {
        sendAssistantAnswerResponse(res, 'No recent admissions found.', buildModuleMenu('module:students', ctx));
        return;
      }
      const tableRows = rows.map((r: any) => [
        String(r.admission_no || 'N/A'),
        String([r.first_name, r.last_name].filter(Boolean).join(' ').trim() || 'N/A'),
      ]);
      sendAssistantAnswerResponse(
        res,
        `Showing ${rows.length} recent admission record(s).`,
        buildModuleMenu('module:students', ctx),
        buildAssistantTableMeta(['Admission No', 'Student Name'], tableRows)
      );
      return;
    }

    if (optionId === 'students:my_class_section' && ctx.userRole === 'student') {
      const [rows] = await db.execute(
        `SELECT c.name AS class_name, sec.name AS section_name
         FROM students st
         LEFT JOIN classes c ON c.id = st.class_id AND c.school_id = st.school_id
         LEFT JOIN sections sec ON sec.id = st.section_id AND sec.school_id = st.school_id
         WHERE st.user_id = ? AND st.school_id = ? AND st.is_active = 1
         LIMIT 1`,
        [userId, schoolId]
      ) as any[];
      if (!rows?.length) {
        sendAssistantAnswerResponse(res, 'Student record not found.', buildModuleMenu('module:students', ctx));
        return;
      }
      sendAssistantAnswerResponse(
        res,
        `Your class is ${rows[0].class_name || 'N/A'} and section is ${rows[0].section_name || 'N/A'}.`,
        buildModuleMenu('module:students', ctx)
      );
      return;
    }

    if (optionId === 'students:my_children_count' && ctx.userRole === 'parent') {
      const childIds = await getParentChildrenIds(db, schoolId, userEmail);
      sendAssistantAnswerResponse(res, `You are linked to ${childIds.length} student(s).`, buildModuleMenu('module:students', ctx));
      return;
    }

    if (optionId === 'examination:exam_group_count' && canAccessModule(ctx, 'examinations')) {
      const [rows] = await db.execute('SELECT COUNT(*) AS total FROM exam_groups WHERE school_id = ?', [schoolId]) as any[];
      sendAssistantAnswerResponse(res, `Total exam groups: ${Number(rows?.[0]?.total || 0)}.`, buildModuleMenu('module:examination', ctx));
      return;
    }

    if (optionId === 'examination:exam_count' && canAccessModule(ctx, 'examinations')) {
      const [rows] = await db.execute('SELECT COUNT(*) AS total FROM exams WHERE school_id = ?', [schoolId]) as any[];
      sendAssistantAnswerResponse(res, `Total exams: ${Number(rows?.[0]?.total || 0)}.`, buildModuleMenu('module:examination', ctx));
      return;
    }

    if (optionId === 'homework:active_count' && canAccessModule(ctx, 'homework')) {
      const [rows] = await db.execute(
        `SELECT COUNT(*) AS total
         FROM homework
         WHERE school_id = ? AND submission_date >= CURDATE()`,
        [schoolId]
      ) as any[];
      sendAssistantAnswerResponse(res, `Active homework items (not past due): ${Number(rows?.[0]?.total || 0)}.`, buildModuleMenu('module:homework', ctx));
      return;
    }

    if (optionId === 'homework:my_pending' && ctx.userRole === 'student') {
      const selfStudentId = await getSelfStudentId(db, schoolId, userId);
      if (!selfStudentId) {
        sendAssistantAnswerResponse(res, 'Student profile not found.', buildModuleMenu('module:homework', ctx));
        return;
      }
      const [studentRows] = await db.execute(
        'SELECT class_id, section_id FROM students WHERE id = ? AND school_id = ? LIMIT 1',
        [selfStudentId, schoolId]
      ) as any[];
      if (!studentRows?.length) {
        sendAssistantAnswerResponse(res, 'Student class-section not found.', buildModuleMenu('module:homework', ctx));
        return;
      }
      const [rows] = await db.execute(
        `SELECT COUNT(*) AS total
         FROM homework h
         WHERE h.school_id = ? AND h.class_id = ? AND h.section_id = ? AND h.submission_date >= CURDATE()`,
        [schoolId, studentRows[0].class_id, studentRows[0].section_id]
      ) as any[];
      sendAssistantAnswerResponse(res, `Your pending homework items: ${Number(rows?.[0]?.total || 0)}.`, buildModuleMenu('module:homework', ctx));
      return;
    }

    if (optionId === 'homework:children_pending' && ctx.userRole === 'parent') {
      const childIds = await getParentChildrenIds(db, schoolId, userEmail);
      if (!childIds.length) {
        sendAssistantAnswerResponse(res, 'No linked children found for your account.', buildModuleMenu('module:homework', ctx));
        return;
      }
      const placeholders = childIds.map(() => '?').join(', ');
      const [rows] = await db.execute(
        `SELECT COUNT(*) AS total
         FROM homework h
         INNER JOIN students s
           ON s.school_id = h.school_id
          AND s.class_id = h.class_id
          AND s.section_id = h.section_id
         WHERE h.school_id = ?
           AND s.id IN (${placeholders})
           AND h.submission_date >= CURDATE()`,
        [schoolId, ...childIds]
      ) as any[];
      sendAssistantAnswerResponse(res, `Pending homework items across your children: ${Number(rows?.[0]?.total || 0)}.`, buildModuleMenu('module:homework', ctx));
      return;
    }

    if (optionId === 'frontoffice:visitors_today' && canAccessModule(ctx, 'front-office')) {
      const [rows] = await db.execute(
        `SELECT COUNT(*) AS total
         FROM visitors
         WHERE school_id = ? AND DATE(visit_date) = CURDATE()`,
        [schoolId]
      ) as any[];
      sendAssistantAnswerResponse(res, `Visitors recorded today: ${Number(rows?.[0]?.total || 0)}.`, buildModuleMenu('module:frontoffice', ctx));
      return;
    }

    if (optionId === 'frontoffice:pending_enquiries' && canAccessModule(ctx, 'front-office')) {
      const [rows] = await db.execute(
        `SELECT COUNT(*) AS total
         FROM admission_enquiries
         WHERE school_id = ? AND (status IS NULL OR status NOT IN ('closed', 'converted'))`,
        [schoolId]
      ) as any[];
      sendAssistantAnswerResponse(res, `Open/pending enquiries: ${Number(rows?.[0]?.total || 0)}.`, buildModuleMenu('module:frontoffice', ctx));
      return;
    }

    if (optionId === 'hr:active_staff_count' && canAccessModule(ctx, 'hr')) {
      const [rows] = await db.execute(
        'SELECT COUNT(*) AS total FROM staff WHERE school_id = ? AND is_active = 1',
        [schoolId]
      ) as any[];
      sendAssistantAnswerResponse(
        res,
        `Active staff members: ${Number(rows?.[0]?.total || 0)}.`,
        await buildHrDynamicMenu(db, schoolId, ctx)
      );
      return;
    }

    if (optionId === 'hr:pending_leave_requests' && canAccessModule(ctx, 'hr')) {
      const [rows] = await db.execute(
        `SELECT COUNT(*) AS total
         FROM leave_requests
         WHERE school_id = ? AND status = 'pending'`,
        [schoolId]
      ) as any[];
      sendAssistantAnswerResponse(
        res,
        `Pending staff leave requests: ${Number(rows?.[0]?.total || 0)}.`,
        await buildHrDynamicMenu(db, schoolId, ctx)
      );
      return;
    }

    if (optionId === 'hr:list_teachers' && canAccessModule(ctx, 'hr')) {
      const rows = await getHrStaffListByCategory(db, schoolId, 'teacher');
      if (!rows.length) {
        sendAssistantAnswerResponse(res, 'No teachers found.', await buildHrDynamicMenu(db, schoolId, ctx));
        return;
      }
      const tableRows = rows.map((r: any) => [
        String(r.staff_id || 'N/A'),
        String(r.staff_name || 'N/A'),
        String(r.role_name || 'N/A'),
        String(r.department_name || 'N/A'),
        String(r.designation_name || 'N/A'),
        String(r.email || 'N/A'),
      ]);
      sendAssistantAnswerResponse(
        res,
        `Showing ${rows.length} teacher record(s).`,
        await buildHrDynamicMenu(db, schoolId, ctx),
        buildAssistantTableMeta(['Staff ID', 'Name', 'Role', 'Department', 'Designation', 'Email'], tableRows)
      );
      return;
    }

    if (optionId === 'hr:list_librarians' && canAccessModule(ctx, 'hr')) {
      const rows = await getHrStaffListByCategory(db, schoolId, 'librarian');
      if (!rows.length) {
        sendAssistantAnswerResponse(res, 'No librarians found.', await buildHrDynamicMenu(db, schoolId, ctx));
        return;
      }
      const tableRows = rows.map((r: any) => [
        String(r.staff_id || 'N/A'),
        String(r.staff_name || 'N/A'),
        String(r.role_name || 'N/A'),
        String(r.department_name || 'N/A'),
        String(r.designation_name || 'N/A'),
        String(r.email || 'N/A'),
      ]);
      sendAssistantAnswerResponse(
        res,
        `Showing ${rows.length} librarian record(s).`,
        await buildHrDynamicMenu(db, schoolId, ctx),
        buildAssistantTableMeta(['Staff ID', 'Name', 'Role', 'Department', 'Designation', 'Email'], tableRows)
      );
      return;
    }

    if (optionId === 'hr:list_other_staff' && canAccessModule(ctx, 'hr')) {
      const rows = await getHrStaffListByCategory(db, schoolId, 'other');
      if (!rows.length) {
        sendAssistantAnswerResponse(res, 'No other staff records found.', await buildHrDynamicMenu(db, schoolId, ctx));
        return;
      }
      const tableRows = rows.map((r: any) => [
        String(r.staff_id || 'N/A'),
        String(r.staff_name || 'N/A'),
        String(r.role_name || 'N/A'),
        String(r.department_name || 'N/A'),
        String(r.designation_name || 'N/A'),
        String(r.email || 'N/A'),
      ]);
      sendAssistantAnswerResponse(
        res,
        `Showing ${rows.length} other staff record(s).`,
        await buildHrDynamicMenu(db, schoolId, ctx),
        buildAssistantTableMeta(['Staff ID', 'Name', 'Role', 'Department', 'Designation', 'Email'], tableRows)
      );
      return;
    }

    if (optionId === 'fees:pending_invoices_count' && canAccessModule(ctx, 'fees')) {
      const [rows] = await db.execute(
        `SELECT COUNT(*) AS total
         FROM fees_invoices
         WHERE school_id = ? AND status IN ('unpaid', 'partial')`,
        [schoolId]
      ) as any[];
      sendAssistantAnswerResponse(res, `Pending invoices (unpaid/partial): ${Number(rows?.[0]?.total || 0)}.`, buildModuleMenu('module:fees', ctx));
      return;
    }

    if (optionId === 'fees:my_unpaid_invoices' && ctx.userRole === 'student') {
      const selfStudentId = await getSelfStudentId(db, schoolId, userId);
      if (!selfStudentId) {
        sendAssistantAnswerResponse(res, 'Student profile not found.', buildModuleMenu('module:fees', ctx));
        return;
      }
      const [rows] = await db.execute(
        `SELECT COUNT(*) AS total
         FROM fees_invoices
         WHERE school_id = ? AND student_id = ? AND status IN ('unpaid', 'partial')`,
        [schoolId, selfStudentId]
      ) as any[];
      sendAssistantAnswerResponse(res, `Your unpaid/partial invoices: ${Number(rows?.[0]?.total || 0)}.`, buildModuleMenu('module:fees', ctx));
      return;
    }

    if (optionId === 'fees:children_unpaid_invoices' && ctx.userRole === 'parent') {
      const childIds = await getParentChildrenIds(db, schoolId, userEmail);
      if (!childIds.length) {
        sendAssistantAnswerResponse(res, 'No linked children found for your account.', buildModuleMenu('module:fees', ctx));
        return;
      }
      const placeholders = childIds.map(() => '?').join(', ');
      const [rows] = await db.execute(
        `SELECT COUNT(*) AS total
         FROM fees_invoices
         WHERE school_id = ? AND student_id IN (${placeholders}) AND status IN ('unpaid', 'partial')`,
        [schoolId, ...childIds]
      ) as any[];
      sendAssistantAnswerResponse(res, `Children unpaid/partial invoices: ${Number(rows?.[0]?.total || 0)}.`, buildModuleMenu('module:fees', ctx));
      return;
    }

    if (optionId === 'attendance:today_marked_count' && canAccessModule(ctx, 'attendance')) {
      const [rows] = await db.execute(
        `SELECT COUNT(*) AS total
         FROM student_attendance
         WHERE school_id = ? AND DATE(attendance_date) = CURDATE()`,
        [schoolId]
      ) as any[];
      sendAssistantAnswerResponse(res, `Attendance rows marked today: ${Number(rows?.[0]?.total || 0)}.`, buildModuleMenu('module:attendance', ctx));
      return;
    }

    if (optionId === 'attendance:my_monthly_summary' && ctx.userRole === 'student') {
      const selfStudentId = await getSelfStudentId(db, schoolId, userId);
      if (!selfStudentId) {
        sendAssistantAnswerResponse(res, 'Student profile not found.', buildModuleMenu('module:attendance', ctx));
        return;
      }
      const [rows] = await db.execute(
        `SELECT
           COUNT(CASE WHEN status = 'present' THEN 1 END) AS present_count,
           COUNT(CASE WHEN status = 'absent' THEN 1 END) AS absent_count,
           COUNT(CASE WHEN status = 'late' THEN 1 END) AS late_count,
           COUNT(CASE WHEN status = 'half_day' THEN 1 END) AS half_day_count
         FROM student_attendance
         WHERE school_id = ? AND student_id = ? AND MONTH(attendance_date) = MONTH(CURDATE()) AND YEAR(attendance_date) = YEAR(CURDATE())`,
        [schoolId, selfStudentId]
      ) as any[];
      const row = rows?.[0] || {};
      sendAssistantAnswerResponse(
        res,
        `Your attendance this month - Present: ${Number(row.present_count || 0)}, Absent: ${Number(row.absent_count || 0)}, Late: ${Number(row.late_count || 0)}, Half Day: ${Number(row.half_day_count || 0)}.`,
        buildModuleMenu('module:attendance', ctx)
      );
      return;
    }

    if (optionId === 'attendance:children_monthly_summary' && ctx.userRole === 'parent') {
      const childIds = await getParentChildrenIds(db, schoolId, userEmail);
      if (!childIds.length) {
        sendAssistantAnswerResponse(res, 'No linked children found for your account.', buildModuleMenu('module:attendance', ctx));
        return;
      }
      const placeholders = childIds.map(() => '?').join(', ');
      const [rows] = await db.execute(
        `SELECT
           COUNT(CASE WHEN status = 'present' THEN 1 END) AS present_count,
           COUNT(CASE WHEN status = 'absent' THEN 1 END) AS absent_count,
           COUNT(CASE WHEN status = 'late' THEN 1 END) AS late_count,
           COUNT(CASE WHEN status = 'half_day' THEN 1 END) AS half_day_count
         FROM student_attendance
         WHERE school_id = ? AND student_id IN (${placeholders})
           AND MONTH(attendance_date) = MONTH(CURDATE()) AND YEAR(attendance_date) = YEAR(CURDATE())`,
        [schoolId, ...childIds]
      ) as any[];
      const row = rows?.[0] || {};
      sendAssistantAnswerResponse(
        res,
        `Children attendance this month - Present: ${Number(row.present_count || 0)}, Absent: ${Number(row.absent_count || 0)}, Late: ${Number(row.late_count || 0)}, Half Day: ${Number(row.half_day_count || 0)}.`,
        buildModuleMenu('module:attendance', ctx)
      );
      return;
    }

    sendAssistantAnswerResponse(
      res,
      'This option is not available for your role or permissions.',
      schoolId == null ? [{ id: 'assistant:home', label: 'Back to Main Menu' }] : buildRootAssistantMenu(ctx)
    );
  } catch (error) {
    next(error);
  }
};

