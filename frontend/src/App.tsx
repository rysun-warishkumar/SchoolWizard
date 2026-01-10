import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { QueryClient, QueryClientProvider } from 'react-query';
import Layout from './layouts/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/users/Users';
import Roles from './pages/roles/Roles';
import Settings from './pages/settings/Settings';
import Profile from './pages/profile/Profile';
import Academics from './pages/academics/Academics';
import Students from './pages/students/Students';
import FrontOffice from './pages/frontoffice/FrontOffice';
import HR from './pages/hr/HR';
import Fees from './pages/fees/Fees';
import Income from './pages/income/Income';
import Expenses from './pages/expenses/Expenses';
import Attendance from './pages/attendance/Attendance';
import Examinations from './pages/examinations/Examinations';
import OnlineExaminations from './pages/onlineExaminations/OnlineExaminations';
import Homework from './pages/homework/Homework';
import Library from './pages/library/Library';
import DownloadCenter from './pages/downloadCenter/DownloadCenter';
import Communicate from './pages/communicate/Communicate';
import Inventory from './pages/inventory/Inventory';
import Transport from './pages/transport/Transport';
import Hostel from './pages/hostel/Hostel';
import Certificate from './pages/certificate/Certificate';
import Calendar from './pages/calendar/Calendar';
import Chat from './pages/chat/Chat';
import Alumni from './pages/alumni/Alumni';
import Reports from './pages/reports/Reports';
import LessonPlan from './pages/lessonPlan/LessonPlan';
import FrontCmsWebsite from './pages/frontCmsWebsite/FrontCmsWebsite';
import AdmissionInquiries from './pages/admissionInquiries/AdmissionInquiries';
import ContactMessages from './pages/contactMessages/ContactMessages';
import ProtectedRoute from './components/auth/ProtectedRoute';
import StudentRoute from './components/auth/StudentRoute';
import ParentRoute from './components/auth/ParentRoute';
import StaffRoute from './components/auth/StaffRoute';
import ParentLayout from './layouts/ParentLayout';
import StudentDashboard from './pages/student/Dashboard';
import StudentProfile from './pages/student/StudentProfile';
import StudentFees from './pages/student/StudentFees';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentHomework from './pages/student/StudentHomework';
import StudentTimetable from './pages/student/StudentTimetable';
import StudentLeave from './pages/student/StudentLeave';
import StudentDownloads from './pages/student/StudentDownloads';
import StudentNotices from './pages/student/StudentNotices';
import StudentSubjects from './pages/student/StudentSubjects';
import StudentTeachers from './pages/student/StudentTeachers';
import StudentTeachersReview from './pages/student/StudentTeachersReview';
import StudentLibrary from './pages/student/StudentLibrary';
import StudentLibraryIssued from './pages/student/StudentLibraryIssued';
import StudentTransport from './pages/student/StudentTransport';
import StudentHostel from './pages/student/StudentHostel';
import StudentOnlineExam from './pages/student/StudentOnlineExam';
import ParentDashboard from './pages/parent/Dashboard';
import ParentProfile from './pages/parent/ParentProfile';
import ParentFees from './pages/parent/ParentFees';
import ParentAttendance from './pages/parent/ParentAttendance';
import ParentHomework from './pages/parent/ParentHomework';
import ParentTimetable from './pages/parent/ParentTimetable';
import ParentDownloads from './pages/parent/ParentDownloads';
import ParentNotices from './pages/parent/ParentNotices';
import ParentLeave from './pages/parent/ParentLeave';
import ParentOnlineExam from './pages/parent/ParentOnlineExam';
import ParentSubjects from './pages/parent/ParentSubjects';
import ParentTeachersReview from './pages/parent/ParentTeachersReview';
import ParentTeachers from './pages/parent/ParentTeachers';
import ParentLibrary from './pages/parent/ParentLibrary';
import ParentLibraryIssued from './pages/parent/ParentLibraryIssued';
import ParentTransport from './pages/parent/ParentTransport';
import ParentHostel from './pages/parent/ParentHostel';
import StaffDashboard from './pages/staff/Dashboard';
import StaffProfile from './pages/staff/StaffProfile';
import StaffClasses from './pages/staff/StaffClasses';
import StaffStudents from './pages/staff/StaffStudents';
import StaffTimetable from './pages/staff/StaffTimetable';
import StaffAttendance from './pages/staff/StaffAttendance';
import StaffLeave from './pages/staff/StaffLeave';
import StaffPayroll from './pages/staff/StaffPayroll';
import StaffHomework from './pages/staff/StaffHomework';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              {/* Root redirect to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              {/* Protected Admin Routes - These will only match if user is authenticated */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute allowedRoles={['superadmin', 'admin', 'teacher', 'accountant', 'librarian', 'receptionist']}>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/users" element={<Users />} />
                        <Route path="/roles" element={<Roles />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/academics" element={<Academics />} />
                        <Route path="/students" element={<Students />} />
                        <Route path="/students/:id" element={<Students />} />
                        <Route path="/front-office" element={<FrontOffice />} />
                        <Route path="/hr" element={<HR />} />
                        <Route path="/fees" element={<Fees />} />
                        <Route path="/income" element={<Income />} />
                        <Route path="/expenses" element={<Expenses />} />
                        <Route path="/attendance" element={<Attendance />} />
                        <Route path="/examinations" element={<Examinations />} />
                        <Route path="/online-examinations" element={<OnlineExaminations />} />
                        <Route path="/homework" element={<Homework />} />
                        <Route path="/library" element={<Library />} />
                        <Route path="/download-center" element={<DownloadCenter />} />
                        <Route path="/communicate" element={<Communicate />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/transport" element={<Transport />} />
                        <Route path="/hostel" element={<Hostel />} />
                        <Route path="/certificate" element={<Certificate />} />
                        <Route path="/calendar" element={<Calendar />} />
                        <Route path="/chat" element={<Chat />} />
                        <Route path="/alumni" element={<Alumni />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/lesson-plan" element={<LessonPlan />} />
                        <Route path="/front-cms-website" element={<FrontCmsWebsite />} />
                        <Route path="/admission-inquiries" element={<AdmissionInquiries />} />
                        <Route path="/contact-messages" element={<ContactMessages />} />
                        {/* More routes will be added as modules are developed */}
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              {/* Student Panel Routes */}
              <Route
                path="/student/*"
                element={
                  <StudentRoute>
                    <Routes>
                      <Route path="dashboard" element={<StudentDashboard />} />
                      <Route path="profile" element={<StudentProfile />} />
                      <Route path="fees" element={<StudentFees />} />
                      <Route path="timetable" element={<StudentTimetable />} />
                      <Route path="homework" element={<StudentHomework />} />
                      <Route path="exams" element={<StudentOnlineExam />} />
                      <Route path="leave" element={<StudentLeave />} />
                      <Route path="downloads" element={<StudentDownloads />} />
                      <Route path="attendance" element={<StudentAttendance />} />
                      <Route path="notices" element={<StudentNotices />} />
                      <Route path="teachers" element={<StudentTeachersReview />} />
                      <Route path="subjects" element={<StudentSubjects />} />
                      <Route path="teachers-list" element={<StudentTeachers />} />
                      <Route path="library" element={<StudentLibrary />} />
                      <Route path="library-issued" element={<StudentLibraryIssued />} />
                      <Route path="transport" element={<StudentTransport />} />
                      <Route path="hostel" element={<StudentHostel />} />
                      <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
                    </Routes>
                  </StudentRoute>
                }
              />
              {/* Parent Panel Routes */}
              <Route
                path="/parent/*"
                element={
                  <ParentRoute>
                    <ParentLayout>
                      <Routes>
                        <Route path="dashboard" element={<ParentDashboard />} />
                        <Route path="profile" element={<ParentProfile />} />
                        <Route path="fees" element={<ParentFees />} />
                        <Route path="timetable" element={<ParentTimetable />} />
                        <Route path="homework" element={<ParentHomework />} />
                        <Route path="exams" element={<ParentOnlineExam />} />
                        <Route path="leave" element={<ParentLeave />} />
                        <Route path="downloads" element={<ParentDownloads />} />
                        <Route path="attendance" element={<ParentAttendance />} />
                        <Route path="notices" element={<ParentNotices />} />
                        <Route path="teachers" element={<ParentTeachersReview />} />
                        <Route path="subjects" element={<ParentSubjects />} />
                        <Route path="teachers-list" element={<ParentTeachers />} />
                        <Route path="library" element={<ParentLibrary />} />
                        <Route path="library-issued" element={<ParentLibraryIssued />} />
                        <Route path="transport" element={<ParentTransport />} />
                        <Route path="hostel" element={<ParentHostel />} />
                        <Route path="*" element={<Navigate to="/parent/dashboard" replace />} />
                      </Routes>
                    </ParentLayout>
                  </ParentRoute>
                }
              />
              {/* Staff Panel Routes */}
              <Route
                path="/staff/*"
                element={
                  <StaffRoute>
                    <Routes>
                      <Route path="dashboard" element={<StaffDashboard />} />
                      <Route path="profile" element={<StaffProfile />} />
                      <Route path="classes" element={<StaffClasses />} />
                      <Route path="students" element={<StaffStudents />} />
                      <Route path="timetable" element={<StaffTimetable />} />
                      <Route path="attendance" element={<StaffAttendance />} />
                      <Route path="leave" element={<StaffLeave />} />
                      <Route path="payroll" element={<StaffPayroll />} />
                      <Route path="homework" element={<StaffHomework />} />
                      <Route path="downloads" element={<StudentDownloads />} />
                      <Route path="notices" element={<StudentNotices />} />
                      <Route path="chat" element={<Chat />} />
                      <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
                    </Routes>
                  </StaffRoute>
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

