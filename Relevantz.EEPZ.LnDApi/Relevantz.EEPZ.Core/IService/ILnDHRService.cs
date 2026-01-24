using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface ILnDHRService
    {
        Task<
            ApiResponse<PaginatedResponse<SubordinateEmployeeResponseModel>>
        > GetAllOrganizationEmployees(OrganizationEmployeesRequestModel request);
        Task<ApiResponse<PaginatedResponse<AssignmentResponseModel>>> GetAllOrganizationAssignments(
            OrganizationAssignmentsRequestModel request
        );
        Task<ApiResponse<byte[]>> GetOrganizationAssignmentsForExport(
            ExportOrganizationAssignmentsRequestModel request
        );
        Task<ApiResponse<PaginatedResponse<EmployeeSkillResponseModel>>> GetEmployeeSkillsById(
            int employeeId,
            EmployeeSkillsByIdRequestModel request
        );
    }
}
