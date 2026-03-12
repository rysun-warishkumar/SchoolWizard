import crypto from 'crypto';
import { getDatabase } from '../config/database';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export const createPasswordSetupLink = async (userId: number): Promise<string> => {
  const db = getDatabase();
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await db.execute(
    'REPLACE INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt]
  );

  const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${frontendBase}/reset-password?token=${rawToken}`;
};
