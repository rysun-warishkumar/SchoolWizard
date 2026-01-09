import { useState } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { reportsService } from '../../services/api/reportsService';
import { academicsService } from '../../services/api/academicsService';
import { examinationsService } from '../../services/api/examinationsService';
import './Reports.css';

type TabType =
  | 'student-list'
  | 'student-attendance'
  | 'student-exam-results'
  | 'student-fees'
  | 'staff-list'
  | 'staff-payroll'
  | 'staff-leaves'
  | 'fees-collection'
  | 'income'
  | 'expenses'
  | 'financial-summary'
  | 'library'
  | 'transport'
  | 'inventory'
  | 'admission-enquiry';

const Reports = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType;
  const validTabs: TabType[] = [
    'student-list',
    'student-attendance',
    'student-exam-results',
    'student-fees',
    'staff-list',
    'staff-payroll',
    'staff-leaves',
    'fees-collection',
    'income',
    'expenses',
    'financial-summary',
    'library',
    'transport',
    'inventory',
    'admission-enquiry',
  ];
  const defaultTab: TabType = validTabs.includes(tabFromUrl) ? tabFromUrl : 'student-list';

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Reports</h1>
      </div>

      <div className="reports-tabs">
        <div className="tab-group">
          <span className="tab-group-label">Student Reports</span>
          <button
            className={activeTab === 'student-list' ? 'active' : ''}
            onClick={() => handleTabChange('student-list')}
          >
            Student List
          </button>
          <button
            className={activeTab === 'student-attendance' ? 'active' : ''}
            onClick={() => handleTabChange('student-attendance')}
          >
            Attendance
          </button>
          <button
            className={activeTab === 'student-exam-results' ? 'active' : ''}
            onClick={() => handleTabChange('student-exam-results')}
          >
            Exam Results
          </button>
          <button
            className={activeTab === 'student-fees' ? 'active' : ''}
            onClick={() => handleTabChange('student-fees')}
          >
            Fees
          </button>
        </div>

        <div className="tab-group">
          <span className="tab-group-label">Staff Reports</span>
          <button
            className={activeTab === 'staff-list' ? 'active' : ''}
            onClick={() => handleTabChange('staff-list')}
          >
            Staff List
          </button>
          <button
            className={activeTab === 'staff-payroll' ? 'active' : ''}
            onClick={() => handleTabChange('staff-payroll')}
          >
            Payroll
          </button>
          <button
            className={activeTab === 'staff-leaves' ? 'active' : ''}
            onClick={() => handleTabChange('staff-leaves')}
          >
            Leaves
          </button>
        </div>

        <div className="tab-group">
          <span className="tab-group-label">Financial Reports</span>
          <button
            className={activeTab === 'fees-collection' ? 'active' : ''}
            onClick={() => handleTabChange('fees-collection')}
          >
            Fees Collection
          </button>
          <button
            className={activeTab === 'income' ? 'active' : ''}
            onClick={() => handleTabChange('income')}
          >
            Income
          </button>
          <button
            className={activeTab === 'expenses' ? 'active' : ''}
            onClick={() => handleTabChange('expenses')}
          >
            Expenses
          </button>
          <button
            className={activeTab === 'financial-summary' ? 'active' : ''}
            onClick={() => handleTabChange('financial-summary')}
          >
            Summary
          </button>
        </div>

        <div className="tab-group">
          <span className="tab-group-label">Other Reports</span>
          <button
            className={activeTab === 'library' ? 'active' : ''}
            onClick={() => handleTabChange('library')}
          >
            Library
          </button>
          <button
            className={activeTab === 'transport' ? 'active' : ''}
            onClick={() => handleTabChange('transport')}
          >
            Transport
          </button>
          <button
            className={activeTab === 'inventory' ? 'active' : ''}
            onClick={() => handleTabChange('inventory')}
          >
            Inventory
          </button>
          <button
            className={activeTab === 'admission-enquiry' ? 'active' : ''}
            onClick={() => handleTabChange('admission-enquiry')}
          >
            Admission Enquiry
          </button>
        </div>
      </div>

      <div className="reports-content">
        {activeTab === 'student-list' && <StudentListReport />}
        {activeTab === 'student-attendance' && <StudentAttendanceReport />}
        {activeTab === 'student-exam-results' && <StudentExamResultsReport />}
        {activeTab === 'student-fees' && <StudentFeesReport />}
        {activeTab === 'staff-list' && <StaffListReport />}
        {activeTab === 'staff-payroll' && <StaffPayrollReport />}
        {activeTab === 'staff-leaves' && <StaffLeavesReport />}
        {activeTab === 'fees-collection' && <FeesCollectionReport />}
        {activeTab === 'income' && <IncomeReport />}
        {activeTab === 'expenses' && <ExpensesReport />}
        {activeTab === 'financial-summary' && <FinancialSummaryReportComponent />}
        {activeTab === 'library' && <LibraryReport />}
        {activeTab === 'transport' && <TransportReport />}
        {activeTab === 'inventory' && <InventoryReport />}
        {activeTab === 'admission-enquiry' && <AdmissionEnquiryReport />}
      </div>
    </div>
  );
};

