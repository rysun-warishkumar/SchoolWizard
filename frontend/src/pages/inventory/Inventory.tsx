import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import {
  inventoryService,
  ItemCategory,
  ItemStore,
  ItemSupplier,
  Item,
  ItemStock,
} from '../../services/api/inventoryService';
import { studentsService } from '../../services/api/studentsService';
import { hrService } from '../../services/api/hrService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import './Inventory.css';

type TabType = 'item-category' | 'item-store' | 'item-supplier' | 'add-item' | 'stock-add-item' | 'issue-item';

const Inventory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType;
  const validTabs: TabType[] = ['item-category', 'item-store', 'item-supplier', 'add-item', 'stock-add-item', 'issue-item'];
  const defaultTab: TabType = validTabs.includes(tabFromUrl) ? tabFromUrl : 'item-category';

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="inventory-page">
      <div className="page-header">
        <h1>Inventory</h1>
      </div>

      <div className="inventory-tabs">
        <button
          className={activeTab === 'item-category' ? 'active' : ''}
          onClick={() => handleTabChange('item-category')}
        >
          Item Category
        </button>
        <button
          className={activeTab === 'item-store' ? 'active' : ''}
          onClick={() => handleTabChange('item-store')}
        >
          Item Store
        </button>
        <button
          className={activeTab === 'item-supplier' ? 'active' : ''}
          onClick={() => handleTabChange('item-supplier')}
        >
          Item Supplier
        </button>
        <button
          className={activeTab === 'add-item' ? 'active' : ''}
          onClick={() => handleTabChange('add-item')}
        >
          Add Item
        </button>
        <button
          className={activeTab === 'stock-add-item' ? 'active' : ''}
          onClick={() => handleTabChange('stock-add-item')}
        >
          Stock Add Item
        </button>
        <button
          className={activeTab === 'issue-item' ? 'active' : ''}
          onClick={() => handleTabChange('issue-item')}
        >
          Issue Item
        </button>
      </div>

      <div className="inventory-content">
        {activeTab === 'item-category' && <ItemCategoryTab />}
        {activeTab === 'item-store' && <ItemStoreTab />}
        {activeTab === 'item-supplier' && <ItemSupplierTab />}
        {activeTab === 'add-item' && <AddItemTab />}
        {activeTab === 'stock-add-item' && <StockAddItemTab />}
        {activeTab === 'issue-item' && <IssueItemTab />}
      </div>
    </div>
  );
};

// ========== Item Category Tab ==========

const ItemCategoryTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | null>(null);

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading, refetch } = useQuery(
    'item-categories',
    () => inventoryService.getItemCategories(),
    { refetchOnWindowFocus: true }
  );

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const createMutation = useMutation(inventoryService.createItemCategory, {
    onSuccess: () => {
      queryClient.invalidateQueries('item-categories');
      refetch();
      showToast('Item category created successfully', 'success');
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create category', 'error');
    },
  });

  const updateMutation = useMutation(
    (data: { id: number; data: Partial<ItemCategory> }) => inventoryService.updateItemCategory(data.id, data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('item-categories');
        refetch();
        showToast('Item category updated successfully', 'success');
        setShowEditModal(false);
        setSelectedCategory(null);
        resetForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update category', 'error');
      },
    }
  );

  const deleteMutation = useMutation(inventoryService.deleteItemCategory, {
    onSuccess: () => {
      queryClient.invalidateQueries('item-categories');
      refetch();
      showToast('Item category deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete category', 'error');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', description: '' });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showToast('Category name is required', 'error');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (category: ItemCategory) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !formData.name) {
      showToast('Category name is required', 'error');
      return;
    }
    updateMutation.mutate({ id: selectedCategory.id, data: formData });
  };

  return (
    <div className="inventory-tab-content">
      <div className="tab-header">
        <button className="btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
          + Add Category
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : categories.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{category.description || '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-sm btn-secondary" onClick={() => handleEdit(category)}>Edit</button>
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this category?')) {
                          deleteMutation.mutate(category.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">No categories found</div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); }} title="Add Category">
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label>Name <span className="required">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>Save</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedCategory(null); resetForm(); }} title="Edit Category">
        <form onSubmit={handleUpdateSubmit}>
          <div className="form-group">
            <label>Name <span className="required">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowEditModal(false); setSelectedCategory(null); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={updateMutation.isLoading}>Update</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ========== Item Store Tab ==========

const ItemStoreTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState<ItemStore | null>(null);

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: stores = [], isLoading, refetch } = useQuery(
    'item-stores',
    () => inventoryService.getItemStores(),
    { refetchOnWindowFocus: true }
  );

  const [formData, setFormData] = useState({
    name: '',
    stock_code: '',
    description: '',
  });

  const createMutation = useMutation(inventoryService.createItemStore, {
    onSuccess: () => {
      queryClient.invalidateQueries('item-stores');
      refetch();
      showToast('Item store created successfully', 'success');
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create store', 'error');
    },
  });

  const updateMutation = useMutation(
    (data: { id: number; data: Partial<ItemStore> }) => inventoryService.updateItemStore(data.id, data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('item-stores');
        refetch();
        showToast('Item store updated successfully', 'success');
        setShowEditModal(false);
        setSelectedStore(null);
        resetForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update store', 'error');
      },
    }
  );

  const deleteMutation = useMutation(inventoryService.deleteItemStore, {
    onSuccess: () => {
      queryClient.invalidateQueries('item-stores');
      refetch();
      showToast('Item store deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete store', 'error');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', stock_code: '', description: '' });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.stock_code) {
      showToast('Store name and stock code are required', 'error');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (store: ItemStore) => {
    setSelectedStore(store);
    setFormData({
      name: store.name,
      stock_code: store.stock_code,
      description: store.description || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore || !formData.name || !formData.stock_code) {
      showToast('Store name and stock code are required', 'error');
      return;
    }
    updateMutation.mutate({ id: selectedStore.id, data: formData });
  };

  return (
    <div className="inventory-tab-content">
      <div className="tab-header">
        <button className="btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
          + Add Store
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : stores.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Stock Code</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store.id}>
                <td>{store.name}</td>
                <td>{store.stock_code}</td>
                <td>{store.description || '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-sm btn-secondary" onClick={() => handleEdit(store)}>Edit</button>
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this store?')) {
                          deleteMutation.mutate(store.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">No stores found</div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); }} title="Add Store">
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label>Name <span className="required">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Stock Code <span className="required">*</span></label>
            <input
              type="text"
              value={formData.stock_code}
              onChange={(e) => setFormData({ ...formData, stock_code: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>Save</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedStore(null); resetForm(); }} title="Edit Store">
        <form onSubmit={handleUpdateSubmit}>
          <div className="form-group">
            <label>Name <span className="required">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Stock Code <span className="required">*</span></label>
            <input
              type="text"
              value={formData.stock_code}
              onChange={(e) => setFormData({ ...formData, stock_code: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowEditModal(false); setSelectedStore(null); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={updateMutation.isLoading}>Update</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ========== Item Supplier Tab ==========

const ItemSupplierTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<ItemSupplier | null>(null);

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading, refetch } = useQuery(
    'item-suppliers',
    () => inventoryService.getItemSuppliers(),
    { refetchOnWindowFocus: true }
  );

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    contact_person_name: '',
    contact_person_phone: '',
    contact_person_email: '',
    description: '',
  });

  const createMutation = useMutation(inventoryService.createItemSupplier, {
    onSuccess: () => {
      queryClient.invalidateQueries('item-suppliers');
      refetch();
      showToast('Item supplier created successfully', 'success');
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create supplier', 'error');
    },
  });

  const updateMutation = useMutation(
    (data: { id: number; data: Partial<ItemSupplier> }) => inventoryService.updateItemSupplier(data.id, data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('item-suppliers');
        refetch();
        showToast('Item supplier updated successfully', 'success');
        setShowEditModal(false);
        setSelectedSupplier(null);
        resetForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update supplier', 'error');
      },
    }
  );

  const deleteMutation = useMutation(inventoryService.deleteItemSupplier, {
    onSuccess: () => {
      queryClient.invalidateQueries('item-suppliers');
      refetch();
      showToast('Item supplier deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete supplier', 'error');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      contact_person_name: '',
      contact_person_phone: '',
      contact_person_email: '',
      description: '',
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showToast('Supplier name is required', 'error');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (supplier: ItemSupplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      contact_person_name: supplier.contact_person_name || '',
      contact_person_phone: supplier.contact_person_phone || '',
      contact_person_email: supplier.contact_person_email || '',
      description: supplier.description || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !formData.name) {
      showToast('Supplier name is required', 'error');
      return;
    }
    updateMutation.mutate({ id: selectedSupplier.id, data: formData });
  };

  return (
    <div className="inventory-tab-content">
      <div className="tab-header">
        <button className="btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
          + Add Supplier
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : suppliers.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Contact Person</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>{supplier.name}</td>
                <td>{supplier.phone || '-'}</td>
                <td>{supplier.email || '-'}</td>
                <td>{supplier.contact_person_name || '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-sm btn-secondary" onClick={() => handleEdit(supplier)}>Edit</button>
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this supplier?')) {
                          deleteMutation.mutate(supplier.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">No suppliers found</div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); }} title="Add Supplier" size="large">
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label>Name <span className="required">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
            />
          </div>
          <div className="form-group">
            <label>Contact Person Name</label>
            <input
              type="text"
              value={formData.contact_person_name}
              onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Contact Person Phone</label>
              <input
                type="text"
                value={formData.contact_person_phone}
                onChange={(e) => setFormData({ ...formData, contact_person_phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Contact Person Email</label>
              <input
                type="email"
                value={formData.contact_person_email}
                onChange={(e) => setFormData({ ...formData, contact_person_email: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>Save</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedSupplier(null); resetForm(); }} title="Edit Supplier" size="large">
        <form onSubmit={handleUpdateSubmit}>
          <div className="form-group">
            <label>Name <span className="required">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
            />
          </div>
          <div className="form-group">
            <label>Contact Person Name</label>
            <input
              type="text"
              value={formData.contact_person_name}
              onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Contact Person Phone</label>
              <input
                type="text"
                value={formData.contact_person_phone}
                onChange={(e) => setFormData({ ...formData, contact_person_phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Contact Person Email</label>
              <input
                type="email"
                value={formData.contact_person_email}
                onChange={(e) => setFormData({ ...formData, contact_person_email: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowEditModal(false); setSelectedSupplier(null); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={updateMutation.isLoading}>Update</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ========== Add Item Tab ==========

const AddItemTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery('item-categories', () => inventoryService.getItemCategories());
  const { data: items = [], isLoading, refetch } = useQuery(
    ['items', searchTerm, categoryFilter],
    () => inventoryService.getItems({
      search: searchTerm || undefined,
      category_id: categoryFilter ? Number(categoryFilter) : undefined,
    }),
    { refetchOnWindowFocus: true }
  );

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
  });

  const createMutation = useMutation(inventoryService.createItem, {
    onSuccess: () => {
      queryClient.invalidateQueries('items');
      refetch();
      showToast('Item created successfully', 'success');
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create item', 'error');
    },
  });

  const updateMutation = useMutation(
    (data: { id: number; data: Partial<Item> }) => inventoryService.updateItem(data.id, data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('items');
        refetch();
        showToast('Item updated successfully', 'success');
        setShowEditModal(false);
        setSelectedItem(null);
        resetForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update item', 'error');
      },
    }
  );

  const deleteMutation = useMutation(inventoryService.deleteItem, {
    onSuccess: () => {
      queryClient.invalidateQueries('items');
      refetch();
      showToast('Item deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete item', 'error');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', category_id: '', description: '' });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category_id) {
      showToast('Item name and category are required', 'error');
      return;
    }
    createMutation.mutate({
      name: formData.name,
      category_id: Number(formData.category_id),
      description: formData.description || undefined,
    });
  };

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category_id: item.category_id.toString(),
      description: item.description || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !formData.name || !formData.category_id) {
      showToast('Item name and category are required', 'error');
      return;
    }
    updateMutation.mutate({
      id: selectedItem.id,
      data: {
        name: formData.name,
        category_id: Number(formData.category_id),
        description: formData.description || undefined,
      },
    });
  };

  return (
    <div className="inventory-tab-content">
      <div className="tab-header">
        <div className="filters-section">
          <input
            type="text"
            placeholder="Search items..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
          + Add Item
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : items.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.category_name || '-'}</td>
                <td>{item.description || '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-sm btn-secondary" onClick={() => handleEdit(item)}>Edit</button>
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this item?')) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">No items found</div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); }} title="Add Item">
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label>Name <span className="required">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Category <span className="required">*</span></label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>Save</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedItem(null); resetForm(); }} title="Edit Item">
        <form onSubmit={handleUpdateSubmit}>
          <div className="form-group">
            <label>Name <span className="required">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Category <span className="required">*</span></label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowEditModal(false); setSelectedItem(null); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={updateMutation.isLoading}>Update</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ========== Stock Add Item Tab ==========

const StockAddItemTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<ItemStock | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    item_id: '',
    category_id: '',
    supplier_id: '',
    store_id: '',
    quantity: '',
    stock_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const { data: categories = [] } = useQuery('item-categories', () => inventoryService.getItemCategories());
  const { data: stores = [] } = useQuery('item-stores', () => inventoryService.getItemStores());
  const { data: suppliers = [] } = useQuery('item-suppliers', () => inventoryService.getItemSuppliers());
  
  // Items for the form modal (based on formData.category_id)
  const { data: formItems = [] } = useQuery(
    ['items', 'form', formData.category_id],
    () => inventoryService.getItems({
      category_id: formData.category_id ? Number(formData.category_id) : undefined,
    }),
    { enabled: !!formData.category_id && (showCreateModal || showEditModal) }
  );
  
  // Use formItems when modal is open, otherwise empty array
  const items = (showCreateModal || showEditModal) ? formItems : [];

  const { data: stocks = [], isLoading, refetch } = useQuery(
    ['item-stocks', categoryFilter, storeFilter, dateFrom, dateTo],
    () => inventoryService.getItemStocks({
      category_id: categoryFilter ? Number(categoryFilter) : undefined,
      store_id: storeFilter ? Number(storeFilter) : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    { refetchOnWindowFocus: true }
  );

  const createMutation = useMutation(inventoryService.createItemStock, {
    onSuccess: () => {
      queryClient.invalidateQueries('item-stocks');
      refetch();
      showToast('Item stock added successfully', 'success');
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to add stock', 'error');
    },
  });

  const updateMutation = useMutation(
    (data: { id: number; data: Partial<ItemStock> }) => inventoryService.updateItemStock(data.id, data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('item-stocks');
        refetch();
        showToast('Item stock updated successfully', 'success');
        setShowEditModal(false);
        setSelectedStock(null);
        resetForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update stock', 'error');
      },
    }
  );

  const deleteMutation = useMutation(inventoryService.deleteItemStock, {
    onSuccess: () => {
      queryClient.invalidateQueries('item-stocks');
      refetch();
      showToast('Item stock deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete stock', 'error');
    },
  });

  const resetForm = () => {
    setFormData({
      item_id: '',
      category_id: '',
      supplier_id: '',
      store_id: '',
      quantity: '',
      stock_date: new Date().toISOString().split('T')[0],
      description: '',
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_id || !formData.category_id || !formData.store_id || !formData.quantity || !formData.stock_date) {
      showToast('All required fields must be filled', 'error');
      return;
    }
    if (Number(formData.quantity) <= 0) {
      showToast('Quantity must be greater than 0', 'error');
      return;
    }
    createMutation.mutate({
      ...formData,
      item_id: Number(formData.item_id),
      category_id: Number(formData.category_id),
      supplier_id: formData.supplier_id ? Number(formData.supplier_id) : undefined,
      store_id: Number(formData.store_id),
      quantity: Number(formData.quantity),
    });
  };

  const handleEdit = (stock: ItemStock) => {
    setSelectedStock(stock);
    setFormData({
      item_id: stock.item_id.toString(),
      category_id: stock.category_id.toString(),
      supplier_id: stock.supplier_id?.toString() || '',
      store_id: stock.store_id.toString(),
      quantity: stock.quantity.toString(),
      stock_date: stock.stock_date,
      description: stock.description || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock || !formData.item_id || !formData.category_id || !formData.store_id || !formData.quantity || !formData.stock_date) {
      showToast('All required fields must be filled', 'error');
      return;
    }
    if (Number(formData.quantity) <= 0) {
      showToast('Quantity must be greater than 0', 'error');
      return;
    }
    updateMutation.mutate({
      id: selectedStock.id,
      data: {
        ...formData,
        item_id: Number(formData.item_id),
        category_id: Number(formData.category_id),
        supplier_id: formData.supplier_id ? Number(formData.supplier_id) : undefined,
        store_id: Number(formData.store_id),
        quantity: Number(formData.quantity),
      },
    });
  };

  return (
    <div className="inventory-tab-content">
      <div className="tab-header">
        <div className="filters-section">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setFormData({ ...formData, category_id: e.target.value, item_id: '' });
            }}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Stores</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            placeholder="From Date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="filter-select"
          />
          <input
            type="date"
            placeholder="To Date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="filter-select"
          />
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
          + Add Stock
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : stocks.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Supplier</th>
              <th>Store</th>
              <th>Quantity</th>
              <th>Stock Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr key={stock.id}>
                <td>{stock.item_name || '-'}</td>
                <td>{stock.category_name || '-'}</td>
                <td>{stock.supplier_name || '-'}</td>
                <td>{stock.store_name || '-'}</td>
                <td>{stock.quantity}</td>
                <td>{new Date(stock.stock_date).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-sm btn-secondary" onClick={() => handleEdit(stock)}>Edit</button>
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this stock?')) {
                          deleteMutation.mutate(stock.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">No stocks found</div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); }} title="Add Stock" size="large">
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label>Category <span className="required">*</span></label>
            <select
              value={formData.category_id}
              onChange={(e) => {
                setFormData({ ...formData, category_id: e.target.value, item_id: '' });
              }}
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Item <span className="required">*</span></label>
            <select
              value={formData.item_id}
              onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
              required
              disabled={!formData.category_id}
            >
              <option value="">Select Item</option>
              {items.length > 0 ? (
                items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))
              ) : formData.category_id ? (
                <option value="" disabled>Loading items...</option>
              ) : (
                <option value="" disabled>Please select a category first</option>
              )}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Supplier</label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Store <span className="required">*</span></label>
              <select
                value={formData.store_id}
                onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                required
              >
                <option value="">Select Store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Quantity <span className="required">*</span></label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Stock Date <span className="required">*</span></label>
              <input
                type="date"
                value={formData.stock_date}
                onChange={(e) => setFormData({ ...formData, stock_date: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>Save</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedStock(null); resetForm(); }} title="Edit Stock" size="large">
        <form onSubmit={handleUpdateSubmit}>
          <div className="form-group">
            <label>Category <span className="required">*</span></label>
            <select
              value={formData.category_id}
              onChange={(e) => {
                setFormData({ ...formData, category_id: e.target.value, item_id: '' });
              }}
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Item <span className="required">*</span></label>
            <select
              value={formData.item_id}
              onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
              required
              disabled={!formData.category_id}
            >
              <option value="">Select Item</option>
              {items.length > 0 ? (
                items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))
              ) : formData.category_id ? (
                <option value="" disabled>Loading items...</option>
              ) : (
                <option value="" disabled>Please select a category first</option>
              )}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Supplier</label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Store <span className="required">*</span></label>
              <select
                value={formData.store_id}
                onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                required
              >
                <option value="">Select Store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Quantity <span className="required">*</span></label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Stock Date <span className="required">*</span></label>
              <input
                type="date"
                value={formData.stock_date}
                onChange={(e) => setFormData({ ...formData, stock_date: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowEditModal(false); setSelectedStock(null); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={updateMutation.isLoading}>Update</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ========== Issue Item Tab ==========

const IssueItemTab = () => {
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    item_id: '',
    category_id: '',
    user_type: 'staff' as 'student' | 'staff',
    user_id: '',
    issue_by: '',
    issue_date: new Date().toISOString().split('T')[0],
    return_date: '',
    quantity: '1',
    note: '',
  });

  const { data: categories = [] } = useQuery('item-categories', () => inventoryService.getItemCategories());
  
  // Items for the form modal (based on formData.category_id)
  const { data: formItems = [] } = useQuery(
    ['items', 'issue-form', formData.category_id],
    () => inventoryService.getItems({
      category_id: formData.category_id ? Number(formData.category_id) : undefined,
    }),
    { enabled: !!formData.category_id && showIssueModal }
  );
  
  // Use formItems when modal is open, otherwise empty array
  const items = showIssueModal ? formItems : [];

  const { data: issues = [], isLoading, refetch } = useQuery(
    ['item-issues', statusFilter, categoryFilter, dateFrom, dateTo],
    () => inventoryService.getItemIssues({
      status: statusFilter ? (statusFilter as 'issued' | 'returned') : undefined,
      category_id: categoryFilter ? Number(categoryFilter) : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    { refetchOnWindowFocus: true }
  );

  const [availableStock, setAvailableStock] = useState<number | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data: studentsData } = useQuery(
    ['students', 'all', userSearchTerm],
    () =>
      studentsService.getStudents({
        search: userSearchTerm || undefined,
        page: 1,
        limit: 50,
      }),
    { enabled: formData.user_type === 'student' && userSearchTerm.length > 0 }
  );

  const { data: staffData } = useQuery(
    ['staff', 'all', userSearchTerm],
    () =>
      hrService.getStaff({
        search: userSearchTerm || undefined,
        page: 1,
        limit: 50,
      }).then((res) => res.data),
    { enabled: formData.user_type === 'staff' && userSearchTerm.length > 0 }
  );

  const students = studentsData?.data || [];
  const staff = staffData || [];

  const createMutation = useMutation(inventoryService.createItemIssue, {
    onSuccess: () => {
      queryClient.invalidateQueries('item-issues');
      refetch();
      showToast('Item issued successfully', 'success');
      setShowIssueModal(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to issue item', 'error');
    },
  });

  const returnMutation = useMutation(inventoryService.returnItemIssue, {
    onSuccess: () => {
      queryClient.invalidateQueries('item-issues');
      refetch();
      showToast('Item returned successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to return item', 'error');
    },
  });

  const deleteMutation = useMutation(inventoryService.deleteItemIssue, {
    onSuccess: () => {
      queryClient.invalidateQueries('item-issues');
      refetch();
      showToast('Item issue deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete issue', 'error');
    },
  });

  const resetForm = () => {
    setFormData({
      item_id: '',
      category_id: '',
      user_type: 'staff',
      user_id: '',
      issue_by: '',
      issue_date: new Date().toISOString().split('T')[0],
      return_date: '',
      quantity: '1',
      note: '',
    });
    setAvailableStock(null);
    setSelectedUser(null);
    setUserSearchTerm('');
  };

  const handleItemChange = async (itemId: string) => {
    if (itemId) {
      try {
        const stock = await inventoryService.getAvailableStock(Number(itemId));
        setAvailableStock(stock.available_stock);
      } catch (error) {
        setAvailableStock(0);
      }
    } else {
      setAvailableStock(null);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_id || !formData.category_id || !formData.user_id || !formData.issue_by || !formData.issue_date || !formData.quantity) {
      showToast('All required fields must be filled', 'error');
      return;
    }
    if (Number(formData.quantity) <= 0) {
      showToast('Quantity must be greater than 0', 'error');
      return;
    }
    if (availableStock !== null && Number(formData.quantity) > availableStock) {
      showToast(`Insufficient stock. Available: ${availableStock}`, 'error');
      return;
    }
    createMutation.mutate({
      ...formData,
      item_id: Number(formData.item_id),
      category_id: Number(formData.category_id),
      user_id: Number(formData.user_id),
      quantity: Number(formData.quantity),
    });
  };

  return (
    <div className="inventory-tab-content">
      <div className="tab-header">
        <div className="filters-section">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="issued">Issued</option>
            <option value="returned">Returned</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            placeholder="From Date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="filter-select"
          />
          <input
            type="date"
            placeholder="To Date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="filter-select"
          />
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowIssueModal(true); }}>
          + Issue Item
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : issues.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>User Type</th>
              <th>Issue By</th>
              <th>Issue Date</th>
              <th>Return Date</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue.id}>
                <td>{issue.item_name || '-'}</td>
                <td>{issue.category_name || '-'}</td>
                <td>{issue.user_type}</td>
                <td>{issue.issue_by}</td>
                <td>{new Date(issue.issue_date).toLocaleDateString()}</td>
                <td>{issue.return_date ? new Date(issue.return_date).toLocaleDateString() : '-'}</td>
                <td>{issue.quantity}</td>
                <td>
                  <span className={`status-badge ${issue.status}`}>
                    {issue.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    {issue.status === 'issued' && (
                      <button
                        className="btn-sm btn-primary"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to return this item?')) {
                            returnMutation.mutate(issue.id);
                          }
                        }}
                      >
                        Return
                      </button>
                    )}
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this issue?')) {
                          deleteMutation.mutate(issue.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">No issues found</div>
      )}

      <Modal isOpen={showIssueModal} onClose={() => { setShowIssueModal(false); resetForm(); }} title="Issue Item" size="large">
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label>Category <span className="required">*</span></label>
            <select
              value={formData.category_id}
              onChange={(e) => {
                setFormData({ ...formData, category_id: e.target.value, item_id: '' });
                setAvailableStock(null);
              }}
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Item <span className="required">*</span></label>
            <select
              value={formData.item_id}
              onChange={(e) => {
                setFormData({ ...formData, item_id: e.target.value });
                handleItemChange(e.target.value);
              }}
              required
              disabled={!formData.category_id}
            >
              <option value="">Select Item</option>
              {items.length > 0 ? (
                items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))
              ) : formData.category_id ? (
                <option value="" disabled>Loading items...</option>
              ) : (
                <option value="" disabled>Please select a category first</option>
              )}
            </select>
            {availableStock !== null && (
              <small className="stock-info">Available Stock: {availableStock}</small>
            )}
          </div>
          <div className="form-group">
            <label>User Type <span className="required">*</span></label>
            <select
              value={formData.user_type}
              onChange={(e) => {
                setFormData({ ...formData, user_type: e.target.value as any, user_id: '' });
                setSelectedUser(null);
                setUserSearchTerm('');
              }}
              required
            >
              <option value="staff">Staff</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div className="form-group">
            <label>{formData.user_type === 'student' ? 'Student' : 'Staff'} <span className="required">*</span></label>
            <input
              type="text"
              placeholder={`Search ${formData.user_type}...`}
              value={userSearchTerm}
              onChange={(e) => {
                setUserSearchTerm(e.target.value);
                setSelectedUser(null);
                setFormData({ ...formData, user_id: '' });
              }}
              required
            />
            {userSearchTerm.length > 0 && (
              <div className="user-search-results">
                {(formData.user_type === 'student' ? students : staff).slice(0, 10).map((user: any) => (
                  <div
                    key={user.id}
                    className="user-search-item"
                    onClick={() => {
                      setSelectedUser(user);
                      setFormData({ ...formData, user_id: user.id.toString() });
                      setUserSearchTerm(formData.user_type === 'student' ? `${user.admission_no} - ${user.first_name} ${user.last_name || ''}` : `${user.staff_id} - ${user.first_name} ${user.last_name || ''}`);
                    }}
                  >
                    {formData.user_type === 'student'
                      ? `${user.admission_no} - ${user.first_name} ${user.last_name || ''}`
                      : `${user.staff_id} - ${user.first_name} ${user.last_name || ''}`}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Issue By <span className="required">*</span></label>
            <input
              type="text"
              value={formData.issue_by}
              onChange={(e) => setFormData({ ...formData, issue_by: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Issue Date <span className="required">*</span></label>
              <input
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Return Date</label>
              <input
                type="date"
                value={formData.return_date}
                onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Quantity <span className="required">*</span></label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Note</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowIssueModal(false); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>Issue Item</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;

