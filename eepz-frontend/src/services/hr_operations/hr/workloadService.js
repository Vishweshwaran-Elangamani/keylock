// import hrApi from "../hrApi";

// //  MOCK DATA - Complete projects with all required fields
// const MOCK_PROJECTS = [
//   {
//     projectId: 1,
//     projectName: "E-Commerce Platform",
//     reportingManagerName: "Rajesh Kumar",
//     teamMembers: [
//       { memberId: 1, employeeName: "Amit Singh", workload: 85 },
//       { memberId: 2, employeeName: "Priya Sharma", workload: 78 },
//       { memberId: 3, employeeName: "Vikram Patel", workload: 92 }
//     ],
//     avgWorkload: 85,
//     workloadVariance: 8,
//     tasksDistributed: 24,
//     status: "active",
//     startDate: "2025-01-15",
//     endDate: "2025-12-31"
//   },
//   {
//     projectId: 2,
//     projectName: "Mobile App Development",
//     reportingManagerName: "Sarah Johnson",
//     teamMembers: [
//       { memberId: 4, employeeName: "Deepak Nair", workload: 45 },
//       { memberId: 5, employeeName: "Neha Gupta", workload: 88 },
//       { memberId: 6, employeeName: "Arjun Kumar", workload: 92 }
//     ],
//     avgWorkload: 75,
//     workloadVariance: 28,
//     tasksDistributed: 18,
//     status: "active",
//     startDate: "2025-02-01",
//     endDate: "2025-11-30"
//   },
//   {
//     projectId: 3,
//     projectName: "Cloud Migration",
//     reportingManagerName: "Michael Chen",
//     teamMembers: [
//       { memberId: 7, employeeName: "Rohan Verma", workload: 79 },
//       { memberId: 8, employeeName: "Kavya Menon", workload: 81 },
//       { memberId: 9, employeeName: "Sanjay Desai", workload: 82 }
//     ],
//     avgWorkload: 81,
//     workloadVariance: 3,
//     tasksDistributed: 32,
//     status: "active",
//     startDate: "2025-03-10",
//     endDate: "2025-09-30"
//   },
//   {
//     projectId: 4,
//     projectName: "AI & Machine Learning",
//     reportingManagerName: "Dr. Priya Singh",
//     teamMembers: [
//       { memberId: 10, employeeName: "Nikhil Desai", workload: 95 },
//       { memberId: 11, employeeName: "Isha Reddy", workload: 92 },
//       { memberId: 12, employeeName: "Aditya Patel", workload: 88 }
//     ],
//     avgWorkload: 92,
//     workloadVariance: 4,
//     tasksDistributed: 28,
//     status: "active",
//     startDate: "2025-04-05",
//     endDate: "2025-10-31"
//   },
//   {
//     projectId: 5,
//     projectName: "Data Analytics Platform",
//     reportingManagerName: "James Wilson",
//     teamMembers: [
//       { memberId: 13, employeeName: "Suresh Kumar", workload: 60 },
//       { memberId: 14, employeeName: "Meera Gupta", workload: 75 },
//       { memberId: 15, employeeName: "Ravi Shankar", workload: 85 },
//       { memberId: 16, employeeName: "Anjali Verma", workload: 50 }
//     ],
//     avgWorkload: 68,
//     workloadVariance: 18,
//     tasksDistributed: 22,
//     status: "active",
//     startDate: "2025-01-20",
//     endDate: "2025-08-31"
//   },
//   {
//     projectId: 6,
//     projectName: "Cybersecurity Initiative",
//     reportingManagerName: "Emma Thompson",
//     teamMembers: [
//       { memberId: 17, employeeName: "Hassan Ali", workload: 90 },
//       { memberId: 18, employeeName: "Lisa Wong", workload: 87 },
//       { memberId: 19, employeeName: "Marcus Johnson", workload: 89 }
//     ],
//     avgWorkload: 89,
//     workloadVariance: 2,
//     tasksDistributed: 35,
//     status: "active",
//     startDate: "2025-02-15",
//     endDate: "2025-12-31"
//   }
// ];

// const workloadService = {
//   //  GET ALL PROJECTS - Using mock data
//   getAllProjects: async () => {
//     try {
//       console.log(" Frontend: Fetching all projects for workload");
      
//       // Try real API first
//       try {
//         const response = await hrApi.get("/ProjectManagement");
//         console.log(" Frontend: Projects from REAL API:", response.data);
//         return response.data;
//       } catch (apiError) {
//         console.log(" Real API failed (404), switching to mock data...");
//         console.log(" Hint: ProjectManagement endpoint not ready yet");
        
//         // Return mock data
//         return {
//           success: true,
//           data: MOCK_PROJECTS,
//           message: "Mock data loaded (API endpoint pending)"
//         };
//       }
//     } catch (error) {
//       console.error(" Frontend: Fatal error fetching projects", error);
//       // Final fallback - return mock data
//       return {
//         success: true,
//         data: MOCK_PROJECTS,
//         message: "Mock data loaded (fallback)"
//       };
//     }
//   },

