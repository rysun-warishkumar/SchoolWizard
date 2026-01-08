import { apiClient } from './apiClient';

export interface NewsArticle {
  id?: number;
  title: string;
  slug?: string;
  excerpt?: string | null;
  content: string;
  category: string;
  featured_image?: string | null;
  author?: string | null;
  published_date: string;
  is_featured: boolean;
  is_active: boolean;
  views_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Event {
  id?: number;
  title: string;
  slug?: string;
  description: string;
  category: string;
  event_date: string;
  event_time?: string | null;
  end_date?: string | null;
  end_time?: string | null;
  venue?: string | null;
  featured_image?: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const newsEventsManagementService = {
  // News Articles
  getNewsArticles: async (params?: { category?: string; featured?: boolean; limit?: number }): Promise<NewsArticle[]> => {
    const response = await apiClient.get('/news-events/news', { params });
    return response.data.data;
  },
  getNewsArticle: async (id: number): Promise<NewsArticle> => {
    const response = await apiClient.get(`/news-events/news/${id}`);
    return response.data.data;
  },
  createNewsArticle: async (formData: FormData): Promise<NewsArticle> => {
    const response = await apiClient.post('/news-events/news', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
  updateNewsArticle: async (id: number, formData: FormData): Promise<NewsArticle> => {
    const response = await apiClient.put(`/news-events/news/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
  deleteNewsArticle: async (id: number): Promise<void> => {
    await apiClient.delete(`/news-events/news/${id}`);
  },

  // Events
  getEvents: async (params?: { category?: string; featured?: boolean; upcoming?: boolean; limit?: number }): Promise<Event[]> => {
    const response = await apiClient.get('/news-events/events', { params });
    return response.data.data;
  },
  getEvent: async (id: number): Promise<Event> => {
    const response = await apiClient.get(`/news-events/events/${id}`);
    return response.data.data;
  },
  createEvent: async (formData: FormData): Promise<Event> => {
    const response = await apiClient.post('/news-events/events', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
  updateEvent: async (id: number, formData: FormData): Promise<Event> => {
    const response = await apiClient.put(`/news-events/events/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
  deleteEvent: async (id: number): Promise<void> => {
    await apiClient.delete(`/news-events/events/${id}`);
  },
};

