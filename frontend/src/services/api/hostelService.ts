import { apiClient } from './apiClient';

export interface Hostel {
  id: number;
  name: string;
  type: 'boys' | 'girls' | 'mixed';
  address?: string;
  intake: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface RoomType {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface HostelRoom {
  id: number;
  hostel_id: number;
  room_type_id: number;
  room_no: string;
  no_of_bed: number;
  cost_per_bed: number;
  description?: string;
  hostel_name?: string;
  hostel_type?: string;
  room_type_name?: string;
  created_at: string;
  updated_at: string;
}

export const hostelService = {
  // Hostels
  async getHostels(): Promise<Hostel[]> {
    const response = await apiClient.get('/hostel/hostels');
    return response.data.data || [];
  },

  async createHostel(data: Partial<Hostel>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/hostel/hostels', data);
    return response.data;
  },

  async updateHostel(id: number, data: Partial<Hostel>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/hostel/hostels/${id}`, data);
    return response.data;
  },

  async deleteHostel(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/hostel/hostels/${id}`);
    return response.data;
  },

  // Room Types
  async getRoomTypes(): Promise<RoomType[]> {
    const response = await apiClient.get('/hostel/room-types');
    return response.data.data || [];
  },

  async createRoomType(data: Partial<RoomType>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/hostel/room-types', data);
    return response.data;
  },

  async updateRoomType(id: number, data: Partial<RoomType>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/hostel/room-types/${id}`, data);
    return response.data;
  },

  async deleteRoomType(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/hostel/room-types/${id}`);
    return response.data;
  },

  // Hostel Rooms
  async getHostelRooms(params?: {
    hostel_id?: number;
    room_type_id?: number;
  }): Promise<HostelRoom[]> {
    const response = await apiClient.get('/hostel/rooms', { params });
    return response.data.data || [];
  },

  async createHostelRoom(data: Partial<HostelRoom>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/hostel/rooms', data);
    return response.data;
  },

  async updateHostelRoom(id: number, data: Partial<HostelRoom>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/hostel/rooms/${id}`, data);
    return response.data;
  },

  async deleteHostelRoom(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/hostel/rooms/${id}`);
    return response.data;
  },
};

