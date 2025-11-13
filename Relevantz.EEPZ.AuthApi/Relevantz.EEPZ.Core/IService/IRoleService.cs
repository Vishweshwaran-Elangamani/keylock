using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IRoleService
    {
        Task<ApiResponseDto<RoleResponseDto>> CreateRoleAsync(CreateRoleRequestDto request);
        Task<ApiResponseDto<RoleResponseDto>> UpdateRoleAsync(UpdateRoleRequestDto request);
        Task<ApiResponseDto<RoleResponseDto>> GetRoleByIdAsync(int roleId);
        Task<ApiResponseDto<List<RoleResponseDto>>> GetAllRolesAsync();
        Task<ApiResponseDto<string>> DeleteRoleAsync(int roleId);
    }
}
