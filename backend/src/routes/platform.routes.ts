import express from 'express';
import { authenticate } from '../middleware/auth';
import { requirePlatformAdmin } from '../middleware/auth';
import {
  listSchools,
  getSchool,
  updateSchool,
  getSchoolControlPlane,
  registerTenantDomain,
  updateTenantDomain,
  requestDedicatedProvision,
  updateTenantEnvironment,
  createTenantMigration,
  runTenantMigrationPrecheck,
  markTenantCutoverComplete,
  rollbackTenantMigration,
  setTenantReadOnlyFreeze,
} from '../controllers/platform.controller';

const router = express.Router();

router.use(authenticate, requirePlatformAdmin);

router.get('/schools', listSchools);
router.get('/schools/:id', getSchool);
router.patch('/schools/:id', updateSchool);
router.get('/schools/:id/control-plane', getSchoolControlPlane);
router.post('/schools/:id/domains', registerTenantDomain);
router.patch('/schools/:id/domains/:domainId', updateTenantDomain);
router.post('/schools/:id/dedicated/provision', requestDedicatedProvision);
router.patch('/schools/:id/environments/:environmentId', updateTenantEnvironment);
router.post('/schools/:id/migrations', createTenantMigration);
router.post('/schools/:id/migrations/:migrationId/precheck', runTenantMigrationPrecheck);
router.post('/schools/:id/migrations/:migrationId/cutover', markTenantCutoverComplete);
router.post('/schools/:id/migrations/:migrationId/rollback', rollbackTenantMigration);
router.patch('/schools/:id/read-only-freeze', setTenantReadOnlyFreeze);

export default router;
