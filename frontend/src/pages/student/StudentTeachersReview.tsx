import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { hrService } from '../../services/api/hrService';
import { studentsService } from '../../services/api/studentsService';
import { useToast } from '../../contexts/ToastContext';
import './StudentTeachersReview.css';

const StudentTeachersReview = () => {
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: studentData } = useQuery('my-student-profile', () => studentsService.getMyProfile(), {
    refetchOnWindowFocus: false,
  });

  const { data: teachersData, isLoading } = useQuery(
    'teachers-for-review',
    () =>
      hrService.getStaff({
        role_id: 3, // Teacher role
        is_active: true,
      }),
    { refetchOnWindowFocus: false }
  );

  const teachers = teachersData?.data || [];

  const submitReviewMutation = useMutation(
    async (data: { teacher_id: number; student_id: number; rating: number; review: string }) => {
      return hrService.submitTeacherRating(data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teacher-reviews');
        setSelectedTeacher(null);
        setRating(5);
        setReview('');
        showToast('Review submitted successfully', 'success');
      },
      onError: () => {
        showToast('Failed to submit review', 'error');
      },
    }
  );

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    const student = studentData?.data;
    if (!student || !selectedTeacher) return;

    submitReviewMutation.mutate({
      teacher_id: selectedTeacher.id,
      student_id: student.id,
      rating,
      review,
    });
  };

  if (isLoading) {
    return <div className="loading">Loading teachers...</div>;
  }

  return (
    <div className="student-teachers-review-page">
      <div className="review-header">
        <h1>Teachers Review</h1>
        <p className="review-description">Rate and review your teachers</p>
      </div>

      <div className="review-content">
        {teachers.length === 0 ? (
          <div className="empty-state">No teachers available for review</div>
        ) : (
          <div className="teachers-grid">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="teacher-review-card">
                <div className="teacher-photo-section">
                  {teacher.photo ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}${teacher.photo.startsWith('/') ? teacher.photo : '/' + teacher.photo}`}
                      alt={`${teacher.first_name} ${teacher.last_name || ''}`}
                      className="teacher-photo"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const placeholder = target.nextElementSibling as HTMLElement;
                        if (placeholder && placeholder.classList.contains('teacher-photo-placeholder')) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className="teacher-photo-placeholder"
                    style={{ display: teacher.photo && teacher.photo.trim() !== '' ? 'none' : 'flex' }}
                  >
                    {teacher.first_name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="teacher-info">
                  <h3>
                    {teacher.first_name} {teacher.last_name || ''}
                  </h3>
                  {teacher.designation_name && (
                    <p className="designation">{teacher.designation_name}</p>
                  )}
                  {teacher.department_name && (
                    <p className="department">{teacher.department_name}</p>
                  )}
                </div>
                <button
                  className="btn-review"
                  onClick={() => setSelectedTeacher(teacher)}
                >
                  Rate & Review
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTeacher && (
        <div className="modal-overlay" onClick={() => setSelectedTeacher(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rate & Review {selectedTeacher.first_name} {selectedTeacher.last_name || ''}</h2>
              <button className="modal-close" onClick={() => setSelectedTeacher(null)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitReview} className="review-form">
              <div className="form-group">
                <label>Rating *</label>
                <div className="rating-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-button ${star <= rating ? 'active' : ''}`}
                      onClick={() => setRating(star)}
                    >
                      ⭐
                    </button>
                  ))}
                  <span className="rating-value">{rating} / 5</span>
                </div>
              </div>
              <div className="form-group">
                <label>Review</label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={5}
                  placeholder="Write your review about this teacher..."
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setSelectedTeacher(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitReviewMutation.isLoading}>
                  {submitReviewMutation.isLoading ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTeachersReview;

