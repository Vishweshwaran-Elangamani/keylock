using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IRoleService
    {
        Task<RoleResponseDto> CreateRoleAsync(CreateRoleRequestDto request);
        Task<RoleResponseDto> UpdateRoleAsync(UpdateRoleRequestDto request);
        Task<RoleResponseDto> GetRoleByIdAsync(int roleId);
        Task<List<RoleResponseDto>> GetAllRolesAsync();
        Task DeleteRoleAsync(int roleId);
    }
}
