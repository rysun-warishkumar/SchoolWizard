import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { studentsService } from '../../../services/api/studentsService';
import { settingsService } from '../../../services/api/settingsService';
import { useToast } from '../../../contexts/ToastContext';

interface StudentAdmissionTabProps {
  classes: any[];
  sections: any[];
}

const StudentAdmissionTab: React.FC<StudentAdmissionTabProps> = ({ classes, sections }) => {
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

export default StudentAdmissionTab;
