using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class RoleDepartmentManagementController : ControllerBase
    {
        private readonly IRoleService _roleService;
        private readonly IDepartmentService _departmentService;

        public RoleDepartmentManagementController(IRoleService roleService, IDepartmentService departmentService)
        {
            _roleService = roleService;
            _departmentService = departmentService;
        }

        [HttpPost("role/create")]
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequestDto request)
        {
            var result = await _roleService.CreateRoleAsync(request);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPut("role/update")]
        public async Task<IActionResult> UpdateRole([FromBody] UpdateRoleRequestDto request)
        {
            var result = await _roleService.UpdateRoleAsync(request);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpGet("role/{roleId}")]
        public async Task<IActionResult> GetRoleById(int roleId)
        {
            var result = await _roleService.GetRoleByIdAsync(roleId);

            if (!result.Success)
                return NotFound(result);

            return Ok(result);
        }

        [HttpGet("role/all")]
        public async Task<IActionResult> GetAllRoles()
        {
            var result = await _roleService.GetAllRolesAsync();
            return Ok(result);
        }

        [HttpDelete("role/{roleId}")]
        public async Task<IActionResult> DeleteRole(int roleId)
        {
            var result = await _roleService.DeleteRoleAsync(roleId);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPost("department/create")]
        [AllowAnonymous]
        public async Task<IActionResult> CreateDepartment([FromBody] CreateDepartmentRequestDto request)
        {
            var result = await _departmentService.CreateDepartmentAsync(request);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPut("department/update")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateDepartment([FromBody] UpdateDepartmentRequestDto request)
        {
            var result = await _departmentService.UpdateDepartmentAsync(request);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpGet("department/{departmentId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDepartmentById(int departmentId)
        {
            var result = await _departmentService.GetDepartmentByIdAsync(departmentId);

            if (!result.Success)
                return NotFound(result);

            return Ok(result);
        }

        [HttpGet("department/all")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllDepartments()
        {
            var result = await _departmentService.GetAllDepartmentsAsync();
            return Ok(result);
        }

        [HttpDelete("department/{departmentId}")]
        [AllowAnonymous]
        public async Task<IActionResult> DeleteDepartment(int departmentId)
        {
            var result = await _departmentService.DeleteDepartmentAsync(departmentId);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        // ==================== NEW DEPARTMENT HIERARCHY ENDPOINTS ====================

        [HttpGet("department/hierarchy/tree")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDepartmentHierarchyTree([FromQuery] int? rootDepartmentId = null)
        {
            var result = await _departmentService.GetDepartmentHierarchyTreeAsync(rootDepartmentId);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpGet("department/{departmentId}/children")]
        [AllowAnonymous]
        public async Task<IActionResult> GetChildDepartments(int departmentId)
        {
            var result = await _departmentService.GetChildDepartmentsAsync(departmentId);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpGet("department/hierarchy/roots")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRootDepartments()
        {
            var result = await _departmentService.GetRootDepartmentsAsync();
            return Ok(result);
        }

        [HttpGet("department/{departmentId}/path")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDepartmentPath(int departmentId)
        {
            var result = await _departmentService.GetDepartmentPathAsync(departmentId);

            if (!result.Success)
                return NotFound(result);

            return Ok(result);
        }

        // ==================== DEPARTMENT STATUS ENDPOINTS ====================

        [HttpGet("department/status/active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveDepartments()
        {
            var result = await _departmentService.GetActiveDepartmentsAsync();
            return Ok(result);
        }

        [HttpGet("department/status/inactive")]
        [AllowAnonymous]
        public async Task<IActionResult> GetInactiveDepartments()
        {
            var result = await _departmentService.GetInactiveDepartmentsAsync();
            return Ok(result);
        }

        [HttpPatch("department/{departmentId}/status")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateDepartmentStatus(int departmentId, [FromBody] UpdateStatusRequestDto request)
        {
            var result = await _departmentService.UpdateDepartmentStatusAsync(departmentId, request.Status);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        // ==================== DEPARTMENT HOD ENDPOINTS ====================

        [HttpGet("department/hod/{hodEmployeeId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDepartmentsByHod(int hodEmployeeId)
        {
            var result = await _departmentService.GetDepartmentsByHodAsync(hodEmployeeId);
            return Ok(result);
        }

        [HttpPost("department/{departmentId}/hod/assign")]
        [AllowAnonymous]
        public async Task<IActionResult> AssignHod(int departmentId, [FromBody] AssignHodRequestDto request)
        {
            var result = await _departmentService.AssignHodAsync(departmentId, request.HodEmployeeId);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpDelete("department/{departmentId}/hod/remove")]
        [AllowAnonymous]
        public async Task<IActionResult> RemoveHod(int departmentId)
        {
            var result = await _departmentService.RemoveHodAsync(departmentId);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        // ==================== DEPARTMENT SEARCH & FILTER ENDPOINTS ====================

        [HttpGet("department/search")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchDepartments([FromQuery] string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return BadRequest(new { Success = false, Message = "Search term is required" });

            var result = await _departmentService.SearchDepartmentsAsync(searchTerm);
            return Ok(result);
        }

        [HttpGet("department/code/{departmentCode}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDepartmentByCode(string departmentCode)
        {
            var result = await _departmentService.GetDepartmentByCodeAsync(departmentCode);

            if (!result.Success)
                return NotFound(result);

            return Ok(result);
        }

        // ==================== DEPARTMENT STATISTICS ENDPOINTS ====================

        [HttpGet("department/statistics/total")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTotalDepartmentCount()
        {
            var result = await _departmentService.GetTotalDepartmentCountAsync();
            return Ok(result);
        }

        [HttpGet("department/statistics/active-count")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveDepartmentCount()
        {
            var result = await _departmentService.GetActiveDepartmentCountAsync();
            return Ok(result);
        }
    }
}
