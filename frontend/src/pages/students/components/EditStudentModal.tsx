import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { studentsService, Student } from '../../../services/api/studentsService';
import { settingsService } from '../../../services/api/settingsService';
import { transportService } from '../../../services/api/transportService';
import { useToast } from '../../../contexts/ToastContext';
import Modal from '../../../components/common/Modal';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface EditStudentModalProps {
  studentId: number;
  classes: any[];
  sections: any[];
  onClose: () => void;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({ studentId, classes, sections, onClose }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data: studentData, isLoading } = useQuery(
    ['student', studentId],
    () => studentsService.getStudentById(String(studentId)),
    { enabled: !!studentId }
  );

  const { data: sessionsResponse } = useQuery('sessions', () => settingsService.getSessions());
  const sessionsData = sessionsResponse?.data || [];
  const { data: routes = [] } = useQuery('transport-routes-for-student-edit', () => transportService.getRoutes(), {
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  // Helper function to format date to YYYY-MM-DD for date inputs
  const formatDateForInput = (dateValue: string | null | undefined): string => {
    if (!dateValue) return '';
    
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // Try to parse as Date and format
    try {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      // If parsing fails, try to extract YYYY-MM-DD from string
      const match = dateValue.match(/(\d{4}-\d{2}-\d{2})/);
      if (match) {
        return match[1];
      }
    }
    
    return '';
  };

  useEffect(() => {
    if (studentData?.data) {
      const student = studentData.data;
      setFormData({
        admission_no: student.admission_no || '',
        roll_no: student.roll_no || '',
        class_id: String(student.class_id || ''),
        section_id: String(student.section_id || ''),
        session_id: String(student.session_id || ''),
        transport_route_id: student.transport_route_id ? String(student.transport_route_id) : '',
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        gender: student.gender || 'male',
        date_of_birth: formatDateForInput(student.date_of_birth),
        student_mobile: student.student_mobile || '',
        email: student.email || '',
        admission_date: formatDateForInput(student.admission_date),
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

  const updatePasswordMutation = useMutation(
    (payload: { id: string; new_password: string }) =>
      studentsService.updateStudentPassword(payload.id, payload.new_password),
    {
      onSuccess: (response) => {
        showToast(response.message || 'Password updated successfully', 'success');
        setIsPasswordModalOpen(false);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError(null);
      },
      onError: (err: any) => {
        const status = Number(err?.response?.status || 0);
        const errorMessage =
          status === 404
            ? 'Password update API not found (404). Please restart backend server and try again.'
            : err.response?.data?.message || 'Failed to update password';
        setPasswordError(errorMessage);
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
      transport_route_id: formData.transport_route_id ? Number(formData.transport_route_id) : null,
      gender: formData.gender as 'male' | 'female' | 'other',
    });
  };

  const handleOpenPasswordModal = () => {
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsPasswordModalOpen(true);
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (!newPassword) {
      setPasswordError('Please enter new password.');
      showToast('Please enter new password', 'error');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      showToast('Password must be at least 8 characters long', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Password and confirm password do not match.');
      showToast('Password and confirm password do not match', 'error');
      return;
    }

    updatePasswordMutation.mutate({ id: String(studentId), new_password: newPassword });
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
              <label>Transport Route</label>
              <select
                value={formData.transport_route_id || ''}
                onChange={(e) => setFormData({ ...formData, transport_route_id: e.target.value })}
              >
                <option value="">Not Assigned</option>
                {routes.map((route: any) => (
                  <option key={route.id} value={route.id}>
                    {route.title}
                  </option>
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
                Only Father&apos;s email is used for parent portal login when enabled.
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
            </div>
          </div>
        </div>

        <div
          className="form-actions"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" onClick={handleOpenPasswordModal} className="btn-secondary">
              Update Password
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
          <button type="submit" className="btn-primary" disabled={updateMutation.isLoading}>
            {updateMutation.isLoading ? 'Updating...' : 'Update Student'}
          </button>
        </div>
      </form>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Update Student Password"
        size="small"
      >
        <form onSubmit={handlePasswordUpdate}>
          {passwordError && (
            <div
              className="error-message"
              style={{
                padding: 'var(--spacing-sm)',
                marginBottom: 'var(--spacing-md)',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #fca5a5',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              {passwordError}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="student_new_password">New Password</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                id="student_new_password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="Minimum 8 characters"
                required
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowNewPassword((prev) => !prev)}
                style={{ minWidth: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                title={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="student_confirm_password">Confirm Password</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                id="student_confirm_password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="Re-enter password"
                required
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                style={{ minWidth: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsPasswordModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={updatePasswordMutation.isLoading}>
              {updatePasswordMutation.isLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </Modal>
    </Modal>
  );
};

export default EditStudentModal;
