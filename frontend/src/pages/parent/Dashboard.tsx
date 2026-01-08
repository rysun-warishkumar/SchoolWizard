import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { studentsService } from '../../services/api/studentsService';
import { feesService } from '../../services/api/feesService';
import { attendanceService } from '../../services/api/attendanceService';
import { homeworkService } from '../../services/api/homeworkService';
import ChildSelector from '../../components/parent/ChildSelector';
import './ParentDashboard.css';

const ParentDashboard = () => {
  const { user } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  const { data: childrenData, isLoading: childrenLoading } = useQuery(
    'my-children',
    () => studentsService.getMyChildren(),
    { refetchOnWindowFocus: false }
  );

  const children = childrenData?.data || [];

  // Auto-select first child if available
  React.useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const selectedChild = children.find((c) => c.id === selectedChildId);

  // Get fees for selected child
  const { data: fees = [] } = useQuery(
    ['parent-fees', selectedChildId],
    () => feesService.getStudentFees({ student_id: selectedChildId }),
    { enabled: !!selectedChildId, refetchOnWindowFocus: false }
  );

  // Get attendance for selected child
  const { data: attendance } = useQuery(
    ['parent-attendance-summary', selectedChildId],
    () => {
      if (!selectedChildId) return null;
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      return attendanceService.getStudentAttendance({
        student_id: selectedChildId,
        month,
        year,
      });
    },
    { enabled: !!selectedChildId, refetchOnWindowFocus: false }
  );

  // Get homework for selected child
  const { data: homework = [] } = useQuery(
    ['parent-homework', selectedChild?.class_id, selectedChild?.section_id],
    () =>
      homeworkService.getHomework({
        class_id: selectedChild?.class_id,
        section_id: selectedChild?.section_id,
      }),
    { enabled: !!selectedChild?.class_id && !!selectedChild?.section_id, refetchOnWindowFocus: false }
  );

  const totalFees = fees.reduce((sum, fee) => sum + parseFloat(fee.amount || '0'), 0);
  const paidFees = fees.filter((f) => f.status === 'paid').reduce((sum, fee) => sum + parseFloat(fee.amount || '0'), 0);
  const pendingFees = totalFees - paidFees;

  const attendanceData = attendance?.data || [];
  const totalDays = attendanceData.reduce((sum: number, day: any) => sum + (day.status === 'present' ? 1 : 0), 0);
  const attendancePercentage = attendanceData.length > 0 ? Math.round((totalDays / attendanceData.length) * 100) : 0;

  if (childrenLoading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (children.length === 0) {
    return (
      <div className="parent-dashboard">
        <div className="dashboard-header">
          <h1>Welcome back, {user?.name || 'Parent'}!</h1>
          <p>No children found. Please contact the school administration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="parent-dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.name || 'Parent'}!</h1>
        <p>Here's an overview of your children's academic information</p>
      </div>

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onSelectChild={setSelectedChildId}
      />

      {selectedChild ? (
        <>
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef3c7', color: '#92400e' }}>
                💰
              </div>
              <div className="stat-content">
                <h3>Fee</h3>
                <div className="stat-value">₹{paidFees.toFixed(2)}</div>
                <div className="stat-label">Paid: ₹{paidFees.toFixed(2)}</div>
                <div className="stat-label">Pending: ₹{pendingFees.toFixed(2)}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#d1fae5', color: '#065f46' }}>
                ✅
              </div>
              <div className="stat-content">
                <h3>Attendance</h3>
                <div className="stat-value">{attendancePercentage}%</div>
                <div className="stat-label">
                  {totalDays} / {attendanceData.length} days
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dbeafe', color: '#1e40af' }}>
                📝
              </div>
              <div className="stat-content">
                <h3>Homework</h3>
                <div className="stat-value">{homework.length}</div>
                <div className="stat-label">Assigned</div>
              </div>
            </div>
          </div>

          <div className="dashboard-sections">
            <div className="dashboard-section">
              <h2>Recent Homework</h2>
              {homework.length === 0 ? (
                <div className="empty-message">No homework assigned</div>
              ) : (
                <div className="homework-list">
                  {homework.slice(0, 5).map((hw) => (
                    <div key={hw.id} className="homework-item">
                      <div className="homework-info">
                        <h4>{hw.title}</h4>
                        <p>{hw.description}</p>
                        <span className="homework-date">
                          Due: {hw.submission_date ? new Date(hw.submission_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="dashboard-section">
              <h2>Fee Status</h2>
              {fees.length === 0 ? (
                <div className="empty-message">No fee records found</div>
              ) : (
                <div className="fees-list">
                  {fees.slice(0, 5).map((fee) => (
                    <div key={fee.id} className="fee-item">
                      <div className="fee-info">
                        <h4>{fee.fee_type || 'Fee'}</h4>
                        <p>Amount: ₹{parseFloat(fee.amount || '0').toFixed(2)}</p>
                        <span className={`fee-status ${fee.status}`}>{fee.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">Please select a child to view their information</div>
      )}
    </div>
  );
};

export default ParentDashboard;

