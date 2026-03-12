import { NextFunction, Request, Response } from 'express';
import { getDatabase } from '../config/database';
import { env, isDevelopment } from '../config/env';

type MutableRequest = Request & { user?: Record<string, unknown>; tenantContext?: Record<string, unknown> };

const normalizeHost = (host?: string): string | null => {
  if (!host) return null;
  const value = host.toLowerCase().trim();
  return value.split(':')[0] || null;
};

const resolveSchoolFromDomain = async (
  host: string
): Promise<{ schoolId: number; tenantId: number } | null> => {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT t.school_id, t.id as tenant_id
     FROM tenant_domains td
     INNER JOIN tenants t ON t.id = td.tenant_id
     WHERE td.domain = ? 
       AND td.is_active = 1
       AND td.verification_status = 'verified'
     LIMIT 1`,
    [host]
  ) as any[];

  if (!rows || rows.length === 0) return null;
  return {
    schoolId: Number(rows[0].school_id),
    tenantId: Number(rows[0].tenant_id),
  };
};

export const resolvePublicSchoolContext = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const run = async () => {
    let schoolId: number | null = null;
    let tenantId: number | null = null;

    // Prefer verified domain mapping when enabled.
    if (env.saas.controlPlaneEnabled && env.saas.domainRoutingEnabled) {
      const host = normalizeHost(req.headers.host);
      const isLocal = host ? /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/i.test(host) : false;
      if (host && (!isDevelopment() || !isLocal)) {
        try {
          const domainMatch = await resolveSchoolFromDomain(host);
          if (domainMatch) {
            schoolId = domainMatch.schoolId;
            tenantId = domainMatch.tenantId;
          }
        } catch (error) {
          // Keep legacy fallback path if control-plane tables are not ready.
        }
      }
    }

    // Legacy fallback path.
    if (schoolId == null) {
      const rawSchoolId = req.query.school_id ?? req.headers['x-school-id'];
      const parsed = Number(rawSchoolId);
      if (rawSchoolId && Number.isInteger(parsed) && parsed > 0) {
        schoolId = parsed;
      }
    }

    if (schoolId == null) {
      res.status(400).json({
        success: false,
        message: 'Valid school_id or verified school domain is required for public school content',
      });
      return;
    }

    const mutableReq = req as MutableRequest;
    mutableReq.user = {
      ...(mutableReq.user || {}),
      schoolId,
    };
    mutableReq.tenantContext = {
      ...(mutableReq.tenantContext || {}),
      tenantId: tenantId ?? undefined,
      resolvedBy: tenantId ? 'domain' : 'school_id',
    };

    next();
  };

  run().catch(next);
};
