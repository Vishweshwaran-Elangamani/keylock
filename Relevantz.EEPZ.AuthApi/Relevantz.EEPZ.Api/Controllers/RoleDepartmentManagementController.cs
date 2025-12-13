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

        // ==================== ROLE ENDPOINTS ====================

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

        // ==================== DEPARTMENT ENDPOINTS ====================

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
    }
}
