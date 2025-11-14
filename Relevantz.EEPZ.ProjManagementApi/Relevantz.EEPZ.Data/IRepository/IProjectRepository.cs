using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IProjectRepository
    {
        // Project CRUD
        Task<Project?> GetProjectByIdAsync(int projectId);
        Task<List<Project>> GetAllProjectsAsync();
        Task<Project> CreateProjectAsync(Project project);
        Task<Project> UpdateProjectAsync(Project project);
        Task<bool> DeleteProjectAsync(int projectId);
        Task<bool> ProjectExistsAsync(int projectId);
        Task<bool> ProjectNameExistsAsync(string projectName, int? excludeProjectId = null);

        // Reporting Managers
        Task<bool> UpdateReportingManagersAsync(int projectId, int? resourceOwnerId, int? l1ApproverId, int? l2ApproverId);

        // Employee Mapping
        Task<List<Projectemployee>> GetProjectEmployeesAsync(int projectId);
        Task<bool> MapEmployeesToProjectAsync(int projectId, List<Projectemployee> employees);
        Task<bool> UnmapEmployeesFromProjectAsync(int projectId, List<int> employeeIds);
        Task<bool> IsEmployeeMappedToProjectAsync(int projectId, int employeeId);

        // Employee Details
        Task<Employeedetailsmaster?> GetEmployeeDetailsByIdAsync(int employeeMasterId);
        Task<List<Employeedetailsmaster>> GetEmployeeDetailsByIdsAsync(List<int> employeeMasterIds);
        Task<bool> EmployeeMasterExistsAsync(int employeeMasterId);
        Task<Employee?> GetEmployeeByIdAsync(int employeeId);
        Task<List<Projectemployee>> GetProjectEmployeesByEmployeeIdAsync(int employeeId);

        // ✅ NEW: Get EmployeeId from EmployeeMasterId
        Task<int?> GetEmployeeIdByMasterIdAsync(int employeeMasterId);
        
        // ✅ NEW: Update Employee entity
        Task<bool> UpdateEmployeeAsync(Employee employee);
        
        // ✅ NEW: Batch update primary flags
        Task<bool> UpdateProjectEmployeePrimaryFlagsAsync(List<Projectemployee> projectEmployees);

        // ✅ NEW: Get all employees with their primary project information
Task<Dictionary<int, (int ProjectId, string ProjectName)?>> GetAllEmployeesWithPrimaryProjectAsync();

    }
}
