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
    /// Provides administrative endpoints to manage Roles and Departments.
    /// Includes role CRUD operations, department CRUD operations, hierarchy queries,
    /// status management, HOD assignment/removal, search, and statistics endpoints.
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
        /// <summary>
        /// Creates a new role. (Admin only)
        /// </summary>
        /// <remarks>
        /// Accepts role details and persists a new role entry.
        /// Returns a success response with the created role details.
        /// </remarks>
        [HttpPost("role/create")]
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequestDto request)
        {
            _logger.LogInformation("Creating role: {RoleName}", request.RoleName);
            var result = await _roleService.CreateRoleAsync(request);
            return Ok(ApiResponseDto<RoleResponseDto>.SuccessResponse(result, MessageConstants.RoleCreatedSuccess)); 
        }
        /// <summary>
        /// Updates an existing role. (Admin only)
        /// </summary>
        /// <remarks>
        /// Accepts role ID and updated values, then updates the role in the system.
        /// Returns a success response with the updated role details.
        /// </remarks>
        [HttpPut("role/update")]
        public async Task<IActionResult> UpdateRole([FromBody] UpdateRoleRequestDto request)
        {
            _logger.LogInformation("Updating role: {RoleId}", request.RoleId);
            var result = await _roleService.UpdateRoleAsync(request);
            return Ok(ApiResponseDto<RoleResponseDto>.SuccessResponse(result, MessageConstants.RoleUpdatedSuccess)); 
        }
        /// <summary>
        /// Retrieves a role by its unique identifier. (Admin only)
        /// </summary>
        /// <param name="Id">Role identifier</param>
        [HttpGet("role/{Id}")]
        public async Task<IActionResult> GetRoleById(int Id)
        {
            _logger.LogInformation("Retrieving role: {RoleId}", Id);
            var result = await _roleService.GetRoleByIdAsync(Id);
            return Ok(ApiResponseDto<RoleResponseDto>.SuccessResponse(result, "Role retrieved successfully"));
        }
        /// <summary>
        /// Retrieves all roles available in the system. (Admin only)
        /// </summary>
        [HttpGet("role/all")]
        public async Task<IActionResult> GetAllRoles()
        {
            _logger.LogInformation("Retrieving all roles");
            var result = await _roleService.GetAllRolesAsync();
            return Ok(ApiResponseDto<List<RoleResponseDto>>.SuccessResponse(result, "Roles retrieved successfully"));
        }
        /// <summary>
        /// Deletes a role by its unique identifier. (Admin only)
        /// </summary>
        /// <param name="id">Role identifier</param>
        [HttpDelete("role/{id}")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            _logger.LogInformation("Deleting role: {RoleId}", id);
            await _roleService.DeleteRoleAsync(id);
            return Ok(ApiResponseDto<string>.SuccessResponse("Role deleted successfully", "Role deleted successfully"));
        }
        #endregion
        #region Department Management
        /// <summary>
        /// Creates a new department.
        /// </summary>
        /// <remarks>
        /// NOTE: This endpoint is marked as AllowAnonymous and does not require authentication.
        /// Creates a department entry and returns the created department data.
        /// </remarks>
        [HttpPost("department/create")]
        [AllowAnonymous]
        public async Task<IActionResult> CreateDepartment([FromBody] CreateDepartmentRequestDto request)
        {
            _logger.LogInformation("Creating department: {DepartmentName}", request.DepartmentName);
            var result = await _departmentService.CreateDepartmentAsync(request);
            return Ok(ApiResponseDto<DepartmentResponseDto>.SuccessResponse(result, MessageConstants.DepartmentCreatedSuccess)); 
        }
        /// <summary>
        /// Updates an existing department.
        /// </summary>
        /// <remarks>
        /// NOTE: This endpoint is marked as AllowAnonymous and does not require authentication.
        /// Accepts department ID and updated values, then updates the department record.
        /// </remarks>
        [HttpPut("department/update")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateDepartment([FromBody] UpdateDepartmentRequestDto request)
        {
            _logger.LogInformation("Updating department: {DepartmentId}", request.DepartmentId);
            var result = await _departmentService.UpdateDepartmentAsync(request);
            return Ok(ApiResponseDto<DepartmentResponseDto>.SuccessResponse(result, MessageConstants.DepartmentUpdatedSuccess)); 
        }
        /// <summary>
        /// Retrieves a department by its unique identifier.
        /// </summary>
        /// <remarks>
        /// NOTE: This endpoint is marked as AllowAnonymous and does not require authentication.
        /// </remarks>
        /// <param name="Id">Department identifier</param>
        [HttpGet("department/{Id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDepartmentById(int Id)
        {
            _logger.LogInformation("Retrieving department: {DepartmentId}", Id);
            var result = await _departmentService.GetDepartmentByIdAsync(Id);
            return Ok(ApiResponseDto<DepartmentResponseDto>.SuccessResponse(result, DepartmentMessages.DepartmentRetrievedSuccess));
        }
        /// <summary>
        /// Retrieves all departments.
        /// </summary>
        /// <remarks>
        /// NOTE: This endpoint is marked as AllowAnonymous and does not require authentication.
        /// </remarks>
        [HttpGet("department/all")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllDepartments()
        {
            _logger.LogInformation("Retrieving all departments");
            var result = await _departmentService.GetAllDepartmentsAsync();
            return Ok(ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(result, DepartmentMessages.DepartmentsRetrievedSuccess));
        }
        /// <summary>
        /// Deletes a department by its unique identifier.
        /// </summary>
        /// <remarks>
        /// NOTE: This endpoint is marked as AllowAnonymous and does not require authentication.
        /// </remarks>
        /// <param name="id">Department identifier</param>
        [HttpDelete("department/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> DeleteDepartment(int id)
        {
            _logger.LogInformation("Deleting department: {DepartmentId}", id);
            await _departmentService.DeleteDepartmentAsync(id);
            return Ok(ApiResponseDto<string>.SuccessResponse(DepartmentMessages.DepartmentDeletedSuccess, DepartmentMessages.DepartmentDeletedSuccess));
        }
        #endregion
        #region Department Hierarchy
        /// <summary>
        /// Retrieves the department hierarchy tree, optionally from a specified root department.
        /// </summary>
        /// <remarks>
        /// NOTE: This endpoint is marked as AllowAnonymous and does not require authentication.
        /// If <paramref name="rootDepartmentId"/> is null, the hierarchy tree is returned from all roots.
        /// </remarks>
        /// <param name="rootDepartmentId">Optional root department identifier</param>
        [HttpGet("department/hierarchy/tree")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDepartmentHierarchyTree([FromQuery] int? rootDepartmentId = null)
        {
            _logger.LogInformation("Retrieving department hierarchy. RootDepartmentId: {RootDepartmentId}", rootDepartmentId);
            var result = await _departmentService.GetDepartmentHierarchyTreeAsync(rootDepartmentId);
            return Ok(ApiResponseDto<DepartmentHierarchyResponseDto>.SuccessResponse(result, DepartmentMessages.DepartmentHierarchyRetrievedSuccess));
        }
        /// <summary>
        /// Retrieves all child departments for the specified parent department.
        /// </summary>
        /// <remarks>
        /// NOTE: This endpoint is marked as AllowAnonymous and does not require authentication.
        /// </remarks>
        /// <param name="id">Parent department identifier</param>
        [HttpGet("department/{id}/children")]
        [AllowAnonymous]
        public async Task<IActionResult> GetChildDepartments(int id)
        {
            _logger.LogInformation("Retrieving child departments for parent: {ParentDepartmentId}", id);
            var result = await _departmentService.GetChildDepartmentsAsync(id);
            return Ok(ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(result, DepartmentMessages.ChildDepartmentsRetrievedSuccess));
        }
        /// <summary>
        /// Retrieves root-level departments (departments without a parent).
        /// </summary>
        /// <remarks>
        /// NOTE: This endpoint is marked as AllowAnonymous and does not require authentication.
        /// </remarks>
        [HttpGet("department/hierarchy/roots")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRootDepartments()
        {
            _logger.LogInformation("Retrieving root departments");
            var result = await _departmentService.GetRootDepartmentsAsync();
            return Ok(ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(result, DepartmentMessages.RootDepartmentsRetrievedSuccess));
        }
        /// <summary>
        /// Retrieves the full department path from the root to the specified department.
        /// </summary>
        /// <remarks>
        /// NOTE: This endpoint is marked as AllowAnonymous and does not require authentication.
        /// </remarks>
        /// <param name="id">Department identifier</param>
        [HttpGet("department/{id}/path")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDepartmentPath(int id)
        {
            _logger.LogInformation("Retrieving department path for: {DepartmentId}", id);
            var result = await _departmentService.GetDepartmentPathAsync(id);
            return Ok(ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(result, DepartmentMessages.DepartmentPathRetrievedSuccess));
        }
        #endregion
        #region Department Status
        /// <summary>
        /// Retrieves all active departments.
        /// </summary>
        /// <remarks>
        /// NOTE: This endpoint is marked as AllowAnonymous and does not require authentication.
        /// </remarks>
        [HttpGet("department/status/active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveDepartments()
        {
            _logger.LogInformation("Retrieving active departments");
            var result = await _departmentService.GetActiveDepartmentsAsync();
            return Ok(ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(result, DepartmentMessages.ActiveDepartmentsRetrievedSuccess));
        }
        /// <summary>
        /// Retrieves all inactive departments.
        /// </summary>
        /// <remarks>
        /// NOTE: This endpoint is marked as AllowAnonymous and does not require authentication.
        /// </remarks>
        [HttpGet("department/status/inactive")]
        [AllowAnonymous]
        public async Task<IActionResult> GetInactiveDepartments()
        {
            _logger.LogInformation("Retrieving inactive departments");
            var result = await _departmentService.GetInactiveDepartmentsAsync();
            return Ok(ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(result, DepartmentMessages.InactiveDepartmentsRetrievedSuccess));
        }
        /// <summary>
        /// Updates the active/inactive status of a department.
        /// </summary>
        /// <remarks>
        /// NOTE: This endpoint is marked as AllowAnonymous and does not require authentication.
        /// The status value is taken from the request payload.
        /// </remarks>
        /// <param name="id">Department identifier</param>
        [HttpPatch("department/{id}/status")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateDepartmentStatus(int id, [FromBody] UpdateStatusRequestDto request)
        {
            _logger.LogInformation("Updating department status: {DepartmentId} to {Status}", id, request.Status);
            await _departmentService.UpdateDepartmentStatusAsync(id, request.Status);
            return Ok(ApiResponseDto<string>.SuccessResponse("Status updated successfully", string.Format(DepartmentMessages.StatusUpdatedSuccess, request.Status)));
        }
        #endregion
        #region HOD Operations
        /// <summary>
        /// Retrieves departments assigned to the given Head of Department (HOD).
        /// </summary>
        /// <remarks>
        /// NOTE: This endpoint is marked as AllowAnonymous and does not require authentication.
        /// </remarks>
        /// <param name="hodEmployeeId">HOD employee identifier</param>
        [HttpGet("department/hod/{hodEmployeeId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDepartmentsByHod(int hodEmployeeId)
        {
            _logger.LogInformation("Retrieving departments for HOD: {HodEmployeeId}", hodEmployeeId);
            var result = await _departmentService.GetDepartmentsByHodAsync(hodEmployeeId);
            return Ok(ApiResponseDto<List<DepartmentResponseDto>>.SuccessResponse(result, DepartmentMessages.HodDepartmentsRetrievedSuccess));
        }
        /// <summary>
        /// Assigns a Head of Department (HOD) to a department.
        /// </summary>
        /// <remarks>
        /// NOTE: This endpoint is marked as AllowAnonymous and does not require authentication.
        /// Assigns the provided employee as the HOD for the given department.
        /// </remarks>
        /// <param name="id">Department identifier</param>
        [HttpPost("department/{id}/hod/assign")]
        [AllowAnonymous]
        public async Task<IActionResult> AssignHod(int id, [FromBody] AssignHodRequestDto request)
        {
            _logger.LogInformation("Assigning HOD: {HodEmployeeId} to department: {DepartmentId}", request.HodEmployeeId, id);
            await _departmentService.AssignHodAsync(id, request.HodEmployeeId);
            return Ok(ApiResponseDto<string>.SuccessResponse(DepartmentMessages.HodAssignedSuccess, DepartmentMessages.HodAssignedSuccess));
        }
        /// <summary>
        /// Removes the Head of Department (HOD) assignment from a department.
        /// </summary>
        /// <remarks>
        /// NOTE: This endpoint is marked as AllowAnonymous and does not require authentication.
        /// </remarks>
        /// <param name="id">Department identifier</param>
        [HttpDelete("department/{id}/hod/remove")]
        [AllowAnonymous]
        public async Task<IActionResult> RemoveHod(int id)
        {
            _logger.LogInformation("Removing HOD from department: {DepartmentId}", id);
            await _departmentService.RemoveHodAsync(id);
            return Ok(ApiResponseDto<string>.SuccessResponse(DepartmentMessages.HodRemovedSuccess, DepartmentMessages.HodRemovedSuccess));
        }
        #endregion
        #region Search and Statistics
        /// <summary>
        /// Searches departments by a given search term (name/code matching based on service implementation).
        /// </summary>
        /// <remarks>
        /// NOTE: This endpoint is marked as AllowAnonymous and does not require authentication.
        /// Returns 400 if the search term is empty.
        /// </remarks>
        /// <param name="searchTerm">Text to search for</param>
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
        /// <summary>
        /// Retrieves a department by its unique department code.
        /// </summary>
        /// <remarks>
        /// NOTE: This endpoint is marked as AllowAnonymous and does not require authentication.
        /// </remarks>
        /// <param name="departmentCode">Department code</param>
        [HttpGet("department/code/{departmentCode}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDepartmentByCode(string departmentCode)
        {
            _logger.LogInformation("Retrieving department by code: {DepartmentCode}", departmentCode);
            var result = await _departmentService.GetDepartmentByCodeAsync(departmentCode);
            return Ok(ApiResponseDto<DepartmentResponseDto>.SuccessResponse(result, DepartmentMessages.DepartmentRetrievedSuccess));
        }
        /// <summary>
        /// Retrieves the total number of departments in the system.
        /// </summary>
        /// <remarks>
        /// NOTE: This endpoint is marked as AllowAnonymous and does not require authentication.
        /// </remarks>
        [HttpGet("department/statistics/total")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTotalDepartmentCount()
        {
            _logger.LogInformation("Retrieving total department count");
            var count = await _departmentService.GetTotalDepartmentCountAsync();
            return Ok(ApiResponseDto<int>.SuccessResponse(count, string.Format(DepartmentMessages.TotalDepartmentsCount, count)));
        }
        /// <summary>
        /// Retrieves the total number of active departments in the system.
        /// </summary>
        /// <remarks>
        /// NOTE: This endpoint is marked as AllowAnonymous and does not require authentication.
        /// </remarks>
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
