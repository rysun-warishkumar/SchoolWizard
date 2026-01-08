import axios from 'axios';

const PUBLIC_API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL?.replace('/api/v1', '/api/public') || 'http://localhost:5000/api/public';

// Public API client (no authentication required)
const publicApiClient = axios.create({
  baseURL: PUBLIC_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ========== Types ==========

export interface PublicMenu {
  id: number;
  name: string;
  description?: string;
  items?: PublicMenuItem[];
}

export interface PublicMenuItem {
  id: number;
  menu_id: number;
  parent_id?: number;
  menu_item: string;
  external_url?: string;
  open_in_new_tab: boolean;
  page_id?: number;
  page_title?: string;
  slug?: string; // Slug from the associated page
  sort_order: number;
  children?: PublicMenuItem[];
}

export interface PublicPage {
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

export interface PublicEvent {
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

export interface PublicGallery {
  id: number;
  gallery_title: string;
  description?: string;
  meta_title?: string;
  meta_keyword?: string;
  meta_description?: string;
  sidebar_enabled: boolean;
  featured_image?: string;
  slug: string;
  images?: PublicGalleryImage[];
  created_at: string;
  updated_at: string;
}

export interface PublicGalleryImage {
  id: number;
  gallery_id: number;
  image_path: string;
  image_title?: string;
  sort_order: number;
  created_at: string;
}

export interface PublicNews {
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

export interface PublicBannerImage {
  id: number;
  image_path: string;
  image_title?: string;
  image_link?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicCMSSettings {
  id?: number;
  is_enabled: boolean;
  sidebar_enabled: boolean;
  rtl_mode: boolean;
  logo?: string;
  favicon?: string;
  footer_text?: string;
  address?: string;
  google_analytics?: string;
  facebook_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
  pinterest_url?: string;
  whatsapp_url?: string;
  current_theme?: string;
}

// ========== Service Object ==========

export const publicCmsService = {
  // ========== Settings ==========
  async getSettings(): Promise<PublicCMSSettings> {
    const response = await publicApiClient.get('/cms/settings');
    return response.data.data;
  },

  // ========== Menus ==========
  async getMenus(): Promise<PublicMenu[]> {
    const response = await publicApiClient.get('/cms/menus');
    return response.data.data;
  },

  async getMenuItems(menuId: number): Promise<PublicMenuItem[]> {
    const response = await publicApiClient.get(`/cms/menus/${menuId}/items`);
    return response.data.data;
  },

  // ========== Pages ==========
  async getPages(params?: { page_type?: string; search?: string }): Promise<PublicPage[]> {
    const response = await publicApiClient.get('/cms/pages', { params });
    return response.data.data;
  },

  async getPageBySlug(slug: string): Promise<PublicPage> {
    const response = await publicApiClient.get(`/cms/pages/slug/${slug}`);
    return response.data.data;
  },

  async getPageById(id: number): Promise<PublicPage> {
    const response = await publicApiClient.get(`/cms/pages/${id}`);
    return response.data.data;
  },

  // ========== Events ==========
  async getEvents(params?: { search?: string; start_date?: string; end_date?: string }): Promise<PublicEvent[]> {
    const response = await publicApiClient.get('/cms/events', { params });
    return response.data.data;
  },

  async getEventBySlug(slug: string): Promise<PublicEvent> {
    const response = await publicApiClient.get(`/cms/events/slug/${slug}`);
    return response.data.data;
  },

  async getEventById(id: number): Promise<PublicEvent> {
    const response = await publicApiClient.get(`/cms/events/${id}`);
    return response.data.data;
  },

  // ========== Galleries ==========
  async getGalleries(params?: { search?: string }): Promise<PublicGallery[]> {
    const response = await publicApiClient.get('/cms/galleries', { params });
    return response.data.data;
  },

  async getGalleryBySlug(slug: string): Promise<PublicGallery> {
    const response = await publicApiClient.get(`/cms/galleries/slug/${slug}`);
    return response.data.data;
  },

  async getGalleryById(id: number): Promise<PublicGallery> {
    const response = await publicApiClient.get(`/cms/galleries/${id}`);
    return response.data.data;
  },

  // ========== News ==========
  async getNews(params?: { search?: string; start_date?: string; end_date?: string }): Promise<PublicNews[]> {
    const response = await publicApiClient.get('/cms/news', { params });
    return response.data.data;
  },

  async getNewsBySlug(slug: string): Promise<PublicNews> {
    const response = await publicApiClient.get(`/cms/news/slug/${slug}`);
    return response.data.data;
  },

  async getNewsById(id: number): Promise<PublicNews> {
    const response = await publicApiClient.get(`/cms/news/${id}`);
    return response.data.data;
  },

  // ========== Banner Images ==========
  async getBannerImages(): Promise<PublicBannerImage[]> {
    const response = await publicApiClient.get('/cms/banner-images');
    return response.data.data;
  },
};

