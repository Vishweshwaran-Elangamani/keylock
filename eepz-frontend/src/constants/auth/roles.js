// USER ROLES

export const USER_ROLES = {
  ADMIN: "Admin",

  HR: "HR",

  LEADERSHIP: "Leadership",

  DEPARTMENT_HEAD: "Department Head",

  MANAGER: "Manager",

  EMPLOYEE: "Employee",
};

// ROLE DISPLAY NAMES

export const ROLE_DISPLAY_NAMES = {
  [USER_ROLES.ADMIN]: "Administrator",

  [USER_ROLES.HR]: "Human Resources",

  [USER_ROLES.LEADERSHIP]: "Leadership",

  [USER_ROLES.DEPARTMENT_HEAD]: "Department Head",

  [USER_ROLES.MANAGER]: "Manager",

  [USER_ROLES.USER]: "Employee",

  [USER_ROLES.EMPLOYEE]: "Employee",
};

// ROLE ROUTES

export const ROLE_ROUTES = {
  [USER_ROLES.ADMIN]: "/admin/dashboard",

  [USER_ROLES.HR]: "/hr/dashboard",

  [USER_ROLES.LEADERSHIP]: "/leadership/dashboard",

  [USER_ROLES.DEPARTMENT_HEAD]: "/department-head/dashboard",

  [USER_ROLES.MANAGER]: "/manager/dashboard",

  [USER_ROLES.USER]: "/employee/dashboard",

  [USER_ROLES.EMPLOYEE]: "/employee/dashboard",
};

// ROLE PERMISSIONS

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    "all",

    "manage_users",

    "manage_roles",

    "manage_departments",

    "view_all_reports",

    "system_settings",

    "audit_logs",

    "bulk_operations",

    "export_data",
  ],

  [USER_ROLES.HR]: [
    "manage_employees",

    "view_reports",

    "process_change_requests",

    "manage_employee_profiles",

    "view_employee_data",

    "generate_hr_reports",

    "manage_onboarding",

    "manage_offboarding",
  ],

  [USER_ROLES.LEADERSHIP]: [
    "view_all_departments",

    "view_organization_reports",

    "manage_strategic_goals",

    "approve_major_decisions",

    "view_all_team_performance",

    "access_executive_dashboard",

    "manage_organization_objectives",

    "view_cross_department_data",

    "approve_budgets",

    "conduct_executive_reviews",
  ],

  [USER_ROLES.DEPARTMENT_HEAD]: [
    "view_team",

    "manage_department",

    "view_team_performance",

    "approve_leave_requests",

    "manage_department_budget",

    "view_department_reports",

    "assign_tasks",
  ],

  [USER_ROLES.MANAGER]: [
    "manage_team_performance",

    "schedule_meetings",

    "view_team_data",

    "approve_team_requests",

    "conduct_reviews",

    "assign_projects",
  ],

  [USER_ROLES.USER]: [
    "view_own_data",

    "submit_requests",

    "view_own_profile",

    "update_profile",

    "submit_change_requests",

    "view_own_performance",

    "apply_leave",

    "view_payslips",
  ],

  [USER_ROLES.EMPLOYEE]: [
    "view_own_data",

    "submit_requests",

    "view_own_profile",

    "update_profile",

    "submit_change_requests",

    "view_own_performance",

    "apply_leave",

    "view_payslips",
  ],
};

// HELPER FUNCTIONS

export const hasPermission = (userRole, permission) => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];

  if (permissions.includes("all")) {
    return true;
  }

  return permissions.includes(permission);
};

export const hasAnyPermission = (userRole, permissionsToCheck) => {
  return permissionsToCheck.some((permission) =>
    hasPermission(userRole, permission)
  );
};

export const hasAllPermissions = (userRole, permissionsToCheck) => {
  return permissionsToCheck.every((permission) =>
    hasPermission(userRole, permission)
  );
};

export const getDashboardRoute = (userRole) => {
  return ROLE_ROUTES[userRole] || ROLE_ROUTES[USER_ROLES.USER];
};

export const getRoleDisplayName = (userRole) => {
  return ROLE_DISPLAY_NAMES[userRole] || userRole;
};

export const isValidRole = (userRole) => {
  return Object.values(USER_ROLES).includes(userRole);
};

export const getRolePermissions = (userRole) => {
  return ROLE_PERMISSIONS[userRole] || [];
};

// ROLE HIERARCHY

export const ROLE_HIERARCHY = {
  [USER_ROLES.ADMIN]: 6,

  [USER_ROLES.HR]: 5,

  [USER_ROLES.LEADERSHIP]: 4,

  [USER_ROLES.DEPARTMENT_HEAD]: 3,

  [USER_ROLES.MANAGER]: 2,

  [USER_ROLES.USER]: 1,

  [USER_ROLES.EMPLOYEE]: 1,
};

export const isHigherRole = (role1, role2) => {
  return (ROLE_HIERARCHY[role1] || 0) > (ROLE_HIERARCHY[role2] || 0);
};

export const isEqualOrHigherRole = (role1, role2) => {
  return (ROLE_HIERARCHY[role1] || 0) >= (ROLE_HIERARCHY[role2] || 0);
};

// DEFAULT EXPORT

export default {
  USER_ROLES,

  ROLE_DISPLAY_NAMES,

  ROLE_ROUTES,

  ROLE_PERMISSIONS,

  ROLE_HIERARCHY,

  hasPermission,

  hasAnyPermission,

  hasAllPermissions,

  getDashboardRoute,

  getRoleDisplayName,

  isValidRole,

  getRolePermissions,

  isHigherRole,

  isEqualOrHigherRole,
};
