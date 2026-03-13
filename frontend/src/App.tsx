import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useQuery } from 'react-query';
import Layout from './layouts/Layout';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import RegisterSchool from './pages/auth/RegisterSchool';
import TrialExpired from './pages/auth/TrialExpired';
import PlatformAdmin from './pages/platform/PlatformAdmin';
import HostingGuide from './pages/platform/HostingGuide';
import PlatformSchoolDetails from './pages/platform/PlatformSchoolDetails';
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
import { profileService } from './services/api/profileService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function DefaultRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const isPlatformAdmin =
    user?.isPlatformAdmin === true ||
    (user?.role === 'superadmin' && (user?.schoolId == null || user?.schoolId === undefined));
  return <Navigate to={isPlatformAdmin ? '/platform' : '/dashboard'} replace />;
}

function PlatformAdminOnlyRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isPlatformAdmin =
    user?.isPlatformAdmin === true ||
    (user?.role === 'superadmin' && (user?.schoolId == null || user?.schoolId === undefined));

  if (!isPlatformAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function ModuleViewRoute({ moduleName, children }: { moduleName: string; children: ReactNode }) {
  const { user } = useAuth();
  const isPlatformAdmin =
    user?.isPlatformAdmin === true ||
    (user?.role === 'superadmin' && (user?.schoolId == null || user?.schoolId === undefined));
  const shouldCheck = !!user && !isPlatformAdmin && user?.role !== 'superadmin';

  const { data: permissionsData, isLoading } = useQuery(
    'user-permissions',
    () => profileService.getUserPermissions(),
    { enabled: shouldCheck, refetchOnWindowFocus: false }
  );

  if (!shouldCheck) {
    return children;
  }

  if (isLoading) {
    return <div className="loading">Loading permissions...</div>;
  }

  const userPermissions = permissionsData?.data || {};
  const modulePermissions: string[] = userPermissions[moduleName] || [];
  if (!modulePermissions.includes('view')) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/register-school" element={<RegisterSchool />} />
              <Route path="/trial-expired" element={<TrialExpired />} />
              {/* Root: platform admin -> /platform, others -> /dashboard, not logged in -> /login */}
              <Route path="/" element={<DefaultRedirect />} />
              {/* Protected Admin Routes - These will only match if user is authenticated */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute allowedRoles={['superadmin', 'admin', 'teacher', 'accountant', 'librarian', 'receptionist']}>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<DefaultRedirect />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/users" element={<ModuleViewRoute moduleName="users"><Users /></ModuleViewRoute>} />
                        <Route path="/roles" element={<ModuleViewRoute moduleName="roles"><Roles /></ModuleViewRoute>} />
                        <Route path="/settings" element={<ModuleViewRoute moduleName="settings"><Settings /></ModuleViewRoute>} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/academics" element={<ModuleViewRoute moduleName="academics"><Academics /></ModuleViewRoute>} />
                        <Route path="/students" element={<ModuleViewRoute moduleName="students"><Students /></ModuleViewRoute>} />
                        <Route path="/students/:id" element={<ModuleViewRoute moduleName="students"><Students /></ModuleViewRoute>} />
                        <Route path="/front-office" element={<ModuleViewRoute moduleName="front-office"><FrontOffice /></ModuleViewRoute>} />
                        <Route path="/hr" element={<ModuleViewRoute moduleName="hr"><HR /></ModuleViewRoute>} />
                        <Route path="/fees" element={<ModuleViewRoute moduleName="fees"><Fees /></ModuleViewRoute>} />
                        <Route path="/income" element={<ModuleViewRoute moduleName="income"><Income /></ModuleViewRoute>} />
                        <Route path="/expenses" element={<ModuleViewRoute moduleName="expenses"><Expenses /></ModuleViewRoute>} />
                        <Route path="/attendance" element={<ModuleViewRoute moduleName="attendance"><Attendance /></ModuleViewRoute>} />
                        <Route path="/examinations" element={<ModuleViewRoute moduleName="examinations"><Examinations /></ModuleViewRoute>} />
                        <Route path="/online-examinations" element={<ModuleViewRoute moduleName="online-examinations"><OnlineExaminations /></ModuleViewRoute>} />
                        <Route path="/homework" element={<ModuleViewRoute moduleName="homework"><Homework /></ModuleViewRoute>} />
                        <Route path="/library" element={<ModuleViewRoute moduleName="library"><Library /></ModuleViewRoute>} />
                        <Route path="/download-center" element={<ModuleViewRoute moduleName="download-center"><DownloadCenter /></ModuleViewRoute>} />
                        <Route path="/communicate" element={<ModuleViewRoute moduleName="communicate"><Communicate /></ModuleViewRoute>} />
                        <Route path="/inventory" element={<ModuleViewRoute moduleName="inventory"><Inventory /></ModuleViewRoute>} />
                        <Route path="/transport" element={<ModuleViewRoute moduleName="transport"><Transport /></ModuleViewRoute>} />
                        <Route path="/hostel" element={<ModuleViewRoute moduleName="hostel"><Hostel /></ModuleViewRoute>} />
                        <Route path="/certificate" element={<ModuleViewRoute moduleName="certificate"><Certificate /></ModuleViewRoute>} />
                        <Route path="/calendar" element={<ModuleViewRoute moduleName="calendar"><Calendar /></ModuleViewRoute>} />
                        <Route path="/chat" element={<ModuleViewRoute moduleName="chat"><Chat /></ModuleViewRoute>} />
                        <Route path="/alumni" element={<ModuleViewRoute moduleName="alumni"><Alumni /></ModuleViewRoute>} />
                        <Route path="/reports" element={<ModuleViewRoute moduleName="reports"><Reports /></ModuleViewRoute>} />
                        <Route path="/lesson-plan" element={<ModuleViewRoute moduleName="lesson-plan"><LessonPlan /></ModuleViewRoute>} />
                        <Route path="/front-cms-website" element={<ModuleViewRoute moduleName="settings"><FrontCmsWebsite /></ModuleViewRoute>} />
                        <Route path="/admission-inquiries" element={<ModuleViewRoute moduleName="settings"><AdmissionInquiries /></ModuleViewRoute>} />
                        <Route path="/contact-messages" element={<ModuleViewRoute moduleName="settings"><ContactMessages /></ModuleViewRoute>} />
                        <Route path="/platform" element={<PlatformAdminOnlyRoute><PlatformAdmin /></PlatformAdminOnlyRoute>} />
                        <Route path="/platform/schools/:id" element={<PlatformAdminOnlyRoute><PlatformSchoolDetails /></PlatformAdminOnlyRoute>} />
                        <Route
                          path="/hosting-guide"
                          element={
                            <PlatformAdminOnlyRoute>
                              <HostingGuide />
                            </PlatformAdminOnlyRoute>
                          }
                        />
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

