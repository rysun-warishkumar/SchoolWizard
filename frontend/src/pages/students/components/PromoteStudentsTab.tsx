import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { studentsService } from '../../../services/api/studentsService';
import { settingsService } from '../../../services/api/settingsService';
import { useToast } from '../../../contexts/ToastContext';

interface PromoteStudentsTabProps {
  classes: any[];
  sections: any[];
}

const PromoteStudentsTab: React.FC<PromoteStudentsTabProps> = ({ classes, sections }) => {
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('');
  const [selectedSectionId, setSelectedSectionId] = useState<number | ''>('');
  const [targetSessionId, setTargetSessionId] = useState<number | ''>('');
  const [targetClassId, setTargetClassId] = useState<number | ''>('');
  const [targetSectionId, setTargetSectionId] = useState<number | ''>('');
  const [studentPromotions, setStudentPromotions] = useState<Record<number, { current_result: 'pass' | 'fail' | ''; next_session_status: 'continue' | 'leave' | '' }>>({});

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: sessionsData } = useQuery('sessions', () => settingsService.getSessions());

  const { data: studentsData, refetch: refetchStudents } = useQuery(
    ['promote-students', selectedClassId, selectedSectionId],
    () => studentsService.getStudentsForPromotion({
      class_id: Number(selectedClassId),
      section_id: Number(selectedSectionId),
    }),
    { enabled: false }
  );

  const promoteMutation = useMutation(studentsService.promoteStudents, {
    onSuccess: () => {
      queryClient.invalidateQueries('students');
      refetchStudents();
      setStudentPromotions({});
      showToast('Students promoted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to promote students', 'error');
    },
  });

  const handleSearch = () => {
    if (!selectedClassId || !selectedSectionId) {
      showToast('Please select both class and section', 'error');
      return;
    }
    refetchStudents();
    setStudentPromotions({});
  };

  const handlePromote = () => {
    if (!targetSessionId) {
      showToast('Please select target session', 'error');
      return;
    }

    const students = studentsData?.data || [];
    const promotions = students
      .filter((student: any) => {
        const promotion = studentPromotions[student.id];
        return promotion && promotion.current_result && promotion.next_session_status;
      })
      .map((student: any) => ({
        student_id: student.id,
        current_result: studentPromotions[student.id].current_result as 'pass' | 'fail',
        next_session_status: studentPromotions[student.id].next_session_status as 'continue' | 'leave',
      }));

    if (promotions.length === 0) {
      showToast('Please set promotion details for at least one student', 'error');
      return;
    }

    promoteMutation.mutate({
      promotions,
      target_session_id: Number(targetSessionId),
      target_class_id: targetClassId ? Number(targetClassId) : undefined,
      target_section_id: targetSectionId ? Number(targetSectionId) : undefined,
    });
  };

  const students = studentsData?.data || [];
  const sessions = sessionsData?.data || [];

  const availableSections = selectedClassId
    ? sections.filter(s => {
        const selectedClass = classes.find(c => c.id === Number(selectedClassId));
        if (!selectedClass?.section_ids) return false;
        const sectionIds = selectedClass.section_ids.split(',').map((id: string) => Number(id.trim())).filter((id: number) => !isNaN(id));
        return sectionIds.includes(s.id);
      })
    : [];

  const availableTargetSections = targetClassId
    ? sections.filter(s => {
        const selectedClass = classes.find(c => c.id === Number(targetClassId));
        if (!selectedClass?.section_ids) return false;
        const sectionIds = selectedClass.section_ids.split(',').map((id: string) => Number(id.trim())).filter((id: number) => !isNaN(id));
        return sectionIds.includes(s.id);
      })
    : [];

  return (
    <div className="students-tab-content">
      <div className="tab-header">
        <h2>Promote Students</h2>
        <p>Promote students to next session and class-section based on their exam results</p>
      </div>

      <div className="form-section" style={{ marginBottom: '30px' }}>
        <h3>Select Current Class-Section</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value ? Number(e.target.value) : '');
                setSelectedSectionId('');
              }}
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Section</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value ? Number(e.target.value) : '')}
              disabled={!selectedClassId}
            >
              <option value="">Select Section</option>
              {availableSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <button className="btn-primary btn-wm" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>
      </div>

      {students.length > 0 && (
        <>
          <div className="form-section" style={{ marginBottom: '30px' }}>
            <h3>Promotion Target</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Promote In Session</label>
                <select
                  value={targetSessionId}
                  onChange={(e) => setTargetSessionId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">Select Session</option>
                  {sessions.map((session: any) => (
                    <option key={session.id} value={session.id}>
                      {session.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Class</label>
                <select
                  value={targetClassId}
                  onChange={(e) => {
                    setTargetClassId(e.target.value ? Number(e.target.value) : '');
                    setTargetSectionId('');
                  }}
                >
                  <option value="">Same Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Section</label>
                <select
                  value={targetSectionId}
                  onChange={(e) => setTargetSectionId(e.target.value ? Number(e.target.value) : '')}
                  disabled={!targetClassId}
                >
                  <option value="">Same Section</option>
                  {availableTargetSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="table-section">
            <h3>Student List</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Current Class</th>
                  <th>Current Section</th>
                  <th>Current Session</th>
                  <th>Current Result</th>
                  <th>Next Session Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student: any) => (
                  <tr key={student.id}>
                    <td>{student.admission_no}</td>
                    <td>{student.first_name} {student.last_name}</td>
                    <td>{student.class_name}</td>
                    <td>{student.section_name}</td>
                    <td>{student.session_name}</td>
                    <td>
                      <select
                        value={studentPromotions[student.id]?.current_result || ''}
                        onChange={(e) => {
                          setStudentPromotions({
                            ...studentPromotions,
                            [student.id]: {
                              ...studentPromotions[student.id],
                              current_result: e.target.value as 'pass' | 'fail' | '',
                            },
                          });
                        }}
                      >
                        <option value="">Select</option>
                        <option value="pass">Pass</option>
                        <option value="fail">Fail</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={studentPromotions[student.id]?.next_session_status || ''}
                        onChange={(e) => {
                          setStudentPromotions({
                            ...studentPromotions,
                            [student.id]: {
                              ...studentPromotions[student.id],
                              next_session_status: e.target.value as 'continue' | 'leave' | '',
                            },
                          });
                        }}
                      >
                        <option value="">Select</option>
                        <option value="continue">Continue</option>
                        <option value="leave">Leave</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-actions" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn-primary"
              onClick={handlePromote}
              disabled={promoteMutation.isLoading || !targetSessionId}
            >
              {promoteMutation.isLoading ? 'Promoting...' : 'Promote'}
            </button>
          </div>

          <div className="info-box" style={{ marginTop: '20px', padding: '15px', background: 'var(--gray-50)', borderRadius: '8px' }}>
            <h4>Promotion Logic:</h4>
            <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
              <li><strong>Pass + Continue:</strong> Promoted to next session and next class-section</li>
              <li><strong>Fail + Continue:</strong> Promoted to next session, class-section remains same</li>
              <li><strong>Pass + Leave:</strong> Not promoted (stays in current session and class-section)</li>
              <li><strong>Fail + Leave:</strong> Not promoted (stays in current session and class-section)</li>
            </ul>
          </div>
        </>
      )}

      {students.length === 0 && selectedClassId && selectedSectionId && (
        <div className="empty-state">
          <p>No students found for the selected class and section.</p>
        </div>
      )}
    </div>
  );
};

export default PromoteStudentsTab;
