import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { studentsService, Student } from '../../services/api/studentsService';
import { academicsService } from '../../services/api/academicsService';
import { settingsService } from '../../services/api/settingsService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import './Students.css';

const Students = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'admission' | 'online-admissions' | 'categories' | 'houses' | 'disable-reasons' | 'promote'>('list');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const queryClient = useQueryClient();

  const { data: studentsData, isLoading } = useQuery(
    ['students', page, classFilter, sectionFilter, searchTerm],
    () => studentsService.getStudents({
      page,
      limit: 20,
      class_id: classFilter ? Number(classFilter) : undefined,
      section_id: sectionFilter ? Number(sectionFilter) : undefined,
      search: searchTerm || undefined,
    })
  );

  const { data: classesData } = useQuery('classes', () => academicsService.getClasses());
  const { data: sectionsData } = useQuery('sections', () => academicsService.getSections());

  const { showToast } = useToast();

  const deleteMutation = useMutation(studentsService.deleteStudent, {
    onSuccess: () => {
      queryClient.invalidateQueries('students');
      showToast('Student deleted successfully', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to delete student', 'error');
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      deleteMutation.mutate(String(id));
    }
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
      const hasOverflow = container.scrollWidth > container.clientWidth;
      
      if (hasOverflow) {
        setShowLeftArrow(container.scrollLeft > 5);
        setShowRightArrow(
          container.scrollLeft < container.scrollWidth - container.clientWidth - 5
        );
      } else {
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
      
      setTimeout(() => {
        checkArrows();
      }, 300);
    }
  };

  // Initialize and check arrows
  useEffect(() => {
    checkArrows();
    scrollToActiveTab();
  }, []);

  // Check arrows on scroll and window resize
  useEffect(() => {
    const container = tabsContainerRef.current;
    if (container) {
      checkArrows();
      container.addEventListener('scroll', checkArrows);
      window.addEventListener('resize', checkArrows);
      
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
    <div className="students-page">
      <div className="page-header">
        <h1>Student Information</h1>
        <button className="btn-primary" onClick={() => setActiveTab('admission')}>
          + Add Student
        </button>
      </div>

      <div className="students-tabs-wrapper">
        <div className="students-tabs-container">
          {showLeftArrow && (
            <button
              className="students-tabs-arrow students-tabs-arrow-left"
              onClick={() => scrollTabs('left')}
              aria-label="Scroll tabs left"
            >
              ‹
            </button>
          )}
          <div className="students-tabs" ref={tabsContainerRef}>
            <button
              ref={activeTab === 'list' ? activeTabRef : null}
              className={activeTab === 'list' ? 'active' : ''}
              onClick={() => setActiveTab('list')}
            >
              Student List
            </button>
            <button
              ref={activeTab === 'admission' ? activeTabRef : null}
              className={activeTab === 'admission' ? 'active' : ''}
              onClick={() => setActiveTab('admission')}
            >
              Student Admission
            </button>
            <button
              ref={activeTab === 'online-admissions' ? activeTabRef : null}
              className={activeTab === 'online-admissions' ? 'active' : ''}
              onClick={() => setActiveTab('online-admissions')}
            >
              Online Admissions
            </button>
            <button
              ref={activeTab === 'categories' ? activeTabRef : null}
              className={activeTab === 'categories' ? 'active' : ''}
              onClick={() => setActiveTab('categories')}
            >
              Categories
            </button>
            <button
              ref={activeTab === 'houses' ? activeTabRef : null}
              className={activeTab === 'houses' ? 'active' : ''}
              onClick={() => setActiveTab('houses')}
            >
              Houses
            </button>
            <button
              ref={activeTab === 'disable-reasons' ? activeTabRef : null}
              className={activeTab === 'disable-reasons' ? 'active' : ''}
              onClick={() => setActiveTab('disable-reasons')}
            >
              Disable Reasons
            </button>
            <button
              ref={activeTab === 'promote' ? activeTabRef : null}
              className={activeTab === 'promote' ? 'active' : ''}
              onClick={() => setActiveTab('promote')}
            >
              Promote Students
            </button>
          </div>
          {showRightArrow && (
            <button
              className="students-tabs-arrow students-tabs-arrow-right"
              onClick={() => scrollTabs('right')}
              aria-label="Scroll tabs right"
            >
              ›
            </button>
          )}
        </div>
      </div>

      <div className="students-content">
        {activeTab === 'list' && (
          <StudentListTab
            students={studentsData?.data || []}
            classes={classesData?.data || []}
            sections={sectionsData?.data || []}
            pagination={studentsData?.pagination}
            classFilter={classFilter}
            sectionFilter={sectionFilter}
            searchTerm={searchTerm}
            onClassFilterChange={setClassFilter}
            onSectionFilterChange={setSectionFilter}
            onSearchChange={setSearchTerm}
            onPageChange={setPage}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        )}
        {activeTab === 'admission' && (
          <StudentAdmissionTab
            classes={classesData?.data || []}
            sections={sectionsData?.data || []}
          />
        )}
        {activeTab === 'online-admissions' && (
          <OnlineAdmissionsTab />
        )}
        {activeTab === 'categories' && (
          <CategoriesTab />
        )}
        {activeTab === 'houses' && (
          <HousesTab />
        )}
        {activeTab === 'disable-reasons' && (
          <DisableReasonsTab />
        )}
        {activeTab === 'promote' && (
          <PromoteStudentsTab
            classes={classesData?.data || []}
            sections={sectionsData?.data || []}
          />
        )}
      </div>
    </div>
  );
};

// Student List Tab
const StudentListTab = ({
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
}: any) => {
  const [viewStudentId, setViewStudentId] = useState<number | null>(null);
  const [editStudentId, setEditStudentId] = useState<number | null>(null);

  return (
    <div className="tab-content">
      <div className="filters">
        <input
          type="text"
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => { onSearchChange(e.target.value); onPageChange(1); }}
          className="search-input"
        />
        <select
          value={classFilter}
          onChange={(e) => { onClassFilterChange(e.target.value); onPageChange(1); }}
          className="filter-select"
        >
          <option value="">All Classes</option>
          {classes.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={sectionFilter}
          onChange={(e) => { onSectionFilterChange(e.target.value); onPageChange(1); }}
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

          {pagination && pagination.pages > 1 && (
            <div className="pagination">
              <button onClick={() => onPageChange((p: number) => Math.max(1, p - 1))} disabled={pagination.page === 1}>
                Previous
              </button>
              <span>Page {pagination.page} of {pagination.pages}</span>
              <button onClick={() => onPageChange((p: number) => Math.min(pagination.pages, p + 1))} disabled={pagination.page === pagination.pages}>
                Next
              </button>
            </div>
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

// View Student Modal
const ViewStudentModal = ({ studentId, onClose }: { studentId: number; onClose: () => void }) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: studentData, isLoading, refetch } = useQuery(
    ['student', studentId],
    () => studentsService.getStudentById(String(studentId)),
    { enabled: !!studentId }
  );

  const student = studentData?.data;

  const updatePhotoMutation = useMutation(
    (formData: FormData) => studentsService.updateStudentWithPhoto(String(studentId), formData),
    {
      onSuccess: () => {
        showToast('Photo updated successfully', 'success');
        setIsUploadingPhoto(false);
        // Keep photoPreview until refetch completes
        refetch().then(() => {
          setPhotoPreview(null);
        });
        queryClient.invalidateQueries(['student', studentId]);
        queryClient.invalidateQueries('students');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update photo', 'error');
        setIsUploadingPhoto(false);
        setPhotoPreview(null);
      },
    }
  );

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size should be less than 2MB', 'error');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    setIsUploadingPhoto(true);
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('photo', file, file.name);
    
    // Debug: Verify file is in FormData
    console.log('Uploading file:', file.name, file.size, file.type);
    console.log('FormData entries:', Array.from(formData.entries()).map(([k, v]) => [k, (v && typeof v === 'object' && 'constructor' in v && (v as any).constructor.name === 'File') ? `${(v as File).name} (${(v as File).size} bytes)` : v]));
    
    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result as string;
      setPhotoPreview(previewUrl);
    };
    reader.readAsDataURL(file);
    
    // Upload file
    updatePhotoMutation.mutate(formData);
  };


  // Helper function to get photo URL
  const getPhotoUrl = (photo: string | null | undefined): string | null => {
    if (!photo) return null;
    
    const photoStr = String(photo).trim();
    if (!photoStr || photoStr === 'null' || photoStr === 'undefined') return null;
    
    // File path - construct full URL
    if (photoStr.startsWith('/uploads/')) {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
      return apiBaseUrl.replace('/api/v1', '') + photoStr;
    }
    
    // Data URL (base64) - return as-is (browser handles it directly)
    if (photoStr.startsWith('data:image/')) {
      return photoStr;
    }
    
    // External URL - return as-is
    if (photoStr.startsWith('http://') || photoStr.startsWith('https://')) {
      return photoStr;
    }
    
    // Relative path - construct URL
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    return apiBaseUrl.replace('/api/v1', '') + (photoStr.startsWith('/') ? photoStr : '/' + photoStr);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Student Details: ${student ? `${student.first_name} ${student.last_name || ''}` : ''}`} size="xlarge">
      {isLoading ? (
        <div className="loading">Loading student details...</div>
      ) : student ? (
        <div className="student-details-view">
          {/* Student Header Section */}
          <div className="student-details-header">
            {(() => {
              const photoUrl = getPhotoUrl(student.photo);
              
              const displayPhotoUrl = photoPreview || photoUrl;
              const displayHasPhoto = displayPhotoUrl !== null && displayPhotoUrl !== '';

              return (
                <div className="student-photo-container">
                  <div className="student-photo-wrapper">
                    {displayHasPhoto ? (
                      <img 
                        key={`photo-${student.id}`}
                        src={displayPhotoUrl!}
                        alt={`${student.first_name} ${student.last_name || ''}`}
                        className="student-photo-large"
                        style={{ display: 'block' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const wrapper = target.parentElement;
                          const placeholder = wrapper?.querySelector('.student-photo-placeholder-large') as HTMLElement;
                          if (placeholder) {
                            placeholder.style.display = 'flex';
                          }
                        }}
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement;
                          const placeholder = target.parentElement?.querySelector('.student-photo-placeholder-large') as HTMLElement;
                          if (placeholder) {
                            placeholder.style.display = 'none';
                          }
                        }}
                      />
                    ) : null}
                    <div 
                      className="student-photo-placeholder-large"
                      data-student-id={student.id}
                      style={{
                        display: displayHasPhoto ? 'none' : 'flex',
                      }}
                    >
                      {student.first_name?.charAt(0).toUpperCase() || 'S'}
                      {student.last_name?.charAt(0).toUpperCase() || ''}
                    </div>
                    {displayHasPhoto && (
                      <div className="student-photo-hover-overlay"></div>
                    )}
                    <div className="student-photo-upload-overlay">
                      <label className="photo-upload-label" title="Update Photo">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          disabled={isUploadingPhoto}
                          style={{ display: 'none' }}
                        />
                        <span className="photo-upload-icon">📷</span>
                        {isUploadingPhoto && <span className="uploading-text">Uploading...</span>}
                      </label>
                    </div>
                  </div>
                </div>
              );
            })()}
            <div className="student-header-info">
              <h3>{student.first_name} {student.last_name || ''}</h3>
              <div className="student-header-meta">
                <span className="meta-item">
                  <strong>Admission No:</strong> {student.admission_no}
                </span>
                {student.roll_no && (
                  <span className="meta-item">
                    <strong>Roll No:</strong> {student.roll_no}
                  </span>
                )}
                <span className={`status-badge-large ${student.is_active ? 'active' : 'inactive'}`}>
                  {student.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Student Information Sections */}
          <div className="student-details-sections">
            {/* Basic Information */}
            <div className="student-info-section">
              <h3 className="section-title">Basic Information</h3>
              <div className="student-info-grid">
                <div className="info-item">
                  <span className="info-label">Class:</span>
                  <span className="info-value">{student.class_name || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Section:</span>
                  <span className="info-value">{student.section_name || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Session:</span>
                  <span className="info-value">{(student as any).session_name || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Gender:</span>
                  <span className="info-value capitalize">{student.gender || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Date of Birth:</span>
                  <span className="info-value">{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Admission Date:</span>
                  <span className="info-value">{student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '-'}</span>
                </div>
                {student.category_name && (
                  <div className="info-item">
                    <span className="info-label">Category:</span>
                    <span className="info-value">{student.category_name}</span>
                  </div>
                )}
                {student.house_name && (
                  <div className="info-item">
                    <span className="info-label">House:</span>
                    <span className="info-value">{student.house_name}</span>
                  </div>
                )}
                {student.blood_group && (
                  <div className="info-item">
                    <span className="info-label">Blood Group:</span>
                    <span className="info-value">{student.blood_group}</span>
                  </div>
                )}
                {student.religion && (
                  <div className="info-item">
                    <span className="info-label">Religion:</span>
                    <span className="info-value">{student.religion}</span>
                  </div>
                )}
                {student.caste && (
                  <div className="info-item">
                    <span className="info-label">Caste:</span>
                    <span className="info-value">{student.caste}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            {(student.student_mobile || student.email) && (
              <div className="student-info-section">
                <h3 className="section-title">Contact Information</h3>
                <div className="student-info-grid">
                  {student.student_mobile && (
                    <div className="info-item">
                      <span className="info-label">Student Mobile:</span>
                      <span className="info-value">{student.student_mobile}</span>
                    </div>
                  )}
                  {student.email && (
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{student.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Parent/Guardian Information */}
            {(student.father_name || student.mother_name || (student as any).guardian_name) && (
              <div className="student-info-section">
                <h3 className="section-title">Parent/Guardian Information</h3>
                <div className="student-info-grid">
                  {student.father_name && (
                    <>
                      <div className="info-item">
                        <span className="info-label">Father Name:</span>
                        <span className="info-value">{student.father_name}</span>
                      </div>
                      {student.father_phone && (
                        <div className="info-item">
                          <span className="info-label">Father Phone:</span>
                          <span className="info-value">{student.father_phone}</span>
                        </div>
                      )}
                      {student.father_email && (
                        <div className="info-item">
                          <span className="info-label">Father Email:</span>
                          <span className="info-value">{student.father_email}</span>
                        </div>
                      )}
                    </>
                  )}
                  {student.mother_name && (
                    <>
                      <div className="info-item">
                        <span className="info-label">Mother Name:</span>
                        <span className="info-value">{student.mother_name}</span>
                      </div>
                      {student.mother_phone && (
                        <div className="info-item">
                          <span className="info-label">Mother Phone:</span>
                          <span className="info-value">{student.mother_phone}</span>
                        </div>
                      )}
                      {student.mother_email && (
                        <div className="info-item">
                          <span className="info-label">Mother Email:</span>
                          <span className="info-value">{student.mother_email}</span>
                        </div>
                      )}
                    </>
                  )}
                  {(student as any).guardian_name && (
                    <>
                      <div className="info-item">
                        <span className="info-label">Guardian Name:</span>
                        <span className="info-value">{(student as any).guardian_name}</span>
                      </div>
                      {(student as any).guardian_phone && (
                        <div className="info-item">
                          <span className="info-label">Guardian Phone:</span>
                          <span className="info-value">{(student as any).guardian_phone}</span>
                        </div>
                      )}
                      {(student as any).guardian_email && (
                        <div className="info-item">
                          <span className="info-label">Guardian Email:</span>
                          <span className="info-value">{(student as any).guardian_email}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="error-message">Student not found</div>
      )}
    </Modal>
  );
};

// Edit Student Modal
const EditStudentModal = ({ studentId, classes, sections, onClose }: { studentId: number; classes: any[]; sections: any[]; onClose: () => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: studentData, isLoading } = useQuery(
    ['student', studentId],
    () => studentsService.getStudentById(String(studentId)),
    { enabled: !!studentId }
  );

  const { data: sessionsResponse } = useQuery('sessions', () => settingsService.getSessions());
  const sessionsData = sessionsResponse?.data || [];

  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  useEffect(() => {
    if (studentData?.data) {
      const student = studentData.data;
      setFormData({
        admission_no: student.admission_no || '',
        roll_no: student.roll_no || '',
        class_id: String(student.class_id || ''),
        section_id: String(student.section_id || ''),
        session_id: String(student.session_id || ''),
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        gender: student.gender || 'male',
        date_of_birth: student.date_of_birth || '',
        student_mobile: student.student_mobile || '',
        email: student.email || '',
        admission_date: student.admission_date || '',
        father_name: student.father_name || '',
        father_phone: student.father_phone || '',
        father_email: student.father_email || '',
        mother_name: student.mother_name || '',
        mother_phone: student.mother_phone || '',
        mother_email: student.mother_email || '',
        guardian_name: student.guardian_name || '',
        guardian_phone: student.guardian_phone || '',
        guardian_email: student.guardian_email || '',
        photo: student.photo || '',
      });
      setPhotoPreview(student.photo || '');
    }
  }, [studentData]);

  const updateMutation = useMutation(
    (data: Partial<Student>) => studentsService.updateStudent(String(studentId), data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('students');
        queryClient.invalidateQueries(['student', studentId]);
        showToast(response.message || 'Student updated successfully', 'success');
        setPhotoPreview('');
        onClose();
      },
      onError: (err: any) => {
        const errorMessage = err.response?.data?.message || 'Failed to update student';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.admission_no || !formData.class_id || !formData.section_id || !formData.first_name) {
      setError('Please fill in all required fields');
      return;
    }

    updateMutation.mutate({
      ...formData,
      class_id: Number(formData.class_id),
      section_id: Number(formData.section_id),
      session_id: Number(formData.session_id),
      gender: formData.gender as 'male' | 'female' | 'other',
    });
  };

  if (isLoading) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Edit Student" size="large">
        <div className="loading">Loading student details...</div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Student" size="large">
      <form onSubmit={handleSubmit} className="student-admission-form">
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
              <label htmlFor="edit_admission_no">Admission No *</label>
              <input
                type="text"
                id="edit_admission_no"
                name="admission_no"
                value={formData.admission_no || ''}
                onChange={(e) => setFormData({ ...formData, admission_no: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit_roll_no">Roll No</label>
              <input
                type="text"
                id="edit_roll_no"
                name="roll_no"
                value={formData.roll_no || ''}
                onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Session *</label>
              <select
                value={formData.session_id || ''}
                onChange={(e) => setFormData({ ...formData, session_id: e.target.value })}
                required
              >
                <option value="">Select Session</option>
                {sessionsData?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.is_current ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Class *</label>
              <select
                value={formData.class_id || ''}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                required
              >
                <option value="">Select Class</option>
                {classes.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Section *</label>
              <select
                value={formData.section_id || ''}
                onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                required
              >
                <option value="">Select Section</option>
                {sections.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Admission Date *</label>
              <input
                type="date"
                value={formData.admission_date || ''}
                onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                required
              />
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
              <label>Date of Birth *</label>
              <input
                type="date"
                value={formData.date_of_birth || ''}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Student Mobile</label>
              <input
                type="tel"
                value={formData.student_mobile || ''}
                onChange={(e) => setFormData({ ...formData, student_mobile: e.target.value })}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@example.com"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Parent/Guardian Information</h4>
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
              <label>Father Phone</label>
              <input
                type="tel"
                value={formData.father_phone || ''}
                onChange={(e) => setFormData({ ...formData, father_phone: e.target.value })}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Father Email</label>
              <input
                type="email"
                value={formData.father_email || ''}
                onChange={(e) => setFormData({ ...formData, father_email: e.target.value })}
                placeholder="father@example.com"
              />
              <small style={{ color: 'var(--gray-500)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--spacing-xs)', display: 'block' }}>
                Parent account will be created automatically with this email
              </small>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Mother Name</label>
              <input
                type="text"
                value={formData.mother_name || ''}
                onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Mother Phone</label>
              <input
                type="tel"
                value={formData.mother_phone || ''}
                onChange={(e) => setFormData({ ...formData, mother_phone: e.target.value })}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Mother Email</label>
              <input
                type="email"
                value={formData.mother_email || ''}
                onChange={(e) => setFormData({ ...formData, mother_email: e.target.value })}
                placeholder="mother@example.com"
              />
              <small style={{ color: 'var(--gray-500)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--spacing-xs)', display: 'block' }}>
                Parent account will be created automatically with this email
              </small>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Guardian Name</label>
              <input
                type="text"
                value={formData.guardian_name || ''}
                onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Guardian Phone</label>
              <input
                type="tel"
                value={formData.guardian_phone || ''}
                onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Guardian Email</label>
              <input
                type="email"
                value={formData.guardian_email || ''}
                onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })}
                placeholder="guardian@example.com"
              />
              <small style={{ color: 'var(--gray-500)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--spacing-xs)', display: 'block' }}>
                Parent account will be created automatically with this email
              </small>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={updateMutation.isLoading}>
            {updateMutation.isLoading ? 'Updating...' : 'Update Student'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Student Admission Tab
const StudentAdmissionTab = ({ classes, sections }: any) => {
  const [formData, setFormData] = useState({
    admission_no: '',
    roll_no: '',
    class_id: '',
    section_id: '',
    session_id: '',
    first_name: '',
    last_name: '',
    gender: 'male',
    date_of_birth: '',
    student_mobile: '',
    email: '',
    admission_date: new Date().toISOString().split('T')[0],
    photo: '',
    father_name: '',
    father_phone: '',
    father_email: '',
    mother_name: '',
    mother_phone: '',
    mother_email: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
  });
  const [photoPreview, setPhotoPreview] = useState<string>('');

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Fetch sessions and auto-select current session
  const { data: sessionsResponse } = useQuery('sessions', () => settingsService.getSessions());
  const sessionsData = sessionsResponse?.data || [];

  useEffect(() => {
    if (sessionsData && sessionsData.length > 0 && !formData.session_id) {
      const currentSession = sessionsData.find((s: any) => s.is_current);
      if (currentSession) {
        setFormData(prev => ({ ...prev, session_id: String(currentSession.id) }));
      }
    }
  }, [sessionsData, formData.session_id]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    setFieldErrors({});
    setError(null);

    // Required field validations
    if (!formData.admission_no || formData.admission_no.trim() === '') {
      errors.admission_no = 'Admission number is required';
    }

    if (!formData.class_id) {
      errors.class_id = 'Class is required';
    }

    if (!formData.section_id) {
      errors.section_id = 'Section is required';
    }

    if (!formData.session_id) {
      errors.session_id = 'Session is required';
    }

    if (!formData.first_name || formData.first_name.trim() === '') {
      errors.first_name = 'First name is required';
    }

    if (!formData.gender) {
      errors.gender = 'Gender is required';
    }

    if (!formData.date_of_birth) {
      errors.date_of_birth = 'Date of birth is required';
    } else {
      const dobDate = new Date(formData.date_of_birth);
      const today = new Date();
      if (dobDate > today) {
        errors.date_of_birth = 'Date of birth cannot be in the future';
      }
    }

    if (!formData.admission_date) {
      errors.admission_date = 'Admission date is required';
    }

    // Email validation
    if (formData.email && formData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    // Validate parent emails if provided
    if (formData.father_email && formData.father_email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.father_email.trim())) {
        errors.father_email = 'Please enter a valid email address';
      }
    }

    if (formData.mother_email && formData.mother_email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.mother_email.trim())) {
        errors.mother_email = 'Please enter a valid email address';
      }
    }

    if (formData.guardian_email && formData.guardian_email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.guardian_email.trim())) {
        errors.guardian_email = 'Please enter a valid email address';
      }
    }

    // Phone validation
    if (formData.student_mobile && formData.student_mobile.trim() !== '') {
      const phoneRegex = /^[0-9]{10}$/;
      const cleanedPhone = formData.student_mobile.replace(/\D/g, '');
      if (!phoneRegex.test(cleanedPhone)) {
        errors.student_mobile = 'Please enter a valid 10-digit mobile number';
      }
    }

    // Father phone validation
    if (formData.father_phone && formData.father_phone.trim() !== '') {
      const phoneRegex = /^[0-9]{10}$/;
      const cleanedPhone = formData.father_phone.replace(/\D/g, '');
      if (!phoneRegex.test(cleanedPhone)) {
        errors.father_phone = 'Please enter a valid 10-digit mobile number';
      }
    }

    // Mother phone validation
    if (formData.mother_phone && formData.mother_phone.trim() !== '') {
      const phoneRegex = /^[0-9]{10}$/;
      const cleanedPhone = formData.mother_phone.replace(/\D/g, '');
      if (!phoneRegex.test(cleanedPhone)) {
        errors.mother_phone = 'Please enter a valid 10-digit mobile number';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the errors in the form before submitting.');
      return false;
    }

    return true;
  };

  const createMutation = useMutation(studentsService.createStudent, {
    onSuccess: (response) => {
      queryClient.invalidateQueries('students');
      setError(null);
      setFieldErrors({});
      
      // Show success toast message
      const successMessage = response.message || 'Student admitted successfully!';
      showToast(successMessage, 'success');
      
      // Reset form
      const currentSessionId = sessionsData?.find((s: any) => s.is_current)?.id;
      setFormData({
        admission_no: '',
        roll_no: '',
        class_id: '',
        section_id: '',
        session_id: currentSessionId ? String(currentSessionId) : '',
        first_name: '',
        last_name: '',
        gender: 'male',
        date_of_birth: '',
        student_mobile: '',
        email: '',
        admission_date: new Date().toISOString().split('T')[0],
        photo: '',
        father_name: '',
        father_phone: '',
        father_email: '',
        mother_name: '',
        mother_phone: '',
        mother_email: '',
        guardian_name: '',
        guardian_phone: '',
        guardian_email: '',
      });
      setPhotoPreview('');
    },
    onError: (err: any) => {
      // Extract error message from response
      let errorMessage = 'Failed to create student. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setFieldErrors({});
      showToast(errorMessage, 'error');

      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Client-side validation
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    createMutation.mutate({
      ...formData,
      class_id: Number(formData.class_id),
      section_id: Number(formData.section_id),
      session_id: Number(formData.session_id),
      gender: formData.gender as 'male' | 'female' | 'other',
    });
  };

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Student Admission</h3>
      </div>

      <form onSubmit={handleSubmit} className="student-admission-form">
        {error && (
          <div className="error-message" style={{ 
            padding: 'var(--spacing-md)', 
            marginBottom: 'var(--spacing-lg)', 
            backgroundColor: '#fee2e2', 
            color: '#991b1b', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid #fca5a5',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)'
          }}>
            <span style={{ fontSize: '1.2em' }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="form-section">
          <h4>Basic Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="admission_no">Admission No *</label>
              <input
                type="text"
                id="admission_no"
                name="admission_no"
                value={formData.admission_no}
                onChange={(e) => {
                  setFormData({ ...formData, admission_no: e.target.value });
                  if (fieldErrors.admission_no) {
                    setFieldErrors({ ...fieldErrors, admission_no: '' });
                  }
                }}
                className={fieldErrors.admission_no ? 'error' : ''}
                required
              />
              {fieldErrors.admission_no && (
                <span className="field-error">{fieldErrors.admission_no}</span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="roll_no">Roll No</label>
              <input
                type="text"
                id="roll_no"
                name="roll_no"
                value={formData.roll_no}
                onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Session *</label>
              <select
                value={formData.session_id}
                onChange={(e) => {
                  setFormData({ ...formData, session_id: e.target.value });
                  if (fieldErrors.session_id) {
                    setFieldErrors({ ...fieldErrors, session_id: '' });
                  }
                }}
                className={fieldErrors.session_id ? 'error' : ''}
                required
              >
                <option value="">Select Session</option>
                {sessionsData?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.is_current ? '(Current)' : ''}
                  </option>
                ))}
              </select>
              {fieldErrors.session_id && (
                <span className="field-error">{fieldErrors.session_id}</span>
              )}
            </div>
            <div className="form-group">
              <label>Class *</label>
              <select
                value={formData.class_id}
                onChange={(e) => {
                  setFormData({ ...formData, class_id: e.target.value });
                  if (fieldErrors.class_id) {
                    setFieldErrors({ ...fieldErrors, class_id: '' });
                  }
                }}
                className={fieldErrors.class_id ? 'error' : ''}
                required
              >
                <option value="">Select Class</option>
                {classes.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {fieldErrors.class_id && (
                <span className="field-error">{fieldErrors.class_id}</span>
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Section *</label>
              <select
                value={formData.section_id}
                onChange={(e) => {
                  setFormData({ ...formData, section_id: e.target.value });
                  if (fieldErrors.section_id) {
                    setFieldErrors({ ...fieldErrors, section_id: '' });
                  }
                }}
                className={fieldErrors.section_id ? 'error' : ''}
                required
              >
                <option value="">Select Section</option>
                {sections.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {fieldErrors.section_id && (
                <span className="field-error">{fieldErrors.section_id}</span>
              )}
            </div>
            <div className="form-group">
              <label>Admission Date *</label>
              <input
                type="date"
                value={formData.admission_date}
                onChange={(e) => {
                  setFormData({ ...formData, admission_date: e.target.value });
                  if (fieldErrors.admission_date) {
                    setFieldErrors({ ...fieldErrors, admission_date: '' });
                  }
                }}
                className={fieldErrors.admission_date ? 'error' : ''}
                max={new Date().toISOString().split('T')[0]}
                required
              />
              {fieldErrors.admission_date && (
                <span className="field-error">{fieldErrors.admission_date}</span>
              )}
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
                  if (fieldErrors.first_name) {
                    setFieldErrors({ ...fieldErrors, first_name: '' });
                  }
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
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date of Birth *</label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => {
                  setFormData({ ...formData, date_of_birth: e.target.value });
                  if (fieldErrors.date_of_birth) {
                    setFieldErrors({ ...fieldErrors, date_of_birth: '' });
                  }
                }}
                className={fieldErrors.date_of_birth ? 'error' : ''}
                max={new Date().toISOString().split('T')[0]}
                required
              />
              {fieldErrors.date_of_birth && (
                <span className="field-error">{fieldErrors.date_of_birth}</span>
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Student Mobile</label>
              <input
                type="tel"
                value={formData.student_mobile}
                onChange={(e) => {
                  setFormData({ ...formData, student_mobile: e.target.value });
                  if (fieldErrors.student_mobile) {
                    setFieldErrors({ ...fieldErrors, student_mobile: '' });
                  }
                }}
                className={fieldErrors.student_mobile ? 'error' : ''}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
              {fieldErrors.student_mobile && (
                <span className="field-error">{fieldErrors.student_mobile}</span>
              )}
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (fieldErrors.email) {
                    setFieldErrors({ ...fieldErrors, email: '' });
                  }
                }}
                className={fieldErrors.email ? 'error' : ''}
                placeholder="student@example.com"
              />
              {fieldErrors.email && (
                <span className="field-error">{fieldErrors.email}</span>
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Student Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Validate file size (max 2MB)
                    if (file.size > 2 * 1024 * 1024) {
                      showToast('Image size should be less than 2MB', 'error');
                      return;
                    }
                    // Validate file type
                    if (!file.type.startsWith('image/')) {
                      showToast('Please select a valid image file', 'error');
                      return;
                    }
                    // Convert to base64
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64String = reader.result as string;
                      setFormData({ ...formData, photo: base64String });
                      setPhotoPreview(base64String);
                    };
                    reader.onerror = () => {
                      showToast('Error reading image file', 'error');
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              {photoPreview && (
                <div style={{ marginTop: 'var(--spacing-sm)' }}>
                  <img
                    src={photoPreview}
                    alt="Preview"
                    style={{
                      width: '150px',
                      height: '150px',
                      objectFit: 'cover',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--border-radius)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview('');
                      setFormData({ ...formData, photo: '' });
                    }}
                    style={{
                      marginTop: 'var(--spacing-xs)',
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      fontSize: 'var(--font-size-sm)',
                      backgroundColor: 'var(--error-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--border-radius)',
                      cursor: 'pointer',
                    }}
                  >
                    Remove Photo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Parent/Guardian Information</h4>
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
              <label>Father Phone</label>
              <input
                type="tel"
                value={formData.father_phone}
                onChange={(e) => {
                  setFormData({ ...formData, father_phone: e.target.value });
                  if (fieldErrors.father_phone) {
                    setFieldErrors({ ...fieldErrors, father_phone: '' });
                  }
                }}
                className={fieldErrors.father_phone ? 'error' : ''}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
              {fieldErrors.father_phone && (
                <span className="field-error">{fieldErrors.father_phone}</span>
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Father Email</label>
              <input
                type="email"
                value={formData.father_email}
                onChange={(e) => {
                  setFormData({ ...formData, father_email: e.target.value });
                  if (fieldErrors.father_email) {
                    setFieldErrors({ ...fieldErrors, father_email: '' });
                  }
                }}
                className={fieldErrors.father_email ? 'error' : ''}
                placeholder="father@example.com"
              />
              {fieldErrors.father_email && (
                <span className="field-error">{fieldErrors.father_email}</span>
              )}
              <small style={{ color: 'var(--gray-500)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--spacing-xs)', display: 'block' }}>
                Parent account will be created automatically with this email
              </small>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Mother Name</label>
              <input
                type="text"
                value={formData.mother_name}
                onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Mother Phone</label>
              <input
                type="tel"
                value={formData.mother_phone}
                onChange={(e) => {
                  setFormData({ ...formData, mother_phone: e.target.value });
                  if (fieldErrors.mother_phone) {
                    setFieldErrors({ ...fieldErrors, mother_phone: '' });
                  }
                }}
                className={fieldErrors.mother_phone ? 'error' : ''}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
              {fieldErrors.mother_phone && (
                <span className="field-error">{fieldErrors.mother_phone}</span>
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Mother Email</label>
              <input
                type="email"
                value={formData.mother_email}
                onChange={(e) => {
                  setFormData({ ...formData, mother_email: e.target.value });
                  if (fieldErrors.mother_email) {
                    setFieldErrors({ ...fieldErrors, mother_email: '' });
                  }
                }}
                className={fieldErrors.mother_email ? 'error' : ''}
                placeholder="mother@example.com"
              />
              {fieldErrors.mother_email && (
                <span className="field-error">{fieldErrors.mother_email}</span>
              )}
              <small style={{ color: 'var(--gray-500)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--spacing-xs)', display: 'block' }}>
                Parent account will be created automatically with this email
              </small>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Guardian Name</label>
              <input
                type="text"
                value={formData.guardian_name}
                onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Guardian Phone</label>
              <input
                type="tel"
                value={formData.guardian_phone}
                onChange={(e) => {
                  setFormData({ ...formData, guardian_phone: e.target.value });
                  if (fieldErrors.guardian_phone) {
                    setFieldErrors({ ...fieldErrors, guardian_phone: '' });
                  }
                }}
                className={fieldErrors.guardian_phone ? 'error' : ''}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
              {fieldErrors.guardian_phone && (
                <span className="field-error">{fieldErrors.guardian_phone}</span>
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Guardian Email</label>
              <input
                type="email"
                value={formData.guardian_email}
                onChange={(e) => {
                  setFormData({ ...formData, guardian_email: e.target.value });
                  if (fieldErrors.guardian_email) {
                    setFieldErrors({ ...fieldErrors, guardian_email: '' });
                  }
                }}
                className={fieldErrors.guardian_email ? 'error' : ''}
                placeholder="guardian@example.com"
              />
              {fieldErrors.guardian_email && (
                <span className="field-error">{fieldErrors.guardian_email}</span>
              )}
              <small style={{ color: 'var(--gray-500)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--spacing-xs)', display: 'block' }}>
                Parent account will be created automatically with this email
              </small>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
            {createMutation.isLoading ? 'Saving...' : 'Save Student'}
          </button>
          {createMutation.isLoading && (
            <span style={{ marginLeft: 'var(--spacing-md)', color: 'var(--gray-600)' }}>
              Please wait...
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

// Online Admissions Tab
const OnlineAdmissionsTab = () => {
  const { data: admissionsData, isLoading } = useQuery('online-admissions', () => studentsService.getOnlineAdmissions());
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const approveMutation = useMutation(studentsService.approveOnlineAdmission, {
    onSuccess: () => {
      queryClient.invalidateQueries('online-admissions');
      queryClient.invalidateQueries('students');
      showToast('Admission approved and student created!', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to approve admission', 'error');
    },
  });

  const rejectMutation = useMutation(studentsService.rejectOnlineAdmission, {
    onSuccess: () => {
      queryClient.invalidateQueries('online-admissions');
      showToast('Admission rejected!', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to reject admission', 'error');
    },
  });

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Online Admissions</h3>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Class</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admissionsData?.data.map((admission: any) => (
                <tr key={admission.id}>
                  <td>{admission.first_name} {admission.last_name || ''}</td>
                  <td>{admission.class_name || '-'}</td>
                  <td>{admission.phone || '-'}</td>
                  <td>{admission.email || '-'}</td>
                  <td>
                    <span className={`status-badge ${admission.status === 'approved' ? 'active' : admission.status === 'rejected' ? 'inactive' : 'pending'}`}>
                      {admission.status}
                    </span>
                  </td>
                  <td>{new Date(admission.created_at).toLocaleDateString()}</td>
                  <td>
                    {admission.status === 'pending' && (
                      <div className="action-buttons">
                        <button onClick={() => approveMutation.mutate(String(admission.id))} className="btn-edit">
                          Approve
                        </button>
                        <button onClick={() => rejectMutation.mutate(String(admission.id))} className="btn-delete">
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Categories Tab
const CategoriesTab = () => {
  const { data: categoriesData } = useQuery('student-categories', () => studentsService.getCategories());
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '' });

  const createMutation = useMutation(studentsService.createCategory, {
    onSuccess: () => {
      queryClient.invalidateQueries('student-categories');
      setShowModal(false);
      setFormData({ name: '' });
    },
  });

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Student Categories</h3>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Category</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {categoriesData?.data.map((cat: any) => (
              <tr key={cat.id}>
                <td>{cat.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Category</h2>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }}>
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Houses Tab
const HousesTab = () => {
  const { data: housesData } = useQuery('student-houses', () => studentsService.getHouses());
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '' });

  const createMutation = useMutation(studentsService.createHouse, {
    onSuccess: () => {
      queryClient.invalidateQueries('student-houses');
      setShowModal(false);
      setFormData({ name: '' });
    },
  });

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Student Houses</h3>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add House</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {housesData?.data.map((house: any) => (
              <tr key={house.id}>
                <td>{house.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add House</h2>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }}>
              <div className="form-group">
                <label>House Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Disable Reasons Tab
const DisableReasonsTab = () => {
  const { data: reasonsData } = useQuery('disable-reasons', () => studentsService.getDisableReasons());
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '' });

  const createMutation = useMutation(studentsService.createDisableReason, {
    onSuccess: () => {
      queryClient.invalidateQueries('disable-reasons');
      setShowModal(false);
      setFormData({ name: '' });
    },
  });

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Disable Reasons</h3>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Reason</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {reasonsData?.data.map((reason: any) => (
              <tr key={reason.id}>
                <td>{reason.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Disable Reason</h2>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }}>
              <div className="form-group">
                <label>Reason Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Promote Students Tab
const PromoteStudentsTab = ({ classes, sections }: { classes: any[]; sections: any[] }) => {
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('');
  const [selectedSectionId, setSelectedSectionId] = useState<number | ''>('');
  const [targetSessionId, setTargetSessionId] = useState<number | ''>('');
  const [targetClassId, setTargetClassId] = useState<number | ''>('');
  const [targetSectionId, setTargetSectionId] = useState<number | ''>('');
  const [studentPromotions, setStudentPromotions] = useState<Record<number, { current_result: 'pass' | 'fail' | ''; next_session_status: 'continue' | 'leave' | '' }>>({});

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: sessionsData } = useQuery('sessions', () => settingsService.getSessions());

  const { data: studentsData, refetch: refetchStudents } = useQuery(
    ['promote-students', selectedClassId, selectedSectionId],
    () => studentsService.getStudentsForPromotion({
      class_id: Number(selectedClassId),
      section_id: Number(selectedSectionId),
    }),
    { enabled: false }
  );

  const promoteMutation = useMutation(studentsService.promoteStudents, {
    onSuccess: () => {
      queryClient.invalidateQueries('students');
      refetchStudents();
      setStudentPromotions({});
      showToast('Students promoted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to promote students', 'error');
    },
  });

  const handleSearch = () => {
    if (!selectedClassId || !selectedSectionId) {
      showToast('Please select both class and section', 'error');
      return;
    }
    refetchStudents();
    setStudentPromotions({});
  };

  const handlePromote = () => {
    if (!targetSessionId) {
      showToast('Please select target session', 'error');
      return;
    }

    const students = studentsData?.data || [];
    const promotions = students
      .filter((student: any) => {
        const promotion = studentPromotions[student.id];
        return promotion && promotion.current_result && promotion.next_session_status;
      })
      .map((student: any) => ({
        student_id: student.id,
        current_result: studentPromotions[student.id].current_result as 'pass' | 'fail',
        next_session_status: studentPromotions[student.id].next_session_status as 'continue' | 'leave',
      }));

    if (promotions.length === 0) {
      showToast('Please set promotion details for at least one student', 'error');
      return;
    }

    promoteMutation.mutate({
      promotions,
      target_session_id: Number(targetSessionId),
      target_class_id: targetClassId ? Number(targetClassId) : undefined,
      target_section_id: targetSectionId ? Number(targetSectionId) : undefined,
    });
  };

  const students = studentsData?.data || [];
  const sessions = sessionsData?.data || [];

  const availableSections = selectedClassId
    ? sections.filter(s => {
        const selectedClass = classes.find(c => c.id === Number(selectedClassId));
        if (!selectedClass?.section_ids) return false;
        const sectionIds = selectedClass.section_ids.split(',').map((id: string) => Number(id.trim())).filter((id: number) => !isNaN(id));
        return sectionIds.includes(s.id);
      })
    : [];

  const availableTargetSections = targetClassId
    ? sections.filter(s => {
        const selectedClass = classes.find(c => c.id === Number(targetClassId));
        if (!selectedClass?.section_ids) return false;
        const sectionIds = selectedClass.section_ids.split(',').map((id: string) => Number(id.trim())).filter((id: number) => !isNaN(id));
        return sectionIds.includes(s.id);
      })
    : [];

  return (
    <div className="students-tab-content">
      <div className="tab-header">
        <h2>Promote Students</h2>
        <p>Promote students to next session and class-section based on their exam results</p>
      </div>

      <div className="form-section" style={{ marginBottom: '30px' }}>
        <h3>Select Current Class-Section</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value ? Number(e.target.value) : '');
                setSelectedSectionId('');
              }}
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Section</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value ? Number(e.target.value) : '')}
              disabled={!selectedClassId}
            >
              <option value="">Select Section</option>
              {availableSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <button className="btn-primary btn-wm" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>
      </div>

      {students.length > 0 && (
        <>
          <div className="form-section" style={{ marginBottom: '30px' }}>
            <h3>Promotion Target</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Promote In Session</label>
                <select
                  value={targetSessionId}
                  onChange={(e) => setTargetSessionId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">Select Session</option>
                  {sessions.map((session: any) => (
                    <option key={session.id} value={session.id}>
                      {session.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Class</label>
                <select
                  value={targetClassId}
                  onChange={(e) => {
                    setTargetClassId(e.target.value ? Number(e.target.value) : '');
                    setTargetSectionId('');
                  }}
                >
                  <option value="">Same Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Section</label>
                <select
                  value={targetSectionId}
                  onChange={(e) => setTargetSectionId(e.target.value ? Number(e.target.value) : '')}
                  disabled={!targetClassId}
                >
                  <option value="">Same Section</option>
                  {availableTargetSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="table-section">
            <h3>Student List</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Current Class</th>
                  <th>Current Section</th>
                  <th>Current Session</th>
                  <th>Current Result</th>
                  <th>Next Session Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student: any) => (
                  <tr key={student.id}>
                    <td>{student.admission_no}</td>
                    <td>{student.first_name} {student.last_name}</td>
                    <td>{student.class_name}</td>
                    <td>{student.section_name}</td>
                    <td>{student.session_name}</td>
                    <td>
                      <select
                        value={studentPromotions[student.id]?.current_result || ''}
                        onChange={(e) => {
                          setStudentPromotions({
                            ...studentPromotions,
                            [student.id]: {
                              ...studentPromotions[student.id],
                              current_result: e.target.value as 'pass' | 'fail' | '',
                            },
                          });
                        }}
                      >
                        <option value="">Select</option>
                        <option value="pass">Pass</option>
                        <option value="fail">Fail</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={studentPromotions[student.id]?.next_session_status || ''}
                        onChange={(e) => {
                          setStudentPromotions({
                            ...studentPromotions,
                            [student.id]: {
                              ...studentPromotions[student.id],
                              next_session_status: e.target.value as 'continue' | 'leave' | '',
                            },
                          });
                        }}
                      >
                        <option value="">Select</option>
                        <option value="continue">Continue</option>
                        <option value="leave">Leave</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-actions" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn-primary"
              onClick={handlePromote}
              disabled={promoteMutation.isLoading || !targetSessionId}
            >
              {promoteMutation.isLoading ? 'Promoting...' : 'Promote'}
            </button>
          </div>

          <div className="info-box" style={{ marginTop: '20px', padding: '15px', background: 'var(--gray-50)', borderRadius: '8px' }}>
            <h4>Promotion Logic:</h4>
            <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
              <li><strong>Pass + Continue:</strong> Promoted to next session and next class-section</li>
              <li><strong>Fail + Continue:</strong> Promoted to next session, class-section remains same</li>
              <li><strong>Pass + Leave:</strong> Not promoted (stays in current session and class-section)</li>
              <li><strong>Fail + Leave:</strong> Not promoted (stays in current session and class-section)</li>
            </ul>
          </div>
        </>
      )}

      {students.length === 0 && selectedClassId && selectedSectionId && (
        <div className="empty-state">
          <p>No students found for the selected class and section.</p>
        </div>
      )}
    </div>
  );
};

export default Students;

