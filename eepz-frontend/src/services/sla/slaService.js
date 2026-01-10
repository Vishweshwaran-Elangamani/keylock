import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_SLA_API_URL;
const API_EMP = import.meta.env.VITE_PROJECT_API_URL;

const slaApi = axios.create({
  baseURL: `${API_BASE_URL}/api/Sla`,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

const employeeApi = axios.create({
  baseURL: `${API_EMP}/api/EmployeeManagement`,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

[slaApi, employeeApi].forEach((api) => {
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );
});

[slaApi, employeeApi].forEach((api) => {
  api.interceptors.response.use(
    (response) => ({
      success: response.data.success !== false,
      data: response.data.data || response.data,
      message: response.data.message || "Success",
      count: response.data.count || 0,
    }),
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/mock-login";
      }
      return Promise.reject({
        success: false,
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
      });
    }
  );
});

export const ROLE_IDS = {
  EMPLOYEE: 1,
  MANAGER: 2,
  DEPARTMENT_HEAD: 3,
  HR: 4,
};

export const escalationHelpers = {
  canEscalateToL1: (sla, escalations = []) => {
    if (!sla || sla.status === "Closed") return false;
    return !escalations.some(
      (e) => e.escalationLevel === "L1" && e.escalationStatus === "Pending"
    );
  },

  canEscalateToL2: (sla, escalations = []) => {
    if (!sla || sla.status === "Closed") return false;
    return !escalations.some(
      (e) => e.escalationLevel === "L2" && e.escalationStatus === "Pending"
    );
  },

  getEscalationBlockReason: (sla, escalations = [], level = "L2") => {
    if (!sla) return "Invalid SLA";
    if (sla.status === "Closed") return "Cannot escalate closed SLA";
    const hasEscalation = escalations.some(
      (e) => e.escalationLevel === level && e.escalationStatus === "Pending"
    );
    return hasEscalation
      ? `Already escalated to ${level}. Wait for resolution.`
      : null;
  },

  getEscalationStatusBadge: (status) => {
    const badges = {
      Pending: "bg-warning text-dark",
      Resolved: "bg-success",
      Rejected: "bg-danger",
      InProgress: "bg-info",
    };
    return badges[status] || "bg-secondary";
  },

  getEscalationLevelBadge: (level) => {
    const badges = {
      L1: "bg-info",
      L2: "bg-warning text-dark",
      L3: "bg-danger",
      DeptHead: "bg-warning text-dark",
    };
    return badges[level] || "bg-secondary";
  },

  hasPendingEscalation: (escalations = []) => {
    return escalations.some((e) => e.escalationStatus === "Pending");
  },

  getLatestEscalation: (escalations = []) => {
    if (!escalations?.length) return null;
    return [...escalations].sort(
      (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
    )[0];
  },

  countEscalationsByLevel: (escalations = []) => ({
    L1: escalations.filter((e) => e.escalationLevel === "L1").length,
    L2: escalations.filter((e) => e.escalationLevel === "L2").length,
    L3: escalations.filter((e) => e.escalationLevel === "L3").length,
    total: escalations.length,
  }),
};

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
    if (days < 0) return { status: "Overdue", color: "#E01950" };
    if (days === 0) return { status: "Today", color: "#E2B93B" };
    if (days <= 3) return { status: "Urgent", color: "#E2B93B" };
    if (days <= 7) return { status: "Soon", color: "#0F62FE" };
    return { status: "On Track", color: "#24A148" };
  },

  formatDeadline: (deadline) => {
    if (!deadline) return "N/A";
    const date = new Date(deadline);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  },

  toLocalDateTimeString: (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  },
};

