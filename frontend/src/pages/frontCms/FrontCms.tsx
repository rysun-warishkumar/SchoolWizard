import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import {
  frontCmsService,
  Menu,
  MenuItem,
  Page,
  Event,
  Gallery,
  News,
  Media,
  BannerImage,
} from '../../services/api/frontCmsService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import './FrontCms.css';

type TabType = 'pages' | 'menus' | 'events' | 'gallery' | 'news' | 'media' | 'banner-images';

const FrontCms = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType;
  const validTabs: TabType[] = ['pages', 'menus', 'events', 'gallery', 'news', 'media', 'banner-images'];
  const defaultTab: TabType = validTabs.includes(tabFromUrl) ? tabFromUrl : 'pages';

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Scroll to active tab
  const scrollToActiveTab = () => {
    if (activeTabRef.current && tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const tab = activeTabRef.current;
      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      
      const scrollLeft = container.scrollLeft;
      const tabLeft = tabRect.left - containerRect.left + scrollLeft;
      const tabWidth = tabRect.width;
      const containerWidth = containerRect.width;
      
      const targetScroll = tabLeft - (containerWidth / 2) + (tabWidth / 2);
      
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  // Check if arrows should be visible
  const checkArrows = () => {
    if (tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const hasOverflow = container.scrollWidth > container.clientWidth;
      
      if (hasOverflow) {
        setShowLeftArrow(container.scrollLeft > 5);
        setShowRightArrow(
          container.scrollLeft < container.scrollWidth - container.clientWidth - 5
        );
      } else {
        setShowLeftArrow(false);
        setShowRightArrow(false);
      }
    }
  };

  // Scroll tabs left/right
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const scrollAmount = 250;
      const currentScroll = container.scrollLeft;
      const newScrollLeft = direction === 'left' 
        ? Math.max(0, currentScroll - scrollAmount)
        : Math.min(container.scrollWidth - container.clientWidth, currentScroll + scrollAmount);
      
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
      
      setTimeout(() => {
        checkArrows();
      }, 300);
    }
  };

  // Initialize and check arrows
  useEffect(() => {
    checkArrows();
    scrollToActiveTab();
  }, []);

  // Check arrows on scroll and window resize
  useEffect(() => {
    const container = tabsContainerRef.current;
    if (container) {
      checkArrows();
      container.addEventListener('scroll', checkArrows);
      window.addEventListener('resize', checkArrows);
      
      const resizeObserver = new ResizeObserver(() => {
        checkArrows();
      });
      resizeObserver.observe(container);
      
      return () => {
        container.removeEventListener('scroll', checkArrows);
        window.removeEventListener('resize', checkArrows);
        resizeObserver.disconnect();
      };
    }
  }, []);

  // Scroll to active tab when it changes
  useEffect(() => {
    scrollToActiveTab();
  }, [activeTab]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="front-cms-page">
      <div className="page-header">
        <h1>Front CMS</h1>
      </div>

      <div className="front-cms-tabs-wrapper">
        <div className="front-cms-tabs-container">
          {showLeftArrow && (
            <button
              className="front-cms-tabs-arrow front-cms-tabs-arrow-left"
              onClick={() => scrollTabs('left')}
              aria-label="Scroll tabs left"
            >
              ‹
            </button>
          )}
          <div className="front-cms-tabs" ref={tabsContainerRef}>
            <button
              ref={activeTab === 'pages' ? activeTabRef : null}
              className={activeTab === 'pages' ? 'active' : ''}
              onClick={() => handleTabChange('pages')}
            >
              Pages
            </button>
            <button
              ref={activeTab === 'menus' ? activeTabRef : null}
              className={activeTab === 'menus' ? 'active' : ''}
              onClick={() => handleTabChange('menus')}
            >
              Menus
            </button>
            <button
              ref={activeTab === 'events' ? activeTabRef : null}
              className={activeTab === 'events' ? 'active' : ''}
              onClick={() => handleTabChange('events')}
            >
              Events
            </button>
            <button
              ref={activeTab === 'gallery' ? activeTabRef : null}
              className={activeTab === 'gallery' ? 'active' : ''}
              onClick={() => handleTabChange('gallery')}
            >
              Gallery
            </button>
            <button
              ref={activeTab === 'news' ? activeTabRef : null}
              className={activeTab === 'news' ? 'active' : ''}
              onClick={() => handleTabChange('news')}
            >
              News
            </button>
            <button
              ref={activeTab === 'media' ? activeTabRef : null}
              className={activeTab === 'media' ? 'active' : ''}
              onClick={() => handleTabChange('media')}
            >
              Media Manager
            </button>
            <button
              ref={activeTab === 'banner-images' ? activeTabRef : null}
              className={activeTab === 'banner-images' ? 'active' : ''}
              onClick={() => handleTabChange('banner-images')}
            >
              Banner Images
            </button>
          </div>
          {showRightArrow && (
            <button
              className="front-cms-tabs-arrow front-cms-tabs-arrow-right"
              onClick={() => scrollTabs('right')}
              aria-label="Scroll tabs right"
            >
              ›
            </button>
          )}
        </div>
      </div>

      <div className="front-cms-content">
        {activeTab === 'pages' && <PagesTab />}
        {activeTab === 'menus' && <MenusTab />}
        {activeTab === 'events' && <EventsTab />}
        {activeTab === 'gallery' && <GalleryTab />}
        {activeTab === 'news' && <NewsTab />}
        {activeTab === 'media' && <MediaTab />}
        {activeTab === 'banner-images' && <BannerImagesTab />}
      </div>
    </div>
  );
};

