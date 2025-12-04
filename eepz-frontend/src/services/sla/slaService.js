import axios from 'axios';
 
const API_BASE_URL = import.meta.env.VITE_SLA_API_URL;
 
const slaApi = axios.create({
  baseURL: `${API_BASE_URL}/api/Sla`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});
 
const employeeApi = axios.create({
  baseURL: `${API_BASE_URL}/api/EmployeeManagement`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});
 
// ========== REQUEST INTERCEPTORS ==========
[slaApi, employeeApi].forEach(api => {
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      console.log(`${config.baseURL?.includes('Sla') ? 'SLA' : 'Employee'} API: ${config.method.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => Promise.reject(error)
  );
});
 
// ========== RESPONSE INTERCEPTORS ==========
[slaApi, employeeApi].forEach(api => {
  api.interceptors.response.use(
    (response) => ({
      success: response.data.success !== false,
      data: response.data.data || response.data,
      message: response.data.message || 'Success',
      count: response.data.count || 0
    }),
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/mock-login';
      }
      return Promise.reject({
        success: false,
        message: error.response?.data?.message || error.message,
        status: error.response?.status
      });
    }
  );
});
 
// ========== CONSTANTS ==========
export const ROLE_IDS = {
  EMPLOYEE: 1,
  MANAGER: 2,
  DEPARTMENT_HEAD: 3,
  HR: 4
};
 
// ========== ESCALATION HELPERS ==========
export const escalationHelpers = {
  canEscalateToL1: (sla, escalations = []) => {
    if (!sla || sla.status === 'Closed') return false;
    return !escalations.some(e =>
      e.escalationLevel === 'L1' && e.escalationStatus === 'Pending'
    );
  },
 
  canEscalateToL2: (sla, escalations = []) => {
    if (!sla || sla.status === 'Closed') return false;
    return !escalations.some(e =>
      e.escalationLevel === 'L2' && e.escalationStatus === 'Pending'
    );
  },
 
  getEscalationBlockReason: (sla, escalations = [], level = 'L2') => {
    if (!sla) return 'Invalid SLA';
    if (sla.status === 'Closed') return 'Cannot escalate closed SLA';
    const hasEscalation = escalations.some(e =>
      e.escalationLevel === level && e.escalationStatus === 'Pending'
    );
    return hasEscalation ? `Already escalated to ${level}. Wait for resolution.` : null;
  },
 
  getEscalationStatusBadge: (status) => {
    const badges = {
      'Pending': 'bg-warning text-dark',
      'Resolved': 'bg-success',
      'Rejected': 'bg-danger',
      'InProgress': 'bg-info'
    };
    return badges[status] || 'bg-secondary';
  },
 
  getEscalationLevelBadge: (level) => {
    const badges = {
      'L1': 'bg-info',
      'L2': 'bg-warning text-dark',
      'L3': 'bg-danger',
      'DeptHead': 'bg-warning text-dark'
    };
    return badges[level] || 'bg-secondary';
  },
 
  hasPendingEscalation: (escalations = []) => {
    return escalations.some(e => e.escalationStatus === 'Pending');
  },
 
  getLatestEscalation: (escalations = []) => {
    if (!escalations?.length) return null;
    return [...escalations].sort((a, b) =>
      new Date(b.submittedAt) - new Date(a.submittedAt)
    )[0];
  },
 
  countEscalationsByLevel: (escalations = []) => ({
    L1: escalations.filter(e => e.escalationLevel === 'L1').length,
    L2: escalations.filter(e => e.escalationLevel === 'L2').length,
    L3: escalations.filter(e => e.escalationLevel === 'L3').length,
    total: escalations.length
  })
};
 
// ========== DATE HELPERS ==========
export const dateHelpers = {
  daysRemaining: (deadline) => {
    if (!deadline) return 0;
    const now = new Date();
    const end = new Date(deadline);
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  },
 
  daysOverdue: (deadline) => {
    if (!deadline) return 0;
    const days = dateHelpers.daysRemaining(deadline);
    return days < 0 ? Math.abs(days) : 0;
  },
 
  getUrgencyStatus: (deadline) => {
    const days = dateHelpers.daysRemaining(deadline);
    if (days < 0) return { status: 'Overdue', color: '#E01950' };
    if (days === 0) return { status: 'Today', color: '#E2B93B' };
    if (days <= 3) return { status: 'Urgent', color: '#E2B93B' };
    if (days <= 7) return { status: 'Soon', color: '#0F62FE' };
    return { status: 'On Track', color: '#24A148' };
  },
 
  formatDeadline: (deadline) => {
    if (!deadline) return 'N/A';
    const date = new Date(deadline);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },
 
  toLocalDateTimeString: (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  }
};
 
// ========== MAIN SERVICE ==========
const slaService = {
 
  // ============================================
  // ===== SLA OPERATIONS =====
  // ============================================
 
  getAllSLAs: async () => {
    try {
      console.log('Fetching all SLAs');
      const response = await slaApi.get('/all');
      return response;
    } catch (error) {
      console.error('Error fetching all SLAs:', error);
      throw error;
    }
  },
 
  getEmployeeSLAs: async (empId) => {
    try {
      console.log(`Fetching SLAs for employee ${empId}`);
      const response = await slaApi.get(`/employee/${empId}`);
      return response;
    } catch (error) {
      console.error('Error fetching employee SLAs:', error);
      throw error;
    }
  },
 
  getSLAById: async (id) => {
    try {
      console.log(`Fetching SLA ${id}`);
      return await slaApi.get(`/${id}`);
    } catch (error) {
      console.error('Error fetching SLA:', error);
      throw error;
    }
  },
 
  createSLA: async (data) => {
    try {
      console.log('Creating single SLA');
      const payload = {
        slatype: data.slatype,
        employeeId: data.employeeId,
        assignedToEmployeeId: data.assignedToEmployeeId,
        departmentId: data.departmentId,
        deadline: data.deadline,
        createdByEmployeeId: data.createdByEmployeeId
      };
      return await slaApi.post('/create', payload);
    } catch (error) {
      console.error('Error creating SLA:', error);
      throw error;
    }
  },
 
  /**
   * NEW: Bulk create SLAs (10-20x faster)
   * Endpoint: POST /api/sla/bulk-create
   * Max: 10,000 records per request
   *
   * @param {Array<Object>} slaRequests - Array of SLA creation requests
   * @returns {Promise<Object>} { success, data: { totalRequested, successfulInserts, failedInserts, failedRecords, message } }
   */
  createBulkSLA: async (slaRequests) => {
    try {
      console.log(`Creating ${slaRequests.length} SLAs in bulk`);
     
      // Validate input
      if (!Array.isArray(slaRequests) || slaRequests.length === 0) {
        throw new Error('SLA requests array is required and cannot be empty');
      }
 
      if (slaRequests.length > 10000) {
        throw new Error('Maximum 10,000 SLAs allowed per bulk operation');
      }
 
      // Transform to match backend DTO structure
      const payload = slaRequests.map(sla => ({
        slatype: sla.slatype,
        employeeId: sla.employeeId,
        assignedToEmployeeId: sla.assignedToEmployeeId,
        departmentId: sla.departmentId,
        deadline: sla.deadline,
        relatedEntityType: sla.relatedEntityType || null,
        relatedEntityId: sla.relatedEntityId || null,
        createdByEmployeeId: sla.createdByEmployeeId,
        creationReason: sla.creationReason || null
      }));
 
      console.log('Payload structure:', {
        count: payload.length,
        sample: payload[0]
      });
 
      const response = await slaApi.post('/bulk-create', payload);
 
      console.log('Bulk creation result:', {
        totalRequested: response.data?.totalRequested,
        successfulInserts: response.data?.successfulInserts,
        failedInserts: response.data?.failedInserts
      });
 
      // Log failed records if any
      if (response.data?.failedRecords?.length > 0) {
        console.warn('Failed records:', response.data.failedRecords);
      }
 
      return response;
    } catch (error) {
      console.error('Error creating bulk SLAs:', error);
      throw error;
    }
  },
 
  /**
   * Helper: Create SLAs for all employees in a department
   * Use case: Performance review season, training compliance, etc.
   */
  createBulkSLAForDepartment: async (departmentId, slaConfig) => {
    try {
      console.log(`Creating bulk SLAs for department ${departmentId}`);
 
      // Step 1: Get all employees in department
      const employeesResponse = await employeeApi.get(`/department/${departmentId}`);
     
      if (!employeesResponse?.success || !employeesResponse?.data?.length) {
        throw new Error(`No employees found in department ${departmentId}`);
      }
 
      const employees = employeesResponse.data;
      console.log(`Found ${employees.length} employees`);
 
      // Step 2: Create SLA request for each employee
      const slaRequests = employees.map(emp => ({
        slatype: slaConfig.slatype,
        employeeId: emp.employeeId || emp.employeeMasterId,
        assignedToEmployeeId: 0,
        departmentId: departmentId,
        deadline: slaConfig.deadline,
        createdByEmployeeId: slaConfig.createdByEmployeeId,
        creationReason: slaConfig.creationReason || `Bulk creation for ${slaConfig.slatype}`
      }));
 
      // Step 3: Call bulk create
      return await slaService.createBulkSLA(slaRequests);
    } catch (error) {
      console.error('Error creating department bulk SLAs:', error);
      throw error;
    }
  },
 
  /**
   * Helper: Create SLAs for ALL employees in organization
   * Use case: Company-wide mandatory training, annual reviews
   */
  createBulkSLAForAllEmployees: async (slaConfig) => {
    try {
      console.log('Creating bulk SLAs for ALL employees');
 
      // Step 1: Get all employees
      const employeesResponse = await employeeApi.get('/all');
     
      if (!employeesResponse?.success || !employeesResponse?.data?.length) {
        throw new Error('No employees found');
      }
 
      const employees = employeesResponse.data;
      console.log(`Found ${employees.length} total employees`);
 
      // Step 2: Create SLA request for each employee
      const slaRequests = employees.map(emp => ({
        slatype: slaConfig.slatype,
        employeeId: emp.employeeId || emp.employeeMasterId,
        assignedToEmployeeId: 0,
        departmentId: emp.departmentId,
        deadline: slaConfig.deadline,
        createdByEmployeeId: slaConfig.createdByEmployeeId,
        creationReason: slaConfig.creationReason || `Organization-wide ${slaConfig.slatype}`
      }));
 
      // Step 3: Call bulk create
      return await slaService.createBulkSLA(slaRequests);
    } catch (error) {
      console.error('Error creating organization-wide bulk SLAs:', error);
      throw error;
    }
  },
 
  updateSLA: async (id, data) => {
    try {
      console.log(`Updating SLA ${id}`);
      const payload = {
        slatype: data.slatype,
        assignedToEmployeeId: data.assignedToEmployeeId,
        deadline: data.deadline,
        status: data.status,
        updatedByEmployeeId: data.updatedByEmployeeId
      };
      return await slaApi.put(`/${id}`, payload);
    } catch (error) {
      console.error('Error updating SLA:', error);
      throw error;
    }
  },
 
  deleteSLA: async (id) => {
    try {
      console.log(`Deleting SLA ${id}`);
      return await slaApi.delete(`/${id}`);
    } catch (error) {
      console.error('Error deleting SLA:', error);
      throw error;
    }
  },
 
  closeSLA: async (data) => {
    try {
      console.log('Closing SLA');
      const payload = {
        slaid: data.slaid,
        closedByEmployeeId: data.closedByEmployeeId,
        closureComments: data.closureComments || ''
      };
      return await slaApi.put('/close', payload);
    } catch (error) {
      console.error('Error closing SLA:', error);
      throw error;
    }
  },
 
  reopenSLA: async (data) => {
    try {
      console.log('Reopening SLA');
      return await slaApi.put('/reopen', data);
    } catch (error) {
      console.error('Error reopening SLA:', error);
      throw error;
    }
  },
 
  // ============================================
  // ===== ESCALATION OPERATIONS =====
  // ============================================
 
  submitEscalation: async (data) => {
    try {
      console.log('L1 Escalation (Employee to Manager)');
      const payload = {
        slaid: data.slaid,
        reason: data.reason,
        description: data.description || '',
        escalationLevel: 'L1',
        escalatedToEmployeeId: data.escalatedToEmployeeId,
        submittedByEmployeeId: data.submittedByEmployeeId
      };
      return await slaApi.post('/escalate', payload);
    } catch (error) {
      console.error('L1 Escalation Error:', error);
      throw error;
    }
  },
 
  escalateToDeptHead: async (data) => {
    try {
      console.log('L2 Escalation (Manager to Dept Head)');
      const payload = {
        slaid: data.slaid,
        reason: data.reason,
        description: data.description || '',
        escalationLevel: 'L2',
        escalatedToEmployeeId: data.escalatedToEmployeeId,
        submittedByEmployeeId: data.submittedByEmployeeId
      };
      return await slaApi.post('/escalate-to-dept-head', payload);
    } catch (error) {
      console.error('L2 Escalation Error:', error);
      throw error;
    }
  },
 
  resolveEscalation: async (data) => {
    try {
      console.log('Resolving escalation');
      const payload = {
        escalationId: data.escalationId,
        resolvedByEmployeeId: data.resolvedByEmployeeId,
        escalationStatus: 'Resolved',
        resolutionComments: data.resolutionComments || ''
      };
      return await slaApi.put('/escalation/resolve', payload);
    } catch (error) {
      console.error('Error resolving escalation:', error);
      throw error;
    }
  },
 
  getSLAEscalations: async (id) => {
    try {
      console.log(`Fetching escalations for SLA ${id}`);
      return await slaApi.get(`/${id}/escalations`);
    } catch (error) {
      console.error('Error fetching escalations:', error);
      throw error;
    }
  },
 
  getSLAHistory: async (id) => {
    try {
      console.log(`Fetching history for SLA ${id}`);
      return await slaApi.get(`/${id}/history`);
    } catch (error) {
      console.error('Error fetching history:', error);
      throw error;
    }
  },
 
  // ============================================
  // ===== MANAGER OPERATIONS =====
  // ============================================
 
  getTeamReviews: async (managerId) => {
    try {
      console.log(`Fetching team reviews for manager ${managerId}`);
      return await slaApi.get(`/manager/${managerId}/team-reviews`);
    } catch (error) {
      console.error('Error fetching team reviews:', error);
      throw error;
    }
  },
 
  getManagerEscalations: async (managerId) => {
    try {
      console.log(`Fetching escalations for manager ${managerId}`);
      return await slaApi.get(`/manager/${managerId}/escalations`);
    } catch (error) {
      console.error('Error fetching escalations:', error);
      throw error;
    }
  },
 
  // ============================================
  // ===== COMPLIANCE =====
  // ============================================
 
  getDepartmentCompliance: async (deptId, period = null) => {
    try {
      console.log(`Fetching compliance for department ${deptId}`);
      const params = period ? { period } : {};
      return await slaApi.get(`/compliance/department/${deptId}`, { params });
    } catch (error) {
      console.error('Error fetching compliance:', error);
      throw error;
    }
  },
 
  getAllCompliance: async (period = null) => {
    try {
      console.log('Fetching all compliance');
      const params = period ? { period } : {};
      return await slaApi.get('/compliance/all', { params });
    } catch (error) {
      console.error('Error fetching compliance:', error);
      throw error;
    }
  },
 
  calculateCompliance: async (data) => {
    try {
      console.log('Calculating compliance');
      return await slaApi.post('/compliance/calculate', data);
    } catch (error) {
      console.error('Error calculating compliance:', error);
      throw error;
    }
  },
 
  // ============================================
  // ===== EMPLOYEE MANAGEMENT =====
  // ============================================
 
  getAllEmployees: async () => {
    try {
      console.log('Fetching all employees');
      return await employeeApi.get('/all');
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },
 
  getAllManagers: async () => {
    try {
      console.log('Fetching all managers');
      return await employeeApi.get('/managers');
    } catch (error) {
      console.error('Error fetching managers:', error);
      throw error;
    }
  },
 
  getEmployeeById: async (id) => {
    try {
      console.log(`Fetching employee ${id}`);
      return await employeeApi.get(`/${id}`);
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  },
 
  searchEmployees: async (query) => {
    try {
      console.log(`Searching employees: ${query}`);
      return await employeeApi.get('/search', { params: { q: query } });
    } catch (error) {
      console.error('Error searching:', error);
      throw error;
    }
  },
 
  getEmployeesByDepartment: async (deptId) => {
    try {
      console.log(`Fetching employees for department ${deptId}`);
      return await employeeApi.get(`/department/${deptId}`);
    } catch (error) {
      console.error('Error fetching department employees:', error);
      throw error;
    }
  },
 
  getEmployeesByRole: async (roleId) => {
    try {
      console.log(`Fetching employees with role ID: ${roleId}`);
      return await employeeApi.get(`/role/${roleId}`);
    } catch (error) {
      console.error('Error fetching by role:', error);
      throw error;
    }
  },
 
  getAllDepartments: async () => {
    try {
      console.log('Fetching all departments');
      return await employeeApi.get('/departments');
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },
 
  getDepartmentDetails: async (deptId) => {
    try {
      console.log(`Fetching department ${deptId} details`);
      return await employeeApi.get(`/departments/${deptId}`);
    } catch (error) {
      console.error('Error fetching department:', error);
      throw error;
    }
  },
 
  /**
   * Get dept heads by department ID
   * Endpoint: GET /api/EmployeeManagement/department-heads/{departmentId}
   */
  getDepartmentHeads: async (deptId) => {
    try {
      if (!deptId) {
        console.warn('No departmentId provided');
        return { success: false, data: [], message: 'Department ID required' };
      }
 
      console.log(`Fetching department heads for department ${deptId}`);
      const response = await employeeApi.get(`/department-heads/${deptId - 1}`);
 
      if (response?.success && Array.isArray(response.data)) {
        console.log(`Found ${response.data.length} dept head(s)`);
        response.data.forEach(dh => {
          console.log(`   -> ${dh.firstName} ${dh.lastName} (${dh.departmentName})`);
        });
        return response;
      }
 
      console.warn('No dept heads found');
      return { success: false, data: [], message: 'No department heads found' };
    } catch (error) {
      console.error('Error fetching dept heads:', error);
      return { success: false, data: [], message: error.message };
    }
  },
 
  /**
   * Get ALL department heads by ROLE ID = 3
   * Used for: Getting all dept heads across organization
   */
  getAllDepartmentHeads: async () => {
    try {
      console.log(`Fetching ALL department heads (roleId = ${ROLE_IDS.DEPARTMENT_HEAD})`);
      return await employeeApi.get(`/role/${ROLE_IDS.DEPARTMENT_HEAD}`);
    } catch (error) {
      console.error('Error fetching all dept heads:', error);
      throw error;
    }
  },
 
  /**
   * NEW: Get valid dept head for manager escalation
   *
   * Logic:
   * 1. Get manager details -> find who they report to (reportsTo field)
   * 2. Fetch all dept heads by roleId = 3
   * 3. Filter to find dept head whose ID matches manager's reportsTo
   * 4. Return valid escalation target
   */
  getDepartmentHeadForEscalation: async (managerId) => {
    try {
      console.log(`Step 1: Fetching manager ${managerId} details`);
 
      // Step 1: Get manager details
      const managerResponse = await employeeApi.get(`/${managerId}`);
 
      if (!managerResponse?.success || !managerResponse?.data) {
        throw new Error('Manager not found');
      }
 
      const manager = managerResponse.data;
      const managerReportsTo = manager.reportsTo || manager.reportingToId;
 
      console.log(`Manager found:`, {
        id: managerId,
        name: `${manager.firstName} ${manager.lastName}`,
        reportsTo: managerReportsTo
      });
 
      if (!managerReportsTo) {
        throw new Error('Manager has no reporting manager for escalation');
      }
 
      // Step 2: Fetch all department heads by ROLE ID
      console.log(`Step 2: Fetching all department heads (roleId = ${ROLE_IDS.DEPARTMENT_HEAD})`);
      const deptHeadsResponse = await employeeApi.get(`/role/${ROLE_IDS.DEPARTMENT_HEAD}`);
 
      if (!deptHeadsResponse?.success || !Array.isArray(deptHeadsResponse.data)) {
        throw new Error('Failed to fetch department heads');
      }
 
      console.log(`Found ${deptHeadsResponse.data.length} department heads`);
 
      // Step 3: Find dept head whose ID matches manager's reportsTo
      console.log(`Step 3: Validating manager's reporting manager`);
 
      const validDeptHeads = deptHeadsResponse.data.filter(dh => {
        const dhId = dh.employeeId || dh.employeeMasterId;
        const isMatch = dhId === managerReportsTo || dhId?.toString() === managerReportsTo?.toString();
 
        if (isMatch) {
          console.log(`MATCH: ${dh.firstName} ${dh.lastName} (ID: ${dhId})`);
        }
        return isMatch;
      });
 
      if (validDeptHeads.length === 0) {
        console.warn(`Manager's reporting manager (${managerReportsTo}) is NOT in dept heads`);
 
        // Fallback: Get direct manager
        const directManager = await employeeApi.get(`/${managerReportsTo}`);
        if (directManager?.success && directManager?.data) {
          console.log(`Fallback: Using direct manager as escalation target`);
          return {
            success: true,
            data: [directManager.data],
            message: 'Direct manager fetched (not a registered dept head)',
            warning: 'Target is not a registered department head'
          };
        }
 
        throw new Error(`Manager's reporting manager (ID: ${managerReportsTo}) not found`);
      }
 
      console.log(`Escalation target verified`);
 
      return {
        success: true,
        data: validDeptHeads,
        message: 'Department head verified as manager\'s reporting manager'
      };
 
    } catch (error) {
      console.error('Error fetching escalation target:', error);
      throw error;
    }
  },
 
  // ============================================
  // ===== VALIDATION HELPERS =====
  // ============================================
 
  canEscalate: (sla) => sla && sla.status !== 'Closed',
  canReopen: (sla) => sla && sla.status === 'Closed',
  canClose: (sla) => sla && ['Open', 'InProgress', 'Escalated'].includes(sla.status),
  canResolveEscalation: (escalation) => escalation && escalation.escalationStatus === 'Pending',
  isOverdue: (deadline) => dateHelpers.daysRemaining(deadline) < 0,
  isUrgent: (deadline) => {
    const days = dateHelpers.daysRemaining(deadline);
    return days >= 0 && days <= 3;
  }
};
 
export default slaService;
