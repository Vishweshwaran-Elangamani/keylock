import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/auth/AuthContext";
import ProtectedRoute from "./components/guards/ProtectedRoute";
import PublicRoute from "./components/guards/PublicRoute";
import DashboardLayout from "./layouts/DashboardLayout";
// Auth Pages
import Login from "./pages/auth/common/Login";
import VerifyCode from "./pages/auth/common/VerifyCode";
import ChangePassword from "./pages/auth/common/ChangePassword";
import ResetPassword from "./pages/auth/common/ResetPassword";
import VerifyResetOtp from "./pages/auth/common/VerifyResetOtp";
import VerifyFirstLogin from "./pages/auth/common/VerifyFirstLogin";
import EmployeeProfile from "./pages/auth/common/EmployeeProfile";
// Admin Pages
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import DepartmentList from "./pages/auth/admin/departments/DepartmentList";
import RoleList from "./pages/auth/admin/roles/RoleList";
import UserList from "./pages/auth/admin/users/UserList";
import ChangeRequestManagement from "./pages/auth/admin/ChangeRequestManagement";
// HR Pages
import HRDashboard from "./pages/dashboards/HRDashboard";
import HROperations from "./pages/hr_operations/hr/HROperations";
import HRHome from "./pages/performancemanagement/hr/HRHome";
import FormCreate from "./pages/performancemanagement/hr/FormCreate";
import FormProgressTrackerPage from "./pages/performancemanagement/hr/Formprogresstracker";
import FormsList from "./pages/performancemanagement/hr/FormsList";
import HRNominations from "./pages/performancemanagement/hr/HRNomination";
import HRAssessmentView from "./pages/performancemanagement/hr/HRViewAssessment";
import RewardConfiguration from "./pages/performancemanagement/hr/Rewardconfiguration";
import DraftsList from "./pages/performancemanagement/hr/DraftList";
import ProjectManagementDashboard from "./pages/project_management/ProjectManagementDashboard";
import CreateProject from "./pages/project_management/CreateProject";
import ProjectDetails from "./pages/project_management/ProjectDetails";
import ProjectList from "./pages/project_management/ProjectList";
import ResourcePoolMapping from "./pages/project_management/ResourcePoolMapping";
import HRSLADashboard from "./pages/sla/HRSLADashboard";
import FeedbackHRDashboard from "./pages/feedback_management/FeedbackHRDashboard";
import CreateFeedbackForm from "./pages/feedback_management/hr/CreateFeedbackForm";
import HRFeedbackList from "./pages/feedback_management/hr/HRFeedbackList";
import SLADetails from "./pages/sla/SLADetails";
// Internal Opportunity
import InternalOpportunityManagement from "./pages/internal/InternalOpportunityManagement";
import NominationManagement from "./pages/internal/NominationManagement";
import PromotionManagement from "./pages/internal/PromotionManagement";
import LeadershipDashboard from "./pages/dashboards/LeadershipDashboard";
import BudgetAllocation from "./pages/hr_operations/hr/compliance/BudgetAllocation";
import LeadershipApproval from "./pages/hr_operations/hr/LeadershipApproval";
import DepartmentHeadDashboard from "./pages/dashboards/DepartmentHeadDashboard";
import DeptHeadPage from "./pages/performancemanagement/departmenthead/DeptHeadPage";
import DeptHeadSLADashboard from "./pages/sla/DeptHeadDashboard";
import SLACompliance from "./pages/sla/SLACompliance";
import DepartmentHeadBudgetView from "./pages/hr_operations/hr/compliance/DepartmentHeadBudgetView";
import TopPerformers from "./pages/performancemanagement/departmenthead/deptheadtopperformer";
import ManagerDashboard from "./pages/dashboards/ManagerDashboard";
import PerformanceManagerHome from "./pages/performancemanagement/manager/PerformanceManagerHome";
import ManagerNomination from "./pages/performancemanagement/manager/ManagerNomination";
import TeamLeadPage from "./pages/performancemanagement/manager/TeamLeadPage";
import ManagerPerformanceDashboard from "./pages/performancemanagement/manager/ManagerPerformanceDashboard";
import ManagerSLADashboard from "./pages/sla/ManagerSLADashboard";
import EmployeeDashboard from "./pages/dashboards/EmployeeDashboard";
import EmployeeSLADashboard from "./pages/sla/EmployeeSLADashboard";
import UserAssignments from "./pages/performancemanagement/employee/MyAssessments";
import EmployeePolicyView from "./pages/hr_operations/employee/EmployeePolicyView";
import SubmitMentorFeedback from "./pages/feedback_management/feedback/SubmitMentorFeedback";
//LnD
import LnDDashboard from "./pages/lnd/dashboard/LnDDashboard";
import MySkills from "./pages/lnd/skills/MySkills";
import TeamSkills from "./pages/lnd/skills/TeamSkills";
import MyAssignments from "./pages/lnd/assignments/MyAssignments";
import TeamAssignments from "./pages/lnd/assignments/TeamAssignments";
import SmeAssignments from "./pages/lnd/assignments/SmeAssignments";
import ApprovalHistory from "./pages/lnd/approvals/ApprovalHistory";
import PendingApprovals from "./pages/lnd/approvals/PendingApprovals";
import OrganizationSkills from './pages/lnd/hr/OrganizationSkills';
import OrganizationAssignments from './pages/lnd/hr/OrganizationAssignments';
import SmeDirectory from './pages/lnd/hr/SmeDirectory';
//Goals
import GoalsDashboard from "./pages/goals/GoalsDashboard";
import YourGoalsPage from "./pages/goals/YourGoalsPage";
import ViewGoalPage from "./pages/goals/ViewGoalPage";
import GoalApprovalsPage from "./pages/goals/GoalApprovalsPage";
//Feedback imports
import FeedbackEmployeeDashboard from './pages/feedback_management/FeedbackEmployeeDashboard';
import FeedbackManagerDashboard from './pages/feedback_management/FeedbackManagerDashboard';
import FeedbackDepartmentHeadDashboard from './pages/feedback_management/FeedbackDepartmentHeadDashboard';
import SubmitContextFeedback from './pages/feedback_management/feedback/SubmitContextFeedback';
import MySubmissions from './pages/feedback_management/feedback/MySubmissions';
import EmployeeAssignedForms from './pages/feedback_management/feedback/EmployeeAssignedForms';
import EmployeeFillForm from './pages/feedback_management/feedback/EmployeeFillForm';
import ViewMyPeerFeedback from './pages/feedback_management/feedback/ViewMyPeerFeedback';
import CreateManagerReview from './pages/feedback_management/manager/CreateManagerReview';
import ManagerReviewsList from './pages/feedback_management/manager/ManagerReviewsList';
import ManagerEmployeeList from './pages/feedback_management/manager/ManagerEmployeeList';
import ManagerTeamSubmissions from './pages/feedback_management/manager/ManagerTeamSubmissions';
import AllManagerReviews from './pages/feedback_management/head/AllManagerReviews';
import EmployeeHome from "./pages/performancemanagement/employee/employeehome";
import EmployeeAcknowledgment from "./pages/performancemanagement/employee/EmployeeAcknowledge";
import ManagerAcknowledgment from "./pages/performancemanagement/manager/ManagerAcknowledgment";
import MentorFeedbackDashboard from "./pages/feedback_management/feedback/MentorFeedbackDashboard";
import ViewManagerReview from "./pages/feedback_management/manager/ViewManagerReview";
//Meeting and MOM
import EmployeeMomDashboard from './pages/meeting/EmployeeMomDashboard'
import ManagerMomDashboard from "./pages/meeting/ManagerMomDashboard";
import CreateOrEditMom from './pages/meeting/CreateOrEditMom'
import ScheduleMeeting from './pages/meeting/ScheduleMeeting'
import MeetingInvitations from './pages/meeting/MeetingInvitations'
import RSVPSummary from "./pages/meeting/RSVPSummary";
import MyMomsList from "./pages/meeting/MyMomsList"
import ActionItemsManagement from "./pages/meeting/ActionItemsManagement"
import HRMomDashboard from "./pages/meeting/HRMomDashboard";
import HRMomDetails from './pages/meeting/HRMomDetails'

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
    //region DEFAULT/FALLBACK ROUTES
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    //endregion DEFAULT/FALLBACK ROUTES
      //region PUBLIC ROUTES
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/verify-code"
        element={
          <PublicRoute>
            <VerifyCode />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/verify-reset-otp"
        element={
          <PublicRoute>
            <VerifyResetOtp />
          </PublicRoute>
        }
      />
      <Route
        path="/verify-first-login"
        element={
          <PublicRoute>
            <VerifyFirstLogin />
          </PublicRoute>
        }
      />
      <Route path="/change-password" element={<ChangePassword />} />
      //endregion PUBLIC ROUTES
      //region ADMIN ROUTES
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <DashboardLayout role="Admin">
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/departments"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <DashboardLayout role="Admin">
              <DepartmentList />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <DashboardLayout role="Admin">
              <UserList />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/roles"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <DashboardLayout role="Admin">
              <RoleList />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/change-requests"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <DashboardLayout role="Admin">
              <ChangeRequestManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      //endregion ADMIN ROUTES
      //region HR ROUTES
      <Route
        path="/hr/dashboard"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <HRDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      //region HR • PERFORMANCE
      <Route
        path="/hr/dashboard/performance"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <HRHome />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/dashboard/performance/formslist"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <FormsList />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/dashboard/performance/create"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <FormCreate />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/dashboard/performance/progress"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <FormProgressTrackerPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/dashboard/performance/reward"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <RewardConfiguration />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/dashboard/performance/nominations"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <HRNominations />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/dashboard/performance/draftlists"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <DraftsList />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/dashboard/performance/status"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <HRAssessmentView />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      //endregion HR • PERFORMANCE
      //region HR • PROJECT MANAGEMENT
      <Route
        path="/hr/dashboard/projectmgmt"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <ProjectManagementDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/dashboard/projectmgmt/create"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <CreateProject />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/dashboard/projectmgmt/list"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <ProjectList />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/dashboard/projectmgmt/view/:projectId"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <ProjectDetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/dashboard/projectmgmt/resourcepool"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <ResourcePoolMapping />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      //endregion HR • PROJECT MANAGEMENT
      //region HR • SLA
      <Route
        path="/hr/dashboard/sla"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <HRSLADashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/dashboard/sla/details/:slaid"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <SLADetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      //endregion HR • SLA
      //region HR • FEEDBACK
      <Route
        path="/hr/dashboard/feedback"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <FeedbackHRDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/dashboard/feedback/create-form"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <CreateFeedbackForm />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/dashboard/feedback/hrformlist"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              {/* Keep HRFeedbackList as per your original routing */}
              <HRFeedbackList />
              {/* If you ever want FeedbackFormsList instead, swap it here */}
              {/* <FeedbackFormsList /> */}
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/dashboard/feedback/submit-mentor"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <SubmitMentorFeedback />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      //endregion HR • Feedback
      //region HR • OPS
      <Route
        path="/hr/operations/*"
        element={
          <ProtectedRoute allowedRoles={["HR", "Department Head", "Manager"]}>
            <DashboardLayout role={["HR", "Department Head, Manager"]}>
              <HROperations />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      //endregion HR • OPS
      //endregion HR ROUTES
      //region INTERNAL OPPORTUNITIES
      {/* ========== INTERNAL OPPORTUNITY ROUTES ========== */}
      {/*  INTERNAL OPPORTUNITIES - Accessible to Employee, Manager, HR with dynamic role-based UI */}
      <Route
        path="/internal/opportunities"
        element={
          <ProtectedRoute allowedRoles={["Employee", "Manager", "HR"]}>
            <DashboardLayout role={["Employee", "Manager", "HR"]}>
              <InternalOpportunityManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      {/*  NOMINATIONS - Employee self-nominate, Manager nominate & review, DeptHead review, HR view all */}
      <Route
        path="/internal/nominations"
        element={
          <ProtectedRoute allowedRoles={["Employee", "Manager", "Department Head", "HR"]}>
            <DashboardLayout role={["Employee", "Manager", "Department Head", "HR"]}>
              <NominationManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      {/*  PROMOTIONS - HR creates from approved nominations, Leadership approves/rejects */}
      <Route
        path="/internal/promotions"
        element={
          <ProtectedRoute allowedRoles={["HR", "Leadership"]}>
            <DashboardLayout role={["HR", "Leadership"]}>
              <PromotionManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      //region INTERNAL OPPORTUNITIES LEADERSHIP
      <Route
        path="/leadership/dashboard"
        element={
          <ProtectedRoute allowedRoles={["Leadership"]}>
            <DashboardLayout role="Leadership">
              <LeadershipDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leadership/promotions"
        element={
          <ProtectedRoute allowedRoles={["Leadership"]}>
            <DashboardLayout role="Leadership">
              <LeadershipApproval />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leadership/budget-management"
        element={
          <ProtectedRoute allowedRoles={["Leadership"]}>
            <DashboardLayout role="Leadership">
              <BudgetAllocation />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leadership/policies"
        element={
          <ProtectedRoute allowedRoles={["Leadership"]}>
            <DashboardLayout role="Leadership">
              <EmployeePolicyView />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      //endregion INTERNAL OPPORTUNITIES LEADERSHIP
      //region INTERNAL OPPORTUNITIES DEPARTMENT HEAD
      <Route
        path="/department-head/dashboard"
        element={
          <ProtectedRoute allowedRoles={["Department Head"]}>
            <DashboardLayout role="Department Head">
              <DepartmentHeadDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/department-head/dashboard/performance"
        element={
          <ProtectedRoute allowedRoles={["Department Head"]}>
            <DashboardLayout role="Department Head">
              <DeptHeadPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/department-head/dashboard/performance/top-performers"
        element={
          <ProtectedRoute allowedRoles={["Department Head"]}>
            <DashboardLayout role="Department Head">
              <TopPerformers />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/department-head/dashboard/sla"
        element={
          <ProtectedRoute allowedRoles={["Department Head"]}>
            <DashboardLayout role="Department Head">
              <DeptHeadSLADashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/department-head/dashboard/sla/compliance"
        element={
          <ProtectedRoute allowedRoles={["Department Head"]}>
            <DashboardLayout role="Department Head">
              <SLACompliance />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sla/depthead/details/:slaid"
        element={
          <ProtectedRoute allowedRoles={["Department Head"]}>
            <DashboardLayout role="Department Head">
              <SLADetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/department-head/policies"
        element={
          <ProtectedRoute allowedRoles={["Department Head"]}>
            <DashboardLayout role="Department Head">
              <EmployeePolicyView />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/department-head/budget"
        element={
          <ProtectedRoute allowedRoles={["Department Head"]}>
            <DashboardLayout role="Department Head">
              <DepartmentHeadBudgetView />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      //endregion INTERNAL OPPORTUNITIES DEPARTMENT HEAD
      //region INTERNAL OPPORTUNITIES MANAGER
      <Route
        path="/manager/dashboard"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <ManagerDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard/performance"
        element={
          <ProtectedRoute allowedRoles={["Manager", "Department Head"]}>
            <DashboardLayout role={["Manager", "Department Head"]}>
              <PerformanceManagerHome />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard/performance/submitform"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <ManagerPerformanceDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard/performance/nomination"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <ManagerNomination />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard/performance/teamlead"
        element={
          <ProtectedRoute allowedRoles={["Manager", "Department Head"]}>
            <DashboardLayout role={["Manager", "Department Head"]}>
              <TeamLeadPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard/sla"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <ManagerSLADashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sla/manager/details/:slaid"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <SLADetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/policies"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <EmployeePolicyView />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      //endregion INTERNAL OPPORTUNITIES MANAGER
      //region INTERNAL OPPORTUNITIES EMPLOYEE 
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              <EmployeeDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/dashboard/performance"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              <EmployeeHome />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/dashboard/performance/my-assessments"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              < UserAssignments />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/dashboard/sla"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              <EmployeeSLADashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/dashboard/sla/details/:slaid"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              <SLADetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/policies"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              <EmployeePolicyView />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      //endregion INTERNAL OPPORTUNITIES EMPLOYEE
      //region SHARED 
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <DashboardLayout role={user?.role}>
              <EmployeeProfile />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      //endregion SHARED
      //region GOALS LEADERSHIP
      {/* Leadership Goal Routes */}
      <Route
        path="/leadership/dashboard/goals"
        element={
          <ProtectedRoute allowedRoles={["Leadership"]}>
            <DashboardLayout role="Leadership">
              <GoalsDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leadership/goals/your-goals"
        element={
          <ProtectedRoute allowedRoles={["Leadership"]}>
            <DashboardLayout role="Leadership">
              <YourGoalsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leadership/goals/:id"
        element={
          <ProtectedRoute allowedRoles={["Leadership"]}>
            <DashboardLayout role="Leadership">
              <ViewGoalPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leadership/goals/approvals"
        element={
          <ProtectedRoute allowedRoles={["Leadership"]}>
            <DashboardLayout role="Leadership">
              <GoalApprovalsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      //endregion GOALS LEADERSHIP
      //region GOALS DEPT HEAD
      <Route
        path="/department-head/dashboard/goals"
        element={
          <ProtectedRoute allowedRoles={["Department Head"]}>
            <DashboardLayout role="Department Head">
              <GoalsDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      //endregion GOALS DEPT HEAD
      //region GOALS MANAGER
      {/* Manager Goal Routes */}
      <Route
        path="/manager/dashboard/goals"
        element={
          <ProtectedRoute allowedRoles={["Manager", "Department Head"]}>
            <DashboardLayout role={["Manager", "Department Head"]}>
              <GoalsDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/goals/your-goals"
        element={
          <ProtectedRoute allowedRoles={["Manager", "Department Head"]}>
            <DashboardLayout role={["Manager", "Department Head"]}>
              <YourGoalsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/goals/:id"
        element={
          <ProtectedRoute allowedRoles={["Manager", "Department Head"]}>
            <DashboardLayout role={["Manager", "Department Head"]}>
              <ViewGoalPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/goals/approvals"
        element={
          <ProtectedRoute allowedRoles={["Manager", "Department Head"]}>
            <DashboardLayout role={["Manager", "Department Head"]}>
              <GoalApprovalsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      //endregion GOALS MANAGER
      //region GOALS EMPLOYEE
      {/* Employee Goal Routes */}
      <Route
        path="/employee/dashboard/goals"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              <GoalsDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/goals/your-goals"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              <YourGoalsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/goals/:id"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              <ViewGoalPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/goals/approvals"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              <GoalApprovalsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      //endregion GOALS EMPLOYEE
      //region LND LEADERSHIP
      {/* Leadership L&D Routes */}
      <Route
        path="/leadership/lnd/dashboard"
        element={
          <ProtectedRoute allowedRoles={["Leadership"]}>
            <DashboardLayout role="Leadership">
              <LnDDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leadership/lnd/my-skills"
        element={
          <ProtectedRoute allowedRoles={["Leadership"]}>
            <DashboardLayout role="Leadership">
              <MySkills />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leadership/lnd/team/skills"
        element={
          <ProtectedRoute allowedRoles={["Leadership"]}>
            <DashboardLayout role="Leadership">
              <TeamSkills />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leadership/lnd/my-assignments"
        element={
          <ProtectedRoute allowedRoles={["Leadership"]}>
            <DashboardLayout role="Leadership">
              <MyAssignments />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leadership/lnd/assignments/team"
        element={
          <ProtectedRoute allowedRoles={["Leadership"]}>
            <DashboardLayout role="Leadership">
              <TeamAssignments />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leadership/lnd/sme/assignments"
        element={
          <ProtectedRoute allowedRoles={["Leadership"]}>
            <DashboardLayout role="Leadership">
              <SmeAssignments />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leadership/lnd/approvals/pending"
        element={
          <ProtectedRoute allowedRoles={["Leadership"]}>
            <DashboardLayout role="Leadership">
              <PendingApprovals />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leadership/lnd/approvals/history"
        element={
          <ProtectedRoute allowedRoles={["Leadership"]}>
            <DashboardLayout role="Leadership">
              <ApprovalHistory />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      //endregion LND LEADERSHIP
      //region LND DEPARTMENT HEAD
      {/* Department Head L&D Routes */}
      <Route
        path="/department-head/lnd/dashboard"
        element={
          <ProtectedRoute allowedRoles={["Department Head"]}>
            <DashboardLayout role="Department Head">
              <LnDDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/department-head/lnd/my-skills"
        element={
          <ProtectedRoute allowedRoles={["Department Head"]}>
            <DashboardLayout role="Department Head">
              <MySkills />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/department-head/lnd/team/skills"
        element={
          <ProtectedRoute allowedRoles={["Department Head"]}>
            <DashboardLayout role="Department Head">
              <TeamSkills />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/department-head/lnd/my-assignments"
        element={
          <ProtectedRoute allowedRoles={["Department Head"]}>
            <DashboardLayout role="Department Head">
              <MyAssignments />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/department-head/lnd/assignments/team"
        element={
          <ProtectedRoute allowedRoles={["Department Head"]}>
            <DashboardLayout role="Department Head">
              <TeamAssignments />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/department-head/lnd/sme/assignments"
        element={
          <ProtectedRoute allowedRoles={["Department Head"]}>
            <DashboardLayout role="Department Head">
              <SmeAssignments />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/department-head/lnd/approvals/pending"
        element={
          <ProtectedRoute allowedRoles={["Department Head"]}>
            <DashboardLayout role="Department Head">
              <PendingApprovals />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/department-head/lnd/approvals/history"
        element={
          <ProtectedRoute allowedRoles={["Department Head"]}>
            <DashboardLayout role="Department Head">
              <ApprovalHistory />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      //endregion LND DEPARTMENT HEAD
      //region LND MANAGER
      {/* Manager L&D Routes */}
      <Route
        path="/manager/lnd/dashboard"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <LnDDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/lnd/my-skills"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <MySkills />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/lnd/team/skills"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <TeamSkills />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/lnd/my-assignments"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <MyAssignments />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/lnd/assignments/team"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <TeamAssignments />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/lnd/sme/assignments"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <SmeAssignments />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/lnd/approvals/pending"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <PendingApprovals />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/lnd/approvals/history"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <ApprovalHistory />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      //endregion LND MANAGER
      //region LND EMPLOYEE
      {/* Employee L&D Routes */}
      <Route
        path="/employee/lnd/dashboard"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              <LnDDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/lnd/my-skills"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              <MySkills />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/lnd/my-assignments"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              <MyAssignments />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/lnd/sme/assignments"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              <SmeAssignments />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/lnd/approvals/pending"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              <PendingApprovals />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/lnd/approvals/history"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              <ApprovalHistory />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      //endregion LND EMPLOYEE
      //region LND HR
      <Route
        path="/hr/lnd/dashboard"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <LnDDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/lnd/my-skills"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <MySkills />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/lnd/my-assignments"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <MyAssignments />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/lnd/sme/assignments"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <SmeAssignments />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/lnd/approvals/pending"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <PendingApprovals />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/lnd/approvals/history"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <ApprovalHistory />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/lnd/organization-skills"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <OrganizationSkills />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/lnd/organization-assignments"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <OrganizationAssignments />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/lnd/sme-directory"
        element={
          <ProtectedRoute allowedRoles={["HR"]}>
            <DashboardLayout role="HR">
              <SmeDirectory />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
        //endregion LND HR
      //endregion DEFAULT/FALLBACK ROUTES
      //region FEEDBACK EMPLOYEE 
      <Route
        path="/employee/dashboard/feedback"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              <FeedbackEmployeeDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/dashboard/feedback/submit-mentor"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              <SubmitMentorFeedback />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/dashboard/feedback/contextfeedback"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              <SubmitContextFeedback />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/dashboard/feedback/assignedform"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              <EmployeeAssignedForms />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/dashboard/feedback/submit-peer"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              <ViewMyPeerFeedback />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee/dashboard/feedback/mentor"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              <MentorFeedbackDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />


      <Route
        path="/employee/dashboard/feedback/submissions"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              <MySubmissions />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/feedback/fillform/:formId"
        element={
          <ProtectedRoute allowedRoles={["Employee", "Manager"]}>
            <DashboardLayout role={["Manager", "Employee"]}>
              <EmployeeFillForm />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      {/* feedback manager */}
      <Route
        path="/manager/dashboard/feedback"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <FeedbackManagerDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard/feedback/create-review"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <CreateManagerReview />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard/feedback/all-review"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <ManagerReviewsList />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard/feedback/team"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <ManagerEmployeeList />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard/feedback/team-submissions"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <ManagerTeamSubmissions />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard/feedback/submit-mentor"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <SubmitMentorFeedback />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard/feedback/contextfeedback"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <SubmitContextFeedback />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard/feedback/assignedform"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <EmployeeAssignedForms />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard/feedback/submissions"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <MySubmissions />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      {/* Feedback - depthead */}
      <Route
        path="/department-head/dashboard/feedback"
        element={
          <ProtectedRoute allowedRoles={["Department Head"]}>
            <DashboardLayout role="Department Head">
              <FeedbackDepartmentHeadDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/department-head/dashboard/feedback/allreviews"
        element={
          <ProtectedRoute allowedRoles={["Department Head"]}>
            <DashboardLayout role="Department Head">
              <AllManagerReviews />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard/feedback/review/:id"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              <ViewManagerReview />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      //endregion LND EMPLOYEE
      //region PERFORMANCE Acknowledge
      <Route
        path="/manager/dashboard/manager-acknowledgments"
        element={
          <ProtectedRoute allowedRoles={["Manager", "Department Head"]}>
            <DashboardLayout role={["Manager", "Department Head"]}>
              <ManagerAcknowledgment />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard/employee-acknowledgments"
        element={
          <ProtectedRoute allowedRoles={["Manager"]}>
            <DashboardLayout role="Manager">
              < EmployeeAcknowledgment />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/dashboard/employee-acknowledgments"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <DashboardLayout role="Employee">
              < EmployeeAcknowledgment />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      //endregion PERFORMANCE ACKNOWLEDGE

      //region MEETING AND MOM
      {/* EMPLOYEE ROUTES */}
<Route
  path="/employee/dashboard/meetmom"
  element={
    <ProtectedRoute allowedRoles={["Employee"]}>
      <DashboardLayout role="Employee">
        <EmployeeMomDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>

<Route
  path="/employee/dashboard/meetmom/my-moms"
  element={
    <ProtectedRoute allowedRoles={["Employee"]}>
      <DashboardLayout role="Employee">
        <MyMomsList />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>

<Route
  path="/employee/dashboard/meetmom/action-items"
  element={
    <ProtectedRoute allowedRoles={["Employee"]}>
      <DashboardLayout role="Employee">
        <ActionItemsManagement />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>

<Route
  path="/employee/dashboard/meetmom/invitations"
  element={
    <ProtectedRoute allowedRoles={["Employee"]}>
      <DashboardLayout role="Employee">
        <MeetingInvitations />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>

<Route
  path="/employee/dashboard/meetmom/:meetingId"
  element={
    <ProtectedRoute allowedRoles={["Employee"]}>
      <DashboardLayout role="Employee">
        <RSVPSummary />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>

{/* NEW: CREATE and EDIT MOM (Employee) */}
<Route
  path="/employee/dashboard/meetmom/create-mom/:meetingId"
  element={
    <ProtectedRoute allowedRoles={["Employee"]}>
      <DashboardLayout role="Employee">
        <CreateOrEditMom />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/employee/dashboard/meetmom/edit-mom/:momId"
  element={
    <ProtectedRoute allowedRoles={["Employee"]}>
      <DashboardLayout role="Employee">
        <CreateOrEditMom isEdit />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>

{/* MANAGER ROUTES */}
<Route
  path="/manager/dashboard/meetmom"
  element={
    <ProtectedRoute allowedRoles={["Manager"]}>
      <DashboardLayout role="Manager">
        <ManagerMomDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>

<Route
  path="/manager/dashboard/meetmom/schedule"
  element={
    <ProtectedRoute allowedRoles={["Manager"]}>
      <DashboardLayout role="Manager">
        <ScheduleMeeting />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>

<Route
  path="/manager/dashboard/meetmom/:meetingId"
  element={
    <ProtectedRoute allowedRoles={["Manager"]}>
      <DashboardLayout role="Manager">
        <RSVPSummary />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>

{/* NEW: CREATE and EDIT MOM (Manager) */}
<Route
  path="/manager/dashboard/meetmom/create-mom/:meetingId"
  element={
    <ProtectedRoute allowedRoles={["Manager"]}>
      <DashboardLayout role="Manager">
        <CreateOrEditMom />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/manager/dashboard/meetmom/edit-mom/:momId"
  element={
    <ProtectedRoute allowedRoles={["Manager"]}>
      <DashboardLayout role="Manager">
        <CreateOrEditMom isEdit />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>

{/* HR ROUTES */}
<Route
  path="/hr/dasboard/meetmom"
  element={
    <ProtectedRoute allowedRoles={["HR"]}>
      <DashboardLayout role="HR">
        <HRMomDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/hr/dasboard/meetmom/:momId"
  element={
    <ProtectedRoute allowedRoles={["HR"]}>
      <DashboardLayout role="HR">
        <HRMomDetails />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
//endregion MEETING AND MOM
    
    </Routes>
  );
};
export default AppRoutes;
