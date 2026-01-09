import { useQuery } from 'react-query';
import { hrService } from '../../services/api/hrService';
import './StudentTeachers.css';

const StudentTeachers = () => {
  const { data: teachersData, isLoading } = useQuery(
    'teachers-list',
    () =>
      hrService.getStaff({
        role_id: 3, // Assuming role_id 3 is for teachers
        is_active: true,
      }),
    { refetchOnWindowFocus: false }
  );

  const teachers = teachersData?.data || [];

  if (isLoading) {
    return <div className="loading">Loading teachers...</div>;
  }

  return (
    <div className="student-teachers-page">
      <div className="teachers-header">
        <h1>Teachers</h1>
      </div>

      <div className="teachers-content">
        {teachers.length === 0 ? (
          <div className="empty-state">No teachers available</div>
        ) : (
          <div className="teachers-grid">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="teacher-card">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTeachers;

