using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface ILnDHRService
    {
        Task<ApiResponse<PaginatedResponse<SubordinateEmployeeDto>>> GetAllOrganizationEmployees(
            string? searchTerm,
            int pageNumber,
            int pageSize
        );

        Task<ApiResponse<PaginatedResponse<AssignmentDto>>> GetAllOrganizationAssignments(
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        );

        Task<ApiResponse<byte[]>> ExportOrganizationAssignmentsToExcel(
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder
        );

        Task<ApiResponse<PaginatedResponse<EmployeeSkillDto>>> GetEmployeeSkillsById(
            int employeeId,
            int pageNumber,
            string? searchTerm,
            string? sortBy
        );
    }
}
