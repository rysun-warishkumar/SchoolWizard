import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface WebsiteSettings {
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
}

export interface Banner {
  id: number;
  title: string;
  description?: string | null;
  image_path: string;
  button_text?: string | null;
  button_url?: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface MissionVision {
  mission_content: string;
  vision_content: string;
}

export interface Counter {
  id: number;
  counter_number: string;
  counter_label: string;
  sort_order: number;
  is_active: boolean;
}

export interface History {
  history_content: string;
  history_image?: string | null;
}

export interface CoreValue {
  id: number;
  icon_class: string;
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

export interface Achievement {
  id: number;
  achievement_year: string;
  achievement_title: string;
  achievement_description: string;
  sort_order: number;
  is_active: boolean;
}

export interface Leader {
  id: number;
  leader_name: string;
  leader_role: string;
  leader_bio: string;
  leader_image?: string | null;
  sort_order: number;
  is_active: boolean;
}

export const websiteService = {
  getSettings: async (): Promise<WebsiteSettings> => {
    try {
      const response = await apiClient.get('/public/website/website-settings');
      const data = response.data.data;
      // Convert MySQL boolean (0/1) to JavaScript boolean
      return {
        ...data,
        tag_line_visible: Boolean(data.tag_line_visible),
        facebook_enabled: Boolean(data.facebook_enabled),
        twitter_enabled: Boolean(data.twitter_enabled),
        youtube_enabled: Boolean(data.youtube_enabled),
        instagram_enabled: Boolean(data.instagram_enabled),
        linkedin_enabled: Boolean(data.linkedin_enabled),
        whatsapp_enabled: Boolean(data.whatsapp_enabled),
      };
    } catch (error: any) {
      console.error('Error fetching website settings:', error);
      // Return default settings on error
      return {
        school_name: 'School Name',
        tag_line: 'A School with a Difference',
        tag_line_visible: true,
        facebook_enabled: false,
        twitter_enabled: false,
        youtube_enabled: false,
        instagram_enabled: false,
        linkedin_enabled: false,
        whatsapp_enabled: false,
      };
    }
  },

  getBanners: async (): Promise<Banner[]> => {
    try {
      const response = await apiClient.get('/public/website/banners');
      return Array.isArray(response.data.data) ? response.data.data : [];
    } catch (error: any) {
      console.error('Error fetching banners:', error);
      // Return empty array on error - HomePage will handle fallback
      return [];
    }
  },

  // About Us Page Services
  getMissionVision: async (): Promise<MissionVision> => {
    try {
      const response = await apiClient.get('/public/about-us/mission-vision');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching mission & vision:', error);
      return {
        mission_content: '',
        vision_content: '',
      };
    }
  },

  getCounters: async (): Promise<Counter[]> => {
    try {
      const response = await apiClient.get('/public/about-us/counters');
      const data = response.data.data || [];
      return Array.isArray(data) ? data.filter((c: Counter) => c.is_active).sort((a, b) => a.sort_order - b.sort_order) : [];
    } catch (error: any) {
      console.error('Error fetching counters:', error);
      return [];
    }
  },

  getHistory: async (): Promise<History> => {
    try {
      const response = await apiClient.get('/public/about-us/history');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching history:', error);
      return {
        history_content: '',
        history_image: null,
      };
    }
  },

  getValues: async (): Promise<CoreValue[]> => {
    try {
      const response = await apiClient.get('/api/public/about-us/values');
      const data = response.data.data || [];
      return Array.isArray(data) ? data.filter((v: CoreValue) => v.is_active).sort((a, b) => a.sort_order - b.sort_order) : [];
    } catch (error: any) {
      console.error('Error fetching core values:', error);
      return [];
    }
  },

  getAchievements: async (): Promise<Achievement[]> => {
    try {
      const response = await apiClient.get('/public/about-us/achievements');
      const data = response.data.data || [];
      return Array.isArray(data) ? data.filter((a: Achievement) => a.is_active).sort((a, b) => a.sort_order - b.sort_order) : [];
    } catch (error: any) {
      console.error('Error fetching achievements:', error);
      return [];
    }
  },

  getLeadership: async (): Promise<Leader[]> => {
    try {
      const response = await apiClient.get('/public/about-us/leadership');
      const data = response.data.data || [];
      return Array.isArray(data) ? data.filter((l: Leader) => l.is_active).sort((a, b) => a.sort_order - b.sort_order) : [];
    } catch (error: any) {
      console.error('Error fetching leadership:', error);
      return [];
    }
  },

  // Admission Services
  submitAdmissionInquiry: async (data: {
    student_name: string;
    parent_name: string;
    email: string;
    phone: string;
    grade: string;
    previous_school?: string;
    address: string;
    message?: string;
  }): Promise<any> => {
    try {
      const response = await apiClient.post('/api/public/admission/inquiries', data);
      return response.data;
    } catch (error: any) {
      console.error('Error submitting admission inquiry:', error);
      throw error;
    }
  },

  getImportantDates: async (): Promise<any[]> => {
    try {
      const response = await apiClient.get('/public/admission/important-dates');
      const data = response.data.data || [];
      return Array.isArray(data) ? data.filter((d: any) => d.is_active).sort((a, b) => a.sort_order - b.sort_order) : [];
    } catch (error: any) {
      console.error('Error fetching important dates:', error);
      return [];
    }
  },

  getContactDetails: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/api/public/admission/contact-details');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching contact details:', error);
      return {
        call_us_numbers: '[]',
        email_us_addresses: '[]',
        visit_us_address: '',
        office_hours: '',
        important_dates_visible: true,
        contact_details_visible: true,
      };
    }
  },

  // Gallery Services
  getGalleryCategories: async (): Promise<any[]> => {
    try {
      const response = await apiClient.get('/public/gallery/categories');
      const data = response.data.data || [];
      return Array.isArray(data) ? data.filter((c: any) => c.is_active).sort((a, b) => a.sort_order - b.sort_order) : [];
    } catch (error: any) {
      console.error('Error fetching gallery categories:', error);
      return [];
    }
  },

  getGalleryImages: async (categoryId?: number): Promise<any[]> => {
    try {
      const params = categoryId ? { category_id: categoryId } : {};
      const response = await apiClient.get('/public/gallery/images', { params });
      const data = response.data.data || [];
      return Array.isArray(data) ? data.filter((img: any) => img.is_active).sort((a, b) => a.sort_order - b.sort_order) : [];
    } catch (error: any) {
      console.error('Error fetching gallery images:', error);
      return [];
    }
  },

  // News Services
  getNewsArticles: async (category?: string, featured?: boolean): Promise<any[]> => {
    try {
      const params: any = {};
      if (category) params.category = category;
      if (featured !== undefined) params.featured = featured;
      const response = await apiClient.get('/public/news-events/news', { params });
      const data = response.data.data || [];
      return Array.isArray(data) ? data.filter((article: any) => article.is_active) : [];
    } catch (error: any) {
      console.error('Error fetching news articles:', error);
      return [];
    }
  },

  getNewsArticle: async (identifier: string | number): Promise<any> => {
    try {
      const response = await apiClient.get(`/public/news-events/news/${identifier}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching news article:', error);
      return null;
    }
  },

  // Events Services
  getEvents: async (category?: string, featured?: boolean, upcoming?: boolean): Promise<any[]> => {
    try {
      const params: any = {};
      if (category) params.category = category;
      if (featured !== undefined) params.featured = featured;
      if (upcoming !== undefined) params.upcoming = upcoming;
      const response = await apiClient.get('/api/public/news-events/events', { params });
      const data = response.data.data || [];
      return Array.isArray(data) ? data.filter((event: any) => event.is_active) : [];
    } catch (error: any) {
      console.error('Error fetching events:', error);
      return [];
    }
  },

  getEvent: async (identifier: string | number): Promise<any> => {
    try {
      const response = await apiClient.get(`/public/news-events/events/${identifier}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching event:', error);
      return null;
    }
  },
};

