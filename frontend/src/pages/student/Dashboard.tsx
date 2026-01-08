import { useQuery } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { studentsService } from '../../services/api/studentsService';
import { feesService, FeesInvoice } from '../../services/api/feesService';
import { attendanceService } from '../../services/api/attendanceService';
import { homeworkService } from '../../services/api/homeworkService';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();

  const { data: student } = useQuery(
    'my-student-profile',
    () => studentsService.getMyProfile(),
    { refetchOnWindowFocus: false }
  );

  const { data: feesInvoices = [] } = useQuery<FeesInvoice[]>(
    ['student-fees-invoices', student?.id],
    () => feesService.getStudentFeesInvoices({ student_id: student?.id }),
    { enabled: !!student?.id, refetchOnWindowFocus: false }
  );

  const { data: attendance } = useQuery(
    ['student-attendance-summary', student?.id],
    () => {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      return attendanceService.getMyAttendance({
        month,
        year,
      });
    },
    { enabled: !!student?.id, refetchOnWindowFocus: false }
  );

  const { data: homework = [] } = useQuery(
    ['student-homework', student?.class_id, student?.section_id],
    () =>
      homeworkService.getHomework({
        class_id: student?.class_id,
        section_id: student?.section_id,
      }),
    { enabled: !!student?.class_id && !!student?.section_id, refetchOnWindowFocus: false }
  );

  const totalFees = feesInvoices.reduce((sum, invoice) => sum + parseFloat(String(invoice.amount || '0')), 0);
  const paidFees = feesInvoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, invoice) => sum + parseFloat(String(invoice.paid_amount || '0')), 0);
  const pendingFees = totalFees - paidFees;

  const attendanceData = attendance?.[0];
  const attendancePercentage = attendanceData
    ? ((attendanceData.present_count / (attendanceData.total_days || 1)) * 100).toFixed(1)
    : '0';

  const pendingHomework = homework.filter((hw) => {
    const submissionDate = new Date(hw.submission_date);
    return submissionDate >= new Date() && !hw.evaluations?.some((e) => e.is_completed);
  });

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {student?.first_name || user?.name}!</h1>
        <p>Here's an overview of your academic information</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Fees Status</h3>
            <p className="stat-value">₹{paidFees.toFixed(2)} / ₹{totalFees.toFixed(2)}</p>
            <p className="stat-label">Pending: ₹{pendingFees.toFixed(2)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Attendance</h3>
            <p className="stat-value">{attendancePercentage}%</p>
            <p className="stat-label">
              {attendanceData?.present_count || 0} days present this month
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>Pending Homework</h3>
            <p className="stat-value">{pendingHomework.length}</p>
            <p className="stat-label">Assignments to complete</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>Class</h3>
            <p className="stat-value">
              {student?.class_name || '-'} {student?.section_name ? `- ${student.section_name}` : ''}
            </p>
            <p className="stat-label">Current Class & Section</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h2>Recent Homework</h2>
          {pendingHomework.length > 0 ? (
            <div className="homework-list">
              {pendingHomework.slice(0, 5).map((hw) => (
                <div key={hw.id} className="homework-item">
                  <div className="homework-info">
                    <h4>{hw.title}</h4>
                    <p>{hw.subject_name}</p>
                    <span className="homework-date">
                      Due: {new Date(hw.submission_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-message">No pending homework</p>
          )}
        </div>

        <div className="dashboard-section">
          <h2>Recent Fees</h2>
          {feesInvoices.length > 0 ? (
            <div className="fees-list">
              {feesInvoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="fee-item">
                  <div className="fee-info">
                    <h4>{invoice.fees_type_name || 'Fee'}</h4>
                    <p>Amount: ₹{parseFloat(String(invoice.amount || '0')).toFixed(2)}</p>
                    <span className={`fee-status ${invoice.status}`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-message">No fees records</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

