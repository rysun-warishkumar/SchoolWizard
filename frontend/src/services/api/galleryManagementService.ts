import { apiClient } from './apiClient';

export interface GalleryCategory {
  id?: number;
  name: string;
  description?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GalleryImage {
  id?: number;
  category_id: number;
  category_name?: string;
  title: string;
  description?: string | null;
  image_path: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const galleryManagementService = {
  // Categories
  getCategories: async (): Promise<GalleryCategory[]> => {
    const response = await apiClient.get('/gallery/categories');
    return response.data.data;
  },
  createCategory: async (data: Partial<GalleryCategory>): Promise<GalleryCategory> => {
    const response = await apiClient.post('/gallery/categories', data);
    return response.data.data;
  },
  updateCategory: async (id: number, data: Partial<GalleryCategory>): Promise<GalleryCategory> => {
    const response = await apiClient.put(`/gallery/categories/${id}`, data);
    return response.data.data;
  },
  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`/gallery/categories/${id}`);
  },

  // Images
  getImages: async (categoryId?: number): Promise<GalleryImage[]> => {
    const params = categoryId ? { category_id: categoryId } : {};
    const response = await apiClient.get('/gallery/images', { params });
    return response.data.data;
  },
  createImage: async (formData: FormData): Promise<GalleryImage> => {
    const response = await apiClient.post('/gallery/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
  updateImage: async (id: number, formData: FormData): Promise<GalleryImage> => {
    const response = await apiClient.put(`/gallery/images/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
  deleteImage: async (id: number): Promise<void> => {
    await apiClient.delete(`/gallery/images/${id}`);
  },
};

