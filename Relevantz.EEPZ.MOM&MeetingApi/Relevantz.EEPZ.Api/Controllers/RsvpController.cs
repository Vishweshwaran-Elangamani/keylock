using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RsvpController : ControllerBase
    {
        private readonly IMomService _momService;

        public RsvpController(IMomService momService)
        {
            _momService = momService;
        }


        [HttpGet("my-invitations")]
        public async Task<ActionResult> GetMyMeetingInvitations()
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var result = await _momService.GetMyMeetingInvitationsAsync(employeeId);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }


        [HttpPost("submit")]
        public async Task<ActionResult<MeetingInvitationDto>> SubmitRsvp([FromBody] RsvpResponseDto rsvpDto)
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var result = await _momService.SubmitRsvpAsync(rsvpDto, employeeId);
                return Ok(new { 
                    success = true, 
                    message = "RSVP submitted successfully", 
                    data = result 
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{meetingId}/update")]
        public async Task<ActionResult<MeetingInvitationDto>> UpdateRsvp(
            int meetingId, 
            [FromBody] RsvpResponseDto rsvpDto)
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                rsvpDto.MeetingId = meetingId; 
                var result = await _momService.SubmitRsvpAsync(rsvpDto, employeeId);
                return Ok(new { 
                    success = true, 
                    message = "RSVP updated successfully", 
                    data = result 
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }


        [HttpGet("pending-count")]
        public async Task<ActionResult> GetPendingRsvpCount()
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var count = await _momService.GetPendingRsvpCountAsync(employeeId);
                return Ok(new { success = true, pendingCount = count });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("meeting/{meetingId}/summary")]
        [Authorize(Roles = "Manager")]
        public async Task<ActionResult<MeetingRsvpSummaryDto>> GetMeetingRsvpSummary(int meetingId)
        {
            try
            {
                var managerId = GetEmployeeIdFromClaims();
                var role = GetRoleFromClaims();
                var result = await _momService.GetMeetingRsvpSummaryAsync(meetingId, managerId, role);
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
