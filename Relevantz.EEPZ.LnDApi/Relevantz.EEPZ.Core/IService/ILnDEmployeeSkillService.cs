using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface ILnDEmployeeSkillService
    {
        Task<ApiResponse<PaginatedResponse<SubordinateEmployeeDto>>> GetSubordinateEmployees(
            int managerId,
            string? searchTerm,
            int pageNumber,
            int pageSize
        );

        Task<ApiResponse<List<SkillDto>>> GetAllSkills();

        Task<ApiResponse<PaginatedResponse<EmployeeSkillDto>>> GetSubordinateSkills(
            int managerId,
            int? employeeId,
            string? searchTerm,
            string? sortBy,
            int pageNumber,
            int pageSize
        );

        Task<ApiResponse<EmployeeSkillDto>> RecordEmployeeSkill(
            int managerId,
            RecordSkillRequest request
        );

        Task<ApiResponse<List<EmployeeSkillDto>>> BulkRecordEmployeeSkills(
            int managerId,
            BulkRecordSkillRequest request
        );

        Task<ApiResponse<EmployeeSkillDto>> UpdateEmployeeSkillRating(
            int managerId,
            UpdateSkillRatingRequest request
        );

        Task<ApiResponse<bool>> DeleteEmployeeSkill(int managerId, int mapperId);

        Task<ApiResponse<PaginatedResponse<EmployeeSkillDto>>> GetMySkills(
            int employeeId,
            string searchTerm,
            int pageNumber,
            int pageSize
        );
    }
}
