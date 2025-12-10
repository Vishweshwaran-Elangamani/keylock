using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public partial class MomController : ControllerBase
    {
        private readonly IMomService _momService;

        public MomController(IMomService momService)
        {
            _momService = momService;
        }

        // ========== CORE MOM OPERATIONS (5 endpoints) ==========

        /// <summary>
        /// Create a new MOM
        /// </summary>
        [HttpPost("create")]
        public async Task<ActionResult<MomResponseDto>> CreateMom([FromBody] CreateMomDto createMomDto)
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var role = GetRoleFromClaims();

                var result = await _momService.CreateMomAsync(createMomDto, employeeId, role);
                return Ok(new { success = true, message = "MOM created successfully", data = result });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Update an existing MOM
        /// </summary>
        [HttpPut("update")]
        public async Task<ActionResult<MomResponseDto>> UpdateMom([FromBody] UpdateMomDto updateMomDto)
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var role = GetRoleFromClaims();
                
                var result = await _momService.UpdateMomAsync(updateMomDto, employeeId, role);
                return Ok(new { success = true, message = "MOM updated successfully", data = result });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get MOMs submitted by the current user
        /// </summary>
        [HttpGet("my-moms")]
        [Authorize(Roles = "Manager,Employee")]
        public async Task<ActionResult<List<MomResponseDto>>> GetMyMoms()
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var result = await _momService.GetMomsSubmittedByEmployeeAsync(employeeId);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get a specific MOM by ID
        /// </summary>
        [HttpGet("{momId}")]
        public async Task<ActionResult<MomResponseDto>> GetMomById(int momId)
        {
            try
            {
                var result = await _momService.GetMomByIdAsync(momId);
                if (result == null)
                    return NotFound(new { success = false, message = "MOM not found" });

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Delete a MOM
        /// </summary>
        [HttpDelete("{momId}")]
        public async Task<ActionResult> DeleteMom(int momId)
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var role = GetRoleFromClaims();
                
                var result = await _momService.DeleteMomAsync(momId, employeeId, role);
                
                if (!result)
                    return NotFound(new { success = false, message = "MOM not found" });

                return Ok(new { success = true, message = "MOM deleted successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // ========== HELPER METHODS ==========

        /// <summary>
        /// Extract employee ID from JWT claims
        /// </summary>
        private int GetEmployeeIdFromClaims()
        {
            var employeeIdClaim = User.FindFirst("empId");
            
            if (employeeIdClaim != null && int.TryParse(employeeIdClaim.Value, out int employeeId))
            {
                return employeeId;
            }
            
            var subClaim = User.FindFirst("sub") ?? User.FindFirst(ClaimTypes.NameIdentifier);
            
            if (subClaim != null && int.TryParse(subClaim.Value, out int subId))
            {
                return subId;
            }
            
            throw new UnauthorizedAccessException("Employee ID not found in token");
        }

        /// <summary>
        /// Extract role from JWT claims
        /// </summary>
        private string GetRoleFromClaims()
        {
            var roleClaim = User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role");
            
            if (roleClaim != null)
                return roleClaim.Value;
         
            roleClaim = User.FindFirst(ClaimTypes.Role);
            
            if (roleClaim != null)
                return roleClaim.Value;
            
            roleClaim = User.FindFirst("role");
            
            if (roleClaim != null)
                return roleClaim.Value;
           
            return "Employee";
        }
    }
}
