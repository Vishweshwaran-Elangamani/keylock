import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_SLA_API_URL;
const API_EMP = import.meta.env.VITE_PROJECT_API_URL;

const slaApi = axios.create({
baseURL: `${API_BASE_URL}/api/slas`,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

const employeeApi = axios.create({
  baseURL: `${API_EMP}/api/employees`,
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
  (response) => {
    const body = response.data;

    return {
      success: body.success ?? body.Success ?? true,
      data: body.data ?? body.Data ?? body,
      message: body.message ?? body.Message ?? "Success",
      count: body.count ?? body.Count ?? 0,
    };
  },

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
getAllSLAs: async () => await slaApi.get(""),
getSLAById: async (id) => await slaApi.get(`/${id}`),

createSLA: async (data) => await slaApi.post("", data),
  createBulkSLA: async (data) => await slaApi.post("/bulk", data),

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

  updateSLA: async (id, data) => await slaApi.put(`/${id}`, data),
deleteSLA: async (id) => await slaApi.delete(`/${id}`),

submitEscalation: async (slaId, payload, level = "normal") =>
  await slaApi.post(`/${slaId}/escalations`, payload, {
    params: { level },
  }),

resolveEscalation: async (payload) =>
  await slaApi.put(`/escalations/resolve`, payload),

closeSLA: async (slaId) =>
  await slaApi.put(`/${slaId}/close`),

reopenSLA: async (slaId, payload) =>
  await slaApi.put(`/${slaId}/reopen`, payload),


  getSLAEscalations: async (slaId) =>
  await slaApi.get(`/${slaId}/escalations`),

  escalateToDeptHead: async (data) => await slaApi.post("/escalate-to-dept-head", data),


getSLAHistory: async (slaId) =>
  await slaApi.get(`/${slaId}/history`),

  getTeamReviews: async (managerId) => {
    try {
      return await slaApi.get(`/manager/${managerId}/team-reviews`);
    } catch (error) {
      console.error("Error fetching team reviews:", error);
      throw error;
    }
  },

  getEmployeeSLAs: async (employeeId) =>
  await slaApi.get(`/employee/${employeeId}`),


getManagerEscalations: async () =>
  await slaApi.get(`/manager/escalations`),

  getDepartmentCompliance: async (deptId, period) =>
  await slaApi.get(`/department/${deptId}`, { params: { period } }),

getAllCompliance: async (period)=>
  await slaApi.get(`/departments`, { params: { period } }),

calculateCompliance: async (data) => await slaApi.post(`/calculate`, data),


  getAllEmployees: async () => await employeeApi.get("/"),

  getAllManagers: async () => {
    try {
      return await employeeApi.get("/", { params: { isManager: true } });
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

  searchEmployees: async (searchTerm) => {
    try {
      return await employeeApi.get("/", { params: { searchTerm } });
    } catch (error) {
      console.error("Error searching:", error);
      throw error;
    }
  },

  getEmployeesByDepartment: async (deptId) => {
    try {
      return await employeeApi.get("/", { params: { departmentId: deptId } });
    } catch (error) {
      console.error("Error fetching department employees:", error);
      throw error;
    }
  },

  getEmployeesByRole: async (roleId) => {
    try {
      return await employeeApi.get("/", { params: { roleId } });
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

      const response = await employeeApi.get("/", {
        params: { departmentId: deptId, isDepartmentHead: true },
      });

      return response;
    } catch (error) {
      console.error("Error fetching dept heads:", error);
      return { success: false, data: [], message: error.message };
    }
  },

  getAllDepartmentHeads: async () => {
    try {
      return await employeeApi.get("/", {
        params: { roleId: ROLE_IDS.DEPARTMENT_HEAD },
      });
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

      const deptHeadsResponse = await employeeApi.get("/", {
        params: { roleId: ROLE_IDS.DEPARTMENT_HEAD },
      });

      if (
        !deptHeadsResponse?.success ||
        !Array.isArray(deptHeadsResponse.data)
      ) {
        throw new Error("Failed to fetch department heads");
      }

      const validDeptHeads = deptHeadsResponse.data.filter((dh) => {
        const dhId = dh.employeeId || dh.employeeMasterId;
        return (
          dhId === managerReportsTo ||
          dhId?.toString() === managerReportsTo?.toString()
        );
      });

      if (validDeptHeads.length === 0) {
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
