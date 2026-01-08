import { apiClient } from './apiClient';

// ========== Types ==========

export interface Alumni {
  id: number;
  student_id?: number;
  admission_no?: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  alternate_phone?: string;
  date_of_birth?: string;
  gender: 'male' | 'female' | 'other';
  graduation_year: number;
  class_id?: number;
  section_id?: number;
  class_name?: string;
  section_name?: string;
  class_name_display?: string;
  section_name_display?: string;
  current_profession?: string;
  current_company?: string;
  current_designation?: string;
  current_address?: string;
  permanent_address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  photo?: string;
  facebook_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  achievements?: string;
  bio?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface AlumniEvent {
  id: number;
  event_title: string;
  event_description?: string;
  event_date: string;
  event_time?: string;
  event_end_date?: string;
  event_end_time?: string;
  event_venue?: string;
  event_address?: string;
  event_type: 'reunion' | 'networking' | 'seminar' | 'workshop' | 'other';
  registration_required: boolean;
  registration_deadline?: string;
  max_participants?: number;
  registration_fee: number;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  event_image?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  created_by: number;
  created_by_name?: string;
  registrations_count?: number;
  attended_count?: number;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: number;
  event_id: number;
  alumni_id: number;
  registration_date: string;
  payment_status: 'pending' | 'paid' | 'free';
  payment_amount: number;
  payment_date?: string;
  attendance_status: 'registered' | 'attended' | 'absent' | 'cancelled';
  attendance_marked_at?: string;
  special_requirements?: string;
  notes?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  photo?: string;
  event_title?: string;
  created_at: string;
  updated_at: string;
}

// ========== Service Object ==========

export const alumniService = {
  // ========== Alumni Records ==========
  async getAlumni(params?: {
    search?: string;
    graduation_year?: number;
    class_id?: number;
    status?: string;
  }): Promise<Alumni[]> {
    const response = await apiClient.get('/alumni/alumni', { params });
    return response.data.data;
  },

  async getAlumniById(id: number): Promise<Alumni> {
    const response = await apiClient.get(`/alumni/alumni/${id}`);
    return response.data.data;
  },

  async createAlumni(data: FormData): Promise<{ id: number }> {
    const response = await apiClient.post('/alumni/alumni', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async updateAlumni(id: number, data: FormData): Promise<void> {
    await apiClient.put(`/alumni/alumni/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async deleteAlumni(id: number): Promise<void> {
    await apiClient.delete(`/alumni/alumni/${id}`);
  },

  // ========== Alumni Events ==========
  async getAlumniEvents(params?: {
    search?: string;
    event_type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<AlumniEvent[]> {
    const response = await apiClient.get('/alumni/events', { params });
    return response.data.data;
  },

  async getAlumniEventById(id: number): Promise<AlumniEvent> {
    const response = await apiClient.get(`/alumni/events/${id}`);
    return response.data.data;
  },

  async createAlumniEvent(data: FormData): Promise<{ id: number }> {
    const response = await apiClient.post('/alumni/events', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async updateAlumniEvent(id: number, data: FormData): Promise<void> {
    await apiClient.put(`/alumni/events/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async deleteAlumniEvent(id: number): Promise<void> {
    await apiClient.delete(`/alumni/events/${id}`);
  },

  // ========== Event Registrations ==========
  async getEventRegistrations(params?: {
    event_id?: number;
    alumni_id?: number;
    attendance_status?: string;
    payment_status?: string;
  }): Promise<EventRegistration[]> {
    const response = await apiClient.get('/alumni/registrations', { params });
    return response.data.data;
  },

  async registerForEvent(data: {
    event_id: number;
    alumni_id: number;
    special_requirements?: string;
    notes?: string;
  }): Promise<{ id: number }> {
    const response = await apiClient.post('/alumni/registrations', data);
    return response.data.data;
  },

  async updateRegistration(
    id: number,
    data: {
      payment_status?: string;
      payment_amount?: number;
      payment_date?: string;
      attendance_status?: string;
      attendance_marked_at?: string;
      special_requirements?: string;
      notes?: string;
    }
  ): Promise<void> {
    await apiClient.put(`/alumni/registrations/${id}`, data);
  },

  async deleteRegistration(id: number): Promise<void> {
    await apiClient.delete(`/alumni/registrations/${id}`);
  },
};

