using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.DBContexts;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MeetingController : ControllerBase
    {
        private readonly IMomService _momService;
        private readonly EEPZDbContext _context;

        public MeetingController(IMomService momService, EEPZDbContext context)
        {
            _momService = momService;
            _context = context;
        }

        [HttpPost("schedule")]
        [Authorize(Roles = "Manager")]
        public async Task<ActionResult<MeetingResponseDto>> ScheduleMeeting([FromBody] ScheduleMeetingDto scheduleMeetingDto)
        {
            try
            {
                var employeeId = GetEmployeeIdFromUserId(); // ✅ Updated logic
                var role = GetRoleFromClaims();

                var result = await _momService.ScheduleMeetingAsync(scheduleMeetingDto, employeeId, role);
                return Ok(new { success = true, message = "Meeting scheduled successfully", data = result });
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

        [HttpGet("my-meetings")]
        [Authorize(Roles ="Employee,Manager")]
        public async Task<ActionResult> GetMyMeetings()
        {
            try
            {
                var employeeId = GetEmployeeIdFromUserId();
                var result = await _momService.GetMeetingsByManagerIdAsync(employeeId);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{meetingId}")]
        public async Task<ActionResult<MeetingResponseDto>> GetMeetingById(int meetingId)
        {
            try
            {
                var result = await _momService.GetMeetingByIdAsync(meetingId);
                if (result == null)
                    return NotFound(new { success = false, message = "Meeting not found" });
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("one-on-one-reports")]
        [Authorize(Roles = "Manager")]
        public async Task<ActionResult<OneOnOneReportDto>> GetOneOnOneReports(
            [FromQuery] int? employeeId = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var managerId = GetEmployeeIdFromUserId();
                var role = GetRoleFromClaims();

                var result = await _momService.GetOneOnOneReportsAsync(managerId, role, employeeId, startDate, endDate);
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

        [HttpGet("one-on-one-summary")]
        [Authorize(Roles = "Manager")]
        public async Task<ActionResult<OneOnOneSummaryDto>> GetOneOnOneSummary()
        {
            try
            {
                var managerId = GetEmployeeIdFromUserId();
                var role = GetRoleFromClaims();

                var result = await _momService.GetOneOnOneSummaryAsync(managerId, role);
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

        // ✅ Updated method to map UserId → EmployeeId using Userauthentication table
        private int GetEmployeeIdFromUserId()
        {
            var subClaim = User.FindFirst("sub") ?? User.FindFirst(ClaimTypes.NameIdentifier);
            if (subClaim == null || !int.TryParse(subClaim.Value, out int userId))
                throw new UnauthorizedAccessException("User ID not found in token");

            var userAuth = _context.Userauthentications.FirstOrDefault(u => u.UserId == userId);
            if (userAuth == null)
                throw new UnauthorizedAccessException($"No user authentication record found for UserId {userId}");

            var employeeId = userAuth.EmployeeId;
            if (employeeId <= 0)
                throw new UnauthorizedAccessException($"EmployeeId not mapped for UserId {userId}");

            return employeeId;
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