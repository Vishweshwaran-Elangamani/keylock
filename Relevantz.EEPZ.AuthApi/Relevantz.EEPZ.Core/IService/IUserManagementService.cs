using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IUserManagementService
    {
        Task<ApiResponseDto<UserResponseDto>> CreateUserAsync(CreateUserRequestDto request, int createdByUserId);
        Task<ApiResponseDto<UserResponseDto>> UpdateUserAsync(UpdateUserRequestDto request, int updatedByUserId);
        Task<ApiResponseDto<UserResponseDto>> GetUserByIdAsync(int userId);
        Task<ApiResponseDto<List<UserResponseDto>>> GetAllUsersAsync();
        Task<ApiResponseDto<string>> DeactivateUserAsync(int userId);
        Task<ApiResponseDto<string>> ActivateUserAsync(int userId);
        Task<ApiResponseDto<string>> AssignRoleAndDepartmentAsync(AssignRoleDepartmentRequestDto request);
        Task<ApiResponseDto<List<UserResponseDto>>> GetEmployeesByManagerAsync(int managerId);
 
    }
}
