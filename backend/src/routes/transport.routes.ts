import express from 'express';
import {
  getRoutes, createRoute, updateRoute, deleteRoute,
  getVehicles, createVehicle, updateVehicle, deleteVehicle,
  getVehicleAssignments, createVehicleAssignment, deleteVehicleAssignment,
} from '../controllers/transport.controller';
import { authenticate, authorize } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

router.use(authenticate);

// Routes
router.get('/routes', checkPermission('transport', 'view'), getRoutes);
router.post('/routes', checkPermission('transport', 'add'), createRoute);
router.put('/routes/:id', checkPermission('transport', 'edit'), updateRoute);
router.delete('/routes/:id', checkPermission('transport', 'delete'), deleteRoute);

// Vehicles
router.get('/vehicles', checkPermission('transport', 'view'), getVehicles);
router.post('/vehicles', checkPermission('transport', 'add'), createVehicle);
router.put('/vehicles/:id', checkPermission('transport', 'edit'), updateVehicle);
router.delete('/vehicles/:id', checkPermission('transport', 'delete'), deleteVehicle);

// Vehicle Assignments
router.get('/assignments', checkPermission('transport', 'view'), getVehicleAssignments);
router.post('/assignments', checkPermission('transport', 'add'), createVehicleAssignment);
router.delete('/assignments/:id', checkPermission('transport', 'delete'), deleteVehicleAssignment);

export default router;

