using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IProjectService
    {
        Task<ApiResponse<ProjectResponse>> CreateProjectAsync(CreateProjectRequest request);
        Task<ApiResponse<ProjectResponse>> UpdateProjectAsync(UpdateProjectRequest request);
        Task<ApiResponse<bool>> DeleteProjectAsync(int projectId);
        Task<ApiResponse<ProjectDetailResponse>> GetProjectByIdAsync(int projectId);
        Task<ApiResponse<List<ProjectResponse>>> GetAllProjectsAsync();

        Task<ApiResponse<bool>> UpdateReportingManagersAsync(UpdateReportingManagersRequest request);

        //These now work with the updated DTOs
        Task<ApiResponse<bool>> MapEmployeesToProjectAsync(MapEmployeesToProjectRequest request);
        Task<ApiResponse<bool>> UnmapEmployeesFromProjectAsync(UnmapEmployeesFromProjectRequest request);

        Task<ApiResponse<List<EmployeeBasicInfo>>> GetAvailableEmployeesAsync();

        // ✅ NEW: Get all employees with their primary project information
Task<ApiResponse<Dictionary<int, EmployeePrimaryProjectInfo?>>> GetAllEmployeesWithPrimaryProjectAsync();

        
    }
}
