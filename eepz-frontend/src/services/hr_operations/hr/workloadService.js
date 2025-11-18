import hrApi from "./hrApi";

const workloadService = {
  // GET ALL WORKLOAD DISTRIBUTIONS FROM BACKEND
  getAllProjects: async () => {
    try {
      console.log(
        "Frontend: Fetching all workload distributions from backend..."
      );

      const response = await hrApi.get("/ResponsibilityDistribution/all");
      console.log("Frontend: Raw API Response:", response);
      console.log("Frontend: Response data:", response.data);

      // Backend returns: { success: true, data: [...], message: "..." }
      let dataArray = response.data?.data || response.data || [];

      console.log("Frontend: Extracted data array:", dataArray);

      if (!Array.isArray(dataArray)) {
        dataArray = [dataArray];
      }

      const transformedData = transformBackendToFrontend(dataArray);

      console.log("Frontend: Transformed data:", transformedData);

      return {
        success: true,
        data: transformedData,
        message: "Workload distributions loaded from backend",
      };
    } catch (error) {
      console.error("Frontend: Error fetching from backend:", error);
      throw {
        message:
          error.response?.data?.message ||
          "Failed to fetch workload distributions",
        status: error.response?.status,
      };
    }
  },

  // GET WORKLOAD BY ID
  getProjectById: async (workloadId) => {
    try {
      console.log("Frontend: Fetching workload ID:", workloadId);

      const response = await hrApi.get(
        `/ResponsibilityDistribution/${workloadId}`
      );
      console.log("Frontend: Workload from API:", response);

      let dataItem = response.data?.data || response.data;

      const transformedData = transformBackendToFrontend([dataItem])[0];

      return {
        success: true,
        data: transformedData,
        message: "Workload distribution retrieved successfully",
      };
    } catch (error) {
      console.error("Frontend: Error fetching workload:", error);
      throw {
        message:
          error.response?.data?.message ||
          "Failed to fetch workload distribution",
        status: error.response?.status,
      };
    }
  },

  // GET WORKLOADS BY DEPARTMENT
  getProjectsByDepartment: async (departmentId) => {
    try {
      console.log("Frontend: Fetching workloads for department:", departmentId);

      const response = await hrApi.get(
        `/ResponsibilityDistribution/by-department/${departmentId}`
      );
      console.log("Frontend: Department workloads from API:", response);

      let dataArray = response.data?.data || response.data || [];

      if (!Array.isArray(dataArray)) {
        dataArray = [dataArray];
      }

      const transformedData = transformBackendToFrontend(dataArray);

      return {
        success: true,
        data: transformedData,
        message: `Retrieved workload distributions for department`,
      };
    } catch (error) {
      console.error("Frontend: Error fetching department workloads:", error);
      throw {
        message:
          error.response?.data?.message ||
          "Failed to fetch department workloads",
        status: error.response?.status,
      };
    }
  },

  // CREATE NEW WORKLOAD DISTRIBUTION
  createWorkloadDistribution: async (workloadData) => {
    try {
      console.log(
        "Frontend: Creating new workload distribution:",
        workloadData
      );

      const payload = {
        teamId: workloadData.teamId,
        managerUserId: workloadData.managerUserId,
        memberCount: workloadData.memberCount,
        tasksDistributed: workloadData.tasksDistributed,
        status: workloadData.status || "Balanced",
        evaluationDate: workloadData.evaluationDate || new Date().toISOString(),
      };

      const response = await hrApi.post(
        "/ResponsibilityDistribution/create",
        payload
      );
      console.log("Frontend: Workload created successfully:", response);

      return {
        success: true,
        data: response.data,
        message: "Workload distribution created successfully",
      };
    } catch (error) {
      console.error("Frontend: Error creating workload:", error);
      throw {
        message:
          error.response?.data?.message ||
          "Failed to create workload distribution",
        status: error.response?.status,
      };
    }
  },

  // UPDATE WORKLOAD DISTRIBUTION
  updateWorkloadDistribution: async (workloadId, updateData) => {
    try {
      console.log(
        "Frontend: Updating workload ID:",
        workloadId,
        "Data:",
        updateData
      );

      const payload = {
        workloadId: workloadId,
        memberCount: updateData.memberCount,
        tasksDistributed: updateData.tasksDistributed,
        status: updateData.status,
        evaluationDate: updateData.evaluationDate,
      };

      const response = await hrApi.put(
        "/ResponsibilityDistribution/update",
        payload
      );
      console.log("Frontend: Workload updated successfully:", response);

      return {
        success: true,
        data: response.data,
        message: "Workload distribution updated successfully",
      };
    } catch (error) {
      console.error("Frontend: Error updating workload:", error);
      throw {
        message:
          error.response?.data?.message ||
          "Failed to update workload distribution",
        status: error.response?.status,
      };
    }
  },

  // DELETE WORKLOAD DISTRIBUTION
  deleteWorkloadDistribution: async (workloadId) => {
    try {
      console.log("Frontend: Deleting workload ID:", workloadId);

      const response = await hrApi.delete(
        `/ResponsibilityDistribution/${workloadId}`
      );
      console.log("Frontend: Workload deleted successfully:", response);

      return {
        success: true,
        message: "Workload distribution deleted successfully",
      };
    } catch (error) {
      console.error("Frontend: Error deleting workload:", error);
      throw {
        message:
          error.response?.data?.message ||
          "Failed to delete workload distribution",
        status: error.response?.status,
      };
    }
  },
};

// DATA TRANSFORMATION FUNCTION
// Converts backend ResponsibilityDistributionResponseDto to frontend format
const transformBackendToFrontend = (backendData) => {
  console.log("Transform: Input data:", backendData);

  if (!Array.isArray(backendData)) {
    backendData = [backendData];
  }

  return backendData.map((item) => {
    console.log("Transform: Processing item:", item);

    return {
      projectId: item.workloadId || 0,
      workloadId: item.workloadId || 0,
      teamId: item.teamId || 0,
      projectName: item.teamName || "N/A",
      teamName: item.teamName || "N/A",
      departmentName: item.teamName || "N/A",
      reportingManagerName: item.managerName || "N/A",
      managerUserId: item.managerUserId || 0,
      managerName: item.managerName || "N/A",
      teamMembersCount: item.memberCount || 0,
      memberCount: item.memberCount || 0,
      avgWorkload: item.avgWorkload || 0,
      avgHours: Math.round((item.avgWorkload || 0) * 10) / 10,
      workloadVariance: Math.round((item.workloadVariance || 0) * 100) / 100,
      tasksDistributed: item.taskDistributed || item.tasksDistributed || 0,
      status: item.status || "Balanced",
      evaluationDate: item.evaluationDate || new Date().toISOString(),
      createdAt: item.createdAt || new Date().toISOString(),
      maxHours:
        Math.round(
          ((item.avgWorkload || 0) + (item.workloadVariance || 0)) * 10
        ) / 10,
      teamMembers: [],
      newRole: item.newRole || "N/A",
    };
  });
};

export default workloadService;
