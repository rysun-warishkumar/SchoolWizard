import { apiClient } from './apiClient';

export interface MissionVision {
  id?: number;
  mission_content: string;
  vision_content: string;
}

export interface Counter {
  id?: number;
  counter_number: string;
  counter_label: string;
  sort_order: number;
  is_active: boolean;
}

export interface History {
  id?: number;
  history_content: string;
  history_image?: string | null;
}

export interface CoreValue {
  id?: number;
  icon_class: string;
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

export interface Achievement {
  id?: number;
  achievement_year: string;
  achievement_title: string;
  achievement_description: string;
  sort_order: number;
  is_active: boolean;
}

export interface Leader {
  id?: number;
  leader_name: string;
  leader_role: string;
  leader_bio: string;
  leader_image?: string | null;
  sort_order: number;
  is_active: boolean;
}

const aboutUsPageService = {
  // Mission & Vision
  getMissionVision: async (): Promise<MissionVision> => {
    const response = await apiClient.get('/about-us-page/mission-vision');
    return response.data.data;
  },
  updateMissionVision: async (data: { mission_content: string; vision_content: string }): Promise<MissionVision> => {
    const response = await apiClient.put('/about-us-page/mission-vision', data);
    return response.data.data;
  },

  // Counters
  getCounters: async (): Promise<Counter[]> => {
    const response = await apiClient.get('/about-us-page/counters');
    return response.data.data;
  },
  createCounter: async (data: Partial<Counter>): Promise<Counter> => {
    const response = await apiClient.post('/about-us-page/counters', data);
    return response.data.data;
  },
  updateCounter: async (id: number, data: Partial<Counter>): Promise<Counter> => {
    const response = await apiClient.put(`/about-us-page/counters/${id}`, data);
    return response.data.data;
  },
  deleteCounter: async (id: number): Promise<void> => {
    await apiClient.delete(`/about-us-page/counters/${id}`);
  },

  // History
  getHistory: async (): Promise<History> => {
    const response = await apiClient.get('/about-us-page/history');
    return response.data.data;
  },
  updateHistory: async (data: { history_content: string; history_image?: string | null }, imageFile?: File): Promise<History> => {
    const formData = new FormData();
    formData.append('history_content', data.history_content);
    if (imageFile) {
      formData.append('history_image', imageFile);
    } else if (data.history_image !== undefined) {
      formData.append('history_image', data.history_image || '');
    }
    const response = await apiClient.put('/about-us-page/history', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  // Core Values
  getValues: async (): Promise<CoreValue[]> => {
    const response = await apiClient.get('/about-us-page/values');
    return response.data.data;
  },
  createValue: async (data: Partial<CoreValue>): Promise<CoreValue> => {
    const response = await apiClient.post('/about-us-page/values', data);
    return response.data.data;
  },
  updateValue: async (id: number, data: Partial<CoreValue>): Promise<CoreValue> => {
    const response = await apiClient.put(`/about-us-page/values/${id}`, data);
    return response.data.data;
  },
  deleteValue: async (id: number): Promise<void> => {
    await apiClient.delete(`/about-us-page/values/${id}`);
  },

  // Achievements
  getAchievements: async (): Promise<Achievement[]> => {
    const response = await apiClient.get('/about-us-page/achievements');
    return response.data.data;
  },
  createAchievement: async (data: Partial<Achievement>): Promise<Achievement> => {
    const response = await apiClient.post('/about-us-page/achievements', data);
    return response.data.data;
  },
  updateAchievement: async (id: number, data: Partial<Achievement>): Promise<Achievement> => {
    const response = await apiClient.put(`/about-us-page/achievements/${id}`, data);
    return response.data.data;
  },
  deleteAchievement: async (id: number): Promise<void> => {
    await apiClient.delete(`/about-us-page/achievements/${id}`);
  },

  // Leadership
  getLeadership: async (): Promise<Leader[]> => {
    const response = await apiClient.get('/about-us-page/leadership');
    return response.data.data;
  },
  createLeader: async (data: Partial<Leader>, imageFile?: File): Promise<Leader> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'leader_image') {
        if (typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else {
          formData.append(key, String(value));
        }
      }
    });
    if (imageFile) {
      formData.append('leader_image', imageFile);
    }
    const response = await apiClient.post('/about-us-page/leadership', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
  updateLeader: async (id: number, data: Partial<Leader>, imageFile?: File): Promise<Leader> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'leader_image') {
        if (typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else {
          formData.append(key, String(value));
        }
      }
    });
    if (imageFile) {
      formData.append('leader_image', imageFile);
    } else if (data.leader_image === null) {
      formData.append('leader_image', 'null');
    }
    const response = await apiClient.put(`/about-us-page/leadership/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
  deleteLeader: async (id: number): Promise<void> => {
    await apiClient.delete(`/about-us-page/leadership/${id}`);
  },
};

export { aboutUsPageService };

