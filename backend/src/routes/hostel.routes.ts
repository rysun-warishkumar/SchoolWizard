import express from 'express';
import {
  getHostels, createHostel, updateHostel, deleteHostel,
  getRoomTypes, createRoomType, updateRoomType, deleteRoomType,
  getHostelRooms, createHostelRoom, updateHostelRoom, deleteHostelRoom,
} from '../controllers/hostel.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

router.use(authenticate);

// Hostels Routes
router.get('/hostels', checkPermission('hostel', 'view'), getHostels);
router.post('/hostels', checkPermission('hostel', 'add'), createHostel);
router.put('/hostels/:id', checkPermission('hostel', 'edit'), updateHostel);
router.delete('/hostels/:id', checkPermission('hostel', 'delete'), deleteHostel);

// Room Types Routes
router.get('/room-types', checkPermission('hostel', 'view'), getRoomTypes);
router.post('/room-types', checkPermission('hostel', 'add'), createRoomType);
router.put('/room-types/:id', checkPermission('hostel', 'edit'), updateRoomType);
router.delete('/room-types/:id', checkPermission('hostel', 'delete'), deleteRoomType);

// Hostel Rooms Routes
router.get('/rooms', checkPermission('hostel', 'view'), getHostelRooms);
router.post('/rooms', checkPermission('hostel', 'add'), createHostelRoom);
router.put('/rooms/:id', checkPermission('hostel', 'edit'), updateHostelRoom);
router.delete('/rooms/:id', checkPermission('hostel', 'delete'), deleteHostelRoom);

export default router;

