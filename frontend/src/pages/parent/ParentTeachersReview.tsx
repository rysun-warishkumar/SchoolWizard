import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { hrService } from '../../services/api/hrService';
import { studentsService } from '../../services/api/studentsService';
import ChildSelector from '../../components/parent/ChildSelector';
import './ParentTeachersReview.css';

const ParentTeachersReview = () => {
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  const { data: childrenData } = useQuery('my-children', () => studentsService.getMyChildren(), {
    refetchOnWindowFocus: false,
  });

  const children = childrenData?.data || [];

  React.useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const { data: teachersData, isLoading } = useQuery(
    'parent-teachers-for-review',
    () =>
      hrService.getStaff({
        role_id: 3, // Teacher role
        is_active: true,
      }),
    { refetchOnWindowFocus: false }
  );

  const teachers = teachersData?.data || [];

  if (children.length === 0) {
    return <div className="empty-state">No children found</div>;
  }

  return (
    <div className="parent-teachers-review-page">
      <div className="review-header">
        <h1>Teachers Review</h1>
        <p className="page-subtitle">View teachers for your child's class</p>
      </div>

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onSelectChild={setSelectedChildId}
      />

      <div className="review-content">
        {isLoading ? (
          <div className="loading">Loading teachers...</div>
        ) : teachers.length === 0 ? (
          <div className="empty-state">No teachers available</div>
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
                  {teacher.email && (
                    <p className="email">{teacher.email}</p>
                  )}
                  {teacher.phone && (
                    <p className="phone">{teacher.phone}</p>
                  )}
                </div>
                <div className="review-note">
                  <p>Note: Only students can submit reviews for teachers.</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentTeachersReview;

