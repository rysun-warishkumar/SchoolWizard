import { apiClient } from './apiClient';

export interface WebsiteSettings {
  id?: number;
  website_logo?: string | null;
  school_name: string;
  tag_line?: string | null;
  tag_line_visible: boolean;
  contact_email?: string | null;
  contact_phone?: string | null;
  facebook_url?: string | null;
  facebook_enabled: boolean;
  twitter_url?: string | null;
  twitter_enabled: boolean;
  youtube_url?: string | null;
  youtube_enabled: boolean;
  instagram_url?: string | null;
  instagram_enabled: boolean;
  linkedin_url?: string | null;
  linkedin_enabled: boolean;
  whatsapp_url?: string | null;
  whatsapp_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Banner {
  id?: number;
  title: string;
  description?: string | null;
  image_path: string;
  button_text?: string | null;
  button_url?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BannerFormData {
  title: string;
  description?: string;
  button_text?: string;
  button_url?: string;
  sort_order?: number;
  is_active?: boolean;
  banner_image?: File;
}

export const frontCmsWebsiteService = {
  // Website Settings
  getWebsiteSettings: async (): Promise<WebsiteSettings> => {
    const response = await apiClient.get('/front-cms-website/settings');
    return response.data.data;
  },

  updateWebsiteSettings: async (data: Partial<WebsiteSettings>, logoFile?: File): Promise<WebsiteSettings> => {
    const formData = new FormData();
    
    // Add all fields to FormData - always include all fields
    formData.append('school_name', data.school_name || '');
    formData.append('tag_line', data.tag_line || '');
    formData.append('tag_line_visible', (data.tag_line_visible !== undefined ? data.tag_line_visible : true).toString());
    formData.append('contact_email', data.contact_email || '');
    formData.append('contact_phone', data.contact_phone || '');
    
    // Social media URLs and enabled flags
    formData.append('facebook_url', data.facebook_url || '');
    formData.append('facebook_enabled', (data.facebook_enabled || false).toString());
    formData.append('twitter_url', data.twitter_url || '');
    formData.append('twitter_enabled', (data.twitter_enabled || false).toString());
    formData.append('youtube_url', data.youtube_url || '');
    formData.append('youtube_enabled', (data.youtube_enabled || false).toString());
    formData.append('instagram_url', data.instagram_url || '');
    formData.append('instagram_enabled', (data.instagram_enabled || false).toString());
    formData.append('linkedin_url', data.linkedin_url || '');
    formData.append('linkedin_enabled', (data.linkedin_enabled || false).toString());
    formData.append('whatsapp_url', data.whatsapp_url || '');
    formData.append('whatsapp_enabled', (data.whatsapp_enabled || false).toString());

    // Add logo file if provided
    if (logoFile) {
      formData.append('website_logo', logoFile);
    } else if (data.website_logo) {
      formData.append('website_logo', data.website_logo);
    }

    const response = await apiClient.put('/front-cms-website/settings', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Banners
  getBanners: async (): Promise<Banner[]> => {
    const response = await apiClient.get('/front-cms-website/banners');
    return response.data.data;
  },

  getBanner: async (id: number): Promise<Banner> => {
    const response = await apiClient.get(`/front-cms-website/banners/${id}`);
    return response.data.data;
  },

  createBanner: async (data: BannerFormData): Promise<Banner> => {
    const formData = new FormData();
    
    formData.append('title', data.title);
    formData.append('description', data.description || '');
    formData.append('button_text', data.button_text || '');
    formData.append('button_url', data.button_url || '');
    formData.append('sort_order', (data.sort_order !== undefined ? data.sort_order : 0).toString());
    formData.append('is_active', (data.is_active !== undefined ? data.is_active : true).toString());
    
    if (data.banner_image) {
      formData.append('banner_image', data.banner_image);
    }

    const response = await apiClient.post('/front-cms-website/banners', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  updateBanner: async (id: number, data: BannerFormData): Promise<Banner> => {
    const formData = new FormData();
    
    formData.append('title', data.title);
    formData.append('description', data.description !== undefined ? (data.description || '') : '');
    formData.append('button_text', data.button_text !== undefined ? (data.button_text || '') : '');
    formData.append('button_url', data.button_url !== undefined ? (data.button_url || '') : '');
    formData.append('sort_order', (data.sort_order !== undefined ? data.sort_order : 0).toString());
    formData.append('is_active', (data.is_active !== undefined ? data.is_active : true).toString());
    
    if (data.banner_image) {
      formData.append('banner_image', data.banner_image);
    }

    const response = await apiClient.put(`/front-cms-website/banners/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  deleteBanner: async (id: number): Promise<void> => {
    await apiClient.delete(`/front-cms-website/banners/${id}`);
  },
};

