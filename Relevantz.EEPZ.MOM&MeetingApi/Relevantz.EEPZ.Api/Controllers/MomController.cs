// Controllers/MomController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.Entities;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MomController : ControllerBase
    {
        private readonly IMomService _momService;

        public MomController(IMomService momService)
        {
            _momService = momService;
        }

        // ============================================================================
        // MOM OPERATIONS (US034, US076, US077)
        // ============================================================================

        /// <summary>
        /// US034, US076: Submit MOM instantly after meetings
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
        /// US077: Manager modifies submitted MOM
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
        /// US035, US077: View MOMs submitted by me
        /// </summary>
        [HttpGet("my-moms")]
        [Authorize(Roles ="Manager,Employee")]
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
        /// Get specific MOM by ID
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
        /// Delete MOM (only submitter can delete)
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

        // ============================================================================
        // SHARING OPERATIONS (US035)
        // ============================================================================

        /// <summary>
        /// US035: Share MOM with other employees
        /// </summary>
        [HttpPost("share")]
        public async Task<ActionResult<List<MomSharingResponseDto>>> ShareMom([FromBody] ShareMomDto shareMomDto)
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var result = await _momService.ShareMomAsync(shareMomDto, employeeId);
                return Ok(new { success = true, message = "MOM shared successfully", data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// US035: View MOMs shared by me
        /// </summary>
        [HttpGet("shared-by-me")]
        public async Task<ActionResult<List<MomSharingResponseDto>>> GetMomsSharedByMe()
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var result = await _momService.GetMomsSharedByEmployeeAsync(employeeId);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// US035: View MOMs shared with me
        /// </summary>
        [HttpGet("shared-with-me")]
        public async Task<ActionResult<List<MomResponseDto>>> GetMomsSharedWithMe()
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var result = await _momService.GetMomsSharedWithEmployeeAsync(employeeId);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // ============================================================================
        // HR OPERATIONS (US119) - NEW
        // ============================================================================

        /// <summary>
        /// US119: HR views all MOMs across organization (with filtering and pagination)
        /// </summary>
        [HttpGet("all-moms")]
        [Authorize(Roles = "HR")] // Optional: enforce HR role at controller level
        public async Task<ActionResult<PaginatedMomResponseDto>> GetAllMomsForHR(
            [FromQuery] string? searchTerm = null,
            [FromQuery] string? meetingType = null,
            [FromQuery] int? departmentId = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var role = GetRoleFromClaims();

                var result = await _momService.GetAllMomsForHRAsync(
                    employeeId,
                    role,
                    searchTerm,
                    meetingType,
                    departmentId,
                    startDate,
                    endDate,
                    pageNumber,
                    pageSize);

                return Ok(new { success = true, data = result });
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

        // ============================================================================
        // ACTION ITEM OPERATIONS
        // ============================================================================

        /// <summary>
        /// Update action item status (Pending/Completed)
        /// </summary>
        [HttpPatch("action-items/{actionItemId}/status")]
        public async Task<ActionResult> UpdateActionItemStatus(int actionItemId, [FromBody] string status)
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                
                var result = await _momService.UpdateActionItemStatusAsync(actionItemId, status, employeeId);
                
                if (!result)
                    return NotFound(new { success = false, message = "Action item not found" });

                return Ok(new { success = true, message = "Action item status updated successfully" });
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
        /// Get all action items assigned to me
        /// </summary>
        [HttpGet("action-items/my-tasks")]
        public async Task<ActionResult<List<ActionItemResponseDto>>> GetMyActionItems()
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var result = await _momService.GetMyActionItemsAsync(employeeId);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get all action items I assigned to others (Manager view)
        /// </summary>
        [HttpGet("action-items/assigned-by-me")]
        public async Task<ActionResult<List<ActionItemResponseDto>>> GetActionItemsAssignedByMe()
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var result = await _momService.GetActionItemsAssignedByMeAsync(employeeId);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get all overdue action items assigned to me
        /// </summary>
        [HttpGet("action-items/overdue")]
        public async Task<ActionResult<List<ActionItemResponseDto>>> GetOverdueActionItems()
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var result = await _momService.GetOverdueActionItemsAsync(employeeId);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // ============================================================================
        // HELPER METHODS
        // ============================================================================
        
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

        private string GetRoleFromClaims()
{
    // Try standard Microsoft role claim
    var roleClaim = User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role");
    
    if (roleClaim != null)
        return roleClaim.Value;
    
    // Try ClaimTypes.Role
    roleClaim = User.FindFirst(ClaimTypes.Role);
    
    if (roleClaim != null)
        return roleClaim.Value;
    
    // Try simple "role" claim (for your JWT structure)
    roleClaim = User.FindFirst("role");
    
    if (roleClaim != null)
        return roleClaim.Value;
    
    // Default fallback
    return "Employee";
}

    }
}
