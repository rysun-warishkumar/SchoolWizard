import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();

    // Get total counts
    const [usersCount] = await db.execute('SELECT COUNT(*) as total FROM users WHERE is_active = 1') as any[];
    const [studentsCount] = await db.execute(
      'SELECT COUNT(*) as total FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = ? AND u.is_active = 1',
      ['student']
    ) as any[];
    const [teachersCount] = await db.execute(
      'SELECT COUNT(*) as total FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = ? AND u.is_active = 1',
      ['teacher']
    ) as any[];
    const [classesCount] = await db.execute('SELECT COUNT(DISTINCT class_id) as total FROM class_sections') as any[];

    // Get recent activities (placeholder - will be enhanced later)
    const recentActivities: any[] = [];

    res.json({
      success: true,
      data: {
        totalUsers: usersCount[0].total,
        totalStudents: studentsCount[0].total,
        totalTeachers: teachersCount[0].total,
        totalClasses: classesCount[0].total || 0,
        recentActivities,
      },
    });
  } catch (error) {
    next(error);
  }
};

