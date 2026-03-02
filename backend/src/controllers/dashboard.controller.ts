import { Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest, getSchoolId } from '../middleware/auth';

export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req);
    if (schoolId == null) {
      return next(createError('School context required', 403));
    }

    const db = getDatabase();

    const [usersCount] = await db.execute(
      'SELECT COUNT(*) as total FROM users WHERE school_id = ? AND is_active = 1',
      [schoolId]
    ) as any[];
    const [studentsCount] = await db.execute(
      'SELECT COUNT(*) as total FROM students WHERE school_id = ? AND is_active = 1',
      [schoolId]
    ) as any[];
    const [teachersCount] = await db.execute(
      'SELECT COUNT(*) as total FROM staff s WHERE s.school_id = ? AND s.is_active = 1',
      [schoolId]
    ) as any[];
    const [classesCount] = await db.execute(
      'SELECT COUNT(*) as total FROM classes WHERE school_id = ?',
      [schoolId]
    ) as any[];

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

