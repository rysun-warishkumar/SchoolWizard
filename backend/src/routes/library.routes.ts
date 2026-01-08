import express from 'express';
import {
  getBooks, getBookById, createBook, updateBook, deleteBook,
  getLibraryMembers, addStudentMember, addStaffMember, removeLibraryMember,
  getBookIssues, issueBook, returnBook,
} from '../controllers/library.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

router.use(authenticate);

// Book Routes
router.get('/books', checkPermission('library', 'view'), getBooks);
router.get('/books/:id', checkPermission('library', 'view'), getBookById);
router.post('/books', checkPermission('library', 'add'), createBook);
router.put('/books/:id', checkPermission('library', 'edit'), updateBook);
router.delete('/books/:id', checkPermission('library', 'delete'), deleteBook);

// Library Member Routes
router.get('/members', checkPermission('library', 'view'), getLibraryMembers);
router.post('/members/students', checkPermission('library', 'add'), addStudentMember);
router.post('/members/staff', checkPermission('library', 'add'), addStaffMember);
router.delete('/members/:id', checkPermission('library', 'delete'), removeLibraryMember);

// Book Issue Routes
router.get('/issues', checkPermission('library', 'view'), getBookIssues);
router.post('/issues', checkPermission('library', 'add'), issueBook);
router.put('/issues/:id/return', checkPermission('library', 'edit'), returnBook);

export default router;

