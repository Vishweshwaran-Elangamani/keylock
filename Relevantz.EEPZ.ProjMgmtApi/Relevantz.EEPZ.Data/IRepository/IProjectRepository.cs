using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IProjectRepository
    {
        Task<Project?> GetProjectByIdAsync(int projectId);
        Task<List<Project>> GetAllProjectsAsync();
        Task<Project> CreateProjectAsync(Project project);
        Task<Project> UpdateProjectAsync(Project project);
        Task<bool> DeleteProjectAsync(int projectId);
        Task<bool> ProjectExistsAsync(int projectId);
        Task<bool> ProjectNameExistsAsync(string projectName, int? excludeProjectId = null);
        Task<bool> UpdateReportingManagersAsync(int projectId, int? resourceOwnerId, int? l1ApproverId, int? l2ApproverId);
        Task<List<Projectemployee>> GetProjectEmployeesAsync(int projectId);
        Task<bool> MapEmployeesToProjectAsync(int projectId, List<Projectemployee> employees);
        Task<bool> UnmapEmployeesFromProjectAsync(int projectId, List<int> employeeIds);
        Task<bool> IsEmployeeMappedToProjectAsync(int projectId, int employeeId);
        Task<Employeedetailsmaster?> GetEmployeeDetailsByIdAsync(int employeeMasterId);
        Task<List<Employeedetailsmaster>> GetEmployeeDetailsByIdsAsync(List<int> employeeMasterIds);
        Task<bool> EmployeeMasterExistsAsync(int employeeMasterId);
        Task<Employee?> GetEmployeeByIdAsync(int employeeId);
        Task<List<Projectemployee>> GetProjectEmployeesByEmployeeIdAsync(int employeeId);
        Task<int?> GetEmployeeIdByMasterIdAsync(int employeeMasterId);
        Task<bool> UpdateEmployeeAsync(Employee employee);
        Task<bool> UpdateProjectEmployeePrimaryFlagsAsync(List<Projectemployee> projectEmployees);
        Task<Dictionary<int, (int ProjectId, string ProjectName)?>> GetAllEmployeesWithPrimaryProjectAsync();

        /// <summary>
        /// Move employees to resource pool if they have no other project mappings
        /// </summary>
        Task<int> MoveUnmappedEmployeesToResourcePoolAsync(List<int> employeeIds);

        /// <summary>
        /// Get the resource pool project (org.rz.resourcepool)
        /// </summary>
        Task<Project?> GetResourcePoolProjectAsync();

        /// <summary>
        /// Get resource pool mappings for specific employees
        /// </summary>
        Task<List<Projectemployee>> GetResourcePoolMappingsAsync(int resourcePoolProjectId, List<int> employeeIds);

        /// <summary>
        /// Get mappings from other projects (excluding resource pool)
        /// </summary>
        Task<List<Projectemployee>> GetOtherProjectMappingsAsync(int resourcePoolProjectId, List<int> employeeIds);

        /// <summary>
        /// Remove project-employee mappings and save changes
        /// </summary>
        Task<bool> RemoveProjectEmployeeMappingsAsync(List<Projectemployee> mappings);
    }
}