// ========== Pages Tab ==========

const PagesTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageTypeFilter, setPageTypeFilter] = useState('');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: pages = [], isLoading } = useQuery(
    ['front-cms-pages', searchTerm, pageTypeFilter],
    () => frontCmsService.getPages({ search: searchTerm || undefined, page_type: pageTypeFilter || undefined }),
    { refetchOnWindowFocus: true }
  );

  const createMutation = useMutation(frontCmsService.createPage, {
    onSuccess: () => {
      queryClient.invalidateQueries(['front-cms-pages']);
      setShowCreateModal(false);
      showToast('Page created successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create page', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => frontCmsService.updatePage(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['front-cms-pages']);
        setShowEditModal(false);
        setSelectedPage(null);
        showToast('Page updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update page', 'error');
      },
    }
  );

  const deleteMutation = useMutation(frontCmsService.deletePage, {
    onSuccess: () => {
      queryClient.invalidateQueries(['front-cms-pages']);
      showToast('Page deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete page', 'error');
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      page_title: formData.get('page_title') as string,
      page_type: (formData.get('page_type') as any) || 'standard',
      description: formData.get('description') as string || undefined,
      meta_title: formData.get('meta_title') as string || undefined,
      meta_keyword: formData.get('meta_keyword') as string || undefined,
      meta_description: formData.get('meta_description') as string || undefined,
      sidebar_enabled: formData.get('sidebar_enabled') === 'on',
      featured_image: formData.get('featured_image') as string || undefined,
    });
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPage) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: selectedPage.id,
      data: {
        page_title: formData.get('page_title') as string,
        page_type: (formData.get('page_type') as any) || 'standard',
        description: formData.get('description') as string || undefined,
        meta_title: formData.get('meta_title') as string || undefined,
        meta_keyword: formData.get('meta_keyword') as string || undefined,
        meta_description: formData.get('meta_description') as string || undefined,
        sidebar_enabled: formData.get('sidebar_enabled') === 'on',
        featured_image: formData.get('featured_image') as string || undefined,
      },
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this page?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditClick = (page: Page) => {
    setSelectedPage(page);
    setShowEditModal(true);
  };

  const handleViewPage = (page: Page) => {
    const publicUrl = `/page/${page.slug}`;
    window.open(publicUrl, '_blank');
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search pages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={pageTypeFilter} onChange={(e) => setPageTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="standard">Standard</option>
            <option value="event">Event</option>
            <option value="news">News</option>
            <option value="gallery">Gallery</option>
          </select>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Add Page
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Slug</th>
                <th>Sidebar</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No pages found
                  </td>
                </tr>
              ) : (
                pages.map((page) => (
                  <tr key={page.id}>
                    <td>{page.page_title}</td>
                    <td>
                      <span className={`badge badge-${page.page_type}`}>{page.page_type}</span>
                    </td>
                    <td>{page.slug}</td>
                    <td>{page.sidebar_enabled ? 'Yes' : 'No'}</td>
                    <td>{new Date(page.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-sm btn-view" onClick={() => handleViewPage(page)}>
                        View
                      </button>
                      <button className="btn-sm btn-edit" onClick={() => handleEditClick(page)}>
                        Edit
                      </button>
                      <button className="btn-sm btn-delete" onClick={() => handleDelete(page.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Page"
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Page Title *</label>
            <input type="text" name="page_title" required />
          </div>
          <div className="form-group">
            <label>Page Type</label>
            <select name="page_type" defaultValue="standard">
              <option value="standard">Standard</option>
              <option value="event">Event</option>
              <option value="news">News</option>
              <option value="gallery">Gallery</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" rows={4}></textarea>
          </div>
          <div className="form-group">
            <label>Meta Title</label>
            <input type="text" name="meta_title" />
          </div>
          <div className="form-group">
            <label>Meta Keywords</label>
            <input type="text" name="meta_keyword" />
          </div>
          <div className="form-group">
            <label>Meta Description</label>
            <textarea name="meta_description" rows={3}></textarea>
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" name="sidebar_enabled" defaultChecked />
              Enable Sidebar
            </label>
          </div>
          <div className="form-group">
            <label>Featured Image URL</label>
            <input type="text" name="featured_image" />
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPage(null);
        }}
        title="Edit Page"
      >
        {selectedPage && (
          <form onSubmit={handleEdit}>
            <div className="form-group">
              <label>Page Title *</label>
              <input type="text" name="page_title" defaultValue={selectedPage.page_title} required />
            </div>
            <div className="form-group">
              <label>Page Type</label>
              <select name="page_type" defaultValue={selectedPage.page_type}>
                <option value="standard">Standard</option>
                <option value="event">Event</option>
                <option value="news">News</option>
                <option value="gallery">Gallery</option>
              </select>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" rows={4} defaultValue={selectedPage.description || ''}></textarea>
            </div>
            <div className="form-group">
              <label>Meta Title</label>
              <input type="text" name="meta_title" defaultValue={selectedPage.meta_title || ''} />
            </div>
            <div className="form-group">
              <label>Meta Keywords</label>
              <input type="text" name="meta_keyword" defaultValue={selectedPage.meta_keyword || ''} />
            </div>
            <div className="form-group">
              <label>Meta Description</label>
              <textarea name="meta_description" rows={3} defaultValue={selectedPage.meta_description || ''}></textarea>
            </div>
            <div className="form-group">
              <label>
                <input type="checkbox" name="sidebar_enabled" defaultChecked={selectedPage.sidebar_enabled} />
                Enable Sidebar
              </label>
            </div>
            <div className="form-group">
              <label>Featured Image URL</label>
              <input type="text" name="featured_image" defaultValue={selectedPage.featured_image || ''} />
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => {
                setShowEditModal(false);
                setSelectedPage(null);
              }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Update
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

// ========== Menus Tab ==========

const MenusTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [selectedMenuForItems, setSelectedMenuForItems] = useState<Menu | null>(null);

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: menus = [], isLoading } = useQuery(
    ['front-cms-menus'],
    frontCmsService.getMenus,
    { refetchOnWindowFocus: true }
  );

  const createMutation = useMutation(frontCmsService.createMenu, {
    onSuccess: () => {
      queryClient.invalidateQueries(['front-cms-menus']);
      setShowCreateModal(false);
      showToast('Menu created successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create menu', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => frontCmsService.updateMenu(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['front-cms-menus']);
        setShowEditModal(false);
        setSelectedMenu(null);
        showToast('Menu updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update menu', 'error');
      },
    }
  );

  const deleteMutation = useMutation(frontCmsService.deleteMenu, {
    onSuccess: () => {
      queryClient.invalidateQueries(['front-cms-menus']);
      showToast('Menu deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete menu', 'error');
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
    });
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMenu) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: selectedMenu.id,
      data: {
        name: formData.get('name') as string,
        description: formData.get('description') as string || undefined,
      },
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this menu?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditClick = (menu: Menu) => {
    setSelectedMenu(menu);
    setShowEditModal(true);
  };

  const handleManageItems = (menu: Menu) => {
    setSelectedMenuForItems(menu);
    setShowItemsModal(true);
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div></div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Add Menu
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {menus.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state">
                    No menus found
                  </td>
                </tr>
              ) : (
                menus.map((menu) => (
                  <tr key={menu.id}>
                    <td>{menu.name}</td>
                    <td>{menu.description || '-'}</td>
                    <td>{new Date(menu.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-sm btn-edit" onClick={() => handleEditClick(menu)}>
                        Edit
                      </button>
                      <button className="btn-sm btn-primary" onClick={() => handleManageItems(menu)}>
                        Manage Items
                      </button>
                      <button className="btn-sm btn-delete" onClick={() => handleDelete(menu.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Menu"
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Menu Name *</label>
            <input type="text" name="name" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" rows={3}></textarea>
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMenu(null);
        }}
        title="Edit Menu"
      >
        {selectedMenu && (
          <form onSubmit={handleEdit}>
            <div className="form-group">
              <label>Menu Name *</label>
              <input type="text" name="name" defaultValue={selectedMenu.name} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" rows={3} defaultValue={selectedMenu.description || ''}></textarea>
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => {
                setShowEditModal(false);
                setSelectedMenu(null);
              }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Update
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Menu Items Modal */}
      {showItemsModal && selectedMenuForItems && (
        <MenuItemsManager
          menu={selectedMenuForItems}
          onClose={() => {
            setShowItemsModal(false);
            setSelectedMenuForItems(null);
          }}
        />
      )}
    </div>
  );
};

// ========== Menu Items Manager ==========

const MenuItemsManager = ({ menu, onClose }: { menu: Menu; onClose: () => void }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [createLinkType, setCreateLinkType] = useState<'external' | 'page'>('external');
  const [editLinkType, setEditLinkType] = useState<'external' | 'page'>('external');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: menuItems = [], isLoading } = useQuery(
    ['front-cms-menu-items', menu.id],
    () => frontCmsService.getMenuItems(menu.id),
    { refetchOnWindowFocus: true }
  );

  useQuery(['front-cms-pages'], () => frontCmsService.getPages(), {
    onSuccess: (data) => setPages(data),
  });

  const createMutation = useMutation(
    (data: any) => frontCmsService.createMenuItem(menu.id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['front-cms-menu-items', menu.id]);
        setShowCreateModal(false);
        showToast('Menu item created successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to create menu item', 'error');
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => frontCmsService.updateMenuItem(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['front-cms-menu-items', menu.id]);
        setShowEditModal(false);
        setSelectedItem(null);
        showToast('Menu item updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update menu item', 'error');
      },
    }
  );

  const deleteMutation = useMutation(frontCmsService.deleteMenuItem, {
    onSuccess: () => {
      queryClient.invalidateQueries(['front-cms-menu-items', menu.id]);
      showToast('Menu item deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete menu item', 'error');
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const linkType = formData.get('link_type') as string;
    createMutation.mutate({
      menu_item: formData.get('menu_item') as string,
      external_url: linkType === 'external' ? (formData.get('external_url') as string) : undefined,
      page_id: linkType === 'page' ? parseInt(formData.get('page_id') as string) : undefined,
      open_in_new_tab: formData.get('open_in_new_tab') === 'on',
      sort_order: parseInt(formData.get('sort_order') as string) || 0,
    });
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    const formData = new FormData(e.currentTarget);
    const linkType = formData.get('link_type') as string;
    updateMutation.mutate({
      id: selectedItem.id,
      data: {
        menu_item: formData.get('menu_item') as string,
        external_url: linkType === 'external' ? (formData.get('external_url') as string) : undefined,
        page_id: linkType === 'page' ? parseInt(formData.get('page_id') as string) : undefined,
        open_in_new_tab: formData.get('open_in_new_tab') === 'on',
        sort_order: parseInt(formData.get('sort_order') as string) || 0,
      },
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      deleteMutation.mutate(id);
    }
  };

  const renderMenuItems = (items: MenuItem[], level = 0) => {
    return items.map((item) => (
      <React.Fragment key={item.id}>
        <tr>
          <td style={{ paddingLeft: `${level * 20}px` }}>
            {level > 0 && '└ '}
            {item.menu_item}
          </td>
          <td>{item.external_url || item.page_title || '-'}</td>
          <td>{item.open_in_new_tab ? 'Yes' : 'No'}</td>
          <td>{item.sort_order}</td>
          <td>
            <button className="btn-sm btn-edit" onClick={() => {
              setSelectedItem(item);
              setEditLinkType(item.external_url ? 'external' : 'page');
              setShowEditModal(true);
            }}>
              Edit
            </button>
            <button className="btn-sm btn-delete" onClick={() => handleDelete(item.id)}>
              Delete
            </button>
          </td>
        </tr>
        {item.children && item.children.length > 0 && renderMenuItems(item.children, level + 1)}
      </React.Fragment>
    ));
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Manage Items - ${menu.name}`} size="large">
      <div className="menu-items-manager">
        <div className="tab-header">
          <div></div>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            + Add Menu Item
          </button>
        </div>

        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Menu Item</th>
                  <th>Link</th>
                  <th>New Tab</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      No menu items found
                    </td>
                  </tr>
                ) : (
                  renderMenuItems(menuItems)
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Add Menu Item"
        >
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Menu Item Name *</label>
              <input type="text" name="menu_item" required />
            </div>
            <div className="form-group">
              <label>Link Type *</label>
              <select 
                name="link_type" 
                value={createLinkType}
                onChange={(e) => setCreateLinkType(e.target.value as 'external' | 'page')}
                required
              >
                <option value="external">External URL</option>
                <option value="page">CMS Page</option>
              </select>
            </div>
            {createLinkType === 'external' ? (
              <div className="form-group">
                <label>External URL</label>
                <input type="url" name="external_url" />
              </div>
            ) : (
              <div className="form-group">
                <label>CMS Page</label>
                <select name="page_id">
                  <option value="">Select Page</option>
                  {pages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.page_title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>
                <input type="checkbox" name="open_in_new_tab" />
                Open in New Tab
              </label>
            </div>
            <div className="form-group">
              <label>Sort Order</label>
              <input type="number" name="sort_order" defaultValue="0" min="0" />
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedItem(null);
          }}
          title="Edit Menu Item"
        >
          {selectedItem && (
            <form onSubmit={handleEdit}>
              <div className="form-group">
                <label>Menu Item Name *</label>
                <input type="text" name="menu_item" defaultValue={selectedItem.menu_item} required />
              </div>
              <div className="form-group">
                <label>Link Type *</label>
                <select 
                  name="link_type" 
                  value={editLinkType}
                  onChange={(e) => setEditLinkType(e.target.value as 'external' | 'page')}
                  required
                >
                  <option value="external">External URL</option>
                  <option value="page">CMS Page</option>
                </select>
              </div>
              {editLinkType === 'external' ? (
                <div className="form-group">
                  <label>External URL</label>
                  <input type="url" name="external_url" defaultValue={selectedItem.external_url || ''} />
                </div>
              ) : (
                <div className="form-group">
                  <label>CMS Page</label>
                  <select name="page_id" defaultValue={selectedItem.page_id?.toString() || ''}>
                    <option value="">Select Page</option>
                    {pages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.page_title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>
                  <input type="checkbox" name="open_in_new_tab" defaultChecked={selectedItem.open_in_new_tab} />
                  Open in New Tab
                </label>
              </div>
              <div className="form-group">
                <label>Sort Order</label>
                <input type="number" name="sort_order" defaultValue={selectedItem.sort_order} min="0" />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => {
                  setShowEditModal(false);
                  setSelectedItem(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </Modal>
  );
};

// ========== Events Tab ==========

const EventsTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery(
    ['front-cms-events', searchTerm],
    () => frontCmsService.getEvents({ search: searchTerm || undefined }),
    { refetchOnWindowFocus: true }
  );

  const createMutation = useMutation(frontCmsService.createEvent, {
    onSuccess: () => {
      queryClient.invalidateQueries(['front-cms-events']);
      setShowCreateModal(false);
      showToast('Event created successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create event', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => frontCmsService.updateEvent(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['front-cms-events']);
        setShowEditModal(false);
        setSelectedEvent(null);
        showToast('Event updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update event', 'error');
      },
    }
  );

  const deleteMutation = useMutation(frontCmsService.deleteEvent, {
    onSuccess: () => {
      queryClient.invalidateQueries(['front-cms-events']);
      showToast('Event deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete event', 'error');
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      event_title: formData.get('event_title') as string,
      event_venue: formData.get('event_venue') as string || undefined,
      event_start_date: formData.get('event_start_date') as string,
      event_end_date: formData.get('event_end_date') as string || undefined,
      description: formData.get('description') as string || undefined,
      meta_title: formData.get('meta_title') as string || undefined,
      meta_keyword: formData.get('meta_keyword') as string || undefined,
      meta_description: formData.get('meta_description') as string || undefined,
      sidebar_enabled: formData.get('sidebar_enabled') === 'on',
      featured_image: formData.get('featured_image') as string || undefined,
    });
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEvent) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: selectedEvent.id,
      data: {
        event_title: formData.get('event_title') as string,
        event_venue: formData.get('event_venue') as string || undefined,
        event_start_date: formData.get('event_start_date') as string,
        event_end_date: formData.get('event_end_date') as string || undefined,
        description: formData.get('description') as string || undefined,
        meta_title: formData.get('meta_title') as string || undefined,
        meta_keyword: formData.get('meta_keyword') as string || undefined,
        meta_description: formData.get('meta_description') as string || undefined,
        sidebar_enabled: formData.get('sidebar_enabled') === 'on',
        featured_image: formData.get('featured_image') as string || undefined,
      },
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleViewEvent = (event: Event) => {
    const publicUrl = `/events/${event.slug}`;
    window.open(publicUrl, '_blank');
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Add Event
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Venue</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No events found
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.event_title}</td>
                    <td>{event.event_venue || '-'}</td>
                    <td>{new Date(event.event_start_date).toLocaleDateString()}</td>
                    <td>{event.event_end_date ? new Date(event.event_end_date).toLocaleDateString() : '-'}</td>
                    <td>{new Date(event.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-sm btn-view" onClick={() => handleViewEvent(event)}>
                        View
                      </button>
                      <button className="btn-sm btn-edit" onClick={() => handleEditClick(event)}>
                        Edit
                      </button>
                      <button className="btn-sm btn-delete" onClick={() => handleDelete(event.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Event"
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Event Title *</label>
            <input type="text" name="event_title" required />
          </div>
          <div className="form-group">
            <label>Event Venue</label>
            <input type="text" name="event_venue" />
          </div>
          <div className="form-group">
            <label>Start Date *</label>
            <input type="date" name="event_start_date" required />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input type="date" name="event_end_date" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" rows={4}></textarea>
          </div>
          <div className="form-group">
            <label>Meta Title</label>
            <input type="text" name="meta_title" />
          </div>
          <div className="form-group">
            <label>Meta Keywords</label>
            <input type="text" name="meta_keyword" />
          </div>
          <div className="form-group">
            <label>Meta Description</label>
            <textarea name="meta_description" rows={3}></textarea>
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" name="sidebar_enabled" defaultChecked />
              Enable Sidebar
            </label>
          </div>
          <div className="form-group">
            <label>Featured Image URL</label>
            <input type="text" name="featured_image" />
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEvent(null);
        }}
        title="Edit Event"
      >
        {selectedEvent && (
          <form onSubmit={handleEdit}>
            <div className="form-group">
              <label>Event Title *</label>
              <input type="text" name="event_title" defaultValue={selectedEvent.event_title} required />
            </div>
            <div className="form-group">
              <label>Event Venue</label>
              <input type="text" name="event_venue" defaultValue={selectedEvent.event_venue || ''} />
            </div>
            <div className="form-group">
              <label>Start Date *</label>
              <input type="date" name="event_start_date" defaultValue={selectedEvent.event_start_date.split('T')[0]} required />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" name="event_end_date" defaultValue={selectedEvent.event_end_date ? selectedEvent.event_end_date.split('T')[0] : ''} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" rows={4} defaultValue={selectedEvent.description || ''}></textarea>
            </div>
            <div className="form-group">
              <label>Meta Title</label>
              <input type="text" name="meta_title" defaultValue={selectedEvent.meta_title || ''} />
            </div>
            <div className="form-group">
              <label>Meta Keywords</label>
              <input type="text" name="meta_keyword" defaultValue={selectedEvent.meta_keyword || ''} />
            </div>
            <div className="form-group">
              <label>Meta Description</label>
              <textarea name="meta_description" rows={3} defaultValue={selectedEvent.meta_description || ''}></textarea>
            </div>
            <div className="form-group">
              <label>
                <input type="checkbox" name="sidebar_enabled" defaultChecked={selectedEvent.sidebar_enabled} />
                Enable Sidebar
              </label>
            </div>
            <div className="form-group">
              <label>Featured Image URL</label>
              <input type="text" name="featured_image" defaultValue={selectedEvent.featured_image || ''} />
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => {
                setShowEditModal(false);
                setSelectedEvent(null);
              }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Update
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

// ========== Gallery Tab ==========

const GalleryTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: galleries = [], isLoading } = useQuery(
    ['front-cms-galleries', searchTerm],
    () => frontCmsService.getGalleries({ search: searchTerm || undefined }),
    { refetchOnWindowFocus: true }
  );

  const createMutation = useMutation(frontCmsService.createGallery, {
    onSuccess: () => {
      queryClient.invalidateQueries(['front-cms-galleries']);
      setShowCreateModal(false);
      showToast('Gallery created successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create gallery', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => frontCmsService.updateGallery(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['front-cms-galleries']);
        setShowEditModal(false);
        setSelectedGallery(null);
        showToast('Gallery updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update gallery', 'error');
      },
    }
  );

  const deleteMutation = useMutation(frontCmsService.deleteGallery, {
    onSuccess: () => {
      queryClient.invalidateQueries(['front-cms-galleries']);
      showToast('Gallery deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete gallery', 'error');
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const imagesInput = formData.get('images') as string;
    const images = imagesInput ? imagesInput.split('\n').filter(url => url.trim()).map(url => ({ path: url.trim() })) : [];
    
    createMutation.mutate({
      gallery_title: formData.get('gallery_title') as string,
      description: formData.get('description') as string || undefined,
      meta_title: formData.get('meta_title') as string || undefined,
      meta_keyword: formData.get('meta_keyword') as string || undefined,
      meta_description: formData.get('meta_description') as string || undefined,
      sidebar_enabled: formData.get('sidebar_enabled') === 'on',
      featured_image: formData.get('featured_image') as string || undefined,
      images: images.length > 0 ? images : undefined,
    });
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedGallery) return;
    const formData = new FormData(e.currentTarget);
    const imagesInput = formData.get('images') as string;
    const images = imagesInput ? imagesInput.split('\n').filter(url => url.trim()).map(url => ({ path: url.trim() })) : [];
    
    updateMutation.mutate({
      id: selectedGallery.id,
      data: {
        gallery_title: formData.get('gallery_title') as string,
        description: formData.get('description') as string || undefined,
        meta_title: formData.get('meta_title') as string || undefined,
        meta_keyword: formData.get('meta_keyword') as string || undefined,
        meta_description: formData.get('meta_description') as string || undefined,
        sidebar_enabled: formData.get('sidebar_enabled') === 'on',
        featured_image: formData.get('featured_image') as string || undefined,
        images: images.length > 0 ? images : undefined,
      },
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this gallery?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditClick = async (gallery: Gallery) => {
    const fullGallery = await frontCmsService.getGalleryById(gallery.id);
    setSelectedGallery(fullGallery);
    setShowEditModal(true);
  };

  const handleViewGallery = (gallery: Gallery) => {
    const publicUrl = `/gallery/${gallery.slug}`;
    window.open(publicUrl, '_blank');
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search galleries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Add Gallery
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Images</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {galleries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state">
                    No galleries found
                  </td>
                </tr>
              ) : (
                galleries.map((gallery) => (
                  <tr key={gallery.id}>
                    <td>{gallery.gallery_title}</td>
                    <td>{gallery.images?.length || 0} images</td>
                    <td>{new Date(gallery.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-sm btn-view" onClick={() => handleViewGallery(gallery)}>
                        View
                      </button>
                      <button className="btn-sm btn-edit" onClick={() => handleEditClick(gallery)}>
                        Edit
                      </button>
                      <button className="btn-sm btn-delete" onClick={() => handleDelete(gallery.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Gallery"
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Gallery Title *</label>
            <input type="text" name="gallery_title" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" rows={4}></textarea>
          </div>
          <div className="form-group">
            <label>Gallery Images (one URL per line)</label>
            <textarea name="images" rows={5} placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"></textarea>
          </div>
          <div className="form-group">
            <label>Meta Title</label>
            <input type="text" name="meta_title" />
          </div>
          <div className="form-group">
            <label>Meta Keywords</label>
            <input type="text" name="meta_keyword" />
          </div>
          <div className="form-group">
            <label>Meta Description</label>
            <textarea name="meta_description" rows={3}></textarea>
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" name="sidebar_enabled" defaultChecked />
              Enable Sidebar
            </label>
          </div>
          <div className="form-group">
            <label>Featured Image URL</label>
            <input type="text" name="featured_image" />
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedGallery(null);
        }}
        title="Edit Gallery"
      >
        {selectedGallery && (
          <form onSubmit={handleEdit}>
            <div className="form-group">
              <label>Gallery Title *</label>
              <input type="text" name="gallery_title" defaultValue={selectedGallery.gallery_title} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" rows={4} defaultValue={selectedGallery.description || ''}></textarea>
            </div>
            <div className="form-group">
              <label>Gallery Images (one URL per line)</label>
              <textarea 
                name="images" 
                rows={5} 
                defaultValue={selectedGallery.images?.map(img => img.image_path).join('\n') || ''}
                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
              ></textarea>
            </div>
            <div className="form-group">
              <label>Meta Title</label>
              <input type="text" name="meta_title" defaultValue={selectedGallery.meta_title || ''} />
            </div>
            <div className="form-group">
              <label>Meta Keywords</label>
              <input type="text" name="meta_keyword" defaultValue={selectedGallery.meta_keyword || ''} />
            </div>
            <div className="form-group">
              <label>Meta Description</label>
              <textarea name="meta_description" rows={3} defaultValue={selectedGallery.meta_description || ''}></textarea>
            </div>
            <div className="form-group">
              <label>
                <input type="checkbox" name="sidebar_enabled" defaultChecked={selectedGallery.sidebar_enabled} />
                Enable Sidebar
              </label>
            </div>
            <div className="form-group">
              <label>Featured Image URL</label>
              <input type="text" name="featured_image" defaultValue={selectedGallery.featured_image || ''} />
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => {
                setShowEditModal(false);
                setSelectedGallery(null);
              }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Update
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

// ========== News Tab ==========

const NewsTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: news = [], isLoading } = useQuery(
    ['front-cms-news', searchTerm],
    () => frontCmsService.getNews({ search: searchTerm || undefined }),
    { refetchOnWindowFocus: true }
  );

  const createMutation = useMutation(frontCmsService.createNews, {
    onSuccess: () => {
      queryClient.invalidateQueries(['front-cms-news']);
      setShowCreateModal(false);
      showToast('News created successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create news', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => frontCmsService.updateNews(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['front-cms-news']);
        setShowEditModal(false);
        setSelectedNews(null);
        showToast('News updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update news', 'error');
      },
    }
  );

  const deleteMutation = useMutation(frontCmsService.deleteNews, {
    onSuccess: () => {
      queryClient.invalidateQueries(['front-cms-news']);
      showToast('News deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete news', 'error');
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      news_title: formData.get('news_title') as string,
      news_date: formData.get('news_date') as string,
      description: formData.get('description') as string || undefined,
      meta_title: formData.get('meta_title') as string || undefined,
      meta_keyword: formData.get('meta_keyword') as string || undefined,
      meta_description: formData.get('meta_description') as string || undefined,
      sidebar_enabled: formData.get('sidebar_enabled') === 'on',
      featured_image: formData.get('featured_image') as string || undefined,
    });
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedNews) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: selectedNews.id,
      data: {
        news_title: formData.get('news_title') as string,
        news_date: formData.get('news_date') as string,
        description: formData.get('description') as string || undefined,
        meta_title: formData.get('meta_title') as string || undefined,
        meta_keyword: formData.get('meta_keyword') as string || undefined,
        meta_description: formData.get('meta_description') as string || undefined,
        sidebar_enabled: formData.get('sidebar_enabled') === 'on',
        featured_image: formData.get('featured_image') as string || undefined,
      },
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this news?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditClick = (news: News) => {
    setSelectedNews(news);
    setShowEditModal(true);
  };

  const handleViewNews = (news: News) => {
    const publicUrl = `/news/${news.slug}`;
    window.open(publicUrl, '_blank');
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search news..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Add News
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {news.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state">
                    No news found
                  </td>
                </tr>
              ) : (
                news.map((item) => (
                  <tr key={item.id}>
                    <td>{item.news_title}</td>
                    <td>{new Date(item.news_date).toLocaleDateString()}</td>
                    <td>{new Date(item.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-sm btn-view" onClick={() => handleViewNews(item)}>
                        View
                      </button>
                      <button className="btn-sm btn-edit" onClick={() => handleEditClick(item)}>
                        Edit
                      </button>
                      <button className="btn-sm btn-delete" onClick={() => handleDelete(item.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add News"
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>News Title *</label>
            <input type="text" name="news_title" required />
          </div>
          <div className="form-group">
            <label>News Date *</label>
            <input type="date" name="news_date" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" rows={4}></textarea>
          </div>
          <div className="form-group">
            <label>Meta Title</label>
            <input type="text" name="meta_title" />
          </div>
          <div className="form-group">
            <label>Meta Keywords</label>
            <input type="text" name="meta_keyword" />
          </div>
          <div className="form-group">
            <label>Meta Description</label>
            <textarea name="meta_description" rows={3}></textarea>
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" name="sidebar_enabled" defaultChecked />
              Enable Sidebar
            </label>
          </div>
          <div className="form-group">
            <label>Featured Image URL</label>
            <input type="text" name="featured_image" />
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedNews(null);
        }}
        title="Edit News"
      >
        {selectedNews && (
          <form onSubmit={handleEdit}>
            <div className="form-group">
              <label>News Title *</label>
              <input type="text" name="news_title" defaultValue={selectedNews.news_title} required />
            </div>
            <div className="form-group">
              <label>News Date *</label>
              <input type="date" name="news_date" defaultValue={selectedNews.news_date.split('T')[0]} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" rows={4} defaultValue={selectedNews.description || ''}></textarea>
            </div>
            <div className="form-group">
              <label>Meta Title</label>
              <input type="text" name="meta_title" defaultValue={selectedNews.meta_title || ''} />
            </div>
            <div className="form-group">
              <label>Meta Keywords</label>
              <input type="text" name="meta_keyword" defaultValue={selectedNews.meta_keyword || ''} />
            </div>
            <div className="form-group">
              <label>Meta Description</label>
              <textarea name="meta_description" rows={3} defaultValue={selectedNews.meta_description || ''}></textarea>
            </div>
            <div className="form-group">
              <label>
                <input type="checkbox" name="sidebar_enabled" defaultChecked={selectedNews.sidebar_enabled} />
                Enable Sidebar
              </label>
            </div>
            <div className="form-group">
              <label>Featured Image URL</label>
              <input type="text" name="featured_image" defaultValue={selectedNews.featured_image || ''} />
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => {
                setShowEditModal(false);
                setSelectedNews(null);
              }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Update
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

// ========== Media Tab ==========

const MediaTab = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [fileTypeFilter, setFileTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadType, setUploadType] = useState<'file' | 'youtube'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: media = [], isLoading } = useQuery(
    ['front-cms-media', fileTypeFilter, searchTerm],
    () => frontCmsService.getMedia({ file_type: fileTypeFilter || undefined, search: searchTerm || undefined }),
    { refetchOnWindowFocus: true }
  );

  const uploadMutation = useMutation(
    ({ file, youtubeUrl, altText }: { file: File | null; youtubeUrl?: string; altText?: string }) =>
      frontCmsService.uploadMedia(file, youtubeUrl, altText),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['front-cms-media']);
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadType('file');
        showToast('Media uploaded successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to upload media', 'error');
      },
    }
  );

  const deleteMutation = useMutation(frontCmsService.deleteMedia, {
    onSuccess: () => {
      queryClient.invalidateQueries(['front-cms-media']);
      showToast('Media deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete media', 'error');
    },
  });

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const altText = formData.get('alt_text') as string;
    
    if (uploadType === 'youtube') {
      const youtubeUrl = formData.get('youtube_url') as string;
      if (!youtubeUrl) {
        showToast('YouTube URL is required', 'error');
        return;
      }
      uploadMutation.mutate({ file: null, youtubeUrl, altText: altText || undefined });
    } else {
      if (!selectedFile) {
        showToast('Please select a file', 'error');
        return;
      }
      uploadMutation.mutate({ file: selectedFile, altText: altText || undefined });
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this media?')) {
      deleteMutation.mutate(id);
    }
  };

  const getMediaUrl = (media: Media) => {
    if (media.file_type === 'video' && media.youtube_url) {
      return media.youtube_url;
    }
    return `${import.meta.env.VITE_API_BASE_URL}${media.file_path}`;
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search media..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={fileTypeFilter} onChange={(e) => setFileTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
            <option value="video">Videos</option>
          </select>
        </div>
        <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
          + Upload Media
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="media-grid">
          {media.length === 0 ? (
            <div className="empty-state">No media found</div>
          ) : (
            media.map((item) => (
              <div key={item.id} className="media-item">
                {item.file_type === 'image' ? (
                  <img src={getMediaUrl(item)} alt={item.alt_text || item.file_name} />
                ) : item.file_type === 'video' ? (
                  <div className="video-placeholder">
                    <span>🎥</span>
                    <p>{item.file_name}</p>
                  </div>
                ) : (
                  <div className="document-placeholder">
                    <span>📄</span>
                    <p>{item.file_name}</p>
                  </div>
                )}
                <div className="media-info">
                  <p className="media-name">{item.file_name}</p>
                  <p className="media-type">{item.file_type}</p>
                </div>
                <button className="btn-sm btn-delete" onClick={() => handleDelete(item.id)}>
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedFile(null);
          setUploadType('file');
        }}
        title="Upload Media"
      >
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label>Upload Type</label>
            <select value={uploadType} onChange={(e) => setUploadType(e.target.value as 'file' | 'youtube')}>
              <option value="file">File Upload</option>
              <option value="youtube">YouTube URL</option>
            </select>
          </div>
          {uploadType === 'file' ? (
            <div className="form-group">
              <label>File *</label>
              <input
                type="file"
                name="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label>YouTube URL *</label>
              <input type="url" name="youtube_url" placeholder="https://www.youtube.com/watch?v=..." required />
            </div>
          )}
          <div className="form-group">
            <label>Alt Text</label>
            <input type="text" name="alt_text" />
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => {
              setShowUploadModal(false);
              setSelectedFile(null);
              setUploadType('file');
            }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Upload
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ========== Banner Images Tab ==========

const BannerImagesTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<BannerImage | null>(null);

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: banners = [], isLoading } = useQuery(
    ['front-cms-banner-images'],
    frontCmsService.getBannerImages,
    { refetchOnWindowFocus: true }
  );

  const createMutation = useMutation(frontCmsService.createBannerImage, {
    onSuccess: () => {
      queryClient.invalidateQueries(['front-cms-banner-images']);
      setShowCreateModal(false);
      showToast('Banner image added successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to add banner image', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => frontCmsService.updateBannerImage(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['front-cms-banner-images']);
        setShowEditModal(false);
        setSelectedBanner(null);
        showToast('Banner image updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update banner image', 'error');
      },
    }
  );

  const deleteMutation = useMutation(frontCmsService.deleteBannerImage, {
    onSuccess: () => {
      queryClient.invalidateQueries(['front-cms-banner-images']);
      showToast('Banner image deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete banner image', 'error');
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      image_path: formData.get('image_path') as string,
      image_title: formData.get('image_title') as string || undefined,
      image_link: formData.get('image_link') as string || undefined,
      sort_order: parseInt(formData.get('sort_order') as string) || 0,
      is_active: formData.get('is_active') === 'on',
    });
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBanner) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: selectedBanner.id,
      data: {
        image_path: formData.get('image_path') as string,
        image_title: formData.get('image_title') as string || undefined,
        image_link: formData.get('image_link') as string || undefined,
        sort_order: parseInt(formData.get('sort_order') as string) || 0,
        is_active: formData.get('is_active') === 'on',
      },
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this banner image?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditClick = (banner: BannerImage) => {
    setSelectedBanner(banner);
    setShowEditModal(true);
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div></div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Add Banner Image
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Link</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No banner images found
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id}>
                    <td>
                      <img
                        src={`${import.meta.env.VITE_API_BASE_URL}${banner.image_path}`}
                        alt={banner.image_title || 'Banner'}
                        className="banner-thumbnail"
                      />
                    </td>
                    <td>{banner.image_title || '-'}</td>
                    <td>{banner.image_link || '-'}</td>
                    <td>{banner.sort_order}</td>
                    <td>
                      <span className={`badge ${banner.is_active ? 'badge-success' : 'badge-inactive'}`}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="btn-sm btn-edit" onClick={() => handleEditClick(banner)}>
                        Edit
                      </button>
                      <button className="btn-sm btn-delete" onClick={() => handleDelete(banner.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Banner Image"
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Image Path/URL *</label>
            <input type="text" name="image_path" required />
          </div>
          <div className="form-group">
            <label>Image Title</label>
            <input type="text" name="image_title" />
          </div>
          <div className="form-group">
            <label>Image Link</label>
            <input type="url" name="image_link" />
          </div>
          <div className="form-group">
            <label>Sort Order</label>
            <input type="number" name="sort_order" defaultValue="0" min="0" />
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" name="is_active" defaultChecked />
              Active
            </label>
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBanner(null);
        }}
        title="Edit Banner Image"
      >
        {selectedBanner && (
          <form onSubmit={handleEdit}>
            <div className="form-group">
              <label>Image Path/URL *</label>
              <input type="text" name="image_path" defaultValue={selectedBanner.image_path} required />
            </div>
            <div className="form-group">
              <label>Image Title</label>
              <input type="text" name="image_title" defaultValue={selectedBanner.image_title || ''} />
            </div>
            <div className="form-group">
              <label>Image Link</label>
              <input type="url" name="image_link" defaultValue={selectedBanner.image_link || ''} />
            </div>
            <div className="form-group">
              <label>Sort Order</label>
              <input type="number" name="sort_order" defaultValue={selectedBanner.sort_order} min="0" />
            </div>
            <div className="form-group">
              <label>
                <input type="checkbox" name="is_active" defaultChecked={selectedBanner.is_active} />
                Active
              </label>
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => {
                setShowEditModal(false);
                setSelectedBanner(null);
              }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Update
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default FrontCms;


