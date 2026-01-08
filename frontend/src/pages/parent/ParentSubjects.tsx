import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { academicsService } from '../../services/api/academicsService';
import { studentsService } from '../../services/api/studentsService';
import ChildSelector from '../../components/parent/ChildSelector';
import './ParentSubjects.css';

const ParentSubjects = () => {
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

  const { data: subjectsData, isLoading } = useQuery(
    'parent-subjects',
    () => academicsService.getSubjects(),
    { refetchOnWindowFocus: false }
  );

  const subjects = subjectsData?.data || [];

  if (children.length === 0) {
    return <div className="empty-state">No children found</div>;
  }

  return (
    <div className="parent-subjects-page">
      <div className="subjects-header">
        <h1>Subjects</h1>
      </div>

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onSelectChild={setSelectedChildId}
      />

      <div className="subjects-content">
        {isLoading ? (
          <div className="loading">Loading subjects...</div>
        ) : subjects.length === 0 ? (
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

export default ParentSubjects;

