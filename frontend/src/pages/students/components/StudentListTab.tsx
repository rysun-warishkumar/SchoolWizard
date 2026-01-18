import React, { useState, useEffect } from 'react';
import { Student } from '../../../services/api/studentsService';
import ViewStudentModal from './ViewStudentModal';
import EditStudentModal from './EditStudentModal';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

interface StudentListTabProps {
  students: Student[];
  classes: any[];
  sections: any[];
  pagination?: PaginationInfo;
  classFilter: string;
  sectionFilter: string;
  searchTerm: string;
  onClassFilterChange: (value: string) => void;
  onSectionFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onPageChange: (value: number) => void;
  onDelete: (id: number) => void;
  isLoading: boolean;
  error?: any;
  isError?: boolean;
}

const StudentListTab: React.FC<StudentListTabProps> = ({
  students,
  classes,
  sections,
  pagination,
  classFilter,
  sectionFilter,
  searchTerm,
  onClassFilterChange,
  onSectionFilterChange,
  onSearchChange,
  onPageChange,
  onDelete,
  isLoading,
  error,
  isError,
}) => {
  const [viewStudentId, setViewStudentId] = useState<number | null>(null);
  const [editStudentId, setEditStudentId] = useState<number | null>(null);
  const [pageInput, setPageInput] = useState<string>('');
  const [pageInputError, setPageInputError] = useState<string>('');

  // Update page input when pagination changes
  useEffect(() => {
    if (pagination?.page) {
      setPageInput(String(pagination.page));
      setPageInputError('');
    }
  }, [pagination?.page]);

  // Validate and handle page input
  const handlePageInputChange = (value: string) => {
    setPageInput(value);
    setPageInputError('');
    
    if (value.trim() === '') {
      return;
    }

    const pageNum = parseInt(value, 10);
    
    if (isNaN(pageNum)) {
      setPageInputError('Please enter a valid number');
      return;
    }

    if (pageNum < 1) {
      setPageInputError('Page number must be at least 1');
      return;
    }

    if (pagination && pageNum > pagination.pages) {
      setPageInputError(`Maximum page is ${pagination.pages}`);
      return;
    }
  };

  const handlePageInputBlur = () => {
    if (pageInput.trim() === '') {
      setPageInput(pagination?.page ? String(pagination.page) : '1');
      return;
    }

    const pageNum = parseInt(pageInput, 10);
    
    if (isNaN(pageNum) || pageNum < 1) {
      setPageInput(pagination?.page ? String(pagination.page) : '1');
      setPageInputError('');
      return;
    }

    if (pagination && pageNum > pagination.pages) {
      setPageInput(String(pagination.pages));
      onPageChange(pagination.pages);
      setPageInputError('');
      return;
    }

    if (pageNum !== pagination?.page) {
      onPageChange(pageNum);
    }
    setPageInputError('');
  };

  const handlePageInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  // Generate page numbers to display
  const getPageNumbers = (): (number | string)[] => {
    if (!pagination || pagination.pages <= 1) return [];
    
    const currentPage = pagination.page;
    const totalPages = pagination.pages;
    const pages: (number | string)[] = [];
    
    // For small number of pages, show all
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }
    
    // Always show first page
    if (currentPage > 3) {
      pages.push(1);
      if (currentPage > 4) pages.push('...'); // Ellipsis
    }
    
    // Show pages around current page
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Always show last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) pages.push('...'); // Ellipsis
      pages.push(totalPages);
    }
    
    return pages;
  };

  // Scroll to top when page changes (handled in parent component, but keep as backup)
  useEffect(() => {
    if (pagination?.page) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }, [pagination?.page]);

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= (pagination?.pages || 1)) {
      onPageChange(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFirstPage = () => {
    if (pagination && pagination.page > 1) {
      onPageChange(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLastPage = () => {
    if (pagination && pagination.pages > 0) {
      onPageChange(pagination.pages);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousPage = () => {
    if (pagination && pagination.page > 1) {
      onPageChange(Math.max(1, pagination.page - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (pagination && pagination.page < pagination.pages) {
      onPageChange(Math.min(pagination.pages, pagination.page + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="tab-content">
      <div className="filters">
        <input
          type="text"
          placeholder="Search students by name or admission number..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
          maxLength={100}
        />
        <select
          value={classFilter}
          onChange={(e) => onClassFilterChange(e.target.value)}
          className="filter-select"
        >
          <option value="">All Classes</option>
          {classes.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={sectionFilter}
          onChange={(e) => onSectionFilterChange(e.target.value)}
          className="filter-select"
        >
          <option value="">All Sections</option>
          {sections.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="loading">Loading students...</div>
      ) : isError ? (
        <div className="error-message" style={{ padding: '20px', textAlign: 'center', color: '#d32f2f' }}>
          <h3>Error Loading Students</h3>
          <p>{error?.response?.data?.message || error?.message || 'An unexpected error occurred. Please try again.'}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      ) : (
        <>
          {students.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ fontSize: '16px', color: '#666' }}>No students found.</p>
              {(classFilter || sectionFilter || searchTerm) && (
                <p style={{ fontSize: '14px', color: '#999', marginTop: '10px' }}>
                  Try adjusting your filters or search criteria.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Admission No</th>
                      <th>Name</th>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Gender</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student: Student) => (
                      <tr key={student.id}>
                        <td>{student.admission_no}</td>
                        <td>{student.first_name} {student.last_name || ''}</td>
                        <td>{student.class_name || '-'}</td>
                        <td>{student.section_name || '-'}</td>
                        <td className="capitalize">{student.gender}</td>
                        <td>
                          <span className={`status-badge ${student.is_active ? 'active' : 'inactive'}`}>
                            {student.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button onClick={() => setViewStudentId(student.id)} className="btn-view">View</button>
                            <button onClick={() => setEditStudentId(student.id)} className="btn-edit">Edit</button>
                            <button onClick={() => onDelete(student.id)} className="btn-delete">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Enhanced Pagination */}
              {pagination && pagination.total > 0 && (
                <div className="pagination" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginTop: '20px',
                  padding: '15px',
                  borderTop: '1px solid #e0e0e0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} {pagination.total === 1 ? 'student' : 'students'}
                    </span>
                  </div>

                  {/* Show pagination controls when total > limit (more than 20 students) */}
                  {pagination.total > pagination.limit && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {/* First Page Button */}
                      <button
                        onClick={handleFirstPage}
                        disabled={!pagination.hasPreviousPage}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: pagination.hasPreviousPage ? '#fff' : '#f5f5f5',
                          cursor: pagination.hasPreviousPage ? 'pointer' : 'not-allowed',
                          opacity: pagination.hasPreviousPage ? 1 : 0.5
                        }}
                        title="First page"
                      >
                        ««
                      </button>

                      {/* Previous Button */}
                      <button
                        onClick={handlePreviousPage}
                        disabled={!pagination.hasPreviousPage}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: pagination.hasPreviousPage ? '#fff' : '#f5f5f5',
                          cursor: pagination.hasPreviousPage ? 'pointer' : 'not-allowed',
                          opacity: pagination.hasPreviousPage ? 1 : 0.5
                        }}
                        title="Previous page"
                      >
                        « Previous
                      </button>

                      {/* Page Numbers */}
                      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                        {getPageNumbers().map((pageNum, index) => (
                          pageNum === '...' ? (
                            <span key={`ellipsis-${index}`} style={{ padding: '0 8px', color: '#666' }}>...</span>
                          ) : (
                            <button
                              key={pageNum}
                              onClick={() => handlePageClick(Number(pageNum))}
                              disabled={pageNum === pagination.page}
                              style={{
                                padding: '6px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: pageNum === pagination.page ? '#007bff' : '#fff',
                                color: pageNum === pagination.page ? '#fff' : '#333',
                                cursor: pageNum === pagination.page ? 'default' : 'pointer',
                                fontWeight: pageNum === pagination.page ? 'bold' : 'normal',
                                minWidth: '40px'
                              }}
                            >
                              {pageNum}
                            </button>
                          )
                        ))}
                      </div>

                      {/* Page Input */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '10px' }}>
                        <span style={{ fontSize: '14px', color: '#666' }}>Go to:</span>
                        <input
                          type="text"
                          value={pageInput}
                          onChange={(e) => handlePageInputChange(e.target.value)}
                          onBlur={handlePageInputBlur}
                          onKeyPress={handlePageInputKeyPress}
                          style={{
                            width: '50px',
                            padding: '4px 8px',
                            border: pageInputError ? '1px solid #d32f2f' : '1px solid #ddd',
                            borderRadius: '4px',
                            textAlign: 'center'
                          }}
                          title="Enter page number"
                        />
                        {pageInputError && (
                          <span style={{ fontSize: '12px', color: '#d32f2f', marginLeft: '5px' }}>
                            {pageInputError}
                          </span>
                        )}
                      </div>

                      {/* Next Button */}
                      <button
                        onClick={handleNextPage}
                        disabled={!pagination.hasNextPage}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: pagination.hasNextPage ? '#fff' : '#f5f5f5',
                          cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed',
                          opacity: pagination.hasNextPage ? 1 : 0.5
                        }}
                        title="Next page"
                      >
                        Next »
                      </button>

                      {/* Last Page Button */}
                      <button
                        onClick={handleLastPage}
                        disabled={!pagination.hasNextPage}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: pagination.hasNextPage ? '#fff' : '#f5f5f5',
                          cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed',
                          opacity: pagination.hasNextPage ? 1 : 0.5
                        }}
                        title="Last page"
                      >
                        »»
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {viewStudentId && (
        <ViewStudentModal
          studentId={viewStudentId}
          onClose={() => setViewStudentId(null)}
        />
      )}

      {editStudentId && (
        <EditStudentModal
          studentId={editStudentId}
          classes={classes}
          sections={sections}
          onClose={() => setEditStudentId(null)}
        />
      )}
    </div>
  );
};

export default StudentListTab;
