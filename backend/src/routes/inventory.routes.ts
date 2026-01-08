import express from 'express';
import {
  getItemCategories, createItemCategory, updateItemCategory, deleteItemCategory,
  getItemStores, createItemStore, updateItemStore, deleteItemStore,
  getItemSuppliers, createItemSupplier, updateItemSupplier, deleteItemSupplier,
  getItems, createItem, updateItem, deleteItem,
  getItemStocks, createItemStock, updateItemStock, deleteItemStock,
  getItemIssues, createItemIssue, returnItemIssue, deleteItemIssue,
  getAvailableStock,
} from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

router.use(authenticate);

// Item Categories Routes
router.get('/categories', checkPermission('inventory', 'view'), getItemCategories);
router.post('/categories', checkPermission('inventory', 'add'), createItemCategory);
router.put('/categories/:id', checkPermission('inventory', 'edit'), updateItemCategory);
router.delete('/categories/:id', checkPermission('inventory', 'delete'), deleteItemCategory);

// Item Stores Routes
router.get('/stores', checkPermission('inventory', 'view'), getItemStores);
router.post('/stores', checkPermission('inventory', 'add'), createItemStore);
router.put('/stores/:id', checkPermission('inventory', 'edit'), updateItemStore);
router.delete('/stores/:id', checkPermission('inventory', 'delete'), deleteItemStore);

// Item Suppliers Routes
router.get('/suppliers', checkPermission('inventory', 'view'), getItemSuppliers);
router.post('/suppliers', checkPermission('inventory', 'add'), createItemSupplier);
router.put('/suppliers/:id', checkPermission('inventory', 'edit'), updateItemSupplier);
router.delete('/suppliers/:id', checkPermission('inventory', 'delete'), deleteItemSupplier);

// Items Routes
router.get('/items', checkPermission('inventory', 'view'), getItems);
router.post('/items', checkPermission('inventory', 'add'), createItem);
router.put('/items/:id', checkPermission('inventory', 'edit'), updateItem);
router.delete('/items/:id', checkPermission('inventory', 'delete'), deleteItem);

// Item Stocks Routes
router.get('/stocks', checkPermission('inventory', 'view'), getItemStocks);
router.post('/stocks', checkPermission('inventory', 'add'), createItemStock);
router.put('/stocks/:id', checkPermission('inventory', 'edit'), updateItemStock);
router.delete('/stocks/:id', checkPermission('inventory', 'delete'), deleteItemStock);

// Item Issues Routes
router.get('/issues', checkPermission('inventory', 'view'), getItemIssues);
router.post('/issues', checkPermission('inventory', 'add'), createItemIssue);
router.put('/issues/:id/return', checkPermission('inventory', 'edit'), returnItemIssue);
router.delete('/issues/:id', checkPermission('inventory', 'delete'), deleteItemIssue);

// Get Available Stock
router.get('/items/:item_id/available-stock', checkPermission('inventory', 'view'), getAvailableStock);

export default router;

