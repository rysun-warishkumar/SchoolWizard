import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { hrService } from '../../services/api/hrService';
import './StaffClasses.css';

const StaffClasses = () => {
  const [selectedClass, setSelectedClass] = useState<{ class_id: number; section_id: number } | null>(null);

  const { data: classesData, isLoading } = useQuery(
    'my-classes',
    () => hrService.getMyClasses(),
    { refetchOnWindowFocus: false }
  );

  const classes = classesData?.data || [];

  if (isLoading) {
    return <div className="loading">Loading classes...</div>;
  }

  return (
    <div className="staff-classes-page">
      <div className="page-header">
        <h1>My Classes & Subjects</h1>
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <p>No classes assigned to you yet.</p>
          <p className="empty-state-subtitle">Please contact the administrator to get assigned to classes.</p>
        </div>
      ) : (
        <div className="classes-content">
          <div className="classes-list">
            {classes.map((classItem: any) => (
              <div
                key={`${classItem.class_id}-${classItem.section_id}`}
                className={`class-card ${selectedClass?.class_id === classItem.class_id && selectedClass?.section_id === classItem.section_id ? 'active' : ''}`}
                onClick={() => setSelectedClass({ class_id: classItem.class_id, section_id: classItem.section_id })}
              >
                <div className="class-header">
                  <h3>{classItem.class_name} - {classItem.section_name}</h3>
                  {classItem.subjects && classItem.subjects.length > 0 && (
                    <span className="subjects-count">{classItem.subjects.length} Subject{classItem.subjects.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
                {classItem.subjects && classItem.subjects.length > 0 && (
                  <div className="subjects-preview">
                    {classItem.subjects.slice(0, 3).map((subject: any) => (
                      <span key={subject.id} className="subject-tag">
                        {subject.name}
                      </span>
                    ))}
                    {classItem.subjects.length > 3 && (
                      <span className="subject-tag more">+{classItem.subjects.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {selectedClass && (
            <div className="class-details">
              {(() => {
                const selectedClassData = classes.find(
                  (c: any) => c.class_id === selectedClass.class_id && c.section_id === selectedClass.section_id
                );
                return selectedClassData ? (
                  <>
                    <h2>{selectedClassData.class_name} - {selectedClassData.section_name}</h2>
                    {selectedClassData.subjects && selectedClassData.subjects.length > 0 ? (
                      <div className="subjects-list">
                        <h3>Subjects</h3>
                        <div className="subjects-grid">
                          {selectedClassData.subjects.map((subject: any) => (
                            <div key={subject.id} className="subject-card">
                              <div className="subject-icon">📚</div>
                              <div className="subject-info">
                                <h4>{subject.name}</h4>
                                {subject.code && <p className="subject-code">Code: {subject.code}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="empty-state">
                        <p>No subjects assigned for this class.</p>
                      </div>
                    )}
                  </>
                ) : null;
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffClasses;

