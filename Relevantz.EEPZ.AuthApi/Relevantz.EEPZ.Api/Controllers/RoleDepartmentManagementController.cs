using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Api.Controllers
{
    /// <summary>
    /// Admin endpoints to manage Roles and Departments
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class RoleDepartmentManagementController : ControllerBase
    {
        private readonly IRoleService _roleService;
        private readonly IDepartmentService _departmentService;
        private readonly ILogger<RoleDepartmentManagementController> _logger;

        public RoleDepartmentManagementController(
            IRoleService roleService, 
            IDepartmentService departmentService,
            ILogger<RoleDepartmentManagementController> logger)
        {
            _roleService = roleService;
            _departmentService = departmentService;
            _logger = logger;
        }

        #region Role Management

        [HttpPost("role/create")]
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequestDto request)
        {
            _logger.LogInformation("Creating role: {RoleName}", request.RoleName);
            var result = await _roleService.CreateRoleAsync(request);
            return Ok(ApiResponseDto<RoleResponseDto>.SuccessResponse(result, MessageConstants.RoleCreatedSuccess)); // ✅ CHANGED
        }

        [HttpPut("role/update")]
        public async Task<IActionResult> UpdateRole([FromBody] UpdateRoleRequestDto request)
        {
            _logger.LogInformation("Updating role: {RoleId}", request.RoleId);
            var result = await _roleService.UpdateRoleAsync(request);
            return Ok(ApiResponseDto<RoleResponseDto>.SuccessResponse(result, MessageConstants.RoleUpdatedSuccess)); // ✅ CHANGED
        }

        [HttpGet("role/{Id}")]
        public async Task<IActionResult> GetRoleById(int Id)
        {
            _logger.LogInformation("Retrieving role: {RoleId}", Id);
            var result = await _roleService.GetRoleByIdAsync(Id);
            return Ok(ApiResponseDto<RoleResponseDto>.SuccessResponse(result, "Role retrieved successfully"));
        }

        [HttpGet("role/all")]
        public async Task<IActionResult> GetAllRoles()
        {
            _logger.LogInformation("Retrieving all roles");
            var result = await _roleService.GetAllRolesAsync();
            return Ok(ApiResponseDto<List<RoleResponseDto>>.SuccessResponse(result, "Roles retrieved successfully"));
        }

        [HttpDelete("role/{roleId}")]
        public async Task<IActionResult> DeleteRole(int roleId)
        {
            _logger.LogInformation("Deleting role: {RoleId}", roleId);
            await _roleService.DeleteRoleAsync(roleId);
            return Ok(ApiResponseDto<string>.SuccessResponse("Role deleted successfully", "Role deleted successfully"));
        }

        #endregion

        #region Department Management

        [HttpPost("department/create")]
        [AllowAnonymous]
        public async Task<IActionResult> CreateDepartment([FromBody] CreateDepartmentRequestDto request)
        {
            _logger.LogInformation("Creating department: {DepartmentName}", request.DepartmentName);
            var result = await _departmentService.CreateDepartmentAsync(request);
            return Ok(ApiResponseDto<DepartmentResponseDto>.SuccessResponse(result, MessageConstants.DepartmentCreatedSuccess)); // ✅ CHANGED
        }

        [HttpPut("department/update")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateDepartment([FromBody] UpdateDepartmentRequestDto request)
        {
            _logger.LogInformation("Updating department: {DepartmentId}", request.DepartmentId);
            var result = await _departmentService.UpdateDepartmentAsync(request);
            return Ok(ApiResponseDto<DepartmentResponseDto>.SuccessResponse(result, MessageConstants.DepartmentUpdatedSuccess)); // ✅ CHANGED
        }

        [HttpGet("department/{Id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDepartmentById(int Id)
        {
            _logger.LogInformation("Retrieving department: {DepartmentId}", Id);
            var result = await _departmentService.GetDepartmentByIdAsync(Id);
            return Ok(ApiResponseDto<DepartmentResponseDto>.SuccessResponse(result, DepartmentMessages.DepartmentRetrievedSuccess));
        }

        [HttpGet("department/all")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllDepartments()
        {
            _logger.LogInformation("Retrieving all departments");
            var result = await _departmentService.GetAllDepartmentsAsync();
            return Ok(ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(result, DepartmentMessages.DepartmentsRetrievedSuccess));
        }

        [HttpDelete("department/{departmentId}")]
        [AllowAnonymous]
        public async Task<IActionResult> DeleteDepartment(int departmentId)
        {
            _logger.LogInformation("Deleting department: {DepartmentId}", departmentId);
            await _departmentService.DeleteDepartmentAsync(departmentId);
            return Ok(ApiResponseDto<string>.SuccessResponse(DepartmentMessages.DepartmentDeletedSuccess, DepartmentMessages.DepartmentDeletedSuccess));
        }

        #endregion

        #region Department Hierarchy

        [HttpGet("department/hierarchy/tree")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDepartmentHierarchyTree([FromQuery] int? rootDepartmentId = null)
        {
            _logger.LogInformation("Retrieving department hierarchy. RootDepartmentId: {RootDepartmentId}", rootDepartmentId);
            var result = await _departmentService.GetDepartmentHierarchyTreeAsync(rootDepartmentId);
            return Ok(ApiResponseDto<DepartmentHierarchyResponseDto>.SuccessResponse(result, DepartmentMessages.DepartmentHierarchyRetrievedSuccess));
        }

        [HttpGet("department/{departmentId}/children")]
        [AllowAnonymous]
        public async Task<IActionResult> GetChildDepartments(int departmentId)
        {
            _logger.LogInformation("Retrieving child departments for parent: {ParentDepartmentId}", departmentId);
            var result = await _departmentService.GetChildDepartmentsAsync(departmentId);
            return Ok(ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(result, DepartmentMessages.ChildDepartmentsRetrievedSuccess));
        }

        [HttpGet("department/hierarchy/roots")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRootDepartments()
        {
            _logger.LogInformation("Retrieving root departments");
            var result = await _departmentService.GetRootDepartmentsAsync();
            return Ok(ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(result, DepartmentMessages.RootDepartmentsRetrievedSuccess));
        }

        [HttpGet("department/{departmentId}/path")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDepartmentPath(int departmentId)
        {
            _logger.LogInformation("Retrieving department path for: {DepartmentId}", departmentId);
            var result = await _departmentService.GetDepartmentPathAsync(departmentId);
            return Ok(ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(result, DepartmentMessages.DepartmentPathRetrievedSuccess));
        }

        #endregion

        #region Department Status

        [HttpGet("department/status/active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveDepartments()
        {
            _logger.LogInformation("Retrieving active departments");
            var result = await _departmentService.GetActiveDepartmentsAsync();
            return Ok(ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(result, DepartmentMessages.ActiveDepartmentsRetrievedSuccess));
        }

        [HttpGet("department/status/inactive")]
        [AllowAnonymous]
        public async Task<IActionResult> GetInactiveDepartments()
        {
            _logger.LogInformation("Retrieving inactive departments");
            var result = await _departmentService.GetInactiveDepartmentsAsync();
            return Ok(ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(result, DepartmentMessages.InactiveDepartmentsRetrievedSuccess));
        }

        [HttpPatch("department/{departmentId}/status")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateDepartmentStatus(int departmentId, [FromBody] UpdateStatusRequestDto request)
        {
            _logger.LogInformation("Updating department status: {DepartmentId} to {Status}", departmentId, request.Status);
            await _departmentService.UpdateDepartmentStatusAsync(departmentId, request.Status);
            return Ok(ApiResponseDto<string>.SuccessResponse("Status updated successfully", string.Format(DepartmentMessages.StatusUpdatedSuccess, request.Status)));
        }

        #endregion

        #region HOD Operations

        [HttpGet("department/hod/{hodEmployeeId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDepartmentsByHod(int hodEmployeeId)
        {
            _logger.LogInformation("Retrieving departments for HOD: {HodEmployeeId}", hodEmployeeId);
            var result = await _departmentService.GetDepartmentsByHodAsync(hodEmployeeId);
            return Ok(ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(result, DepartmentMessages.HodDepartmentsRetrievedSuccess));
        }

        [HttpPost("department/{departmentId}/hod/assign")]
        [AllowAnonymous]
        public async Task<IActionResult> AssignHod(int departmentId, [FromBody] AssignHodRequestDto request)
        {
            _logger.LogInformation("Assigning HOD: {HodEmployeeId} to department: {DepartmentId}", request.HodEmployeeId, departmentId);
            await _departmentService.AssignHodAsync(departmentId, request.HodEmployeeId);
            return Ok(ApiResponseDto<string>.SuccessResponse(DepartmentMessages.HodAssignedSuccess, DepartmentMessages.HodAssignedSuccess));
        }

        [HttpDelete("department/{departmentId}/hod/remove")]
        [AllowAnonymous]
        public async Task<IActionResult> RemoveHod(int departmentId)
        {
            _logger.LogInformation("Removing HOD from department: {DepartmentId}", departmentId);
            await _departmentService.RemoveHodAsync(departmentId);
            return Ok(ApiResponseDto<string>.SuccessResponse(DepartmentMessages.HodRemovedSuccess, DepartmentMessages.HodRemovedSuccess));
        }

        #endregion

        #region Search and Statistics

        [HttpGet("department/search")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchDepartments([FromQuery] string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return BadRequest(ApiResponseDto<List<DepartmentResponseDto>>.FailureResponse("Search term is required"));

            _logger.LogInformation("Searching departments with term: {SearchTerm}", searchTerm);
            var result = await _departmentService.SearchDepartmentsAsync(searchTerm);
            return Ok(ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(result, string.Format(DepartmentMessages.DepartmentsFoundBySearch, result.Count, searchTerm)));
        }

        [HttpGet("department/code/{departmentCode}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDepartmentByCode(string departmentCode)
        {
            _logger.LogInformation("Retrieving department by code: {DepartmentCode}", departmentCode);
            var result = await _departmentService.GetDepartmentByCodeAsync(departmentCode);
            return Ok(ApiResponseDto<DepartmentResponseDto>.SuccessResponse(result, DepartmentMessages.DepartmentRetrievedSuccess));
        }

        [HttpGet("department/statistics/total")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTotalDepartmentCount()
        {
            _logger.LogInformation("Retrieving total department count");
            var count = await _departmentService.GetTotalDepartmentCountAsync();
            return Ok(ApiResponseDto<int>.SuccessResponse(count, string.Format(DepartmentMessages.TotalDepartmentsCount, count)));
        }

        [HttpGet("department/statistics/active-count")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveDepartmentCount()
        {
            _logger.LogInformation("Retrieving active department count");
            var count = await _departmentService.GetActiveDepartmentCountAsync();
            return Ok(ApiResponseDto<int>.SuccessResponse(count, string.Format(DepartmentMessages.ActiveDepartmentsCount, count)));
        }

        #endregion
    }
}
