using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IUserManagementService
    {
        Task<UserResponseDto> CreateUserAsync(CreateUserRequestDto request, int createdByUserId);
        Task<UserResponseDto> UpdateUserAsync(UpdateUserRequestDto request, int updatedByUserId);
        Task<UserResponseDto> GetUserByIdAsync(int userId);
        Task<List<UserResponseDto>> GetAllUsersAsync();
        Task DeactivateUserAsync(int userId);
        Task ActivateUserAsync(int userId);
        Task AssignRoleAndDepartmentAsync(AssignRoleDepartmentRequestDto request);
        Task<List<UserResponseDto>> GetEmployeesByManagerAsync(int managerId);
        Task<string> GetNextEmployeeCompanyIdAsync();
    }
}
