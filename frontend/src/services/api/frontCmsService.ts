import { apiClient } from './apiClient';

// ========== Types ==========

export interface Menu {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: number;
  menu_id: number;
  parent_id?: number;
  menu_item: string;
  external_url?: string;
  open_in_new_tab: boolean;
  page_id?: number;
  page_title?: string;
  sort_order: number;
  children?: MenuItem[];
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: number;
  page_title: string;
  page_type: 'standard' | 'event' | 'news' | 'gallery';
  description?: string;
  meta_title?: string;
  meta_keyword?: string;
  meta_description?: string;
  sidebar_enabled: boolean;
  featured_image?: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: number;
  event_title: string;
  event_venue?: string;
  event_start_date: string;
  event_end_date?: string;
  description?: string;
  meta_title?: string;
  meta_keyword?: string;
  meta_description?: string;
  sidebar_enabled: boolean;
  featured_image?: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Gallery {
  id: number;
  gallery_title: string;
  description?: string;
  meta_title?: string;
  meta_keyword?: string;
  meta_description?: string;
  sidebar_enabled: boolean;
  featured_image?: string;
  slug: string;
  images?: GalleryImage[];
  created_at: string;
  updated_at: string;
}

export interface GalleryImage {
  id: number;
  gallery_id: number;
  image_path: string;
  image_title?: string;
  sort_order: number;
  created_at: string;
}

export interface News {
  id: number;
  news_title: string;
  news_date: string;
  description?: string;
  meta_title?: string;
  meta_keyword?: string;
  meta_description?: string;
  sidebar_enabled: boolean;
  featured_image?: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: number;
  file_name: string;
  file_path: string;
  file_type: 'image' | 'document' | 'video';
  file_size?: number;
  mime_type?: string;
  youtube_url?: string;
  alt_text?: string;
  created_at: string;
}

export interface BannerImage {
  id: number;
  image_path: string;
  image_title?: string;
  image_link?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ========== Service Object ==========

export const frontCmsService = {
  // ========== Menus ==========
  async getMenus(): Promise<Menu[]> {
    const response = await apiClient.get('/front-cms/menus');
    return response.data.data;
  },

  async createMenu(data: { name: string; description?: string }): Promise<{ id: number }> {
    const response = await apiClient.post('/front-cms/menus', data);
    return response.data.data;
  },

  async updateMenu(id: number, data: { name: string; description?: string }): Promise<void> {
    await apiClient.put(`/front-cms/menus/${id}`, data);
  },

  async deleteMenu(id: number): Promise<void> {
    await apiClient.delete(`/front-cms/menus/${id}`);
  },

  // ========== Menu Items ==========
  async getMenuItems(menuId: number): Promise<MenuItem[]> {
    const response = await apiClient.get(`/front-cms/menus/${menuId}/items`);
    return response.data.data;
  },

  async createMenuItem(
    menuId: number,
    data: {
      menu_item: string;
      external_url?: string;
      open_in_new_tab?: boolean;
      page_id?: number;
      parent_id?: number;
      sort_order?: number;
    }
  ): Promise<{ id: number }> {
    const response = await apiClient.post(`/front-cms/menus/${menuId}/items`, data);
    return response.data.data;
  },

  async updateMenuItem(
    id: number,
    data: {
      menu_item: string;
      external_url?: string;
      open_in_new_tab?: boolean;
      page_id?: number;
      parent_id?: number;
      sort_order?: number;
    }
  ): Promise<void> {
    await apiClient.put(`/front-cms/menu-items/${id}`, data);
  },

  async deleteMenuItem(id: number): Promise<void> {
    await apiClient.delete(`/front-cms/menu-items/${id}`);
  },

  // ========== Pages ==========
  async getPages(params?: { page_type?: string; search?: string }): Promise<Page[]> {
    const response = await apiClient.get('/front-cms/pages', { params });
    return response.data.data;
  },

  async getPageById(id: number): Promise<Page> {
    const response = await apiClient.get(`/front-cms/pages/${id}`);
    return response.data.data;
  },

  async createPage(data: {
    page_title: string;
    page_type?: 'standard' | 'event' | 'news' | 'gallery';
    description?: string;
    meta_title?: string;
    meta_keyword?: string;
    meta_description?: string;
    sidebar_enabled?: boolean;
    featured_image?: string;
  }): Promise<{ id: number }> {
    const response = await apiClient.post('/front-cms/pages', data);
    return response.data.data;
  },

  async updatePage(
    id: number,
    data: {
      page_title: string;
      page_type?: 'standard' | 'event' | 'news' | 'gallery';
      description?: string;
      meta_title?: string;
      meta_keyword?: string;
      meta_description?: string;
      sidebar_enabled?: boolean;
      featured_image?: string;
    }
  ): Promise<void> {
    await apiClient.put(`/front-cms/pages/${id}`, data);
  },

  async deletePage(id: number): Promise<void> {
    await apiClient.delete(`/front-cms/pages/${id}`);
  },

  // ========== Events ==========
  async getEvents(params?: { search?: string; start_date?: string; end_date?: string }): Promise<Event[]> {
    const response = await apiClient.get('/front-cms/events', { params });
    return response.data.data;
  },

  async getEventById(id: number): Promise<Event> {
    const response = await apiClient.get(`/front-cms/events/${id}`);
    return response.data.data;
  },

  async createEvent(data: {
    event_title: string;
    event_venue?: string;
    event_start_date: string;
    event_end_date?: string;
    description?: string;
    meta_title?: string;
    meta_keyword?: string;
    meta_description?: string;
    sidebar_enabled?: boolean;
    featured_image?: string;
  }): Promise<{ id: number }> {
    const response = await apiClient.post('/front-cms/events', data);
    return response.data.data;
  },

  async updateEvent(
    id: number,
    data: {
      event_title: string;
      event_venue?: string;
      event_start_date: string;
      event_end_date?: string;
      description?: string;
      meta_title?: string;
      meta_keyword?: string;
      meta_description?: string;
      sidebar_enabled?: boolean;
      featured_image?: string;
    }
  ): Promise<void> {
    await apiClient.put(`/front-cms/events/${id}`, data);
  },

  async deleteEvent(id: number): Promise<void> {
    await apiClient.delete(`/front-cms/events/${id}`);
  },

  // ========== Galleries ==========
  async getGalleries(params?: { search?: string }): Promise<Gallery[]> {
    const response = await apiClient.get('/front-cms/galleries', { params });
    return response.data.data;
  },

  async getGalleryById(id: number): Promise<Gallery> {
    const response = await apiClient.get(`/front-cms/galleries/${id}`);
    return response.data.data;
  },

  async createGallery(data: {
    gallery_title: string;
    description?: string;
    meta_title?: string;
    meta_keyword?: string;
    meta_description?: string;
    sidebar_enabled?: boolean;
    featured_image?: string;
    images?: Array<{ path: string; title?: string }>;
  }): Promise<{ id: number }> {
    const response = await apiClient.post('/front-cms/galleries', data);
    return response.data.data;
  },

  async updateGallery(
    id: number,
    data: {
      gallery_title: string;
      description?: string;
      meta_title?: string;
      meta_keyword?: string;
      meta_description?: string;
      sidebar_enabled?: boolean;
      featured_image?: string;
      images?: Array<{ path: string; title?: string }>;
    }
  ): Promise<void> {
    await apiClient.put(`/front-cms/galleries/${id}`, data);
  },

  async deleteGallery(id: number): Promise<void> {
    await apiClient.delete(`/front-cms/galleries/${id}`);
  },

  // ========== News ==========
  async getNews(params?: { search?: string; start_date?: string; end_date?: string }): Promise<News[]> {
    const response = await apiClient.get('/front-cms/news', { params });
    return response.data.data;
  },

  async getNewsById(id: number): Promise<News> {
    const response = await apiClient.get(`/front-cms/news/${id}`);
    return response.data.data;
  },

  async createNews(data: {
    news_title: string;
    news_date: string;
    description?: string;
    meta_title?: string;
    meta_keyword?: string;
    meta_description?: string;
    sidebar_enabled?: boolean;
    featured_image?: string;
  }): Promise<{ id: number }> {
    const response = await apiClient.post('/front-cms/news', data);
    return response.data.data;
  },

  async updateNews(
    id: number,
    data: {
      news_title: string;
      news_date: string;
      description?: string;
      meta_title?: string;
      meta_keyword?: string;
      meta_description?: string;
      sidebar_enabled?: boolean;
      featured_image?: string;
    }
  ): Promise<void> {
    await apiClient.put(`/front-cms/news/${id}`, data);
  },

  async deleteNews(id: number): Promise<void> {
    await apiClient.delete(`/front-cms/news/${id}`);
  },

  // ========== Media ==========
  async getMedia(params?: { file_type?: string; search?: string }): Promise<Media[]> {
    const response = await apiClient.get('/front-cms/media', { params });
    return response.data.data;
  },

  async uploadMedia(file: File | null, youtubeUrl?: string, altText?: string): Promise<{ id: number }> {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    if (youtubeUrl) {
      formData.append('youtube_url', youtubeUrl);
    }
    if (altText) {
      formData.append('alt_text', altText);
    }

    const response = await apiClient.post('/front-cms/media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async deleteMedia(id: number): Promise<void> {
    await apiClient.delete(`/front-cms/media/${id}`);
  },

  // ========== Banner Images ==========
  async getBannerImages(): Promise<BannerImage[]> {
    const response = await apiClient.get('/front-cms/banner-images');
    return response.data.data;
  },

  async createBannerImage(data: {
    image_path: string;
    image_title?: string;
    image_link?: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<{ id: number }> {
    const response = await apiClient.post('/front-cms/banner-images', data);
    return response.data.data;
  },

  async updateBannerImage(
    id: number,
    data: {
      image_path: string;
      image_title?: string;
      image_link?: string;
      sort_order?: number;
      is_active?: boolean;
    }
  ): Promise<void> {
    await apiClient.put(`/front-cms/banner-images/${id}`, data);
  },

  async deleteBannerImage(id: number): Promise<void> {
    await apiClient.delete(`/front-cms/banner-images/${id}`);
  },
};

