using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Common.Constants;
namespace Relevantz.EEPZ.Core.Service
{
    public class RoleService : IRoleService
    {
        private readonly IRoleRepository _roleRepository;
        public RoleService(IRoleRepository roleRepository)
        {
            _roleRepository = roleRepository;
        }
        public async Task<RoleResponseDto> CreateRoleAsync(CreateRoleRequestDto request)
        {
            if (await _roleRepository.RoleNameExistsAsync(request.RoleName))
            {
                throw new InvalidOperationException("Role name already exists");
            }
            if (await _roleRepository.RoleCodeExistsAsync(request.RoleCode))
            {
                throw new InvalidOperationException("Role code already exists");
            }
            var role = new Role
            {
                RoleName = request.RoleName,
                RoleCode = request.RoleCode,
                Description = request.Description,
                IsSystemRole = false,
                CreatedAt = DateTime.UtcNow
            };
            await _roleRepository.CreateAsync(role);
            var response = MapToRoleResponse(role);
            EEPZBusinessLog.Information($"Role created: {request.RoleName}");
            return response;
        }
        public async Task<RoleResponseDto> UpdateRoleAsync(UpdateRoleRequestDto request)
        {
            var role = await _roleRepository.GetByIdAsync(request.RoleId);
            if (role == null)
            {
                throw new KeyNotFoundException(MessageConstants.RoleNotFound); 
            }
            if (role.IsSystemRole == true)
            {
                throw new InvalidOperationException("Cannot update system role");
            }
            if (request.RoleName != null) role.RoleName = request.RoleName;
            if (request.RoleCode != null) role.RoleCode = request.RoleCode;
            if (request.Description != null) role.Description = request.Description;
            role.UpdatedAt = DateTime.UtcNow;
            await _roleRepository.UpdateAsync(role);
            var response = MapToRoleResponse(role);
            EEPZBusinessLog.Information($"Role updated: RoleId {request.RoleId}");
            return response;
        }
        public async Task<RoleResponseDto> GetRoleByIdAsync(int roleId)
        {
            var role = await _roleRepository.GetByIdAsync(roleId);
            if (role == null)
            {
                throw new KeyNotFoundException(MessageConstants.RoleNotFound);
            }
            var response = MapToRoleResponse(role);
            return response;
        }
        public async Task<List<RoleResponseDto>> GetAllRolesAsync()
        {
            var roles = await _roleRepository.GetAllAsync();
            var responses = roles.Select(MapToRoleResponse).ToList();
            return responses;
        }
        public async Task DeleteRoleAsync(int roleId)
        {
            var role = await _roleRepository.GetByIdAsync(roleId);
            if (role == null)
            {
                throw new KeyNotFoundException(MessageConstants.RoleNotFound); 
            }
            if (role.IsSystemRole == true)
            {
                throw new InvalidOperationException("Cannot delete system role");
            }
            await _roleRepository.DeleteAsync(roleId);
            EEPZBusinessLog.Information($"Role deleted: RoleId {roleId}");
        }
        private RoleResponseDto MapToRoleResponse(Role role)
        {
            return new RoleResponseDto
            {
                RoleId = role.RoleId,
                RoleName = role.RoleName,
                RoleCode = role.RoleCode,
                Description = role.Description,
                IsSystemRole = role.IsSystemRole ?? false,
                CreatedAt = role.CreatedAt,
                UpdatedAt = role.UpdatedAt
            };
        }
    }
}
