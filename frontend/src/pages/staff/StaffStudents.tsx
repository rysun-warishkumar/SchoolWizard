import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { hrService } from '../../services/api/hrService';
import './StaffStudents.css';

const StaffStudents = () => {
  const [selectedClass, setSelectedClass] = useState<{ class_id: number; section_id: number } | null>(null);

  const { data: classesData } = useQuery('my-classes', () => hrService.getMyClasses(), {
    refetchOnWindowFocus: false,
  });

  const { data: studentsData, isLoading } = useQuery(
    ['my-students', selectedClass],
    () => hrService.getMyStudents(selectedClass || undefined),
    {
      enabled: !!classesData?.data,
      refetchOnWindowFocus: false,
    }
  );

  const classes = classesData?.data || [];
  const students = studentsData?.data || [];

  // Auto-select first class if none selected
  React.useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass({
        class_id: classes[0].class_id,
        section_id: classes[0].section_id,
      });
    }
  }, [classes, selectedClass]);

  return (
    <div className="staff-students-page">
      <div className="page-header">
        <h1>My Students</h1>
        {classes.length > 0 && (
          <div className="class-selector">
            <label>Filter by Class:</label>
            <select
              value={selectedClass ? `${selectedClass.class_id}-${selectedClass.section_id}` : ''}
              onChange={(e) => {
                if (e.target.value) {
                  const [class_id, section_id] = e.target.value.split('-').map(Number);
                  setSelectedClass({ class_id, section_id });
                } else {
                  setSelectedClass(null);
                }
              }}
            >
              <option value="">All Classes</option>
              {classes.map((classItem: any) => (
                <option
                  key={`${classItem.class_id}-${classItem.section_id}`}
                  value={`${classItem.class_id}-${classItem.section_id}`}
                >
                  {classItem.class_name} - {classItem.section_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <p>No classes assigned to you yet.</p>
          <p className="empty-state-subtitle">Please contact the administrator to get assigned to classes.</p>
        </div>
      ) : isLoading ? (
        <div className="loading">Loading students...</div>
      ) : students.length === 0 ? (
        <div className="empty-state">
          <p>No students found for the selected class.</p>
        </div>
      ) : (
        <div className="students-content">
          <div className="students-stats">
            <div className="stat-card">
              <span className="stat-label">Total Students</span>
              <span className="stat-value">{students.length}</span>
            </div>
            {selectedClass && (
              <div className="stat-card">
                <span className="stat-label">Class</span>
                <span className="stat-value">
                  {classes.find(
                    (c: any) => c.class_id === selectedClass.class_id && c.section_id === selectedClass.section_id
                  )?.class_name || ''}{' '}
                  -{' '}
                  {classes.find(
                    (c: any) => c.class_id === selectedClass.class_id && c.section_id === selectedClass.section_id
                  )?.section_name || ''}
                </span>
              </div>
            )}
          </div>

          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Category</th>
                  <th>Email</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student: any) => (
                  <tr key={student.id}>
                    <td>{student.admission_no}</td>
                    <td>
                      <div className="student-name-cell">
                        {student.photo ? (
                          <img
                            src={`${import.meta.env.VITE_API_BASE_URL}${student.photo.startsWith('/') ? student.photo : '/' + student.photo}`}
                            alt={student.first_name}
                            className="student-photo"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="student-photo-placeholder">
                            {student.first_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span>
                          {student.first_name} {student.last_name || ''}
                        </span>
                      </div>
                    </td>
                    <td>{student.class_name || '-'}</td>
                    <td>{student.section_name || '-'}</td>
                    <td>{student.category_name || '-'}</td>
                    <td>{student.email || '-'}</td>
                    <td>{student.phone || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffStudents;

