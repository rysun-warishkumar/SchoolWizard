import React from 'react';
import { useQuery } from 'react-query';
import { academicsService } from '../../services/api/academicsService';
import { studentsService } from '../../services/api/studentsService';
import './StudentSubjects.css';

const StudentSubjects = () => {
  const { data: student } = useQuery('my-student-profile', () => studentsService.getMyProfile(), {
    refetchOnWindowFocus: false,
  });

  const { data: subjectsData, isLoading } = useQuery(
    'subjects',
    () => academicsService.getSubjects(),
    { refetchOnWindowFocus: false }
  );

  const subjects = subjectsData?.data || [];

  if (isLoading) {
    return <div className="loading">Loading subjects...</div>;
  }

  return (
    <div className="student-subjects-page">
      <div className="subjects-header">
        <h1>Subjects</h1>
        {student && (
          <p className="class-info">
            {student.class_name} - {student.section_name}
          </p>
        )}
      </div>

      <div className="subjects-content">
        {subjects.length === 0 ? (
          <div className="empty-state">No subjects available</div>
        ) : (
          <div className="subjects-grid">
            {subjects.map((subject) => (
              <div key={subject.id} className="subject-card">
                <div className="subject-icon">📚</div>
                <div className="subject-info">
                  <h3>{subject.name}</h3>
                  {subject.code && <p className="subject-code">Code: {subject.code}</p>}
                  <p className="subject-type">
                    Type: {subject.type === 'theory' ? 'Theory' : 'Practical'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSubjects;

