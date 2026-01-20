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
    /// Admin endpoints to manage Roles and Departments, including CRUD operations,
    /// hierarchy traversal, status updates, and HOD assignments.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class RoleDepartmentManagementController : ControllerBase
    {
        private readonly IRoleService _roleService;
        private readonly IDepartmentService _departmentService;
        /// <summary>
        /// Initializes a new instance of <see cref="RoleDepartmentManagementController"/>.
        /// </summary>
        /// <param name="roleService">Service for role management operations.</param>
        /// <param name="departmentService">Service for department management operations.</param>
        public RoleDepartmentManagementController(IRoleService roleService, IDepartmentService departmentService)
        {
            _roleService = roleService;
            _departmentService = departmentService;
        }
        /// <summary>
        /// Creates a new role.
        /// </summary>
        /// <param name="request">The role details to create.</param>
        /// <returns>
        /// 200 OK with creation result on success,  
        /// 400 Bad Request if the create operation fails.
        /// </returns>
        [HttpPost("role/create")]
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequestDto request)
        {
            var result = await _roleService.CreateRoleAsync(request);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        /// <summary>
        /// Updates an existing role.
        /// </summary>
        /// <param name="request">The role details to update.</param>
        /// <returns>
        /// 200 OK with update result on success,  
        /// 400 Bad Request if the update operation fails.
        /// </returns>
        [HttpPut("role/update")]
        public async Task<IActionResult> UpdateRole([FromBody] UpdateRoleRequestDto request)
        {
            var result = await _roleService.UpdateRoleAsync(request);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        /// <summary>
        /// Retrieves a role by its identifier.
        /// </summary>
        /// <param name="Id">The unique identifier of the role.</param>
        /// <returns>
        /// 200 OK with role data when found,  
        /// 404 Not Found if the role does not exist.
        /// </returns>
        [HttpGet("role/{Id}")]
        public async Task<IActionResult> GetRoleById(int Id)
        {
            var result = await _roleService.GetRoleByIdAsync(Id);
            if (!result.Success)
                return NotFound(result);
            return Ok(result);
        }
        /// <summary>
        /// Retrieves all roles.
        /// </summary>
        /// <returns>
        /// 200 OK with a collection of roles.
        /// </returns>
        [HttpGet("role/all")]
        public async Task<IActionResult> GetAllRoles()
        {
            var result = await _roleService.GetAllRolesAsync();
            return Ok(result);
        }
        /// <summary>
        /// Deletes a role by its identifier.
        /// </summary>
        /// <param name="roleId">The unique identifier of the role to delete.</param>
        /// <returns>
        /// 200 OK with deletion result on success,  
        /// 400 Bad Request if deletion fails.
        /// </returns>
        [HttpDelete("role/{roleId}")]
        public async Task<IActionResult> DeleteRole(int roleId)
        {
            var result = await _roleService.DeleteRoleAsync(roleId);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        /// <summary>
        /// Creates a new department.
        /// </summary>
        /// <param name="request">The department details to create.</param>
        /// <returns>
        /// 200 OK with creation result on success,  
        /// 400 Bad Request if creation fails.
        /// </returns>
        [HttpPost("department/create")]
        [AllowAnonymous]
        public async Task<IActionResult> CreateDepartment([FromBody] CreateDepartmentRequestDto request)
        {
            var result = await _departmentService.CreateDepartmentAsync(request);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        /// <summary>
        /// Updates an existing department.
        /// </summary>
        /// <param name="request">The department details to update.</param>
        /// <returns>
        /// 200 OK with update result on success,  
        /// 400 Bad Request if update fails.
        /// </returns>
        [HttpPut("department/update")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateDepartment([FromBody] UpdateDepartmentRequestDto request)
        {
            var result = await _departmentService.UpdateDepartmentAsync(request);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        /// <summary>
        /// Retrieves a department by its identifier.
        /// </summary>
        /// <param name="Id">The unique identifier of the department.</param>
        /// <returns>
        /// 200 OK with department data when found,  
        /// 404 Not Found if the department does not exist.
        /// </returns>
        [HttpGet("department/{Id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDepartmentById(int Id)
        {
            var result = await _departmentService.GetDepartmentByIdAsync(Id);
            if (!result.Success)
                return NotFound(result);
            return Ok(result);
        }
        /// <summary>
        /// Retrieves all departments.
        /// </summary>
        /// <returns>
        /// 200 OK with a collection of departments.
        /// </returns>
        [HttpGet("department/all")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllDepartments()
        {
            var result = await _departmentService.GetAllDepartmentsAsync();
            return Ok(result);
        }
        /// <summary>
        /// Deletes a department by its identifier.
        /// </summary>
        /// <param name="departmentId">The unique identifier of the department to delete.</param>
        /// <returns>
        /// 200 OK with deletion result on success,  
        /// 400 Bad Request if deletion fails.
        /// </returns>
        [HttpDelete("department/{departmentId}")]
        [AllowAnonymous]
        public async Task<IActionResult> DeleteDepartment(int departmentId)
        {
            var result = await _departmentService.DeleteDepartmentAsync(departmentId);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        /// <summary>
        /// Gets the department hierarchy as a tree starting from an optional root.
        /// </summary>
        /// <param name="rootDepartmentId">Optional root department ID to scope the tree.</param>
        /// <returns>
        /// 200 OK with a hierarchical tree structure,  
        /// 400 Bad Request if retrieval fails.
        /// </returns>
        [HttpGet("department/hierarchy/tree")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDepartmentHierarchyTree([FromQuery] int? rootDepartmentId = null)
        {
            var result = await _departmentService.GetDepartmentHierarchyTreeAsync(rootDepartmentId);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        /// <summary>
        /// Retrieves direct child departments of the specified department.
        /// </summary>
        /// <param name="departmentId">The parent department ID.</param>
        /// <returns>
        /// 200 OK with a list of child departments,  
        /// 400 Bad Request if retrieval fails.
        /// </returns>
        [HttpGet("department/{departmentId}/children")]
        [AllowAnonymous]
        public async Task<IActionResult> GetChildDepartments(int departmentId)
        {
            var result = await _departmentService.GetChildDepartmentsAsync(departmentId);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        /// <summary>
        /// Retrieves root (top-level) departments.
        /// </summary>
        /// <returns>
        /// 200 OK with a list of root departments.
        /// </returns>
        [HttpGet("department/hierarchy/roots")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRootDepartments()
        {
            var result = await _departmentService.GetRootDepartmentsAsync();
            return Ok(result);
        }
        /// <summary>
        /// Retrieves the full path (ancestry) from the root to the specified department.
        /// </summary>
        /// <param name="departmentId">The department ID to resolve path for.</param>
        /// <returns>
        /// 200 OK with the department path,  
        /// 404 Not Found if department/path cannot be resolved.
        /// </returns>
        [HttpGet("department/{departmentId}/path")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDepartmentPath(int departmentId)
        {
            var result = await _departmentService.GetDepartmentPathAsync(departmentId);
            if (!result.Success)
                return NotFound(result);
            return Ok(result);
        }
        /// <summary>
        /// Retrieves all active departments.
        /// </summary>
        /// <returns>
        /// 200 OK with a list of active departments.
        /// </returns>
        [HttpGet("department/status/active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveDepartments()
        {
            var result = await _departmentService.GetActiveDepartmentsAsync();
            return Ok(result);
        }
        /// <summary>
        /// Retrieves all inactive departments.
        /// </summary>
        /// <returns>
        /// 200 OK with a list of inactive departments.
        /// </returns>
        [HttpGet("department/status/inactive")]
        [AllowAnonymous]
        public async Task<IActionResult> GetInactiveDepartments()
        {
            var result = await _departmentService.GetInactiveDepartmentsAsync();
            return Ok(result);
        }
        /// <summary>
        /// Updates the active/inactive status of a department.
        /// </summary>
        /// <param name="departmentId">The department identifier to update.</param>
        /// <param name="request">Payload containing the desired status.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 400 Bad Request if update fails.
        /// </returns>
        [HttpPatch("department/{departmentId}/status")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateDepartmentStatus(int departmentId, [FromBody] UpdateStatusRequestDto request)
        {
            var result = await _departmentService.UpdateDepartmentStatusAsync(departmentId, request.Status);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        /// <summary>
        /// Retrieves departments managed by the specified Head of Department (HOD).
        /// </summary>
        /// <param name="hodEmployeeId">The employee ID of the HOD.</param>
        /// <returns>
        /// 200 OK with the list of departments assigned to the HOD.
        /// </returns>
        [HttpGet("department/hod/{hodEmployeeId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDepartmentsByHod(int hodEmployeeId)
        {
            var result = await _departmentService.GetDepartmentsByHodAsync(hodEmployeeId);
            return Ok(result);
        }
        /// <summary>
        /// Assigns a Head of Department (HOD) to a department.
        /// </summary>
        /// <param name="departmentId">The department identifier.</param>
        /// <param name="request">Payload containing the HOD employee identifier.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 400 Bad Request if assignment fails.
        /// </returns>
        [HttpPost("department/{departmentId}/hod/assign")]
        [AllowAnonymous]
        public async Task<IActionResult> AssignHod(int departmentId, [FromBody] AssignHodRequestDto request)
        {
            var result = await _departmentService.AssignHodAsync(departmentId, request.HodEmployeeId);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        /// <summary>
        /// Removes the Head of Department (HOD) assignment from a department.
        /// </summary>
        /// <param name="departmentId">The department identifier.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 400 Bad Request if removal fails.
        /// </returns>
        [HttpDelete("department/{departmentId}/hod/remove")]
        [AllowAnonymous]
        public async Task<IActionResult> RemoveHod(int departmentId)
        {
            var result = await _departmentService.RemoveHodAsync(departmentId);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        /// <summary>
        /// Searches departments by name or code.
        /// </summary>
        /// <param name="searchTerm">The query text to search for.</param>
        /// <returns>
        /// 200 OK with matching departments,  
        /// 400 Bad Request if the search term is empty.
        /// </returns>
        [HttpGet("department/search")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchDepartments([FromQuery] string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return BadRequest(new { Success = false, Message = "Search term is required" });
            var result = await _departmentService.SearchDepartmentsAsync(searchTerm);
            return Ok(result);
        }
        /// <summary>
        /// Retrieves a department by its unique code.
        /// </summary>
        /// <param name="departmentCode">The unique department code.</param>
        /// <returns>
        /// 200 OK when found,  
        /// 404 Not Found if no department matches the code.
        /// </returns>
        [HttpGet("department/code/{departmentCode}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDepartmentByCode(string departmentCode)
        {
            var result = await _departmentService.GetDepartmentByCodeAsync(departmentCode);
            if (!result.Success)
                return NotFound(result);
            return Ok(result);
        }
        /// <summary>
        /// Retrieves the total number of departments.
        /// </summary>
        /// <returns>
        /// 200 OK with the total department count.
        /// </returns>
        [HttpGet("department/statistics/total")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTotalDepartmentCount()
        {
            var result = await _departmentService.GetTotalDepartmentCountAsync();
            return Ok(result);
        }
        /// <summary>
        /// Retrieves the number of active departments.
        /// </summary>
        /// <returns>
        /// 200 OK with the active department count.
        /// </returns>
        [HttpGet("department/statistics/active-count")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveDepartmentCount()
        {
            var result = await _departmentService.GetActiveDepartmentCountAsync();
            return Ok(result);
        }
    }
}
