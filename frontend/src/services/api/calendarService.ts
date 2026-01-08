import { apiClient } from './apiClient';

export interface CalendarEvent {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  event_date: string;
  event_color: string;
  event_type: 'public' | 'private' | 'role' | 'protected';
  role_name?: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}

export interface TodoTask {
  id: number;
  user_id: number;
  title: string;
  task_date: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export const calendarService = {
  // Calendar Events
  async getCalendarEvents(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<CalendarEvent[]> {
    const response = await apiClient.get('/calendar/events', { params });
    return response.data.data || [];
  },

  async getCalendarEventById(id: number): Promise<CalendarEvent> {
    const response = await apiClient.get(`/calendar/events/${id}`);
    return response.data.data;
  },

  async createCalendarEvent(data: Partial<CalendarEvent>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/calendar/events', data);
    return response.data;
  },

  async updateCalendarEvent(id: number, data: Partial<CalendarEvent>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/calendar/events/${id}`, data);
    return response.data;
  },

  async deleteCalendarEvent(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/calendar/events/${id}`);
    return response.data;
  },

  // Todo Tasks
  async getTodoTasks(params?: {
    start_date?: string;
    end_date?: string;
    is_completed?: boolean;
  }): Promise<TodoTask[]> {
    const response = await apiClient.get('/calendar/tasks', { params });
    return response.data.data || [];
  },

  async getTodoTaskById(id: number): Promise<TodoTask> {
    const response = await apiClient.get(`/calendar/tasks/${id}`);
    return response.data.data;
  },

  async createTodoTask(data: Partial<TodoTask>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/calendar/tasks', data);
    return response.data;
  },

  async updateTodoTask(id: number, data: Partial<TodoTask>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/calendar/tasks/${id}`, data);
    return response.data;
  },

  async deleteTodoTask(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/calendar/tasks/${id}`);
    return response.data;
  },
};

