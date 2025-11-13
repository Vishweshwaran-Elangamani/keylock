using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;

namespace Relevantz.EEPZ.Core.Service
{
    public class RoleService : IRoleService
    {
        private readonly IRoleRepository _roleRepository;

        public RoleService(IRoleRepository roleRepository)
        {
            _roleRepository = roleRepository;
        }

        public async Task<ApiResponseDto<RoleResponseDto>> CreateRoleAsync(CreateRoleRequestDto request)
        {
            try
            {
                if (await _roleRepository.RoleNameExistsAsync(request.RoleName))
                {
                    return ApiResponseDto<RoleResponseDto>.FailureResponse("Role name already exists");
                }

                if (await _roleRepository.RoleCodeExistsAsync(request.RoleCode))
                {
                    return ApiResponseDto<RoleResponseDto>.FailureResponse("Role code already exists");
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

                return ApiResponseDto<RoleResponseDto>.SuccessResponse(response, Constants.Messages.RoleCreatedSuccess);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error creating role: {request.RoleName}", ex);
                return ApiResponseDto<RoleResponseDto>.FailureResponse("An error occurred while creating role");
            }
        }

        public async Task<ApiResponseDto<RoleResponseDto>> UpdateRoleAsync(UpdateRoleRequestDto request)
        {
            try
            {
                var role = await _roleRepository.GetByIdAsync(request.RoleId);
                if (role == null)
                {
                    return ApiResponseDto<RoleResponseDto>.FailureResponse(Constants.Messages.RoleNotFound);
                }

                if (role.IsSystemRole == true)
                {
                    return ApiResponseDto<RoleResponseDto>.FailureResponse("Cannot update system role");
                }

                if (request.RoleName != null) role.RoleName = request.RoleName;
                if (request.RoleCode != null) role.RoleCode = request.RoleCode;
                if (request.Description != null) role.Description = request.Description;

                await _roleRepository.UpdateAsync(role);

                var response = MapToRoleResponse(role);
                EEPZBusinessLog.Information($"Role updated: RoleId {request.RoleId}");

                return ApiResponseDto<RoleResponseDto>.SuccessResponse(response, Constants.Messages.RoleUpdatedSuccess);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error updating role: RoleId {request.RoleId}", ex);
                return ApiResponseDto<RoleResponseDto>.FailureResponse("An error occurred while updating role");
            }
        }

        public async Task<ApiResponseDto<RoleResponseDto>> GetRoleByIdAsync(int roleId)
        {
            try
            {
                var role = await _roleRepository.GetByIdAsync(roleId);
                if (role == null)
                {
                    return ApiResponseDto<RoleResponseDto>.FailureResponse(Constants.Messages.RoleNotFound);
                }

                var response = MapToRoleResponse(role);
                return ApiResponseDto<RoleResponseDto>.SuccessResponse(response, "Role retrieved successfully");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error retrieving role: RoleId {roleId}", ex);
                return ApiResponseDto<RoleResponseDto>.FailureResponse("An error occurred while retrieving role");
            }
        }

        public async Task<ApiResponseDto<List<RoleResponseDto>>> GetAllRolesAsync()
        {
            try
            {
                var roles = await _roleRepository.GetAllAsync();
                var responses = roles.Select(MapToRoleResponse).ToList();
                return ApiResponseDto<List<RoleResponseDto>>.SuccessResponse(responses, "Roles retrieved successfully");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error("Error retrieving all roles", ex);
                return ApiResponseDto<List<RoleResponseDto>>.FailureResponse("An error occurred while retrieving roles");
            }
        }

        public async Task<ApiResponseDto<string>> DeleteRoleAsync(int roleId)
        {
            try
            {
                var role = await _roleRepository.GetByIdAsync(roleId);
                if (role == null)
                {
                    return ApiResponseDto<string>.FailureResponse(Constants.Messages.RoleNotFound);
                }

                if (role.IsSystemRole == true)
                {
                    return ApiResponseDto<string>.FailureResponse("Cannot delete system role");
                }

                await _roleRepository.DeleteAsync(roleId);
                EEPZBusinessLog.Information($"Role deleted: RoleId {roleId}");

                return ApiResponseDto<string>.SuccessResponse("Role deleted successfully", "Role deleted successfully");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error deleting role: RoleId {roleId}", ex);
                return ApiResponseDto<string>.FailureResponse("An error occurred while deleting role");
            }
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