// ========== Student List Report ==========

const StudentListReport = () => {
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: classesResponse } = useQuery(['classes'], academicsService.getClasses, {
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const classes = Array.isArray(classesResponse?.data) ? classesResponse.data : [];

  const { data: sectionsResponse, error: sectionsError } = useQuery(['sections'], () => academicsService.getSections(), {
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const sections = Array.isArray(sectionsResponse?.data) ? sectionsResponse.data : [];

  const { data: studentsData, isLoading, error: studentsError } = useQuery(
    ['student-list-report', classFilter, sectionFilter, statusFilter, searchTerm],
    () =>
      reportsService.getStudentListReport({
        class_id: classFilter ? parseInt(classFilter) : undefined,
        section_id: sectionFilter ? parseInt(sectionFilter) : undefined,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      }),
    { 
      refetchOnWindowFocus: false, 
      retry: 1
    }
  );
  // Ensure students is always an array, handle both direct array and nested data structure
  // Ensure students is always an array
  // The service already extracts response.data.data, so studentsData should be an array
  const students: any[] = Array.isArray(studentsData) ? studentsData : [];

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csv = [
      ['Admission No', 'Name', 'Email', 'Phone', 'Class', 'Section', 'Status'].join(','),
      ...students.map((s) =>
        [
          s.admission_no || '',
          `${s.first_name} ${s.last_name || ''}`,
          s.email || '',
          s.phone || '',
          s.class_name || '',
          s.section_name || '',
          s.status,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-list-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="report-content">
      <div className="report-header">
        <div className="report-filters">
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="">All Classes</option>
            {Array.isArray(classes) && classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
            <option value="">All Sections</option>
            {Array.isArray(sections) && sections
              .filter((sec: any) => !classFilter || (sec.class_id && sec.class_id === parseInt(classFilter)))
              .map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="report-actions">
          <button className="btn-secondary" onClick={handleExport}>
            Export CSV
          </button>
          <button className="btn-primary" onClick={handlePrint}>
            Print
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : studentsError ? (
        <div className="error-message">
          Error loading students: {studentsError instanceof Error ? studentsError.message : 'Unknown error'}
        </div>
      ) : (
        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Admission No</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Class</th>
                <th>Section</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!students || students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    No students found
                  </td>
                </tr>
              ) : (
                students.map((student: any) => (
                  <tr key={student.id}>
                    <td>{student.admission_no || '-'}</td>
                    <td>
                      {student.first_name} {student.last_name || ''}
                    </td>
                    <td>{student.email || '-'}</td>
                    <td>{student.phone || '-'}</td>
                    <td>{student.class_name || '-'}</td>
                    <td>{student.section_name || '-'}</td>
                    <td>
                      <span className={`badge ${student.status === 'active' ? 'badge-success' : 'badge-inactive'}`}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ========== Student Attendance Report ==========

const StudentAttendanceReport = () => {
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: classesResponse } = useQuery(['classes'], academicsService.getClasses, {
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const classes = Array.isArray(classesResponse?.data) ? classesResponse.data : [];

  const { data: sectionsResponse, error: sectionsError } = useQuery(['sections'], () => academicsService.getSections(), {
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const sections = Array.isArray(sectionsResponse?.data) ? sectionsResponse.data : [];

  const { data: reportData, isLoading } = useQuery(
    ['student-attendance-report', classFilter, sectionFilter, month, year],
    () =>
      reportsService.getStudentAttendanceReport({
        month,
        year,
        class_id: classFilter ? parseInt(classFilter) : undefined,
        section_id: sectionFilter ? parseInt(sectionFilter) : undefined,
      }),
    { refetchOnWindowFocus: false, retry: 1 }
  );
  const report: any[] = Array.isArray(reportData) 
    ? reportData 
    : (reportData && typeof reportData === 'object' && 'data' in reportData && Array.isArray((reportData as any).data)) 
      ? (reportData as any).data 
      : [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-content">
      <div className="report-header">
        <div className="report-filters">
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="">All Classes</option>
            {Array.isArray(classes) && classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
            <option value="">All Sections</option>
              {Array.isArray(sections) && sections
              .filter((sec: any) => !classFilter || (sec.class_id && sec.class_id === parseInt(classFilter)))
              .map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
          </select>
          <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            min="2000"
            max="2100"
          />
        </div>
        <div className="report-actions">
          <button className="btn-primary" onClick={handlePrint}>
            Print
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Admission No</th>
                <th>Name</th>
                <th>Class</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Late</th>
                <th>Half Day</th>
                <th>Total Days</th>
                <th>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {report.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-state">
                    No attendance data found
                  </td>
                </tr>
              ) : (
                report.map((item: any) => (
                  <tr key={item.id}>
                    <td>{item.admission_no || '-'}</td>
                    <td>
                      {item.first_name} {item.last_name || ''}
                    </td>
                    <td>
                      {item.class_name || '-'}
                      {item.section_name ? ` - ${item.section_name}` : ''}
                    </td>
                    <td>{item.present_count}</td>
                    <td>{item.absent_count}</td>
                    <td>{item.late_count}</td>
                    <td>{item.half_day_count}</td>
                    <td>{item.total_days}</td>
                    <td>{item.attendance_percentage}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ========== Student Exam Results Report ==========

const StudentExamResultsReport = () => {
  const [examFilter, setExamFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');

  const { data: classesResponse } = useQuery(['classes'], academicsService.getClasses, {
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const classes = Array.isArray(classesResponse?.data) ? classesResponse.data : [];

  const { data: sectionsResponse, error: sectionsError } = useQuery(['sections'], () => academicsService.getSections(), {
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const sections = Array.isArray(sectionsResponse?.data) ? sectionsResponse.data : [];

  const { data: examsResponse } = useQuery(['exams'], () => examinationsService.getExams({}), {
    refetchOnWindowFocus: false,
  });
  const exams = Array.isArray(examsResponse) ? examsResponse : [];

  const { data: resultsData, isLoading } = useQuery(
    ['student-exam-results-report', examFilter, classFilter, sectionFilter],
    () =>
      reportsService.getStudentExamResultsReport({
        exam_id: parseInt(examFilter),
        class_id: classFilter ? parseInt(classFilter) : undefined,
        section_id: sectionFilter ? parseInt(sectionFilter) : undefined,
      }),
    {
      refetchOnWindowFocus: false,
      enabled: !!examFilter,
    }
  );
  const results = Array.isArray(resultsData) ? resultsData : [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-content">
      <div className="report-header">
        <div className="report-filters">
          <select value={examFilter} onChange={(e) => setExamFilter(e.target.value)} required>
            <option value="">Select Exam</option>
            {Array.isArray(exams) && exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name}
              </option>
            ))}
          </select>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="">All Classes</option>
            {Array.isArray(classes) && classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
            <option value="">All Sections</option>
              {Array.isArray(sections) && sections
              .filter((sec: any) => !classFilter || (sec.class_id && sec.class_id === parseInt(classFilter)))
              .map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
          </select>
        </div>
        <div className="report-actions">
          <button className="btn-primary" onClick={handlePrint} disabled={!examFilter}>
            Print
          </button>
        </div>
      </div>

      {!examFilter ? (
        <div className="empty-state">Please select an exam to view results</div>
      ) : isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="report-table-container">
          {results.map((result) => (
            <div key={result.student.id} className="exam-result-card">
              <div className="result-header">
                <h3>
                  {result.student.first_name} {result.student.last_name || ''} ({result.student.admission_no})
                </h3>
                <p>
                  {result.student.class_name} - {result.student.section_name}
                </p>
              </div>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Obtained</th>
                    <th>Max Marks</th>
                    <th>Grade</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {result.subjects.map((subject, idx) => (
                    <tr key={idx}>
                      <td>{subject.subject_name}</td>
                      <td>{subject.obtained_marks}</td>
                      <td>{subject.max_marks}</td>
                      <td>{subject.grade || '-'}</td>
                      <td>{subject.remarks || '-'}</td>
                    </tr>
                  ))}
                  <tr className="result-total">
                    <td>
                      <strong>Total</strong>
                    </td>
                    <td>
                      <strong>{result.total_obtained}</strong>
                    </td>
                    <td>
                      <strong>{result.total_max}</strong>
                    </td>
                    <td colSpan={2}>
                      <strong>Percentage: {result.percentage}%</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ========== Student Fees Report ==========

const StudentFeesReport = () => {
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');

  const { data: classesResponse } = useQuery(['classes'], academicsService.getClasses, {
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const classes = Array.isArray(classesResponse?.data) ? classesResponse.data : [];

  const { data: sectionsResponse, error: sectionsError } = useQuery(['sections'], () => academicsService.getSections(), {
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const sections = Array.isArray(sectionsResponse?.data) ? sectionsResponse.data : [];

  const { data: feesData, isLoading } = useQuery(
    ['student-fees-report', classFilter, sectionFilter, startDate, endDate, paymentStatusFilter],
    () =>
      reportsService.getStudentFeesReport({
        class_id: classFilter ? parseInt(classFilter) : undefined,
        section_id: sectionFilter ? parseInt(sectionFilter) : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        payment_status: paymentStatusFilter || undefined,
      }),
    { refetchOnWindowFocus: false, retry: 1 }
  );
  const fees = feesData || { data: [], totals: { total_amount: 0 } };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-content">
      <div className="report-header">
        <div className="report-filters">
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="">All Classes</option>
            {Array.isArray(classes) && classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
            <option value="">All Sections</option>
              {Array.isArray(sections) && sections
              .filter((sec: any) => !classFilter || (sec.class_id && sec.class_id === parseInt(classFilter)))
              .map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start Date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End Date"
          />
          <select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div className="report-actions">
          <button className="btn-primary" onClick={handlePrint}>
            Print
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          {fees?.totals && (
            <div className="report-summary">
              <strong>Total Amount: ₹{fees.totals.total_amount.toFixed(2)}</strong>
            </div>
          )}
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Fee Type</th>
                  <th>Fee Name</th>
                  <th>Amount</th>
                  <th>Payment Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {!fees || !Array.isArray(fees.data) || fees.data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-state">
                      No fees data found
                    </td>
                  </tr>
                ) : (
                  fees.data.map((item) => (
                    <tr key={item.id}>
                      <td>{item.admission_no || '-'}</td>
                      <td>
                        {item.first_name} {item.last_name || ''}
                      </td>
                      <td>
                        {item.class_name || '-'}
                        {item.section_name ? ` - ${item.section_name}` : ''}
                      </td>
                      <td>{item.fee_type}</td>
                      <td>{item.fee_name}</td>
                      <td>₹{parseFloat(item.amount.toString()).toFixed(2)}</td>
                      <td>{new Date(item.payment_date).toLocaleDateString()}</td>
                      <td>
                        <span
                          className={`badge ${item.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}
                        >
                          {item.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// Continue with other report components...
// Due to length, I'll create simplified versions for the remaining reports

// ========== Staff List Report ==========

const StaffListReport = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: staffData, isLoading } = useQuery(
    ['staff-list-report', roleFilter, statusFilter, searchTerm],
    () =>
      reportsService.getStaffListReport({
        role_id: roleFilter ? parseInt(roleFilter) : undefined,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      }),
    { refetchOnWindowFocus: false, retry: 1 }
  );
  const staff: any[] = Array.isArray(staffData) 
    ? staffData 
    : (staffData && typeof staffData === 'object' && 'data' in staffData && Array.isArray((staffData as any).data)) 
      ? (staffData as any).data 
      : [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-content">
      <div className="report-header">
        <div className="report-filters">
          <input
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="report-actions">
          <button className="btn-primary" onClick={handlePrint}>
            Print
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    No staff found
                  </td>
                </tr>
              ) : (
                staff.map((item: any) => (
                  <tr key={item.id}>
                    <td>{item.staff_id || '-'}</td>
                    <td>
                      {item.first_name} {item.last_name || ''}
                    </td>
                    <td>{item.email || '-'}</td>
                    <td>{item.phone || '-'}</td>
                    <td>{item.role_name || '-'}</td>
                    <td>{item.department_name || '-'}</td>
                    <td>
                      <span className={`badge ${item.is_active ? 'badge-success' : 'badge-inactive'}`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ========== Staff Payroll Report ==========

const StaffPayrollReport = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('');

  const { data: payrollData, isLoading } = useQuery(
    ['staff-payroll-report', month, year, statusFilter],
    () =>
      reportsService.getStaffPayrollReport({
        month,
        year,
        status: statusFilter || undefined,
      }),
    { refetchOnWindowFocus: false }
  );
  const payroll = payrollData || { data: [], totals: { total_basic_salary: 0, total_allowances: 0, total_deductions: 0, total_net_salary: 0 } };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-content">
      <div className="report-header">
        <div className="report-filters">
          <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            min="2000"
            max="2100"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div className="report-actions">
          <button className="btn-primary" onClick={handlePrint}>
            Print
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          {payroll?.totals && (
            <div className="report-summary">
              <div className="summary-row">
                <span>Total Basic Salary: ₹{payroll.totals.total_basic_salary.toFixed(2)}</span>
                <span>Total Allowances: ₹{payroll.totals.total_allowances.toFixed(2)}</span>
                <span>Total Deductions: ₹{payroll.totals.total_deductions.toFixed(2)}</span>
                <span>
                  <strong>Total Net Salary: ₹{payroll.totals.total_net_salary.toFixed(2)}</strong>
                </span>
              </div>
            </div>
          )}
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Name</th>
                  <th>Basic Salary</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {!payroll || !Array.isArray(payroll.data) || payroll.data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-state">
                      No payroll data found
                    </td>
                  </tr>
                ) : (
                  payroll.data.map((item) => (
                    <tr key={item.id}>
                      <td>{item.staff_staff_id || '-'}</td>
                      <td>
                        {item.first_name} {item.last_name || ''}
                      </td>
                      <td>₹{parseFloat(item.basic_salary.toString()).toFixed(2)}</td>
                      <td>₹{parseFloat(item.allowances.toString()).toFixed(2)}</td>
                      <td>₹{parseFloat(item.deductions.toString()).toFixed(2)}</td>
                      <td>₹{parseFloat(item.net_salary.toString()).toFixed(2)}</td>
                      <td>
                        <span
                          className={`badge ${item.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}
                        >
                          {item.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// ========== Staff Leaves Report ==========

const StaffLeavesReport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: leaves = [], isLoading } = useQuery(
    ['staff-leaves-report', startDate, endDate, statusFilter],
    () =>
      reportsService.getStaffLeaveReport({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        status: statusFilter || undefined,
      }),
    { refetchOnWindowFocus: false }
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-content">
      <div className="report-header">
        <div className="report-filters">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start Date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End Date"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="disapproved">Disapproved</option>
          </select>
        </div>
        <div className="report-actions">
          <button className="btn-primary" onClick={handlePrint}>
            Print
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Name</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Total Days</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    No leave records found
                  </td>
                </tr>
              ) : (
                leaves.map((item) => (
                  <tr key={item.id}>
                    <td>{item.staff_staff_id || '-'}</td>
                    <td>
                      {item.first_name} {item.last_name || ''}
                    </td>
                    <td>{item.leave_type_name}</td>
                    <td>{new Date(item.start_date).toLocaleDateString()}</td>
                    <td>{new Date(item.end_date).toLocaleDateString()}</td>
                    <td>{item.total_days}</td>
                    <td>
                      <span
                        className={`badge ${
                          item.status === 'approved'
                            ? 'badge-success'
                            : item.status === 'disapproved'
                            ? 'badge-error'
                            : 'badge-warning'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ========== Fees Collection Report ==========

const FeesCollectionReport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [feeTypeFilter, setFeeTypeFilter] = useState('');

  const { data: feesCollectionData, isLoading } = useQuery(
    ['fees-collection-report', startDate, endDate, feeTypeFilter],
    () =>
      reportsService.getFeesCollectionReport({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        fee_type: feeTypeFilter || undefined,
      }),
    { refetchOnWindowFocus: false }
  );
  const feesCollection = feesCollectionData || { data: [], grand_total: 0 };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-content">
      <div className="report-header">
        <div className="report-filters">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start Date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End Date"
          />
          <select value={feeTypeFilter} onChange={(e) => setFeeTypeFilter(e.target.value)}>
            <option value="">All Fee Types</option>
            <option value="admission">Admission</option>
            <option value="tuition">Tuition</option>
            <option value="library">Library</option>
            <option value="transport">Transport</option>
            <option value="hostel">Hostel</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="report-actions">
          <button className="btn-primary" onClick={handlePrint}>
            Print
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          {feesCollection?.grand_total !== undefined && (
            <div className="report-summary">
              <strong>Grand Total: ₹{feesCollection.grand_total.toFixed(2)}</strong>
            </div>
          )}
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Fee Type</th>
                  <th>Fee Name</th>
                  <th>Class</th>
                  <th>Students</th>
                  <th>Payments</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {!feesCollection || !Array.isArray(feesCollection.data) || feesCollection.data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-state">
                      No fees collection data found
                    </td>
                  </tr>
                ) : (
                  feesCollection.data.map((item, idx) => (
                    <tr key={idx}>
                      <td>{new Date(item.payment_date).toLocaleDateString()}</td>
                      <td>{item.fee_type}</td>
                      <td>{item.fee_name}</td>
                      <td>{item.class_name || '-'}</td>
                      <td>{item.student_count}</td>
                      <td>{item.payment_count}</td>
                      <td>₹{parseFloat(item.total_amount.toString()).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// ========== Income Report ==========

const IncomeReport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: incomeData, isLoading } = useQuery(
    ['income-report', startDate, endDate],
    () =>
      reportsService.getIncomeReport({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      }),
    { refetchOnWindowFocus: false }
  );
  const income = incomeData || { data: [], totals: { total_amount: 0 } };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-content">
      <div className="report-header">
        <div className="report-filters">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start Date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End Date"
          />
        </div>
        <div className="report-actions">
          <button className="btn-primary" onClick={handlePrint}>
            Print
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          {income?.totals && (
            <div className="report-summary">
              <strong>Total Income: ₹{income.totals.total_amount.toFixed(2)}</strong>
            </div>
          )}
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Income Head</th>
                  <th>Amount</th>
                  <th>Invoice Number</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {!income || !Array.isArray(income.data) || income.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      No income data found
                    </td>
                  </tr>
                ) : (
                  income.data.map((item) => (
                    <tr key={item.id}>
                      <td>{new Date(item.income_date).toLocaleDateString()}</td>
                      <td>{item.income_head}</td>
                      <td>₹{parseFloat(item.amount.toString()).toFixed(2)}</td>
                      <td>{item.invoice_number || '-'}</td>
                      <td>{item.description || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// ========== Expenses Report ==========

const ExpensesReport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: expensesData, isLoading } = useQuery(
    ['expenses-report', startDate, endDate],
    () =>
      reportsService.getExpenseReport({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      }),
    { refetchOnWindowFocus: false }
  );
  const expenses = expensesData || { data: [], totals: { total_amount: 0 } };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-content">
      <div className="report-header">
        <div className="report-filters">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start Date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End Date"
          />
        </div>
        <div className="report-actions">
          <button className="btn-primary" onClick={handlePrint}>
            Print
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          {expenses?.totals && (
            <div className="report-summary">
              <strong>Total Expenses: ₹{expenses.totals.total_amount.toFixed(2)}</strong>
            </div>
          )}
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Expense Head</th>
                  <th>Expense Name</th>
                  <th>Amount</th>
                  <th>Invoice Number</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {!expenses || !Array.isArray(expenses.data) || expenses.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      No expenses data found
                    </td>
                  </tr>
                ) : (
                  expenses.data.map((item) => (
                    <tr key={item.id}>
                      <td>{new Date(item.expense_date).toLocaleDateString()}</td>
                      <td>{item.expense_head}</td>
                      <td>{item.expense_name}</td>
                      <td>₹{parseFloat(item.amount.toString()).toFixed(2)}</td>
                      <td>{item.invoice_number || '-'}</td>
                      <td>{item.description || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// ========== Financial Summary Report ==========

const FinancialSummaryReportComponent = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: financialSummary, isLoading } = useQuery(
    ['financial-summary-report', startDate, endDate],
    () =>
      reportsService.getFinancialSummaryReport({
        start_date: startDate,
        end_date: endDate,
      }),
    {
      refetchOnWindowFocus: false,
      enabled: !!startDate && !!endDate,
    }
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-content">
      <div className="report-header">
        <div className="report-filters">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start Date"
            required
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End Date"
            required
          />
        </div>
        <div className="report-actions">
          <button className="btn-primary" onClick={handlePrint} disabled={!startDate || !endDate}>
            Print
          </button>
        </div>
      </div>

      {!startDate || !endDate ? (
        <div className="empty-state">Please select start date and end date</div>
      ) : isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="financial-summary">
          <div className="summary-card">
            <h3>Financial Summary</h3>
            {financialSummary && (
              <>
                <p>
                  Period: {financialSummary.period?.start_date ? new Date(financialSummary.period.start_date).toLocaleDateString() : '-'} -{' '}
                  {financialSummary.period?.end_date ? new Date(financialSummary.period.end_date).toLocaleDateString() : '-'}
                </p>
                <div className="summary-items">
                  <div className="summary-item">
                    <label>Fees Collection</label>
                    <span className="amount positive">₹{Number(financialSummary.fees_collection || 0).toFixed(2)}</span>
                  </div>
                  <div className="summary-item">
                    <label>Other Income</label>
                    <span className="amount positive">₹{Number(financialSummary.other_income || 0).toFixed(2)}</span>
                  </div>
                  <div className="summary-item">
                    <label>Total Income</label>
                    <span className="amount positive total">₹{Number(financialSummary.total_income || 0).toFixed(2)}</span>
                  </div>
                  <div className="summary-item">
                    <label>Total Expenses</label>
                    <span className="amount negative">₹{Number(financialSummary.total_expenses || 0).toFixed(2)}</span>
                  </div>
                  <div className="summary-item">
                    <label>Net Profit/Loss</label>
                    <span className={`amount ${Number(financialSummary.net_profit || 0) >= 0 ? 'positive' : 'negative'} total`}>
                      ₹{Number(financialSummary.net_profit || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ========== Library Report ==========

const LibraryReport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [returnStatusFilter, setReturnStatusFilter] = useState('');

  const { data: issuesData, isLoading } = useQuery(
    ['library-report', startDate, endDate, returnStatusFilter],
    () =>
      reportsService.getLibraryBookIssueReport({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        return_status: returnStatusFilter || undefined,
      }),
    { refetchOnWindowFocus: false }
  );
  const issues = Array.isArray(issuesData) ? issuesData : [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-content">
      <div className="report-header">
        <div className="report-filters">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start Date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End Date"
          />
          <select value={returnStatusFilter} onChange={(e) => setReturnStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="issued">Issued</option>
            <option value="returned">Returned</option>
            <option value="lost">Lost</option>
            <option value="damaged">Damaged</option>
          </select>
        </div>
        <div className="report-actions">
          <button className="btn-primary" onClick={handlePrint}>
            Print
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Author</th>
                <th>Member</th>
                <th>Member Type</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {issues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state">
                    No book issues found
                  </td>
                </tr>
              ) : (
                issues.map((item) => (
                  <tr key={item.id}>
                    <td>{item.book_title}</td>
                    <td>{item.author || '-'}</td>
                    <td>{item.member_name || '-'}</td>
                    <td>{item.member_type}</td>
                    <td>{new Date(item.issue_date).toLocaleDateString()}</td>
                    <td>{new Date(item.due_date).toLocaleDateString()}</td>
                    <td>{item.return_date ? new Date(item.return_date).toLocaleDateString() : '-'}</td>
                    <td>
                      <span
                        className={`badge ${
                          item.return_status === 'returned'
                            ? 'badge-success'
                            : item.return_status === 'lost' || item.return_status === 'damaged'
                            ? 'badge-error'
                            : 'badge-warning'
                        }`}
                      >
                        {item.return_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ========== Transport Report ==========

const TransportReport = () => {
  const [routeFilter, setRouteFilter] = useState('');

  const { data: assignmentsData, isLoading } = useQuery(
    ['transport-report', routeFilter],
    () =>
      reportsService.getTransportReport({
        route_id: routeFilter ? parseInt(routeFilter) : undefined,
      }),
    { refetchOnWindowFocus: false }
  );
  const assignments = Array.isArray(assignmentsData) ? assignmentsData : [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-content">
      <div className="report-header">
        <div className="report-filters">
          <select value={routeFilter} onChange={(e) => setRouteFilter(e.target.value)}>
            <option value="">All Routes</option>
            {/* Routes would be loaded from transportService */}
          </select>
        </div>
        <div className="report-actions">
          <button className="btn-primary" onClick={handlePrint}>
            Print
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Admission No</th>
                <th>Class</th>
                <th>Route</th>
                <th>Fare</th>
                <th>Vehicle</th>
                <th>Driver</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    No transport assignments found
                  </td>
                </tr>
              ) : (
                assignments.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.first_name} {item.last_name || ''}
                    </td>
                    <td>{item.admission_no || '-'}</td>
                    <td>
                      {item.class_name || '-'}
                      {item.section_name ? ` - ${item.section_name}` : ''}
                    </td>
                    <td>{item.route_name}</td>
                    <td>₹{parseFloat(item.fare.toString()).toFixed(2)}</td>
                    <td>{item.vehicle_number}</td>
                    <td>{item.driver_name || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ========== Inventory Report ==========

const InventoryReport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: inventoryIssuesData, isLoading } = useQuery(
    ['inventory-report', startDate, endDate],
    () =>
      reportsService.getInventoryReport({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      }),
    { refetchOnWindowFocus: false }
  );
  const inventoryIssues = Array.isArray(inventoryIssuesData) ? inventoryIssuesData : [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-content">
      <div className="report-header">
        <div className="report-filters">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start Date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End Date"
          />
        </div>
        <div className="report-actions">
          <button className="btn-primary" onClick={handlePrint}>
            Print
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Store</th>
                <th>Quantity</th>
                <th>Issued To</th>
                <th>Issue Date</th>
              </tr>
            </thead>
            <tbody>
              {inventoryIssues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No inventory issues found
                  </td>
                </tr>
              ) : (
                inventoryIssues.map((item) => (
                  <tr key={item.id}>
                    <td>{item.item_name}</td>
                    <td>{item.category_name || '-'}</td>
                    <td>{item.store_name || '-'}</td>
                    <td>{item.quantity}</td>
                    <td>{item.student_name || item.staff_name || '-'}</td>
                    <td>{new Date(item.issue_date).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ========== Admission Enquiry Report ==========

const AdmissionEnquiryReport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: enquiriesData, isLoading } = useQuery(
    ['admission-enquiry-report', startDate, endDate, statusFilter],
    () =>
      reportsService.getAdmissionEnquiryReport({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        status: statusFilter || undefined,
      }),
    { refetchOnWindowFocus: false }
  );
  const enquiries = Array.isArray(enquiriesData) ? enquiriesData : [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-content">
      <div className="report-header">
        <div className="report-filters">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start Date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End Date"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="follow_up">Follow Up</option>
            <option value="admitted">Admitted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="report-actions">
          <button className="btn-primary" onClick={handlePrint}>
            Print
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Enquiry Date</th>
                <th>Next Follow Up</th>
                <th>Source</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    No admission enquiries found
                  </td>
                </tr>
              ) : (
                enquiries.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.phone || '-'}</td>
                    <td>{item.email || '-'}</td>
                    <td>{new Date(item.enquiry_date).toLocaleDateString()}</td>
                    <td>
                      {item.next_follow_up_date ? new Date(item.next_follow_up_date).toLocaleDateString() : '-'}
                    </td>
                    <td>{item.source_name || '-'}</td>
                    <td>
                      <span
                        className={`badge ${
                          item.status === 'admitted'
                            ? 'badge-success'
                            : item.status === 'rejected'
                            ? 'badge-error'
                            : 'badge-warning'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reports;

