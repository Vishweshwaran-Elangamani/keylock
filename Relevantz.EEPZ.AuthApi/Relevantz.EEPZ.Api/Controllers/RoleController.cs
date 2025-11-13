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
    public class RoleController : ControllerBase
    {
        private readonly IRoleService _roleService;

        public RoleController(IRoleService roleService)
        {
            _roleService = roleService;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequestDto request)
        {
            var result = await _roleService.CreateRoleAsync(request);
            
            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPut("update")]
        public async Task<IActionResult> UpdateRole([FromBody] UpdateRoleRequestDto request)
        {
            var result = await _roleService.UpdateRoleAsync(request);
            
            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpGet("{roleId}")]
        public async Task<IActionResult> GetRoleById(int roleId)
        {
            var result = await _roleService.GetRoleByIdAsync(roleId);
            
            if (!result.Success)
                return NotFound(result);

            return Ok(result);
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllRoles()
        {
            var result = await _roleService.GetAllRolesAsync();
            return Ok(result);
        }

        [HttpDelete("{roleId}")]
        public async Task<IActionResult> DeleteRole(int roleId)
        {
            var result = await _roleService.DeleteRoleAsync(roleId);
            
            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }
    }
}
