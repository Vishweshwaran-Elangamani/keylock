using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserManagementController : ControllerBase
    {
        private readonly IUserManagementService _userManagementService;

        public UserManagementController(IUserManagementService userManagementService)
        {
            _userManagementService = userManagementService;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequestDto request)
        {
            var createdByUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var result = await _userManagementService.CreateUserAsync(request, createdByUserId);
            
            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPut("update")]
        public async Task<IActionResult> UpdateUser([FromBody] UpdateUserRequestDto request)
        {
            var updatedByUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var result = await _userManagementService.UpdateUserAsync(request, updatedByUserId);
            
            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserById(int userId)
        {
            var result = await _userManagementService.GetUserByIdAsync(userId);
            
            if (!result.Success)
                return NotFound(result);

            return Ok(result);
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllUsers()
        {
            var result = await _userManagementService.GetAllUsersAsync();
            return Ok(result);
        }

        [HttpPost("deactivate/{userId}")]
        public async Task<IActionResult> DeactivateUser(int userId)
        {
            var result = await _userManagementService.DeactivateUserAsync(userId);
            
            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPost("activate/{userId}")]
        public async Task<IActionResult> ActivateUser(int userId)
        {
            var result = await _userManagementService.ActivateUserAsync(userId);
            
            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }
        [HttpGet("manager/{managerId}/employees")]
[Authorize]
public async Task<IActionResult> GetEmployeesByManager(int managerId)
{
    try
    {
        // Verify the requesting user is the manager or has HR/Admin role
        var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

        // If user is not HR/Admin, ensure they can only see their own employees
        if (userRole != "HR" && userRole != "Admin" && currentUserId != managerId)
        {
            return Forbid("You can only view your own employees");
        }

        var result = await _userManagementService.GetEmployeesByManagerAsync(managerId);
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = ex.Message });
    }
}

        [HttpPost("assign-role-department")]
        public async Task<IActionResult> AssignRoleAndDepartment([FromBody] AssignRoleDepartmentRequestDto request)
        {
            var result = await _userManagementService.AssignRoleAndDepartmentAsync(request);
            
            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }
    }
}