//   // GET PROJECT BY ID
//   getProjectById: async (projectId) => {
//     try {
//       console.log(" Frontend: Fetching project ID:", projectId);
      
//       // Try real API first
//       try {
//         const response = await hrApi.get(`/ProjectManagement/${projectId}`);
//         console.log(" Frontend: Project from API:", response.data);
//         return response.data;
//       } catch (apiError) {
//         console.log(" API failed, using mock data for project:", projectId);
        
//         // Fallback to mock data
//         const mockProject = MOCK_PROJECTS.find(p => p.projectId === projectId);
//         if (mockProject) {
//           return {
//             success: true,
//             data: mockProject,
//             message: "Mock data loaded"
//           };
//         }
//         throw new Error("Project not found");
//       }
//     } catch (error) {
//       console.error(" Frontend: Error fetching project", error);
//       throw error.response?.data || { message: "Failed to fetch project" };
//     }
//   },

//   // GET AVAILABLE EMPLOYEES
//   getAvailableEmployees: async () => {
//     try {
//       console.log(" Frontend: Fetching available employees");
      
//       try {
//         const response = await hrApi.get("/ProjectManagement/employees/available");
//         console.log(" Frontend: Available employees from API:", response.data);
//         return response.data;
//       } catch (apiError) {
//         console.log(" API failed, returning mock available employees");
        
//         // Mock available employees
//         return {
//           success: true,
//           data: [
//             { employeeId: 20, employeeName: "John Doe", department: "Engineering" },
//             { employeeId: 21, employeeName: "Jane Smith", department: "Engineering" },
//             { employeeId: 22, employeeName: "Robert Brown", department: "Operations" },
//             { employeeId: 23, employeeName: "Emily Davis", department: "Engineering" },
//             { employeeId: 24, employeeName: "David Wilson", department: "HR" }
//           ],
//           message: "Mock available employees"
//         };
//       }
//     } catch (error) {
//       console.error(" Frontend: Error fetching available employees", error);
//       throw error.response?.data || { message: "Failed to fetch available employees" };
//     }
//   },

//   // MAP EMPLOYEES TO PROJECT
//   mapEmployeesToProject: async (projectId, employeeIds) => {
//     try {
//       console.log(" Frontend: Mapping employees to project:", projectId, "Employees:", employeeIds);
      
//       try {
//         const response = await hrApi.post(
//           `/ProjectManagement/${projectId}/employees/map`,
//           { projectId, employeeIds }
//         );
//         console.log(" Frontend: Employees mapped successfully", response.data);
//         return response.data;
//       } catch (apiError) {
//         console.log(" API failed, returning mock success response");
        
//         // Mock success response
//         return {
//           success: true,
//           message: `${employeeIds.length} employee(s) mapped to project ${projectId} (mock)`,
//           data: { mappedCount: employeeIds.length }
//         };
//       }
//     } catch (error) {
//       console.error(" Frontend: Error mapping employees", error);
//       throw error.response?.data || { message: "Failed to map employees" };
//     }
//   },

//   // UNMAP EMPLOYEES FROM PROJECT
//   unmapEmployeesFromProject: async (projectId, employeeIds) => {
//     try {
//       console.log(" Frontend: Unmapping employees from project:", projectId, "Employees:", employeeIds);
      
//       try {
//         const response = await hrApi.post(
//           `/ProjectManagement/${projectId}/employees/unmap`,
//           { projectId, employeeIds }
//         );
//         console.log(" Frontend: Employees unmapped successfully", response.data);
//         return response.data;
//       } catch (apiError) {
//         console.log(" API failed, returning mock success response");
        
//         // Mock success response
//         return {
//           success: true,
//           message: `${employeeIds.length} employee(s) unmapped from project ${projectId} (mock)`,
//           data: { unmappedCount: employeeIds.length }
//         };
//       }
//     } catch (error) {
//       console.error(" Frontend: Error unmapping employees", error);
//       throw error.response?.data || { message: "Failed to unmap employees" };
//     }
//   },

//   // UPDATE REPORTING MANAGERS
//   updateReportingManagers: async (projectId, managerIds) => {
//     try {
//       console.log(" Frontend: Updating reporting managers for project:", projectId, "Managers:", managerIds);
      
//       try {
//         const response = await hrApi.put(
//           `/ProjectManagement/${projectId}/reporting-managers`,
//           { projectId, managerIds }
//         );
//         console.log(" Frontend: Reporting managers updated", response.data);
//         return response.data;
//       } catch (apiError) {
//         console.log(" API failed, returning mock success response");
        
//         // Mock success response
//         return {
//           success: true,
//           message: `Reporting managers updated for project ${projectId} (mock)`,
//           data: { updatedCount: managerIds.length }
//         };
//       }
//     } catch (error) {
//       console.error(" Frontend: Error updating reporting managers", error);
//       throw error.response?.data || { message: "Failed to update reporting managers" };
//     }
//   }
// };

