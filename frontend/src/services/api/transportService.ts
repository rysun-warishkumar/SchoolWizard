import { apiClient } from './apiClient';

export interface Route {
  id: number;
  title: string;
  fare: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: number;
  vehicle_no: string;
  vehicle_model?: string;
  year_made?: number;
  driver_name?: string;
  driver_license?: string;
  driver_contact?: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleAssignment {
  id: number;
  route_id: number;
  vehicle_id: number;
  route_title?: string;
  route_fare?: number;
  vehicle_no?: string;
  vehicle_model?: string;
  driver_name?: string;
  created_at: string;
  updated_at: string;
}

export const transportService = {
  // Routes
  async getRoutes(): Promise<Route[]> {
    const response = await apiClient.get('/transport/routes');
    return response.data.data || [];
  },

  async createRoute(data: Partial<Route>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/transport/routes', data);
    return response.data;
  },

  async updateRoute(id: number, data: Partial<Route>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/transport/routes/${id}`, data);
    return response.data;
  },

  async deleteRoute(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/transport/routes/${id}`);
    return response.data;
  },

  // Vehicles
  async getVehicles(): Promise<Vehicle[]> {
    const response = await apiClient.get('/transport/vehicles');
    return response.data.data || [];
  },

  async createVehicle(data: Partial<Vehicle>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/transport/vehicles', data);
    return response.data;
  },

  async updateVehicle(id: number, data: Partial<Vehicle>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/transport/vehicles/${id}`, data);
    return response.data;
  },

  async deleteVehicle(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/transport/vehicles/${id}`);
    return response.data;
  },

  // Vehicle Assignments
  async getVehicleAssignments(params?: {
    route_id?: number;
    vehicle_id?: number;
  }): Promise<VehicleAssignment[]> {
    const response = await apiClient.get('/transport/assignments', { params });
    return response.data.data || [];
  },

  async createVehicleAssignment(data: { route_id: number; vehicle_id: number }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/transport/assignments', data);
    return response.data;
  },

  async deleteVehicleAssignment(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/transport/assignments/${id}`);
    return response.data;
  },
};

