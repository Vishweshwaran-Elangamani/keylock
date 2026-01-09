using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface ILnDEmployeeSkillService
    {
        Task<ApiResponse<PaginatedResponse<SubordinateEmployeeResponseModel>>> GetSubordinateEmployees(
            int managerId,
            string? searchTerm,
            int pageNumber,
            int pageSize
        ); 
        Task<ApiResponse<List<SkillResponseModel>>> GetAllSkills();
        Task<ApiResponse<PaginatedResponse<EmployeeSkillResponseModel>>> GetSubordinateSkills(
            int managerId,
            int? employeeId,
            string? searchTerm,
            string? sortBy,
            int pageNumber,
            int pageSize
        );   
        Task<ApiResponse<EmployeeSkillResponseModel>> RecordEmployeeSkill(
            int managerId,
            RecordSkillRequestModel request
        );
        Task<ApiResponse<List<EmployeeSkillResponseModel>>> BulkRecordEmployeeSkills(
            int managerId,
            BulkRecordSkillRequestModel request
        );
        Task<ApiResponse<EmployeeSkillResponseModel>> UpdateEmployeeSkillRating(
            int managerId,
            UpdateSkillRatingRequestModel request
        );
        Task<ApiResponse<bool>> DeleteEmployeeSkill(int managerId, int mapperId);
        Task<ApiResponse<PaginatedResponse<EmployeeSkillResponseModel>>> GetMySkills(
            int employeeId,
            string searchTerm,
            int pageNumber,
            int pageSize
        );
    }
}