// export default workloadService;


import hrApi from "./hrApi";

const workloadService = {
  // GET ALL WORKLOAD DISTRIBUTIONS FROM BACKEND
  getAllProjects: async () => {
    try {
      console.log("Frontend: Fetching all workload distributions from backend...");
      
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
        message: "Workload distributions loaded from backend"
      };
    } catch (error) {
      console.error("Frontend: Error fetching from backend:", error);
      throw {
        message: error.response?.data?.message || "Failed to fetch workload distributions",
        status: error.response?.status
      };
    }
  },

  // GET WORKLOAD BY ID
  getProjectById: async (workloadId) => {
    try {
      console.log("Frontend: Fetching workload ID:", workloadId);
      
      const response = await hrApi.get(`/ResponsibilityDistribution/${workloadId}`);
      console.log("Frontend: Workload from API:", response);
      
      let dataItem = response.data?.data || response.data;
      
      const transformedData = transformBackendToFrontend([dataItem])[0];
      
      return {
        success: true,
        data: transformedData,
        message: "Workload distribution retrieved successfully"
      };
    } catch (error) {
      console.error("Frontend: Error fetching workload:", error);
      throw {
        message: error.response?.data?.message || "Failed to fetch workload distribution",
        status: error.response?.status
      };
    }
  },

  // GET WORKLOADS BY DEPARTMENT
  getProjectsByDepartment: async (departmentId) => {
    try {
      console.log("Frontend: Fetching workloads for department:", departmentId);
      
      const response = await hrApi.get(`/ResponsibilityDistribution/by-department/${departmentId}`);
      console.log("Frontend: Department workloads from API:", response);
      
      let dataArray = response.data?.data || response.data || [];
      
      if (!Array.isArray(dataArray)) {
        dataArray = [dataArray];
      }
      
      const transformedData = transformBackendToFrontend(dataArray);
      
      return {
        success: true,
        data: transformedData,
        message: `Retrieved workload distributions for department`
      };
    } catch (error) {
      console.error("Frontend: Error fetching department workloads:", error);
      throw {
        message: error.response?.data?.message || "Failed to fetch department workloads",
        status: error.response?.status
      };
    }
  },

  // CREATE NEW WORKLOAD DISTRIBUTION
  createWorkloadDistribution: async (workloadData) => {
    try {
      console.log("Frontend: Creating new workload distribution:", workloadData);
      
      const payload = {
        teamId: workloadData.teamId,
        managerUserId: workloadData.managerUserId,
        memberCount: workloadData.memberCount,
        tasksDistributed: workloadData.tasksDistributed,
        status: workloadData.status || "Balanced",
        evaluationDate: workloadData.evaluationDate || new Date().toISOString()
      };
      
      const response = await hrApi.post("/ResponsibilityDistribution/create", payload);
      console.log("Frontend: Workload created successfully:", response);
      
      return {
        success: true,
        data: response.data,
        message: "Workload distribution created successfully"
      };
    } catch (error) {
      console.error("Frontend: Error creating workload:", error);
      throw {
        message: error.response?.data?.message || "Failed to create workload distribution",
        status: error.response?.status
      };
    }
  },

  // UPDATE WORKLOAD DISTRIBUTION
  updateWorkloadDistribution: async (workloadId, updateData) => {
    try {
      console.log("Frontend: Updating workload ID:", workloadId, "Data:", updateData);
      
      const payload = {
        workloadId: workloadId,
        memberCount: updateData.memberCount,
        tasksDistributed: updateData.tasksDistributed,
        status: updateData.status,
        evaluationDate: updateData.evaluationDate
      };
      
      const response = await hrApi.put("/ResponsibilityDistribution/update", payload);
      console.log("Frontend: Workload updated successfully:", response);
      
      return {
        success: true,
        data: response.data,
        message: "Workload distribution updated successfully"
      };
    } catch (error) {
      console.error("Frontend: Error updating workload:", error);
      throw {
        message: error.response?.data?.message || "Failed to update workload distribution",
        status: error.response?.status
      };
    }
  },

  // DELETE WORKLOAD DISTRIBUTION
  deleteWorkloadDistribution: async (workloadId) => {
    try {
      console.log("Frontend: Deleting workload ID:", workloadId);
      
      const response = await hrApi.delete(`/ResponsibilityDistribution/${workloadId}`);
      console.log("Frontend: Workload deleted successfully:", response);
      
      return {
        success: true,
        message: "Workload distribution deleted successfully"
      };
    } catch (error) {
      console.error("Frontend: Error deleting workload:", error);
      throw {
        message: error.response?.data?.message || "Failed to delete workload distribution",
        status: error.response?.status
      };
    }
  }
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
      maxHours: Math.round(((item.avgWorkload || 0) + (item.workloadVariance || 0)) * 10) / 10,
      teamMembers: [],
      newRole: item.newRole || "N/A"
    };
  });
};

export default workloadService;
