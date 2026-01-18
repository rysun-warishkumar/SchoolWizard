import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { hrService, Staff, Department, Designation, LeaveType } from '../../services/api/hrService';
import { rolesService } from '../../services/api/rolesService';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/common/Modal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import Pagination from '../../components/common/Pagination';
import ImportStaffModal from './components/ImportStaffModal';
import './HR.css';

type TabType = 'staff' | 'add-staff' | 'departments' | 'designations' | 'leave-types' | 'staff-attendance' | 'attendance-report' | 'apply-leave' | 'approve-leave' | 'disabled-staff' | 'payroll' | 'teachers-rating';

const HR = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType;
  const validTabs: TabType[] = ['staff', 'add-staff', 'departments', 'designations', 'leave-types', 'staff-attendance', 'attendance-report', 'apply-leave', 'approve-leave', 'disabled-staff', 'payroll', 'teachers-rating'];
  const defaultTab: TabType = validTabs.includes(tabFromUrl) ? tabFromUrl : 'staff';
  
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20); // Fixed limit to match students (20 per page)
  const [showImportModal, setShowImportModal] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {},
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: staffData, isLoading, error: staffError } = useQuery(
    ['staff', page, roleFilter, departmentFilter, searchTerm],
    () => hrService.getStaff({
      page,
      limit,
      role_id: roleFilter ? Number(roleFilter) : undefined,
      department_id: departmentFilter ? Number(departmentFilter) : undefined,
      search: searchTerm || undefined,
    }),
    {
      retry: 1,
      onError: (err: any) => {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load staff list';
        showToast(errorMessage, 'error');
      },
    }
  );

  const { data: departmentsData } = useQuery('departments', () => hrService.getDepartments());
  const { data: designationsData } = useQuery('designations', () => hrService.getDesignations());
  const { data: leaveTypesData } = useQuery('leave-types', () => hrService.getLeaveTypes());

  const deleteMutation = useMutation(hrService.deleteStaff, {
    onSuccess: () => {
      queryClient.invalidateQueries('staff');
      showToast('Staff member deleted successfully', 'success');
      setConfirmationModal({ ...confirmationModal, isOpen: false });
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to delete staff member', 'error');
      setConfirmationModal({ ...confirmationModal, isOpen: false });
    },
  });

  const disableMutation = useMutation(hrService.disableStaff, {
    onSuccess: () => {
      queryClient.invalidateQueries('staff');
      showToast('Staff member disabled successfully', 'success');
      setConfirmationModal({ ...confirmationModal, isOpen: false });
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to disable staff member', 'error');
      setConfirmationModal({ ...confirmationModal, isOpen: false });
    },
  });

  const enableMutation = useMutation(hrService.enableStaff, {
    onSuccess: () => {
      queryClient.invalidateQueries('staff');
      showToast('Staff member enabled successfully', 'success');
      setConfirmationModal({ ...confirmationModal, isOpen: false });
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to enable staff member', 'error');
      setConfirmationModal({ ...confirmationModal, isOpen: false });
    },
  });

  const handleDelete = (id: number) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Staff Member',
      message: 'Are you sure you want to permanently delete this staff member? This action cannot be undone.',
      type: 'danger',
      onConfirm: () => {
        deleteMutation.mutate(String(id));
      },
    });
  };

  const handleDisable = (id: number) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Disable Staff Member',
      message: 'Are you sure you want to disable this staff member? They will not be able to access the system until re-enabled.',
      type: 'warning',
      onConfirm: () => {
        disableMutation.mutate(String(id));
      },
    });
  };

  const handleEnable = (id: number) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Enable Staff Member',
      message: 'Are you sure you want to enable this staff member? They will regain access to the system.',
      type: 'success',
      onConfirm: () => {
        enableMutation.mutate(String(id));
      },
    });
  };

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    // Scroll to active tab after a short delay to ensure it's rendered
    setTimeout(() => {
      scrollToActiveTab();
    }, 100);
  };

  // Scroll to active tab
  const scrollToActiveTab = () => {
    if (activeTabRef.current && tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const tab = activeTabRef.current;
      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      
      const scrollLeft = container.scrollLeft;
      const tabLeft = tabRect.left - containerRect.left + scrollLeft;
      const tabWidth = tabRect.width;
      const containerWidth = containerRect.width;
      
      // Calculate scroll position to center the tab
      const targetScroll = tabLeft - (containerWidth / 2) + (tabWidth / 2);
      
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  // Check if arrows should be visible
  const checkArrows = () => {
    if (tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      // Only show arrows if tabs overflow the container width
      const hasOverflow = container.scrollWidth > container.clientWidth;
      
      if (hasOverflow) {
        const hasLeftScroll = container.scrollLeft > 5; // Small threshold to avoid flickering
        const hasRightScroll = container.scrollLeft < (container.scrollWidth - container.clientWidth - 5);
        setShowLeftArrow(hasLeftScroll);
        setShowRightArrow(hasRightScroll);
      } else {
        // Hide arrows if no overflow
        setShowLeftArrow(false);
        setShowRightArrow(false);
      }
    }
  };

  // Scroll tabs left/right
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const scrollAmount = 250;
      const currentScroll = container.scrollLeft;
      const newScrollLeft = direction === 'left' 
        ? Math.max(0, currentScroll - scrollAmount)
        : Math.min(container.scrollWidth - container.clientWidth, currentScroll + scrollAmount);
      
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
      
      // Update arrow visibility after scroll
      setTimeout(() => {
        checkArrows();
      }, 300);
    }
  };

  // Initialize tab from URL and check arrows
  useEffect(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
    checkArrows();
    scrollToActiveTab();
  }, []);

  // Check arrows on scroll and window resize
  useEffect(() => {
    const container = tabsContainerRef.current;
    if (container) {
      // Initial check
      checkArrows();
      
      // Listen to scroll events
      container.addEventListener('scroll', checkArrows);
      window.addEventListener('resize', checkArrows);
      
      // Use ResizeObserver to detect container size changes
      const resizeObserver = new ResizeObserver(() => {
        checkArrows();
      });
      resizeObserver.observe(container);
      
      return () => {
        container.removeEventListener('scroll', checkArrows);
        window.removeEventListener('resize', checkArrows);
        resizeObserver.disconnect();
      };
    }
  }, []);

  // Scroll to active tab when it changes
  useEffect(() => {
    scrollToActiveTab();
  }, [activeTab]);

  return (
    <div className="hr-page">
      <div className="page-header">
        <h1>Human Resource</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={() => setShowImportModal(true)}>
            📥 Import Staff
          </button>
          <button className="btn-primary" onClick={() => handleTabChange('add-staff')}>
            + Add Staff
          </button>
        </div>
      </div>

      <div className="hr-tabs-wrapper">
        <div className="hr-tabs-container">
        {showLeftArrow && (
          <button
            className="hr-tabs-arrow hr-tabs-arrow-left"
            onClick={() => scrollTabs('left')}
            aria-label="Scroll tabs left"
          >
            ‹
          </button>
        )}
        <div className="hr-tabs" ref={tabsContainerRef}>
          <button
            ref={activeTab === 'staff' ? activeTabRef : null}
            className={activeTab === 'staff' ? 'active' : ''}
            onClick={() => handleTabChange('staff')}
          >
            Staff Directory
          </button>
          <button
            ref={activeTab === 'add-staff' ? activeTabRef : null}
            className={activeTab === 'add-staff' ? 'active' : ''}
            onClick={() => handleTabChange('add-staff')}
          >
            Add Staff
          </button>
          <button
            ref={activeTab === 'departments' ? activeTabRef : null}
            className={activeTab === 'departments' ? 'active' : ''}
            onClick={() => handleTabChange('departments')}
          >
            Departments
          </button>
          <button
            ref={activeTab === 'designations' ? activeTabRef : null}
            className={activeTab === 'designations' ? 'active' : ''}
            onClick={() => handleTabChange('designations')}
          >
            Designations
          </button>
          <button
            ref={activeTab === 'leave-types' ? activeTabRef : null}
            className={activeTab === 'leave-types' ? 'active' : ''}
            onClick={() => handleTabChange('leave-types')}
          >
            Leave Types
          </button>
          <button
            ref={activeTab === 'staff-attendance' ? activeTabRef : null}
            className={activeTab === 'staff-attendance' ? 'active' : ''}
            onClick={() => handleTabChange('staff-attendance')}
          >
            Staff Attendance
          </button>
          <button
            ref={activeTab === 'attendance-report' ? activeTabRef : null}
            className={activeTab === 'attendance-report' ? 'active' : ''}
            onClick={() => handleTabChange('attendance-report')}
          >
            Attendance Report
          </button>
          <button
            ref={activeTab === 'apply-leave' ? activeTabRef : null}
            className={activeTab === 'apply-leave' ? 'active' : ''}
            onClick={() => handleTabChange('apply-leave')}
          >
            Apply Leave
          </button>
          <button
            ref={activeTab === 'approve-leave' ? activeTabRef : null}
            className={activeTab === 'approve-leave' ? 'active' : ''}
            onClick={() => handleTabChange('approve-leave')}
          >
            Approve Leave
          </button>
          <button
            ref={activeTab === 'disabled-staff' ? activeTabRef : null}
            className={activeTab === 'disabled-staff' ? 'active' : ''}
            onClick={() => handleTabChange('disabled-staff')}
          >
            Disabled Staff
          </button>
          <button
            ref={activeTab === 'payroll' ? activeTabRef : null}
            className={activeTab === 'payroll' ? 'active' : ''}
            onClick={() => handleTabChange('payroll')}
          >
            Payroll
          </button>
          <button
            ref={activeTab === 'teachers-rating' ? activeTabRef : null}
            className={activeTab === 'teachers-rating' ? 'active' : ''}
            onClick={() => handleTabChange('teachers-rating')}
          >
            Teachers Rating
          </button>
        </div>
        {showRightArrow && (
          <button
            className="hr-tabs-arrow hr-tabs-arrow-right"
            onClick={() => scrollTabs('right')}
            aria-label="Scroll tabs right"
          >
            ›
          </button>
        )}
        </div>
      </div>

      <div className="hr-content">
        {activeTab === 'staff' && (
          <StaffDirectoryTab
            staff={staffData?.data || []}
            departments={departmentsData?.data || []}
            pagination={staffData?.pagination}
            roleFilter={roleFilter}
            departmentFilter={departmentFilter}
            searchTerm={searchTerm}
            onRoleFilterChange={(value: string) => {
              setRoleFilter(value);
              setPage(1); // Reset to first page when filter changes
            }}
            onDepartmentFilterChange={(value: string) => {
              setDepartmentFilter(value);
              setPage(1); // Reset to first page when filter changes
            }}
            onSearchChange={(value: string) => {
              setSearchTerm(value);
              setPage(1); // Reset to first page when search changes
            }}
            onPageChange={(newPage: number) => {
              // Validate page number
              if (staffData?.pagination) {
                const validPage = Math.max(1, Math.min(newPage, staffData.pagination.pages || 1));
                setPage(validPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                setPage(newPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            onDelete={handleDelete}
            onDisable={handleDisable}
            onEnable={handleEnable}
            isDisabling={disableMutation.isLoading}
            isEnabling={enableMutation.isLoading}
            isLoading={isLoading}
            error={staffError}
          />
        )}

        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
          onConfirm={confirmationModal.onConfirm}
          title={confirmationModal.title}
          message={confirmationModal.message}
          type={confirmationModal.type}
          isLoading={deleteMutation.isLoading || disableMutation.isLoading || enableMutation.isLoading}
          confirmText={confirmationModal.type === 'danger' ? 'Delete' : confirmationModal.type === 'success' ? 'Enable' : 'Disable'}
        />
        {activeTab === 'add-staff' && (
          <AddStaffTab
            departments={departmentsData?.data || []}
            designations={designationsData?.data || []}
          />
        )}
        {activeTab === 'departments' && (
          <DepartmentsTab />
        )}
        {activeTab === 'designations' && (
          <DesignationsTab />
        )}
        {activeTab === 'leave-types' && (
          <LeaveTypesTab />
        )}
        {activeTab === 'staff-attendance' && (
          <StaffAttendanceTab />
        )}
        {activeTab === 'attendance-report' && (
          <StaffAttendanceReportTab />
        )}
        {activeTab === 'apply-leave' && (
          <ApplyLeaveTab />
        )}
        {activeTab === 'approve-leave' && (
          <ApproveLeaveTab />
        )}
        {activeTab === 'disabled-staff' && (
          <DisabledStaffTab />
        )}
        {activeTab === 'payroll' && (
          <PayrollTab />
        )}
        {activeTab === 'teachers-rating' && (
          <TeachersRatingTab />
        )}
      </div>

      {/* Import Staff Modal */}
      <ImportStaffModal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
        }}
        onImportSuccess={() => {
          queryClient.invalidateQueries('staff');
          setShowImportModal(false);
        }}
      />
    </div>
  );
};

// Staff Directory Tab
const StaffDirectoryTab = ({
  staff,
  departments,
  pagination,
  roleFilter,
  departmentFilter,
  searchTerm,
  onRoleFilterChange,
  onDepartmentFilterChange,
  onSearchChange,
  onPageChange,
  onDelete,
  onDisable,
  onEnable,
  isDisabling,
  isEnabling,
  isLoading,
  error,
}: any) => {
  const [viewStaffId, setViewStaffId] = useState<number | null>(null);
  const [editStaffId, setEditStaffId] = useState<number | null>(null);
  const [pageInput, setPageInput] = useState<string>('');
  const [pageInputError, setPageInputError] = useState<string>('');
  
  const { data: designationsData } = useQuery('designations', () => hrService.getDesignations());

  // Keep page input in sync with pagination page
  useEffect(() => {
    if (pagination?.page) {
      setPageInput(String(pagination.page));
      setPageInputError('');
    }
  }, [pagination?.page]);

  // Scroll to top when page changes
  useEffect(() => {
    if (pagination?.page) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pagination?.page]);

  // Handle error state
  if (error) {
    const errorMessage = (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to load staff list';
    return (
      <div className="tab-content">
        <div className="error-message" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
          <p style={{ color: 'var(--danger-color)', marginBottom: 'var(--spacing-md)' }}>
            {errorMessage}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="filters">
        <input
          type="text"
          placeholder="Search staff by name, ID, or email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
          maxLength={100}
        />
        <select
          value={departmentFilter}
          onChange={(e) => onDepartmentFilterChange(e.target.value)}
          className="filter-select"
        >
          <option value="">All Departments</option>
          {departments.map((d: Department) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="loading">Loading staff...</div>
      ) : (
        <>
          {/* Empty state */}
          {!isLoading && staff.length === 0 && (
            <div className="empty-state" style={{ 
              padding: 'var(--spacing-2xl)', 
              textAlign: 'center',
              color: 'var(--gray-500)'
            }}>
              <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-sm)' }}>
                No staff members found
              </p>
              <p style={{ fontSize: 'var(--font-size-sm)' }}>
                {searchTerm || departmentFilter || roleFilter
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding a new staff member'}
              </p>
            </div>
          )}

          {/* Staff table */}
          {staff.length > 0 && (
            <div className="table-responsive-container">
              <table>
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member: Staff) => (
                    <tr key={member.id}>
                      <td>{member.staff_id}</td>
                      <td>{member.first_name} {member.last_name || ''}</td>
                      <td>{member.role_name || '-'}</td>
                      <td>{member.department_name || '-'}</td>
                      <td>{member.designation_name || '-'}</td>
                      <td>{member.phone || '-'}</td>
                      <td>
                        <span className={`status-badge ${member.is_active ? 'active' : 'inactive'}`}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button onClick={() => setViewStaffId(member.id)} className="btn-view">View</button>
                          <button onClick={() => setEditStaffId(member.id)} className="btn-edit">Edit</button>
                          {member.is_active ? (
                            <button 
                              onClick={() => onDisable(member.id)} 
                              className="btn-warning"
                              disabled={isDisabling}
                              title="Disable staff member"
                            >
                              {isDisabling ? 'Disabling...' : 'Disable'}
                            </button>
                          ) : (
                            <button 
                              onClick={() => onEnable(member.id)} 
                              className="btn-success"
                              disabled={isEnabling}
                              title="Enable staff member"
                            >
                              {isEnabling ? 'Enabling...' : 'Enable'}
                            </button>
                          )}
                          <button 
                            onClick={() => onDelete(member.id)} 
                            className="btn-delete"
                            disabled={member.is_active}
                            title={member.is_active ? 'Disable staff member first before deleting' : 'Delete staff member'}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Enhanced Pagination - Matching Student List Style */}
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
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} {pagination.total === 1 ? 'staff member' : 'staff members'}
                </span>
              </div>

              {/* Show pagination controls when total > limit (more than 20 staff) */}
              {pagination.total > pagination.limit && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {/* First Page Button */}
                  <button
                    onClick={() => {
                      onPageChange(1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
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
                    onClick={() => {
                      onPageChange(pagination.page - 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
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
                    {(() => {
                      const pages: (number | string)[] = [];
                      const currentPage = pagination.page;
                      const totalPages = pagination.pages;
                      
                      if (totalPages <= 1) return null;

                      // For small number of pages, show all
                      if (totalPages <= 7) {
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
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
                      }

                      return pages.map((pageNum, index) => (
                        pageNum === '...' ? (
                          <span key={`ellipsis-${index}`} style={{ padding: '0 8px', color: '#666' }}>...</span>
                        ) : (
                          <button
                            key={pageNum}
                            onClick={() => {
                              onPageChange(Number(pageNum));
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
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
                      ));
                    })()}
                  </div>

                  {/* Page Input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '10px' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>Go to:</span>
                    <input
                      type="text"
                      value={pageInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPageInput(value);
                        setPageInputError('');

                        if (value.trim() === '') return;

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
                      }}
                      onBlur={() => {
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
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          setPageInputError('');
                          return;
                        }

                        if (pageNum !== pagination?.page) {
                          onPageChange(pageNum);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                        setPageInputError('');
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
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
                    onClick={() => {
                      onPageChange(pagination.page + 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
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
                    onClick={() => {
                      onPageChange(pagination.pages);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
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

      {viewStaffId && (
        <ViewStaffModal
          staffId={viewStaffId}
          onClose={() => setViewStaffId(null)}
        />
      )}

      {editStaffId && (
        <EditStaffModal
          staffId={editStaffId}
          departments={departments}
          designations={designationsData?.data || []}
          onClose={() => setEditStaffId(null)}
        />
      )}
    </div>
  );
};

// View Staff Modal
const ViewStaffModal = ({ staffId, onClose }: { staffId: number; onClose: () => void }) => {
  const { data: staffData, isLoading } = useQuery(
    ['staff', staffId],
    () => hrService.getStaffById(String(staffId)),
    { enabled: !!staffId }
  );

  const staff = staffData?.data;

  return (
    <Modal isOpen={true} onClose={onClose} title="Staff Details" size="large">
      {isLoading ? (
        <div className="loading">Loading staff details...</div>
      ) : staff ? (
        <div className="staff-view-form">
          <div className="staff-view-header">
            <div className="staff-photo-container">
              {staff.photo ? (
                <img src={staff.photo} alt={staff.first_name} className="staff-photo" />
              ) : (
                <div className="staff-photo-placeholder">
                  {staff.first_name?.charAt(0).toUpperCase() || 'S'}
                  {staff.last_name?.charAt(0).toUpperCase() || ''}
                </div>
              )}
            </div>
            <div className="staff-header-info">
              <h3>{staff.first_name} {staff.last_name || ''}</h3>
              <p className="staff-id">Staff ID: {staff.staff_id}</p>
              <span className={`status-badge ${staff.is_active ? 'active' : 'inactive'}`}>
                {staff.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="staff-view-form-sections">
            <div className="form-section">
              <h4>Basic Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <div className="form-value">{staff.first_name || '-'}</div>
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <div className="form-value">{staff.last_name || '-'}</div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Role</label>
                  <div className="form-value">{staff.role_name || '-'}</div>
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <div className="form-value">{staff.department_name || '-'}</div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Designation</label>
                  <div className="form-value">{staff.designation_name || '-'}</div>
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <div className="form-value capitalize">{staff.gender || '-'}</div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth</label>
                  <div className="form-value">{staff.date_of_birth ? new Date(staff.date_of_birth).toLocaleDateString() : '-'}</div>
                </div>
                <div className="form-group">
                  <label>Date of Joining</label>
                  <div className="form-value">{staff.date_of_joining ? new Date(staff.date_of_joining).toLocaleDateString() : '-'}</div>
                </div>
              </div>
              {staff.marital_status && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Marital Status</label>
                    <div className="form-value capitalize">{staff.marital_status}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-section">
              <h4>Contact Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <div className="form-value">{staff.phone || '-'}</div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <div className="form-value">{staff.email || '-'}</div>
                </div>
              </div>
              {staff.emergency_contact && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Emergency Contact</label>
                    <div className="form-value">{staff.emergency_contact}</div>
                  </div>
                </div>
              )}
            </div>

            {(staff.father_name || staff.mother_name) && (
              <div className="form-section">
                <h4>Family Information</h4>
                {staff.father_name && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Father's Name</label>
                      <div className="form-value">{staff.father_name}</div>
                    </div>
                  </div>
                )}
                {staff.mother_name && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Mother's Name</label>
                      <div className="form-value">{staff.mother_name}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(staff.current_address || staff.permanent_address) && (
              <div className="form-section">
                <h4>Address Information</h4>
                {staff.current_address && (
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Current Address</label>
                      <div className="form-value">{staff.current_address}</div>
                    </div>
                  </div>
                )}
                {staff.permanent_address && (
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Permanent Address</label>
                      <div className="form-value">{staff.permanent_address}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(staff.qualification || staff.work_experience) && (
              <div className="form-section">
                <h4>Professional Information</h4>
                {staff.qualification && (
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Qualification</label>
                      <div className="form-value">{staff.qualification}</div>
                    </div>
                  </div>
                )}
                {staff.work_experience && (
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Work Experience</label>
                      <div className="form-value">{staff.work_experience}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(staff.contract_type || staff.work_shift || staff.location || staff.basic_salary) && (
              <div className="form-section">
                <h4>Employment Details</h4>
                <div className="form-row">
                  {staff.contract_type && (
                    <div className="form-group">
                      <label>Contract Type</label>
                      <div className="form-value capitalize">{staff.contract_type}</div>
                    </div>
                  )}
                  {staff.work_shift && (
                    <div className="form-group">
                      <label>Work Shift</label>
                      <div className="form-value capitalize">{staff.work_shift}</div>
                    </div>
                  )}
                </div>
                <div className="form-row">
                  {staff.location && (
                    <div className="form-group">
                      <label>Location</label>
                      <div className="form-value">{staff.location}</div>
                    </div>
                  )}
                  {staff.basic_salary && (
                    <div className="form-group">
                      <label>Basic Salary</label>
                      <div className="form-value">₹{staff.basic_salary.toLocaleString()}</div>
                    </div>
                  )}
                </div>
                {staff.number_of_leaves !== undefined && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Number of Leaves</label>
                      <div className="form-value">{staff.number_of_leaves}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(staff.bank_account_number || staff.bank_name || staff.ifsc_code) && (
              <div className="form-section">
                <h4>Bank Information</h4>
                <div className="form-row">
                  {staff.bank_account_title && (
                    <div className="form-group">
                      <label>Account Title</label>
                      <div className="form-value">{staff.bank_account_title}</div>
                    </div>
                  )}
                  {staff.bank_account_number && (
                    <div className="form-group">
                      <label>Account Number</label>
                      <div className="form-value">{staff.bank_account_number}</div>
                    </div>
                  )}
                </div>
                <div className="form-row">
                  {staff.bank_name && (
                    <div className="form-group">
                      <label>Bank Name</label>
                      <div className="form-value">{staff.bank_name}</div>
                    </div>
                  )}
                  {staff.ifsc_code && (
                    <div className="form-group">
                      <label>IFSC Code</label>
                      <div className="form-value">{staff.ifsc_code}</div>
                    </div>
                  )}
                </div>
                {staff.bank_branch_name && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Branch Name</label>
                      <div className="form-value">{staff.bank_branch_name}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {staff.note && (
              <div className="form-section">
                <h4>Additional Notes</h4>
                <div className="form-row">
                  <div className="form-group full-width">
                    <div className="form-value">{staff.note}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="error-message">Staff member not found</div>
      )}
    </Modal>
  );
};

// Edit Staff Modal
const EditStaffModal = ({ staffId, departments, designations, onClose }: { staffId: number; departments: Department[]; designations: Designation[]; onClose: () => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const toDateInputValue = (value?: string | null) => {
    if (!value) return '';
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
      return '';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().split('T')[0];
  };

  const { data: staffData, isLoading } = useQuery(
    ['staff', staffId],
    () => hrService.getStaffById(String(staffId)),
    { enabled: !!staffId }
  );

  const { data: rolesData } = useQuery('roles', () => rolesService.getRoles());

  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (staffData?.data) {
      const staff = staffData.data;
      setFormData({
        staff_id: staff.staff_id || '',
        role_id: String(staff.role_id || ''),
        designation_id: staff.designation_id ? String(staff.designation_id) : '',
        department_id: staff.department_id ? String(staff.department_id) : '',
        first_name: staff.first_name || '',
        last_name: staff.last_name || '',
        father_name: staff.father_name || '',
        mother_name: staff.mother_name || '',
        gender: staff.gender || 'male',
        marital_status: staff.marital_status || 'single',
        date_of_birth: toDateInputValue(staff.date_of_birth),
        date_of_joining: toDateInputValue(staff.date_of_joining),
        phone: staff.phone || '',
        emergency_contact: staff.emergency_contact || '',
        email: staff.email || '',
        photo: staff.photo || '',
        current_address: staff.current_address || '',
        permanent_address: staff.permanent_address || '',
        qualification: staff.qualification || '',
        work_experience: staff.work_experience || '',
        note: staff.note || '',
        epf_no: staff.epf_no || '',
        basic_salary: staff.basic_salary || '',
        contract_type: staff.contract_type || 'permanent',
        work_shift: staff.work_shift || 'morning',
        location: staff.location || '',
        number_of_leaves: staff.number_of_leaves || '0',
        bank_account_title: staff.bank_account_title || '',
        bank_account_number: staff.bank_account_number || '',
        bank_name: staff.bank_name || '',
        ifsc_code: staff.ifsc_code || '',
        bank_branch_name: staff.bank_branch_name || '',
        facebook_url: staff.facebook_url || '',
        twitter_url: staff.twitter_url || '',
        linkedin_url: staff.linkedin_url || '',
        instagram_url: staff.instagram_url || '',
      });
    }
  }, [staffData]);

  const updateMutation = useMutation(
    (data: Partial<Staff>) => hrService.updateStaff(String(staffId), data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('staff');
        queryClient.invalidateQueries(['staff', staffId]);
        showToast(response.message || 'Staff member updated successfully', 'success');
        onClose();
      },
      onError: (err: any) => {
        const errorMessage = err.response?.data?.message || 'Failed to update staff member';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.staff_id || !formData.role_id || !formData.first_name || !formData.date_of_joining) {
      setError('Please fill in all required fields');
      return;
    }

    updateMutation.mutate({
      ...formData,
      role_id: Number(formData.role_id),
      designation_id: formData.designation_id ? Number(formData.designation_id) : undefined,
      department_id: formData.department_id ? Number(formData.department_id) : undefined,
      basic_salary: formData.basic_salary ? Number(formData.basic_salary) : 0,
      number_of_leaves: Number(formData.number_of_leaves),
      gender: formData.gender as 'male' | 'female' | 'other',
    });
  };

  if (isLoading) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Edit Staff" size="large">
        <div className="loading">Loading staff details...</div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Staff Member" size="large">
      <form onSubmit={handleSubmit} className="staff-form">
        {error && (
          <div className="error-message" style={{
            padding: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-lg)',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #fca5a5'
          }}>
            {error}
          </div>
        )}

        <div className="form-section">
          <h4>Basic Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Staff ID *</label>
              <input
                type="text"
                value={formData.staff_id || ''}
                onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Role *</label>
              <select
                value={formData.role_id || ''}
                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                required
              >
                <option value="">Select Role</option>
                {rolesData?.data.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <select
                value={formData.department_id || ''}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              >
                <option value="">Select Department</option>
                {departments.map((d: Department) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Designation</label>
              <select
                value={formData.designation_id || ''}
                onChange={(e) => setFormData({ ...formData, designation_id: e.target.value })}
              >
                <option value="">Select Designation</option>
                {designations.map((d: Designation) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                value={formData.first_name || ''}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={formData.last_name || ''}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Gender *</label>
              <select
                value={formData.gender || 'male'}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Marital Status</label>
              <select
                value={formData.marital_status || 'single'}
                onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
              >
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                value={formData.date_of_birth || ''}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="form-group">
              <label>Date of Joining *</label>
              <input
                type="date"
                value={formData.date_of_joining || ''}
                onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Contact Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label>Emergency Contact</label>
              <input
                type="tel"
                value={formData.emergency_contact || ''}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="staff@example.com"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Family Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Father Name</label>
              <input
                type="text"
                value={formData.father_name || ''}
                onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Mother Name</label>
              <input
                type="text"
                value={formData.mother_name || ''}
                onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Address</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Current Address</label>
              <textarea
                value={formData.current_address || ''}
                onChange={(e) => setFormData({ ...formData, current_address: e.target.value })}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Permanent Address</label>
              <textarea
                value={formData.permanent_address || ''}
                onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Professional Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Qualification</label>
              <textarea
                value={formData.qualification || ''}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                rows={3}
                placeholder="Educational qualifications"
              />
            </div>
            <div className="form-group">
              <label>Work Experience</label>
              <textarea
                value={formData.work_experience || ''}
                onChange={(e) => setFormData({ ...formData, work_experience: e.target.value })}
                rows={3}
                placeholder="Previous work experience"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Employment Details</h4>
          <div className="form-row">
            <div className="form-group">
              <label>EPF No</label>
              <input
                type="text"
                value={formData.epf_no || ''}
                onChange={(e) => setFormData({ ...formData, epf_no: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Basic Salary</label>
              <input
                type="number"
                value={formData.basic_salary || ''}
                onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Contract Type</label>
              <select
                value={formData.contract_type || 'permanent'}
                onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
              >
                <option value="permanent">Permanent</option>
                <option value="contract">Contract</option>
                <option value="temporary">Temporary</option>
                <option value="probation">Probation</option>
              </select>
            </div>
            <div className="form-group">
              <label>Work Shift</label>
              <select
                value={formData.work_shift || 'morning'}
                onChange={(e) => setFormData({ ...formData, work_shift: e.target.value })}
              >
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Number of Leaves</label>
              <input
                type="number"
                value={formData.number_of_leaves || '0'}
                onChange={(e) => setFormData({ ...formData, number_of_leaves: e.target.value })}
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Bank Details</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Bank Account Title</label>
              <input
                type="text"
                value={formData.bank_account_title || ''}
                onChange={(e) => setFormData({ ...formData, bank_account_title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Bank Account Number</label>
              <input
                type="text"
                value={formData.bank_account_number || ''}
                onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Bank Name</label>
              <input
                type="text"
                value={formData.bank_name || ''}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>IFSC Code</label>
              <input
                type="text"
                value={formData.ifsc_code || ''}
                onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Bank Branch Name</label>
              <input
                type="text"
                value={formData.bank_branch_name || ''}
                onChange={(e) => setFormData({ ...formData, bank_branch_name: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Social Media Links</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Facebook URL</label>
              <input
                type="url"
                value={formData.facebook_url || ''}
                onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                placeholder="https://facebook.com/..."
              />
            </div>
            <div className="form-group">
              <label>Twitter URL</label>
              <input
                type="url"
                value={formData.twitter_url || ''}
                onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                placeholder="https://twitter.com/..."
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>LinkedIn URL</label>
              <input
                type="url"
                value={formData.linkedin_url || ''}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div className="form-group">
              <label>Instagram URL</label>
              <input
                type="url"
                value={formData.instagram_url || ''}
                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                placeholder="https://instagram.com/..."
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Additional Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Note</label>
              <textarea
                value={formData.note || ''}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
                placeholder="Any additional notes or remarks"
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={updateMutation.isLoading}>
            {updateMutation.isLoading ? 'Updating...' : 'Update Staff Member'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Add Staff Tab
const AddStaffTab = ({ departments, designations }: any) => {
  const [, setSearchParams] = useSearchParams();
  const initialFormData = {
    staff_id: '',
    role_id: '',
    designation_id: '',
    department_id: '',
    first_name: '',
    last_name: '',
    father_name: '',
    mother_name: '',
    gender: 'male' as 'male' | 'female' | 'other',
    marital_status: 'single' as 'single' | 'married' | 'divorced' | 'widowed',
    date_of_birth: '',
    date_of_joining: new Date().toISOString().split('T')[0],
    phone: '',
    emergency_contact: '',
    email: '',
    photo: '',
    current_address: '',
    permanent_address: '',
    qualification: '',
    work_experience: '',
    note: '',
    epf_no: '',
    basic_salary: '',
    contract_type: 'permanent' as 'permanent' | 'contract' | 'temporary' | 'probation',
    work_shift: 'morning' as 'morning' | 'evening' | 'night' | 'flexible',
    location: '',
    number_of_leaves: '0',
    bank_account_title: '',
    bank_account_number: '',
    bank_name: '',
    ifsc_code: '',
    bank_branch_name: '',
    facebook_url: '',
    twitter_url: '',
    linkedin_url: '',
    instagram_url: '',
  };

  const [formData, setFormData] = useState(initialFormData);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: rolesData } = useQuery('roles', () => rolesService.getRoles());

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    setFieldErrors({});
    setError(null);

    if (!formData.staff_id || formData.staff_id.trim() === '') {
      errors.staff_id = 'Staff ID is required';
    }

    if (!formData.role_id) {
      errors.role_id = 'Role is required';
    }

    if (!formData.first_name || formData.first_name.trim() === '') {
      errors.first_name = 'First name is required';
    }

    if (!formData.date_of_joining) {
      errors.date_of_joining = 'Date of joining is required';
    }

    // Email validation
    if (formData.email && formData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    // Phone validation
    if (formData.phone && formData.phone.trim() !== '') {
      const phoneRegex = /^[0-9]{10}$/;
      const cleanedPhone = formData.phone.replace(/\D/g, '');
      if (!phoneRegex.test(cleanedPhone)) {
        errors.phone = 'Please enter a valid 10-digit mobile number';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the errors in the form before submitting.');
      return false;
    }

    return true;
  };

  const createMutation = useMutation(hrService.createStaff, {
    onSuccess: (response) => {
      queryClient.invalidateQueries('staff');
      setError(null);
      setFieldErrors({});
      showToast(response.message || 'Staff member added successfully', 'success');
      setShowSuccessModal(true);
    },
    onError: (err: any) => {
      let errorMessage = 'Failed to add staff member. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setFieldErrors({});
      showToast(errorMessage, 'error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    createMutation.mutate({
      ...formData,
      role_id: Number(formData.role_id),
      designation_id: formData.designation_id ? Number(formData.designation_id) : undefined,
      department_id: formData.department_id ? Number(formData.department_id) : undefined,
      basic_salary: formData.basic_salary ? Number(formData.basic_salary) : 0,
      number_of_leaves: Number(formData.number_of_leaves),
      gender: formData.gender as 'male' | 'female' | 'other',
    });
  };

  const handleAddAnother = () => {
    setShowSuccessModal(false);
    setFormData({
      ...initialFormData,
      date_of_joining: new Date().toISOString().split('T')[0],
    });
    setError(null);
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewStaffList = () => {
    setShowSuccessModal(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSearchParams({ tab: 'staff' });
  };

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Add Staff Member</h3>
      </div>

      <form onSubmit={handleSubmit} className="staff-form">
        {error && (
          <div className="error-message" style={{
            padding: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-lg)',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #fca5a5'
          }}>
            {error}
          </div>
        )}

        <div className="form-section">
          <h4>Basic Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Staff ID *</label>
              <input
                type="text"
                value={formData.staff_id}
                onChange={(e) => {
                  setFormData({ ...formData, staff_id: e.target.value });
                  if (fieldErrors.staff_id) setFieldErrors({ ...fieldErrors, staff_id: '' });
                }}
                className={fieldErrors.staff_id ? 'error' : ''}
                required
              />
              {fieldErrors.staff_id && (
                <span className="field-error">{fieldErrors.staff_id}</span>
              )}
            </div>
            <div className="form-group">
              <label>Role *</label>
              <select
                value={formData.role_id}
                onChange={(e) => {
                  setFormData({ ...formData, role_id: e.target.value });
                  if (fieldErrors.role_id) setFieldErrors({ ...fieldErrors, role_id: '' });
                }}
                className={fieldErrors.role_id ? 'error' : ''}
                required
              >
                <option value="">Select Role</option>
                {rolesData?.data.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
              {fieldErrors.role_id && (
                <span className="field-error">{fieldErrors.role_id}</span>
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              >
                <option value="">Select Department</option>
                {departments.map((d: Department) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Designation</label>
              <select
                value={formData.designation_id}
                onChange={(e) => setFormData({ ...formData, designation_id: e.target.value })}
              >
                <option value="">Select Designation</option>
                {designations.map((d: Designation) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => {
                  setFormData({ ...formData, first_name: e.target.value });
                  if (fieldErrors.first_name) setFieldErrors({ ...fieldErrors, first_name: '' });
                }}
                className={fieldErrors.first_name ? 'error' : ''}
                required
              />
              {fieldErrors.first_name && (
                <span className="field-error">{fieldErrors.first_name}</span>
              )}
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Gender *</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Marital Status</label>
              <select
                value={formData.marital_status}
                onChange={(e) => setFormData({ ...formData, marital_status: e.target.value as any })}
              >
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="form-group">
              <label>Date of Joining *</label>
              <input
                type="date"
                value={formData.date_of_joining}
                onChange={(e) => {
                  setFormData({ ...formData, date_of_joining: e.target.value });
                  if (fieldErrors.date_of_joining) setFieldErrors({ ...fieldErrors, date_of_joining: '' });
                }}
                className={fieldErrors.date_of_joining ? 'error' : ''}
                max={new Date().toISOString().split('T')[0]}
                required
              />
              {fieldErrors.date_of_joining && (
                <span className="field-error">{fieldErrors.date_of_joining}</span>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Contact Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
                }}
                className={fieldErrors.phone ? 'error' : ''}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
              {fieldErrors.phone && (
                <span className="field-error">{fieldErrors.phone}</span>
              )}
            </div>
            <div className="form-group">
              <label>Emergency Contact</label>
              <input
                type="tel"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                }}
                className={fieldErrors.email ? 'error' : ''}
                placeholder="staff@example.com"
              />
              {fieldErrors.email && (
                <span className="field-error">{fieldErrors.email}</span>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Family Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Father Name</label>
              <input
                type="text"
                value={formData.father_name}
                onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Mother Name</label>
              <input
                type="text"
                value={formData.mother_name}
                onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Address</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Current Address</label>
              <textarea
                value={formData.current_address}
                onChange={(e) => setFormData({ ...formData, current_address: e.target.value })}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Permanent Address</label>
              <textarea
                value={formData.permanent_address}
                onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Professional Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Qualification</label>
              <textarea
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                rows={3}
                placeholder="Educational qualifications"
              />
            </div>
            <div className="form-group">
              <label>Work Experience</label>
              <textarea
                value={formData.work_experience}
                onChange={(e) => setFormData({ ...formData, work_experience: e.target.value })}
                rows={3}
                placeholder="Previous work experience"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Employment Details</h4>
          <div className="form-row">
            <div className="form-group">
              <label>EPF No</label>
              <input
                type="text"
                value={formData.epf_no}
                onChange={(e) => setFormData({ ...formData, epf_no: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Basic Salary</label>
              <input
                type="number"
                value={formData.basic_salary}
                onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Contract Type</label>
              <select
                value={formData.contract_type}
                onChange={(e) => setFormData({ ...formData, contract_type: e.target.value as any })}
              >
                <option value="permanent">Permanent</option>
                <option value="contract">Contract</option>
                <option value="temporary">Temporary</option>
                <option value="probation">Probation</option>
              </select>
            </div>
            <div className="form-group">
              <label>Work Shift</label>
              <select
                value={formData.work_shift}
                onChange={(e) => setFormData({ ...formData, work_shift: e.target.value as any })}
              >
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Number of Leaves</label>
              <input
                type="number"
                value={formData.number_of_leaves}
                onChange={(e) => setFormData({ ...formData, number_of_leaves: e.target.value })}
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Bank Details</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Bank Account Title</label>
              <input
                type="text"
                value={formData.bank_account_title}
                onChange={(e) => setFormData({ ...formData, bank_account_title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Bank Account Number</label>
              <input
                type="text"
                value={formData.bank_account_number}
                onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Bank Name</label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>IFSC Code</label>
              <input
                type="text"
                value={formData.ifsc_code}
                onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Bank Branch Name</label>
              <input
                type="text"
                value={formData.bank_branch_name}
                onChange={(e) => setFormData({ ...formData, bank_branch_name: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Social Media Links</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Facebook URL</label>
              <input
                type="url"
                value={formData.facebook_url}
                onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                placeholder="https://facebook.com/..."
              />
            </div>
            <div className="form-group">
              <label>Twitter URL</label>
              <input
                type="url"
                value={formData.twitter_url}
                onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                placeholder="https://twitter.com/..."
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>LinkedIn URL</label>
              <input
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div className="form-group">
              <label>Instagram URL</label>
              <input
                type="url"
                value={formData.instagram_url}
                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                placeholder="https://instagram.com/..."
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Additional Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Note</label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
                placeholder="Any additional notes or remarks"
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
            {createMutation.isLoading ? 'Saving...' : 'Save Staff Member'}
          </button>
          {createMutation.isLoading && (
            <span style={{ marginLeft: 'var(--spacing-md)', color: 'var(--gray-600)' }}>
              Please wait...
            </span>
          )}
        </div>
      </form>

      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success"
        size="small"
        disableBackdropClose
      >
        <p style={{ marginBottom: 'var(--spacing-lg)' }}>
          Staff added successfully.
        </p>
        <div className="modal-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleViewStaffList}
          >
            View Staff List
          </button>
          <button
            type="button"
            className="btn-success"
            onClick={handleAddAnother}
          >
            Add Another Staff
          </button>
        </div>
      </Modal>
    </div>
  );
};

// Departments Tab
const DepartmentsTab = () => {
  const { data: departmentsData } = useQuery('departments', () => hrService.getDepartments());
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const createMutation = useMutation(hrService.createDepartment, {
    onSuccess: (response) => {
      queryClient.invalidateQueries('departments');
      setShowModal(false);
      setFormData({ name: '', description: '' });
      showToast(response.message || 'Department created successfully', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to create department', 'error');
    },
  });

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Departments</h3>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Department</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {departmentsData?.data.map((dept: Department) => (
              <tr key={dept.id}>
                <td>{dept.name}</td>
                <td>{dept.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal isOpen={true} onClose={() => setShowModal(false)} title="Add Department" size="small">
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }}>
            <div className="form-group">
              <label>Department Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
                {createMutation.isLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Designations Tab
const DesignationsTab = () => {
  const { data: designationsData } = useQuery('designations', () => hrService.getDesignations());
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const createMutation = useMutation(hrService.createDesignation, {
    onSuccess: (response) => {
      queryClient.invalidateQueries('designations');
      setShowModal(false);
      setFormData({ name: '', description: '' });
      showToast(response.message || 'Designation created successfully', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to create designation', 'error');
    },
  });

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Designations</h3>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Designation</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {designationsData?.data.map((desig: Designation) => (
              <tr key={desig.id}>
                <td>{desig.name}</td>
                <td>{desig.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal isOpen={true} onClose={() => setShowModal(false)} title="Add Designation" size="small">
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }}>
            <div className="form-group">
              <label>Designation Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
                {createMutation.isLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Leave Types Tab
const LeaveTypesTab = () => {
  const { data: leaveTypesData } = useQuery('leave-types', () => hrService.getLeaveTypes());
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', max_days: '', is_paid: true });

  const createMutation = useMutation(hrService.createLeaveType, {
    onSuccess: (response) => {
      queryClient.invalidateQueries('leave-types');
      setShowModal(false);
      setFormData({ name: '', description: '', max_days: '', is_paid: true });
      showToast(response.message || 'Leave type created successfully', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to create leave type', 'error');
    },
  });

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Leave Types</h3>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Leave Type</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Max Days</th>
              <th>Paid</th>
            </tr>
          </thead>
          <tbody>
            {leaveTypesData?.data.map((lt: LeaveType) => (
              <tr key={lt.id}>
                <td>{lt.name}</td>
                <td>{lt.description || '-'}</td>
                <td>{lt.max_days || '-'}</td>
                <td>{lt.is_paid ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal isOpen={true} onClose={() => setShowModal(false)} title="Add Leave Type" size="small">
          <form onSubmit={(e) => { 
            e.preventDefault(); 
            createMutation.mutate({
              ...formData,
              max_days: formData.max_days ? Number(formData.max_days) : undefined,
            }); 
          }}>
            <div className="form-group">
              <label>Leave Type Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Max Days</label>
              <input
                type="number"
                value={formData.max_days}
                onChange={(e) => setFormData({ ...formData, max_days: e.target.value })}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_paid}
                  onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })}
                />
                Paid Leave
              </label>
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
                {createMutation.isLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Staff Attendance Tab
const StaffAttendanceTab = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [roleId, setRoleId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, { status: string; check_in_time?: string; check_out_time?: string; note?: string }>>({});
  const [isHoliday, setIsHoliday] = useState(false);

  const { data: rolesData } = useQuery('roles', () => rolesService.getRoles());

  const { data: attendanceData, isLoading, refetch } = useQuery(
    ['staff-attendance', roleId, attendanceDate],
    () => hrService.getStaffAttendance({
      role_id: roleId ? Number(roleId) : undefined,
      attendance_date: attendanceDate,
    }),
    { enabled: !!attendanceDate }
  );

  useEffect(() => {
    if (attendanceData?.data) {
      const records: Record<number, any> = {};
      attendanceData.data.forEach((staff: any) => {
        if (staff.status) {
          records[staff.id] = {
            status: staff.status,
            check_in_time: staff.check_in_time || '',
            check_out_time: staff.check_out_time || '',
            note: staff.note || '',
          };
        }
      });
      setAttendanceRecords(records);
    }
  }, [attendanceData]);

  const submitMutation = useMutation(hrService.submitStaffAttendance, {
    onSuccess: (response) => {
      queryClient.invalidateQueries(['staff-attendance', roleId, attendanceDate]);
      showToast(response.message || 'Attendance submitted successfully', 'success');
      refetch();
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to submit attendance', 'error');
    },
  });

  const handleStatusChange = (staffId: number, status: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        status,
      },
    }));
  };

  const handleTimeChange = (staffId: number, field: 'check_in_time' | 'check_out_time', value: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [field]: value,
      },
    }));
  };

  const handleNoteChange = (staffId: number, note: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        note,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isHoliday) {
      submitMutation.mutate({
        attendance_date: attendanceDate,
        is_holiday: true,
      });
      return;
    }

    const records = Object.entries(attendanceRecords)
      .filter(([_, record]) => record.status)
      .map(([staffId, record]) => ({
        staff_id: Number(staffId),
        status: record.status as 'present' | 'late' | 'absent' | 'half_day',
        check_in_time: record.check_in_time || undefined,
        check_out_time: record.check_out_time || undefined,
        note: record.note || undefined,
      }));

    if (records.length === 0) {
      showToast('Please mark attendance for at least one staff member', 'error');
      return;
    }

    submitMutation.mutate({
      attendance_date: attendanceDate,
      attendance_records: records,
    });
  };

  return (
    <div className="tab-content">
      <form onSubmit={handleSubmit} className="attendance-form">
        <div className="form-filters" style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Role</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
            >
              <option value="">All Roles</option>
              {rolesData?.data.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Attendance Date *</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <button type="button" onClick={() => refetch()} className="btn-secondary">
            Search
          </button>
        </div>

        {isLoading ? (
          <div className="loading">Loading staff...</div>
        ) : attendanceData?.data && attendanceData.data.length > 0 ? (
          <>
            <div className="attendance-actions" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <input
                  type="checkbox"
                  checked={isHoliday}
                  onChange={(e) => setIsHoliday(e.target.checked)}
                />
                Mark as Holiday
              </label>
            </div>

            <div className="attendance-table-container" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.data.map((staff: any) => (
                    <tr key={staff.id}>
                      <td>{staff.staff_id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                          {staff.photo && (
                            <img src={staff.photo} alt={staff.first_name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                          )}
                          {staff.first_name} {staff.last_name || ''}
                        </div>
                      </td>
                      <td>{staff.role_name}</td>
                      <td>{staff.department_name || '-'}</td>
                      <td>
                        <select
                          value={attendanceRecords[staff.id]?.status || ''}
                          onChange={(e) => handleStatusChange(staff.id, e.target.value)}
                          style={{ minWidth: '120px' }}
                        >
                          <option value="">Select</option>
                          <option value="present">Present</option>
                          <option value="late">Late</option>
                          <option value="absent">Absent</option>
                          <option value="half_day">Half Day</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="time"
                          value={attendanceRecords[staff.id]?.check_in_time || ''}
                          onChange={(e) => handleTimeChange(staff.id, 'check_in_time', e.target.value)}
                          disabled={!attendanceRecords[staff.id]?.status || attendanceRecords[staff.id]?.status === 'absent'}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          value={attendanceRecords[staff.id]?.check_out_time || ''}
                          onChange={(e) => handleTimeChange(staff.id, 'check_out_time', e.target.value)}
                          disabled={!attendanceRecords[staff.id]?.status || attendanceRecords[staff.id]?.status === 'absent'}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={attendanceRecords[staff.id]?.note || ''}
                          onChange={(e) => handleNoteChange(staff.id, e.target.value)}
                          placeholder="Note"
                          style={{ minWidth: '150px' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="form-actions" style={{ marginTop: 'var(--spacing-lg)' }}>
              <button type="submit" className="btn-primary" disabled={submitMutation.isLoading}>
                {submitMutation.isLoading ? 'Submitting...' : isHoliday ? 'Mark as Holiday' : 'Submit Attendance'}
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state">No staff members found. Please select a role or date.</div>
        )}
      </form>
    </div>
  );
};

// Staff Attendance Report Tab
const StaffAttendanceReportTab = () => {
  const [roleId, setRoleId] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchTrigger, setSearchTrigger] = useState(0);

  const { data: rolesData } = useQuery('roles', () => rolesService.getRoles());

  const { data: reportData, isLoading } = useQuery(
    ['staff-attendance-report', roleId, month, year, searchTrigger],
    () => hrService.getStaffAttendanceReport({
      role_id: roleId ? Number(roleId) : undefined,
      month,
      year,
    }),
    { enabled: searchTrigger > 0 }
  );

  const handleSearch = () => {
    setSearchTrigger(prev => prev + 1);
  };

  return (
    <div className="tab-content">
      <div className="form-filters" style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Role</label>
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
          >
            <option value="">All Roles</option>
            {rolesData?.data.map((role) => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min="2000"
            max="2100"
          />
        </div>
        <button type="button" onClick={handleSearch} className="btn-primary">
          Search
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading report...</div>
      ) : reportData?.data && reportData.data.length > 0 ? (
        <div className="attendance-table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Present</th>
                <th>Late</th>
                <th>Absent</th>
                <th>Half Day</th>
                <th>Holiday</th>
                <th>Total Days</th>
                <th>Gross Present %</th>
              </tr>
            </thead>
            <tbody>
              {reportData.data.map((staff: any) => (
                <tr key={staff.id}>
                  <td>{staff.staff_id}</td>
                  <td>{staff.first_name} {staff.last_name || ''}</td>
                  <td>{staff.role_name}</td>
                  <td>{staff.department_name || '-'}</td>
                  <td>{staff.present_count || 0}</td>
                  <td>{staff.late_count || 0}</td>
                  <td>{staff.absent_count || 0}</td>
                  <td>{staff.half_day_count || 0}</td>
                  <td>{staff.holiday_count || 0}</td>
                  <td>{staff.total_days || 0}</td>
                  <td>{staff.gross_present_percentage || 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : searchTrigger > 0 ? (
        <div className="empty-state">No attendance data found for the selected criteria.</div>
      ) : (
        <div className="empty-state">Please select criteria and click Search to view attendance report.</div>
      )}
    </div>
  );
};

// Apply Leave Tab
const ApplyLeaveTab = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    staff_id: '',
    leave_type_id: '',
    apply_date: new Date().toISOString().split('T')[0],
    leave_date: '',
    reason: '',
    note: '',
  });

  const { data: leaveTypesData } = useQuery('leave-types', () => hrService.getLeaveTypes());
  const { data: staffData } = useQuery('staff', () => hrService.getStaff({ limit: 1000 }));

  // Try to find staff by user_id if user is logged in
  useEffect(() => {
    if (user && staffData?.data) {
      const staffMember = staffData.data.find((s: Staff) => s.user_id === user.id);
      if (staffMember) {
        setFormData(prev => ({ ...prev, staff_id: String(staffMember.id) }));
      }
    }
  }, [user, staffData]);

  const createMutation = useMutation(hrService.createLeaveRequest, {
    onSuccess: (response) => {
      queryClient.invalidateQueries('leave-requests');
      showToast(response.message || 'Leave request submitted successfully', 'success');
      setShowModal(false);
      setFormData({
        staff_id: formData.staff_id, // Keep selected staff
        leave_type_id: '',
        apply_date: new Date().toISOString().split('T')[0],
        leave_date: '',
        reason: '',
        note: '',
      });
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to submit leave request', 'error');
    },
  });

  const { data: myLeaveRequests, isLoading } = useQuery(
    ['leave-requests', formData.staff_id],
    () => hrService.getLeaveRequests({
      staff_id: formData.staff_id ? Number(formData.staff_id) : undefined,
      page: 1,
      limit: 50,
    }),
    { enabled: !!formData.staff_id }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.staff_id || !formData.leave_type_id || !formData.leave_date) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    createMutation.mutate({
      staff_id: Number(formData.staff_id),
      leave_type_id: Number(formData.leave_type_id),
      apply_date: formData.apply_date,
      leave_date: formData.leave_date,
      reason: formData.reason || undefined,
      note: formData.note || undefined,
    });
  };

  return (
    <div className="tab-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h2>My Leave Requests</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Apply Leave
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading leave requests...</div>
      ) : myLeaveRequests?.data && myLeaveRequests.data.length > 0 ? (
        <div className="attendance-table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Leave Date</th>
                <th>Leave Type</th>
                <th>Apply Date</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Approved By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {myLeaveRequests.data.map((request: any) => (
                <tr key={request.id}>
                  <td>{new Date(request.leave_date).toLocaleDateString()}</td>
                  <td>{request.leave_type_name}</td>
                  <td>{new Date(request.apply_date).toLocaleDateString()}</td>
                  <td>{request.reason || '-'}</td>
                  <td>
                    <span className={`status-badge status-${request.status}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </td>
                  <td>{request.approved_by_name || '-'}</td>
                  <td>
                    {request.status === 'pending' && (
                      <button
                        className="btn-danger btn-sm"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this leave request?')) {
                            hrService.deleteLeaveRequest(String(request.id)).then(() => {
                              queryClient.invalidateQueries('leave-requests');
                              showToast('Leave request deleted successfully', 'success');
                            }).catch((err: any) => {
                              showToast(err.response?.data?.message || 'Failed to delete leave request', 'error');
                            });
                          }
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">No leave requests found. Click "Apply Leave" to submit a new request.</div>
      )}

      {showModal && (
        <Modal isOpen={true} onClose={() => setShowModal(false)} title="Apply Leave" size="medium">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Staff Member *</label>
              <select
                value={formData.staff_id}
                onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                required
                disabled={!!user && !!staffData?.data?.find((s: Staff) => s.user_id === user.id)}
              >
                <option value="">Select Staff</option>
                {staffData?.data?.filter((s: Staff) => s.is_active).map((staff: Staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.first_name} {staff.last_name || ''} ({staff.staff_id})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Leave Type *</label>
              <select
                value={formData.leave_type_id}
                onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
                required
              >
                <option value="">Select Leave Type</option>
                {leaveTypesData?.data.map((lt: LeaveType) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.name} {lt.max_days ? `(Max: ${lt.max_days} days)` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Apply Date *</label>
                <input
                  type="date"
                  value={formData.apply_date}
                  onChange={(e) => setFormData({ ...formData, apply_date: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="form-group">
                <label>Leave Date *</label>
                <input
                  type="date"
                  value={formData.leave_date}
                  onChange={(e) => setFormData({ ...formData, leave_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Reason</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                placeholder="Reason for leave"
              />
            </div>
            <div className="form-group">
              <label>Note</label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={2}
                placeholder="Additional notes"
              />
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
                {createMutation.isLoading ? 'Submitting...' : 'Submit Leave Request'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Approve Leave Tab
const ApproveLeaveTab = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'disapproved' | ''>('pending');
  const [page, setPage] = useState(1);
  const [viewRequestId, setViewRequestId] = useState<number | null>(null);

  const { data: leaveRequestsData, isLoading } = useQuery(
    ['leave-requests', statusFilter, page],
    () => hrService.getLeaveRequests({
      status: statusFilter || undefined,
      page,
      limit: 20,
    })
  );

  const { data: leaveRequestDetail } = useQuery(
    ['leave-request', viewRequestId],
    () => hrService.getLeaveRequestById(String(viewRequestId!)),
    { enabled: !!viewRequestId }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => hrService.updateLeaveRequest(id, data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('leave-requests');
        showToast(response.message || 'Leave request updated successfully', 'success');
        setViewRequestId(null);
      },
      onError: (err: any) => {
        showToast(err.response?.data?.message || 'Failed to update leave request', 'error');
      },
    }
  );

  const handleApprove = (id: number, note?: string) => {
    updateMutation.mutate({
      id: String(id),
      data: {
        status: 'approved',
        note: note || '',
        approved_by: user?.id,
      },
    });
  };

  const handleDisapprove = (id: number, note?: string) => {
    updateMutation.mutate({
      id: String(id),
      data: {
        status: 'disapproved',
        note: note || '',
        approved_by: user?.id,
      },
    });
  };

  return (
    <div className="tab-content">
      <div className="filters" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as any);
            setPage(1);
          }}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="disapproved">Disapproved</option>
        </select>
      </div>

      {isLoading ? (
        <div className="loading">Loading leave requests...</div>
      ) : leaveRequestsData?.data && leaveRequestsData.data.length > 0 ? (
        <>
          <div className="attendance-table-container" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Leave Type</th>
                  <th>Leave Date</th>
                  <th>Apply Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequestsData.data.map((request: any) => (
                  <tr key={request.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        {request.photo && (
                          <img src={request.photo} alt={request.first_name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                        )}
                        <div>
                          <div>{request.first_name} {request.last_name || ''}</div>
                          <small style={{ color: '#666' }}>{request.staff_staff_id}</small>
                        </div>
                      </div>
                    </td>
                    <td>{request.leave_type_name}</td>
                    <td>{new Date(request.leave_date).toLocaleDateString()}</td>
                    <td>{new Date(request.apply_date).toLocaleDateString()}</td>
                    <td>{request.reason || '-'}</td>
                    <td>
                      <span className={`status-badge status-${request.status}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                        <button
                          className="btn-primary btn-sm"
                          onClick={() => setViewRequestId(request.id)}
                        >
                          View
                        </button>
                        {request.status === 'pending' && (
                          <>
                            <button
                              className="btn-success btn-sm"
                              onClick={() => handleApprove(request.id)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn-danger btn-sm"
                              onClick={() => {
                                const note = window.prompt('Enter disapproval reason (optional):');
                                if (note !== null) {
                                  handleDisapprove(request.id, note);
                                }
                              }}
                            >
                              Disapprove
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {leaveRequestsData.pagination && leaveRequestsData.pagination.pages > 1 && (
            <div className="pagination" style={{ marginTop: 'var(--spacing-lg)' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span>Page {page} of {leaveRequestsData.pagination.pages}</span>
              <button
                onClick={() => setPage(p => Math.min(leaveRequestsData.pagination.pages, p + 1))}
                disabled={page === leaveRequestsData.pagination.pages}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">No leave requests found.</div>
      )}

      {viewRequestId && leaveRequestDetail?.data && (
        <Modal isOpen={true} onClose={() => setViewRequestId(null)} title="Leave Request Details" size="medium">
          <div className="leave-request-detail">
            <div className="detail-section">
              <h4>Staff Information</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                {leaveRequestDetail.data.photo && (
                  <img src={leaveRequestDetail.data.photo} alt={leaveRequestDetail.data.first_name} style={{ width: '64px', height: '64px', borderRadius: '50%' }} />
                )}
                <div>
                  <div><strong>{leaveRequestDetail.data.first_name} {leaveRequestDetail.data.last_name || ''}</strong></div>
                  <div style={{ color: '#666' }}>Staff ID: {leaveRequestDetail.data.staff_staff_id}</div>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Leave Details</h4>
              <div className="detail-row">
                <span><strong>Leave Type:</strong></span>
                <span>{leaveRequestDetail.data.leave_type_name}</span>
              </div>
              <div className="detail-row">
                <span><strong>Leave Date:</strong></span>
                <span>{new Date(leaveRequestDetail.data.leave_date).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <span><strong>Apply Date:</strong></span>
                <span>{new Date(leaveRequestDetail.data.apply_date).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <span><strong>Status:</strong></span>
                <span className={`status-badge status-${leaveRequestDetail.data.status}`}>
                  {leaveRequestDetail.data.status.charAt(0).toUpperCase() + leaveRequestDetail.data.status.slice(1)}
                </span>
              </div>
              {leaveRequestDetail.data.reason && (
                <div className="detail-row">
                  <span><strong>Reason:</strong></span>
                  <span>{leaveRequestDetail.data.reason}</span>
                </div>
              )}
              {leaveRequestDetail.data.note && (
                <div className="detail-row">
                  <span><strong>Note:</strong></span>
                  <span>{leaveRequestDetail.data.note}</span>
                </div>
              )}
              {leaveRequestDetail.data.approved_by_name && (
                <div className="detail-row">
                  <span><strong>Approved By:</strong></span>
                  <span>{leaveRequestDetail.data.approved_by_name}</span>
                </div>
              )}
              {leaveRequestDetail.data.approved_at && (
                <div className="detail-row">
                  <span><strong>Approved At:</strong></span>
                  <span>{new Date(leaveRequestDetail.data.approved_at).toLocaleString()}</span>
                </div>
              )}
            </div>

            {leaveRequestDetail.data.status === 'pending' && (
              <div className="form-actions" style={{ marginTop: 'var(--spacing-lg)' }}>
                <button
                  className="btn-success"
                  onClick={() => {
                    const note = window.prompt('Enter approval note (optional):');
                    handleApprove(leaveRequestDetail.data.id, note || '');
                  }}
                >
                  Approve
                </button>
                <button
                  className="btn-danger"
                  onClick={() => {
                    const note = window.prompt('Enter disapproval reason (optional):');
                    if (note !== null) {
                      handleDisapprove(leaveRequestDetail.data.id, note);
                    }
                  }}
                >
                  Disapprove
                </button>
                <button className="btn-secondary" onClick={() => setViewRequestId(null)}>
                  Close
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

// Disabled Staff Tab
const DisabledStaffTab = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [viewStaffId, setViewStaffId] = useState<number | null>(null);

  const { data: staffData, isLoading } = useQuery(
    ['staff', 'disabled', page, roleFilter, departmentFilter, searchTerm],
    () => hrService.getStaff({
      is_active: false,
      page,
      limit: 20,
      role_id: roleFilter ? Number(roleFilter) : undefined,
      department_id: departmentFilter ? Number(departmentFilter) : undefined,
      search: searchTerm || undefined,
    })
  );

  const { data: departmentsData } = useQuery('departments', () => hrService.getDepartments());
  const { data: rolesData } = useQuery('roles', () => rolesService.getRoles());

  const enableMutation = useMutation(hrService.enableStaff, {
    onSuccess: () => {
      queryClient.invalidateQueries(['staff', 'disabled']);
      queryClient.invalidateQueries('staff');
      showToast('Staff member enabled successfully', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to enable staff member', 'error');
    },
  });

  const deleteMutation = useMutation(hrService.deleteStaff, {
    onSuccess: () => {
      queryClient.invalidateQueries(['staff', 'disabled']);
      showToast('Staff member deleted successfully', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to delete staff member', 'error');
    },
  });

  const handleEnable = (id: number) => {
    if (window.confirm('Are you sure you want to enable this staff member?')) {
      enableMutation.mutate(String(id));
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to permanently delete this staff member? This action cannot be undone.')) {
      deleteMutation.mutate(String(id));
    }
  };

  return (
    <div className="tab-content">
      <div className="filters">
        <input
          type="text"
          placeholder="Search disabled staff..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          className="search-input"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="filter-select"
        >
          <option value="">All Roles</option>
          {rolesData?.data.map((role) => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>
        <select
          value={departmentFilter}
          onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
          className="filter-select"
        >
          <option value="">All Departments</option>
          {departmentsData?.data.map((d: Department) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="loading">Loading disabled staff...</div>
      ) : staffData?.data && staffData.data.length > 0 ? (
        <>
          <div className="attendance-table-container" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Leaving Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffData.data.map((staff: Staff) => (
                  <tr key={staff.id} style={{ backgroundColor: '#fee2e2' }}>
                    <td>{staff.staff_id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        {staff.photo && (
                          <img src={staff.photo} alt={staff.first_name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                        )}
                        {staff.first_name} {staff.last_name || ''}
                      </div>
                    </td>
                    <td>{staff.role_name}</td>
                    <td>{staff.department_name || '-'}</td>
                    <td>{staff.designation_name || '-'}</td>
                    <td>{staff.leaving_date ? new Date(staff.leaving_date).toLocaleDateString() : '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                        <button
                          className="btn-primary btn-sm"
                          onClick={() => setViewStaffId(staff.id)}
                        >
                          View
                        </button>
                        <button
                          className="btn-success btn-sm"
                          onClick={() => handleEnable(staff.id)}
                          disabled={enableMutation.isLoading}
                        >
                          Enable
                        </button>
                        <button
                          className="btn-danger btn-sm"
                          onClick={() => handleDelete(staff.id)}
                          disabled={deleteMutation.isLoading}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {staffData.pagination && staffData.pagination.pages > 1 && (
            <div className="pagination" style={{ marginTop: 'var(--spacing-lg)' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span>Page {page} of {staffData.pagination.pages}</span>
              <button
                onClick={() => setPage(p => Math.min(staffData.pagination.pages, p + 1))}
                disabled={page === staffData.pagination.pages}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">No disabled staff members found.</div>
      )}

      {viewStaffId && (
        <ViewStaffModal
          staffId={viewStaffId}
          onClose={() => setViewStaffId(null)}
        />
      )}
    </div>
  );
};

// Payroll Tab
const PayrollTab = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [roleId, setRoleId] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<'not_generated' | 'generated' | 'paid' | ''>('');
  const [page, setPage] = useState(1);
  const [showGenerateSelectModal, setShowGenerateSelectModal] = useState(false);
  const [generateModal, setGenerateModal] = useState<{ staffId: number; month: number; year: number } | null>(null);
  const [payModal, setPayModal] = useState<number | null>(null);
  const [viewPayslipId, setViewPayslipId] = useState<number | null>(null);

  const { data: rolesData } = useQuery('roles', () => rolesService.getRoles());

  const { data: payrollData, isLoading, refetch } = useQuery(
    ['payroll', roleId, month, year, statusFilter, page],
    () => hrService.getPayroll({
      role_id: roleId ? Number(roleId) : undefined,
      month,
      year,
      status: statusFilter || undefined,
      page,
      limit: 20,
    }),
    { enabled: month > 0 && year > 0 }
  );

  const handleSearch = () => {
    setPage(1);
    refetch();
  };

  return (
    <div className="tab-content">
      <div className="form-filters" style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Role</label>
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
          >
            <option value="">All Roles</option>
            {rolesData?.data.map((role) => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min="2000"
            max="2100"
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="">All Status</option>
            <option value="not_generated">Not Generated</option>
            <option value="generated">Generated</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <button type="button" onClick={handleSearch} className="btn-primary">
          Search
        </button>
        <button type="button" onClick={() => setShowGenerateSelectModal(true)} className="btn-success">
          Generate Payroll
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading payroll...</div>
      ) : payrollData?.data && payrollData.data.length > 0 ? (
        <>
          <div className="attendance-table-container" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Basic Salary</th>
                  <th>Total Earnings</th>
                  <th>Total Deductions</th>
                  <th>Tax</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.data.map((payroll: any) => (
                  <tr key={payroll.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        {payroll.photo && (
                          <img src={payroll.photo} alt={payroll.first_name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                        )}
                        <div>
                          <div>{payroll.first_name} {payroll.last_name || ''}</div>
                          <small style={{ color: '#666' }}>{payroll.staff_staff_id}</small>
                        </div>
                      </div>
                    </td>
                    <td>{payroll.role_name}</td>
                    <td>{payroll.department_name || '-'}</td>
                    <td>₹{Number(payroll.basic_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>₹{Number(payroll.total_earnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>₹{Number(payroll.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>₹{Number(payroll.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td><strong>₹{Number(payroll.net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                    <td>
                      <span className={`status-badge status-${payroll.status}`}>
                        {payroll.status === 'not_generated' ? 'Not Generated' : 
                         payroll.status === 'generated' ? 'Generated' : 'Paid'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                        {payroll.status === 'not_generated' && (
                          <button
                            className="btn-primary btn-sm"
                            onClick={() => setGenerateModal({ staffId: payroll.staff_id, month: payroll.month, year: payroll.year })}
                          >
                            Generate
                          </button>
                        )}
                        {payroll.status === 'generated' && (
                          <>
                            <button
                              className="btn-success btn-sm"
                              onClick={() => setPayModal(payroll.id)}
                            >
                              Pay
                            </button>
                            <button
                              className="btn-secondary btn-sm"
                              onClick={() => {
                                if (window.confirm('Revert payroll status to Not Generated?')) {
                                  hrService.revertPayrollStatus(String(payroll.id), 'not_generated').then(() => {
                                    queryClient.invalidateQueries('payroll');
                                    showToast('Payroll status reverted successfully', 'success');
                                  }).catch((err: any) => {
                                    showToast(err.response?.data?.message || 'Failed to revert payroll status', 'error');
                                  });
                                }
                              }}
                            >
                              Revert
                            </button>
                          </>
                        )}
                        {payroll.status === 'paid' && (
                          <>
                            <button
                              className="btn-primary btn-sm"
                              onClick={() => setViewPayslipId(payroll.id)}
                            >
                              Payslip
                            </button>
                            <button
                              className="btn-secondary btn-sm"
                              onClick={() => {
                                if (window.confirm('Revert payroll status to Generated?')) {
                                  hrService.revertPayrollStatus(String(payroll.id), 'generated').then(() => {
                                    queryClient.invalidateQueries('payroll');
                                    showToast('Payroll status reverted successfully', 'success');
                                  }).catch((err: any) => {
                                    showToast(err.response?.data?.message || 'Failed to revert payroll status', 'error');
                                  });
                                }
                              }}
                            >
                              Revert
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {payrollData.pagination && payrollData.pagination.pages > 1 && (
            <div className="pagination" style={{ marginTop: 'var(--spacing-lg)' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span>Page {page} of {payrollData.pagination.pages}</span>
              <button
                onClick={() => setPage(p => Math.min(payrollData.pagination.pages, p + 1))}
                disabled={page === payrollData.pagination.pages}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">No payroll data found. Please select criteria and click Search.</div>
      )}

      {generateModal && (
        <GeneratePayrollModal
          staffId={generateModal.staffId}
          month={generateModal.month}
          year={generateModal.year}
          onClose={() => setGenerateModal(null)}
        />
      )}

      {showGenerateSelectModal && (
        <GeneratePayrollSelectModal
          defaultMonth={month}
          defaultYear={year}
          onClose={() => setShowGenerateSelectModal(false)}
          onContinue={({ staffId, month: selectedMonth, year: selectedYear }) => {
            setShowGenerateSelectModal(false);
            setGenerateModal({ staffId, month: selectedMonth, year: selectedYear });
          }}
        />
      )}

      {payModal && (
        <PayPayrollModal
          payrollId={payModal}
          onClose={() => setPayModal(null)}
        />
      )}

      {viewPayslipId && (
        <ViewPayslipModal
          payrollId={viewPayslipId}
          onClose={() => setViewPayslipId(null)}
        />
      )}
    </div>
  );
};

// Generate Payroll Select Modal
const GeneratePayrollSelectModal = ({
  defaultMonth,
  defaultYear,
  onClose,
  onContinue,
}: {
  defaultMonth: number;
  defaultYear: number;
  onClose: () => void;
  onContinue: (data: { staffId: number; month: number; year: number }) => void;
}) => {
  const { showToast } = useToast();
  const [staffId, setStaffId] = useState('');
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);

  const { data: staffData, isLoading } = useQuery(
    ['payroll-staff-list'],
    () =>
      hrService.getStaff({
        page: 1,
        limit: 100,
        is_active: true,
      }),
    { refetchOnWindowFocus: false }
  );

  const staffList = staffData?.data || [];

  const handleContinue = () => {
    if (!staffId) {
      showToast('Please select a staff member', 'error');
      return;
    }
    onContinue({ staffId: Number(staffId), month, year });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Generate Payroll" size="small">
      <div className="form-group">
        <label>Staff *</label>
        <select
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          disabled={isLoading}
          required
        >
          <option value="">{isLoading ? 'Loading staff...' : 'Select Staff'}</option>
          {staffList.map((staff: Staff) => (
            <option key={staff.id} value={staff.id}>
              {staff.first_name} {staff.last_name || ''} ({staff.staff_id})
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Month *</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Year *</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min="2000"
            max="2100"
          />
        </div>
      </div>
      <div className="modal-actions">
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button type="button" onClick={handleContinue} className="btn-success">
          Continue
        </button>
      </div>
    </Modal>
  );
};

// Generate Payroll Modal
const GeneratePayrollModal = ({ staffId, month, year, onClose }: { staffId: number; month: number; year: number; onClose: () => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    basic_salary: '',
    earnings: [{ earning_type: '', amount: '' }],
    deductions: [{ deduction_type: '', amount: '' }],
    tax: '',
  });

  const { data: staffData } = useQuery(
    ['staff', staffId],
    () => hrService.getStaffById(String(staffId)),
    { enabled: !!staffId }
  );

  const { data: attendanceData } = useQuery(
    ['staff-attendance-report', staffId, month, year],
    () => hrService.getStaffAttendanceReport({
      staff_id: staffId,
      month,
      year,
    }),
    { enabled: !!staffId }
  );

  useEffect(() => {
    if (staffData?.data) {
      setFormData(prev => ({
        ...prev,
        basic_salary: String(staffData.data.basic_salary || 0),
      }));
    }
  }, [staffData]);

  const generateMutation = useMutation(hrService.generatePayroll, {
    onSuccess: (response) => {
      queryClient.invalidateQueries('payroll');
      showToast(response.message || 'Payroll generated successfully', 'success');
      onClose();
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to generate payroll', 'error');
    },
  });

  const calculateNetSalary = () => {
    const basic = Number(formData.basic_salary || 0);
    const earningsTotal = formData.earnings.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const deductionsTotal = formData.deductions.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const tax = Number(formData.tax || 0);
    return basic + earningsTotal - deductionsTotal - tax;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate({
      staff_id: staffId,
      month,
      year,
      basic_salary: Number(formData.basic_salary),
      earnings: formData.earnings
        .filter(e => e.earning_type && e.amount)
        .map(e => ({ earning_type: e.earning_type, amount: Number(e.amount) })),
      deductions: formData.deductions
        .filter(d => d.deduction_type && d.amount)
        .map(d => ({ deduction_type: d.deduction_type, amount: Number(d.amount) })),
      tax: Number(formData.tax || 0),
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Generate Payroll" size="large">
      {staffData?.data && (
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h4>Staff Information</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Staff Name</label>
                <input type="text" value={`${staffData.data.first_name} ${staffData.data.last_name || ''}`} disabled />
              </div>
              <div className="form-group">
                <label>Staff ID</label>
                <input type="text" value={staffData.data.staff_id} disabled />
              </div>
            </div>
            {attendanceData?.data && attendanceData.data.length > 0 && (
              <div className="form-group">
                <label>Attendance Summary (Month)</label>
                <div style={{ padding: 'var(--spacing-md)', backgroundColor: '#f3f4f6', borderRadius: 'var(--radius-md)' }}>
                  <div>Present: {attendanceData.data[0].present_count || 0} | 
                        Late: {attendanceData.data[0].late_count || 0} | 
                        Absent: {attendanceData.data[0].absent_count || 0} | 
                        Half Day: {attendanceData.data[0].half_day_count || 0}</div>
                </div>
              </div>
            )}
          </div>

          <div className="form-section">
            <h4>Salary Details</h4>
            <div className="form-group">
              <label>Basic Salary *</label>
              <input
                type="number"
                value={formData.basic_salary}
                onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-section">
            <h4>Earnings</h4>
            {formData.earnings.map((earning, index) => (
              <div key={index} className="form-row">
                <div className="form-group">
                  <label>Earning Type</label>
                  <input
                    type="text"
                    value={earning.earning_type}
                    onChange={(e) => {
                      const newEarnings = [...formData.earnings];
                      newEarnings[index].earning_type = e.target.value;
                      setFormData({ ...formData, earnings: newEarnings });
                    }}
                    placeholder="e.g., Allowance, Bonus"
                  />
                </div>
                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    value={earning.amount}
                    onChange={(e) => {
                      const newEarnings = [...formData.earnings];
                      newEarnings[index].amount = e.target.value;
                      setFormData({ ...formData, earnings: newEarnings });
                    }}
                    min="0"
                    step="0.01"
                  />
                </div>
                {formData.earnings.length > 1 && (
                  <button
                    type="button"
                    className="btn-danger btn-sm"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        earnings: formData.earnings.filter((_, i) => i !== index),
                      });
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setFormData({
                  ...formData,
                  earnings: [...formData.earnings, { earning_type: '', amount: '' }],
                });
              }}
            >
              + Add Earning
            </button>
          </div>

          <div className="form-section">
            <h4>Deductions</h4>
            {formData.deductions.map((deduction, index) => (
              <div key={index} className="form-row">
                <div className="form-group">
                  <label>Deduction Type</label>
                  <input
                    type="text"
                    value={deduction.deduction_type}
                    onChange={(e) => {
                      const newDeductions = [...formData.deductions];
                      newDeductions[index].deduction_type = e.target.value;
                      setFormData({ ...formData, deductions: newDeductions });
                    }}
                    placeholder="e.g., PF, ESI, Advance"
                  />
                </div>
                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    value={deduction.amount}
                    onChange={(e) => {
                      const newDeductions = [...formData.deductions];
                      newDeductions[index].amount = e.target.value;
                      setFormData({ ...formData, deductions: newDeductions });
                    }}
                    min="0"
                    step="0.01"
                  />
                </div>
                {formData.deductions.length > 1 && (
                  <button
                    type="button"
                    className="btn-danger btn-sm"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        deductions: formData.deductions.filter((_, i) => i !== index),
                      });
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setFormData({
                  ...formData,
                  deductions: [...formData.deductions, { deduction_type: '', amount: '' }],
                });
              }}
            >
              + Add Deduction
            </button>
          </div>

          <div className="form-section">
            <h4>Tax</h4>
            <div className="form-group">
              <label>Tax Amount</label>
              <input
                type="number"
                value={formData.tax}
                onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-section">
            <h4>Payroll Summary</h4>
            <div style={{ padding: 'var(--spacing-md)', backgroundColor: '#f3f4f6', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                <span>Basic Salary:</span>
                <strong>₹{Number(formData.basic_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                <span>Total Earnings:</span>
                <strong>₹{(Number(formData.basic_salary || 0) + formData.earnings.reduce((sum, e) => sum + Number(e.amount || 0), 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                <span>Total Deductions:</span>
                <strong>₹{formData.deductions.reduce((sum, d) => sum + Number(d.amount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                <span>Tax:</span>
                <strong>₹{Number(formData.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 'var(--spacing-sm)', borderTop: '2px solid #d1d5db' }}>
                <span><strong>Net Salary:</strong></span>
                <strong style={{ fontSize: '1.2em', color: 'var(--primary-color)' }}>
                  ₹{calculateNetSalary().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={generateMutation.isLoading}>
              {generateMutation.isLoading ? 'Generating...' : 'Generate Payroll'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

// Pay Payroll Modal
const PayPayrollModal = ({ payrollId, onClose }: { payrollId: number; onClose: () => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'bank_transfer' as 'cash' | 'cheque' | 'bank_transfer' | 'online',
    payment_note: '',
  });

  const { data: payrollData } = useQuery(
    ['payroll', payrollId],
    () => hrService.getPayrollById(String(payrollId)),
    { enabled: !!payrollId }
  );

  const payMutation = useMutation(
    (data: any) => hrService.updatePayroll(String(payrollId), { ...data, status: 'paid' }),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('payroll');
        showToast(response.message || 'Payroll marked as paid successfully', 'success');
        onClose();
      },
      onError: (err: any) => {
        showToast(err.response?.data?.message || 'Failed to mark payroll as paid', 'error');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    payMutation.mutate(formData);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Proceed To Pay" size="medium">
      {payrollData?.data && (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Staff</label>
            <input type="text" value={`${payrollData.data.first_name} ${payrollData.data.last_name || ''} (${payrollData.data.staff_staff_id})`} disabled />
          </div>
          <div className="form-group">
            <label>Net Payment Amount</label>
            <input type="text" value={`₹${Number(payrollData.data.net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} disabled />
          </div>
          <div className="form-group">
            <label>Month - Year</label>
            <input type="text" value={`${new Date(2000, payrollData.data.month - 1).toLocaleString('default', { month: 'long' })} ${payrollData.data.year}`} disabled />
          </div>
          <div className="form-group">
            <label>Payment Mode *</label>
            <select
              value={formData.payment_mode}
              onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value as any })}
              required
            >
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="online">Online</option>
            </select>
          </div>
          <div className="form-group">
            <label>Payment Date *</label>
            <input
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <div className="form-group">
            <label>Note</label>
            <textarea
              value={formData.payment_note}
              onChange={(e) => setFormData({ ...formData, payment_note: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={payMutation.isLoading}>
              {payMutation.isLoading ? 'Processing...' : 'Mark as Paid'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

// View Payslip Modal
const ViewPayslipModal = ({ payrollId, onClose }: { payrollId: number; onClose: () => void }) => {
  const { data: payrollData, isLoading } = useQuery(
    ['payroll', payrollId],
    () => hrService.getPayrollById(String(payrollId)),
    { enabled: !!payrollId }
  );

  if (isLoading) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Payslip" size="large">
        <div className="loading">Loading payslip...</div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Payslip" size="large">
      {payrollData?.data && (
        <div className="payslip">
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
            <h2>PAYSLIP</h2>
            <p>{new Date(2000, payrollData.data.month - 1).toLocaleString('default', { month: 'long' })} {payrollData.data.year}</p>
          </div>

          <div className="form-section">
            <h4>Employee Information</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Name</label>
                <div>{payrollData.data.first_name} {payrollData.data.last_name || ''}</div>
              </div>
              <div className="form-group">
                <label>Staff ID</label>
                <div>{payrollData.data.staff_staff_id}</div>
              </div>
              <div className="form-group">
                <label>Department</label>
                <div>{payrollData.data.department_name || '-'}</div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Earnings</h4>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Basic Salary</td>
                  <td>₹{Number(payrollData.data.basic_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                {payrollData.data.earnings?.map((earning: any, index: number) => (
                  <tr key={index}>
                    <td>{earning.earning_type}</td>
                    <td>₹{Number(earning.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold' }}>
                  <td>Total Earnings</td>
                  <td>₹{Number(payrollData.data.total_earnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="form-section">
            <h4>Deductions</h4>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.data.deductions?.map((deduction: any, index: number) => (
                  <tr key={index}>
                    <td>{deduction.deduction_type}</td>
                    <td>₹{Number(deduction.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {payrollData.data.tax > 0 && (
                  <tr>
                    <td>Tax</td>
                    <td>₹{Number(payrollData.data.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                )}
                <tr style={{ fontWeight: 'bold' }}>
                  <td>Total Deductions</td>
                  <td>₹{(Number(payrollData.data.total_deductions || 0) + Number(payrollData.data.tax || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="form-section">
            <div style={{ padding: 'var(--spacing-lg)', backgroundColor: '#f3f4f6', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                Net Salary: ₹{Number(payrollData.data.net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              {payrollData.data.payment_date && (
                <div style={{ marginTop: 'var(--spacing-md)' }}>
                  <div>Payment Date: {new Date(payrollData.data.payment_date).toLocaleDateString()}</div>
                  <div>Payment Mode: {payrollData.data.payment_mode?.replace('_', ' ').toUpperCase()}</div>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => window.print()} className="btn-primary">
              Print Payslip
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

// ========== Teachers Rating Tab ==========
const TeachersRatingTab = () => {
  const [filterApproved, setFilterApproved] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | ''>('');

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: teachersData } = useQuery(
    'teachers-for-ratings',
    () => hrService.getStaff({ role_id: 3, is_active: true, limit: 1000 }),
    { refetchOnWindowFocus: false }
  );

  const { data: ratingsData, refetch: refetchRatings } = useQuery(
    ['teacher-ratings', filterApproved, selectedTeacherId],
    () => hrService.getTeacherRatings({
      teacher_id: selectedTeacherId ? Number(selectedTeacherId) : undefined,
      is_approved: filterApproved === 'approved' ? true : filterApproved === 'pending' ? false : undefined,
    }),
    { enabled: true }
  );

  const approveMutation = useMutation(hrService.approveTeacherRating, {
    onSuccess: () => {
      queryClient.invalidateQueries('teacher-ratings');
      refetchRatings();
      showToast('Rating approved successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to approve rating', 'error');
    },
  });

  const rejectMutation = useMutation(hrService.rejectTeacherRating, {
    onSuccess: () => {
      queryClient.invalidateQueries('teacher-ratings');
      refetchRatings();
      showToast('Rating rejected successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to reject rating', 'error');
    },
  });

  const handleApprove = (id: number) => {
    if (window.confirm('Are you sure you want to approve this rating?')) {
      approveMutation.mutate(String(id));
    }
  };

  const handleReject = (id: number) => {
    if (window.confirm('Are you sure you want to reject and delete this rating?')) {
      rejectMutation.mutate(String(id));
    }
  };

  const ratings = ratingsData?.data || [];
  const teachers = teachersData?.data || [];

  // Calculate average rating per teacher
  const teacherStats = teachers.map((teacher: any) => {
    const teacherRatings = ratings.filter((r: any) => r.teacher_id === teacher.id && r.is_approved);
    const avgRating = teacherRatings.length > 0
      ? teacherRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / teacherRatings.length
      : 0;
    return {
      ...teacher,
      totalRatings: teacherRatings.length,
      avgRating: avgRating.toFixed(1),
    };
  });

  return (
    <div className="hr-tab-content">
      <div className="tab-header">
        <h2>Teachers Rating</h2>
        <p>View and manage teacher ratings submitted by students</p>
      </div>

      <div className="form-section" style={{ marginBottom: '30px' }}>
        <div className="form-row">
          <div className="form-group">
            <label>Filter by Status</label>
            <select
              value={filterApproved}
              onChange={(e) => setFilterApproved(e.target.value)}
            >
              <option value="">All Ratings</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending Approval</option>
            </select>
          </div>
          <div className="form-group">
            <label>Filter by Teacher</label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">All Teachers</option>
              {teachers.map((teacher: any) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.first_name} {teacher.last_name || ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {ratings.length > 0 && (
        <div className="table-section">
          <h3>Teacher Ratings</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Student</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ratings.map((rating: any) => (
                <tr key={rating.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {rating.teacher_photo ? (
                        <img
                          src={rating.teacher_photo}
                          alt={rating.teacher_first_name}
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'var(--primary-color-light)',
                          color: 'var(--primary-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '14px',
                        }}>
                          {rating.teacher_first_name?.charAt(0) || 'T'}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          {rating.teacher_first_name} {rating.teacher_last_name || ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>
                        {rating.student_first_name} {rating.student_last_name || ''}
                      </div>
                      <div style={{ fontSize: '0.85em', color: 'var(--gray-600)' }}>
                        {rating.admission_no}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '1.2em' }}>⭐</span>
                      <span style={{ fontWeight: 'bold' }}>{rating.rating} / 5</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {rating.review || '-'}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${rating.is_approved ? 'status-active' : 'status-pending'}`}>
                      {rating.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td>{new Date(rating.created_at).toLocaleDateString()}</td>
                  <td>
                    {!rating.is_approved ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-primary"
                          onClick={() => handleApprove(rating.id)}
                          disabled={approveMutation.isLoading}
                          style={{ fontSize: '0.85em', padding: '5px 10px' }}
                        >
                          Approve
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleReject(rating.id)}
                          disabled={rejectMutation.isLoading}
                          style={{ fontSize: '0.85em', padding: '5px 10px' }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--gray-500)', fontSize: '0.9em' }}>Approved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ratings.length === 0 && (
        <div className="empty-state">
          <p>No ratings found for the selected criteria.</p>
        </div>
      )}

      <div className="info-box" style={{ marginTop: '30px', padding: '15px', background: 'var(--gray-50)', borderRadius: '8px' }}>
        <h4>Rating Statistics</h4>
        <p style={{ marginBottom: '15px', color: 'var(--gray-600)' }}>
          Teachers with at least 3 approved ratings will have their average rating displayed on their profile page.
        </p>
        <div className="teacher-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
          {teacherStats
            .filter((t: any) => t.totalRatings > 0)
            .sort((a: any, b: any) => b.totalRatings - a.totalRatings)
            .map((teacher: any) => (
              <div key={teacher.id} style={{
                background: 'var(--white)',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid var(--gray-200)',
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {teacher.first_name} {teacher.last_name || ''}
                </div>
                <div style={{ fontSize: '0.9em', color: 'var(--gray-600)' }}>
                  Average Rating: <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{teacher.avgRating} ⭐</span>
                </div>
                <div style={{ fontSize: '0.85em', color: 'var(--gray-500)', marginTop: '5px' }}>
                  Total Ratings: {teacher.totalRatings}
                  {teacher.totalRatings >= 3 && (
                    <span style={{ color: 'var(--success-color)', marginLeft: '5px' }}>✓ Displayed</span>
                  )}
                </div>
              </div>
            ))}
        </div>
        {teacherStats.filter((t: any) => t.totalRatings > 0).length === 0 && (
          <p style={{ color: 'var(--gray-500)', fontStyle: 'italic' }}>No ratings statistics available yet.</p>
        )}
      </div>
    </div>
  );
};

export default HR;