const slaService = {
  getAllSLAs: async () => {
    try {
      const response = await slaApi.get("/all");
      return response;
    } catch (error) {
      console.error("Error fetching all SLAs:", error);
      throw error;
    }
  },

  getEmployeeSLAs: async (empId) => {
    try {
      const response = await slaApi.get(`/employee/${empId}`);
      return response;
    } catch (error) {
      console.error("Error fetching employee SLAs:", error);
      throw error;
    }
  },

  getSLAById: async (id) => {
    try {
      return await slaApi.get(`/${id}`);
    } catch (error) {
      console.error("Error fetching SLA:", error);
      throw error;
    }
  },

  createSLA: async (data) => {
    try {
      const payload = {
        slatype: data.slatype,
        employeeId: data.employeeId,
        assignedToEmployeeId: data.assignedToEmployeeId,
        departmentId: data.departmentId,
        deadline: data.deadline,
        createdByEmployeeId: data.createdByEmployeeId,
      };
      return await slaApi.post("/create", payload);
    } catch (error) {
      console.error("Error creating SLA:", error);
      throw error;
    }
  },

  createBulkSLA: async (slaRequests) => {
    try {
      if (!Array.isArray(slaRequests) || slaRequests.length === 0) {
        throw new Error("SLA requests array is required and cannot be empty");
      }

      if (slaRequests.length > 10000) {
        throw new Error("Maximum 10,000 SLAs allowed per bulk operation");
      }

      const payload = slaRequests.map((sla) => ({
        slatype: sla.slatype,
        employeeId: sla.employeeId,
        assignedToEmployeeId: sla.assignedToEmployeeId,
        departmentId: sla.departmentId,
        deadline: sla.deadline,
        relatedEntityType: sla.relatedEntityType || null,
        relatedEntityId: sla.relatedEntityId || null,
        createdByEmployeeId: sla.createdByEmployeeId,
        creationReason: sla.creationReason || null,
      }));

      const response = await slaApi.post("/bulk-create", payload);

      if (response.data?.failedRecords?.length > 0) {
        console.warn("Failed records:", response.data.failedRecords);
      }

      return response;
    } catch (error) {
      console.error("Error creating bulk SLAs:", error);
      throw error;
    }
  },

  createBulkSLAForDepartment: async (departmentId, slaConfig) => {
    try {
      const employeesResponse = await employeeApi.get(
        `/department/${departmentId}`
      );

      if (!employeesResponse?.success || !employeesResponse?.data?.length) {
        throw new Error(`No employees found in department ${departmentId}`);
      }

      const employees = employeesResponse.data;

      const slaRequests = employees.map((emp) => ({
        slatype: slaConfig.slatype,
        employeeId: emp.employeeId || emp.employeeMasterId,
        assignedToEmployeeId: 0,
        departmentId: departmentId,
        deadline: slaConfig.deadline,
        createdByEmployeeId: slaConfig.createdByEmployeeId,
        creationReason:
          slaConfig.creationReason || `Bulk creation for ${slaConfig.slatype}`,
      }));

      return await slaService.createBulkSLA(slaRequests);
    } catch (error) {
      console.error("Error creating department bulk SLAs:", error);
      throw error;
    }
  },

  createBulkSLAForAllEmployees: async (slaConfig) => {
    try {
      const employeesResponse = await employeeApi.get("/all");

      if (!employeesResponse?.success || !employeesResponse?.data?.length) {
        throw new Error("No employees found");
      }

      const employees = employeesResponse.data;

      const slaRequests = employees.map((emp) => ({
        slatype: slaConfig.slatype,
        employeeId: emp.employeeId || emp.employeeMasterId,
        assignedToEmployeeId: 0,
        departmentId: emp.departmentId,
        deadline: slaConfig.deadline,
        createdByEmployeeId: slaConfig.createdByEmployeeId,
        creationReason:
          slaConfig.creationReason || `Organization-wide ${slaConfig.slatype}`,
      }));
      return await slaService.createBulkSLA(slaRequests);
    } catch (error) {
      console.error("Error creating organization-wide bulk SLAs:", error);
      throw error;
    }
  },

  updateSLA: async (id, data) => {
    try {
      const payload = {
        slatype: data.slatype,
        assignedToEmployeeId: data.assignedToEmployeeId,
        deadline: data.deadline,
        status: data.status,
        updatedByEmployeeId: data.updatedByEmployeeId,
      };
      return await slaApi.put(`/${id}`, payload);
    } catch (error) {
      console.error("Error updating SLA:", error);
      throw error;
    }
  },

  deleteSLA: async (id) => {
    try {
      return await slaApi.delete(`/${id}`);
    } catch (error) {
      console.error("Error deleting SLA:", error);
      throw error;
    }
  },

  closeSLA: async (data) => {
    try {
      const payload = {
        slaid: data.slaid,
        closedByEmployeeId: data.closedByEmployeeId,
        closureComments: data.closureComments || "",
      };
      return await slaApi.put("/close", payload);
    } catch (error) {
      console.error("Error closing SLA:", error);
      throw error;
    }
  },

  reopenSLA: async (data) => {
    try {
      return await slaApi.put("/reopen", data);
    } catch (error) {
      console.error("Error reopening SLA:", error);
      throw error;
    }
  },

  submitEscalation: async (data) => {
    try {
      const payload = {
        slaid: data.slaid,
        reason: data.reason,
        description: data.description || "",
        escalationLevel: "L1",
        escalatedToEmployeeId: data.escalatedToEmployeeId,
        submittedByEmployeeId: data.submittedByEmployeeId,
      };
      return await slaApi.post("/escalate", payload);
    } catch (error) {
      console.error("L1 Escalation Error:", error);
      throw error;
    }
  },

  escalateToDeptHead: async (data) => {
    try {
      const payload = {
        slaid: data.slaid,
        reason: data.reason,
        description: data.description || "",
        escalationLevel: "L2",
        escalatedToEmployeeId: data.escalatedToEmployeeId,
        submittedByEmployeeId: data.submittedByEmployeeId,
      };
      return await slaApi.post("/escalate-to-dept-head", payload);
    } catch (error) {
      console.error("L2 Escalation Error:", error);
      throw error;
    }
  },

  resolveEscalation: async (data) => {
    try {
      const payload = {
        escalationId: data.escalationId,
        resolvedByEmployeeId: data.resolvedByEmployeeId,
        escalationStatus: "Resolved",
        resolutionComments: data.resolutionComments || "",
      };
      return await slaApi.put("/escalation/resolve", payload);
    } catch (error) {
      console.error("Error resolving escalation:", error);
      throw error;
    }
  },

  getSLAEscalations: async (id) => {
    try {
      return await slaApi.get(`/${id}/escalations`);
    } catch (error) {
      console.error("Error fetching escalations:", error);
      throw error;
    }
  },

  getSLAHistory: async (id) => {
    try {
      return await slaApi.get(`/${id}/history`);
    } catch (error) {
      console.error("Error fetching history:", error);
      throw error;
    }
  },

  getTeamReviews: async (managerId) => {
    try {
      return await slaApi.get(`/manager/${managerId}/team-reviews`);
    } catch (error) {
      console.error("Error fetching team reviews:", error);
      throw error;
    }
  },

  getManagerEscalations: async (managerId) => {
    try {
      return await slaApi.get(`/manager/${managerId}/escalations`);
    } catch (error) {
      console.error("Error fetching escalations:", error);
      throw error;
    }
  },

  getDepartmentCompliance: async (deptId, period = null) => {
    try {
      const params = period ? { period } : {};
      return await slaApi.get(`/compliance/department/${deptId}`, { params });
    } catch (error) {
      console.error("Error fetching compliance:", error);
      throw error;
    }
  },

  getAllCompliance: async (period = null) => {
    try {
      const params = period ? { period } : {};
      return await slaApi.get("/compliance/all", { params });
    } catch (error) {
      console.error("Error fetching compliance:", error);
      throw error;
    }
  },

  calculateCompliance: async (data) => {
    try {
      return await slaApi.post("/compliance/calculate", data);
    } catch (error) {
      console.error("Error calculating compliance:", error);
      throw error;
    }
  },

  getAllEmployees: async () => {
    try {
      return await employeeApi.get("/all");
    } catch (error) {
      console.error("Error fetching employees:", error);
      throw error;
    }
  },

  getAllManagers: async () => {
    try {
      return await employeeApi.get("/managers");
    } catch (error) {
      console.error("Error fetching managers:", error);
      throw error;
    }
  },

  getEmployeeById: async (id) => {
    try {
      return await employeeApi.get(`/${id}`);
    } catch (error) {
      console.error("Error fetching employee:", error);
      throw error;
    }
  },

  searchEmployees: async (query) => {
    try {
      return await employeeApi.get("/search", { params: { q: query } });
    } catch (error) {
      console.error("Error searching:", error);
      throw error;
    }
  },

  getEmployeesByDepartment: async (deptId) => {
    try {
      return await employeeApi.get(`/department/${deptId}`);
    } catch (error) {
      console.error("Error fetching department employees:", error);
      throw error;
    }
  },

  getEmployeesByRole: async (roleId) => {
    try {
      return await employeeApi.get(`/role/${roleId}`);
    } catch (error) {
      console.error("Error fetching by role:", error);
      throw error;
    }
  },

  getAllDepartments: async () => {
    try {
      return await employeeApi.get("/departments");
    } catch (error) {
      console.error("Error fetching departments:", error);
      throw error;
    }
  },

  getDepartmentDetails: async (deptId) => {
    try {
      return await employeeApi.get(`/departments/${deptId}`);
    } catch (error) {
      console.error("Error fetching department:", error);
      throw error;
    }
  },

  getDepartmentHeads: async (deptId) => {
    try {
      if (!deptId) {
        console.warn("No departmentId provided");
        return { success: false, data: [], message: "Department ID required" };
      }
      const response = await employeeApi.get(`/department-heads/${deptId - 1}`);

      if (response?.success && Array.isArray(response.data)) {
        response.data.forEach((dh) => {});
        return response;
      }

      console.warn("No dept heads found");
      return { success: false, data: [], message: "No department heads found" };
    } catch (error) {
      console.error("Error fetching dept heads:", error);
      return { success: false, data: [], message: error.message };
    }
  },

  getAllDepartmentHeads: async () => {
    try {
      return await employeeApi.get(`/role/${ROLE_IDS.DEPARTMENT_HEAD}`);
    } catch (error) {
      console.error("Error fetching all dept heads:", error);
      throw error;
    }
  },

  getDepartmentHeadForEscalation: async (managerId) => {
    try {
      const managerResponse = await employeeApi.get(`/${managerId}`);

      if (!managerResponse?.success || !managerResponse?.data) {
        throw new Error("Manager not found");
      }

      const manager = managerResponse.data;
      const managerReportsTo = manager.reportsTo || manager.reportingToId;

      if (!managerReportsTo) {
        throw new Error("Manager has no reporting manager for escalation");
      }
      const deptHeadsResponse = await employeeApi.get(
        `/role/${ROLE_IDS.DEPARTMENT_HEAD}`
      );

      if (
        !deptHeadsResponse?.success ||
        !Array.isArray(deptHeadsResponse.data)
      ) {
        throw new Error("Failed to fetch department heads");
      }

      const validDeptHeads = deptHeadsResponse.data.filter((dh) => {
        const dhId = dh.employeeId || dh.employeeMasterId;
        const isMatch =
          dhId === managerReportsTo ||
          dhId?.toString() === managerReportsTo?.toString();

        if (isMatch) {
        }
        return isMatch;
      });

      if (validDeptHeads.length === 0) {
        console.warn(
          `Manager's reporting manager (${managerReportsTo}) is NOT in dept heads`
        );

        const directManager = await employeeApi.get(`/${managerReportsTo}`);
        if (directManager?.success && directManager?.data) {
          return {
            success: true,
            data: [directManager.data],
            message: "Direct manager fetched (not a registered dept head)",
            warning: "Target is not a registered department head",
          };
        }

        throw new Error(
          `Manager's reporting manager (ID: ${managerReportsTo}) not found`
        );
      }

      return {
        success: true,
        data: validDeptHeads,
        message: "Department head verified as manager's reporting manager",
      };
    } catch (error) {
      console.error("Error fetching escalation target:", error);
      throw error;
    }
  },

  canEscalate: (sla) => sla && sla.status !== "Closed",
  canReopen: (sla) => sla && sla.status === "Closed",
  canClose: (sla) =>
    sla && ["Open", "InProgress", "Escalated"].includes(sla.status),
  canResolveEscalation: (escalation) =>
    escalation && escalation.escalationStatus === "Pending",
  isOverdue: (deadline) => dateHelpers.daysRemaining(deadline) < 0,
  isUrgent: (deadline) => {
    const days = dateHelpers.daysRemaining(deadline);
    return days >= 0 && days <= 3;
  },
};

export default slaService;
