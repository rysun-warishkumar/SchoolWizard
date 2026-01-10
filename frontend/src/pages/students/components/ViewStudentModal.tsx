import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { studentsService } from '../../../services/api/studentsService';
import { useToast } from '../../../contexts/ToastContext';
import Modal from '../../../components/common/Modal';

interface ViewStudentModalProps {
  studentId: number;
  onClose: () => void;
}

const ViewStudentModal: React.FC<ViewStudentModalProps> = ({ studentId, onClose }) => {
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

export default ViewStudentModal;
