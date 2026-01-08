import express from 'express';
import {
  getCertificateTemplates, getCertificateTemplateById,
  createCertificateTemplate, updateCertificateTemplate, deleteCertificateTemplate,
  getIdCardTemplates, getIdCardTemplateById,
  createIdCardTemplate, updateIdCardTemplate, deleteIdCardTemplate,
  generateCertificate, generateIdCard,
  upload,
} from '../controllers/certificate.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

router.use(authenticate);

// Certificate Templates Routes
router.get('/certificate-templates', checkPermission('certificate', 'view'), getCertificateTemplates);
router.get('/certificate-templates/:id', checkPermission('certificate', 'view'), getCertificateTemplateById);
router.post('/certificate-templates', checkPermission('certificate', 'add'), upload.single('background_image'), createCertificateTemplate);
router.put('/certificate-templates/:id', checkPermission('certificate', 'edit'), upload.single('background_image'), updateCertificateTemplate);
router.delete('/certificate-templates/:id', checkPermission('certificate', 'delete'), deleteCertificateTemplate);

// ID Card Templates Routes
router.get('/id-card-templates', checkPermission('certificate', 'view'), getIdCardTemplates);
router.get('/id-card-templates/:id', checkPermission('certificate', 'view'), getIdCardTemplateById);
router.post('/id-card-templates', checkPermission('certificate', 'add'), upload.fields([
  { name: 'background_image', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
]), createIdCardTemplate);
router.put('/id-card-templates/:id', checkPermission('certificate', 'edit'), upload.fields([
  { name: 'background_image', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
]), updateIdCardTemplate);
router.delete('/id-card-templates/:id', checkPermission('certificate', 'delete'), deleteIdCardTemplate);

// Generate Routes
router.post('/generate-certificate', checkPermission('certificate', 'add'), generateCertificate);
router.post('/generate-id-card', checkPermission('certificate', 'add'), generateIdCard);

export default router;

