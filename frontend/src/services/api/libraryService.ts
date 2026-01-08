import { apiClient } from './apiClient';

export interface Book {
  id: number;
  book_title: string;
  book_no?: string;
  isbn_no?: string;
  publisher?: string;
  author?: string;
  subject_id?: number;
  subject_name?: string;
  rack_no?: string;
  qty: number;
  available_qty: number;
  book_price?: number;
  inward_date?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface LibraryMember {
  id: number;
  member_type: 'student' | 'staff';
  student_id?: number;
  staff_id?: number;
  member_code: string;
  joined_date: string;
  status: 'active' | 'inactive';
  member_name?: string;
  member_code_display?: string;
  roll_no?: string;
  class_name?: string;
  section_name?: string;
  created_at: string;
  updated_at: string;
}

export interface BookIssue {
  id: number;
  book_id: number;
  member_id: number;
  issue_date: string;
  return_date?: string;
  due_date: string;
  return_status: 'issued' | 'returned' | 'lost' | 'damaged';
  fine_amount: number;
  remarks?: string;
  issued_by?: number;
  returned_by?: number;
  book_title?: string;
  book_no?: string;
  isbn_no?: string;
  author?: string;
  member_type?: 'student' | 'staff';
  member_code?: string;
  member_name?: string;
  member_code_display?: string;
  issued_by_name?: string;
  returned_by_name?: string;
  created_at: string;
  updated_at: string;
}

export const libraryService = {
  // Books
  async getBooks(params?: {
    search?: string;
    subject_id?: number;
    available_only?: boolean;
  }): Promise<Book[]> {
    const response = await apiClient.get('/library/books', { params });
    return response.data.data;
  },

  async getBookById(id: number): Promise<Book> {
    const response = await apiClient.get(`/library/books/${id}`);
    return response.data.data;
  },

  async createBook(data: Partial<Book>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/library/books', data);
    return response.data;
  },

  async updateBook(id: number, data: Partial<Book>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/library/books/${id}`, data);
    return response.data;
  },

  async deleteBook(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/library/books/${id}`);
    return response.data;
  },

  // Library Members
  async getLibraryMembers(params?: {
    member_type?: 'student' | 'staff';
    search?: string;
  }): Promise<LibraryMember[]> {
    const response = await apiClient.get('/library/members', { params });
    return response.data.data || [];
  },

  async addStudentMember(student_id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/library/members/students', { student_id });
    return response.data;
  },

  async addStaffMember(staff_id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/library/members/staff', { staff_id });
    return response.data;
  },

  async removeLibraryMember(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/library/members/${id}`);
    return response.data;
  },

  // Book Issues
  async getBookIssues(params?: {
    member_id?: number;
    book_id?: number;
    return_status?: 'issued' | 'returned' | 'lost' | 'damaged';
    search?: string;
  }): Promise<BookIssue[]> {
    const response = await apiClient.get('/library/issues', { params });
    return response.data.data;
  },

  async issueBook(data: {
    book_id: number;
    member_id: number;
    issue_date: string;
    due_date: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/library/issues', data);
    return response.data;
  },

  async returnBook(id: number, data: {
    return_date: string;
    return_status?: 'returned' | 'lost' | 'damaged';
    fine_amount?: number;
    remarks?: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/library/issues/${id}/return`, data);
    return response.data;
  },
};

