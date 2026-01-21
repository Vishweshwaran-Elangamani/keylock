
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.ViewModels.Common;
using Relevantz.EEPZ.Common.ViewModels.Nomination.Request;
using Relevantz.EEPZ.Common.Validators;
using Relevantz.EEPZ.Core.IService;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NominationController : ControllerBase
    {
        private readonly INominationService _nominationService;

        public NominationController(INominationService nominationService)
        {
            _nominationService = nominationService;
        }

        /// <summary>
        /// Allows an employee to submit a self-nomination for an active opportunity.
        /// Validates eligibility and stores the nomination record.
        /// </summary>
        [HttpPost("self-nominate")]
        [Authorize(Roles = "Employee,Manager")]
        public async Task<IActionResult> SelfNominate([FromBody] CreateSelfNominationRequestDto request)
        {
            try
            {
                NominationValidator.ValidateSelfNomination(request);

                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                                  ?? User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || userId == 0)
                {
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                Console.WriteLine($"[Controller] Self-Nominate - UserId: {userId}, OpportunityId: {request.OpportunityId}");

                var result = await _nominationService.CreateSelfNominationAsync(userId, request);

                return CreatedAtAction(nameof(GetNominationById), new { id = result.NominationId }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        /// <summary>
        /// Allows managers to nominate employees on their team.
        /// Validates nominee information and saves the nomination.
        /// </summary>
        [HttpPost("manager-nominate")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> ManagerNominate([FromBody] CreateManagerNominationRequestDto request)
        {
            try
            {
                NominationValidator.ValidateManagerNomination(request);

                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                                  ?? User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int managerId) || managerId == 0)
                {
                    return Unauthorized(new { message = "Manager ID not found in token" });
                }

                Console.WriteLine($"[Controller] Manager-Nominate - ManagerId: {managerId}, NomineeId: {request.NomineeEmployeeId}");

                var result = await _nominationService.CreateManagerNominationAsync(managerId, request);

                return CreatedAtAction(nameof(GetNominationById), new { id = result.NominationId }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        /// <summary>
        /// Retrieves a nomination by its unique nomination ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetNominationById(int id)
        {
            try
            {
                var result = await _nominationService.GetNominationByIdAsync(id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Returns the logged-in employee's pending nominations (Self or Manager nominated).
        /// </summary>
        [HttpGet("my-nominations")]
        [Authorize(Roles = "Employee,Manager")]
        public async Task<IActionResult> GetMyNominations()
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                                  ?? User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || userId == 0)
                {
                    var allClaims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
                    return Unauthorized(new { message = "User ID not found in token", availableClaims = allClaims });
                }

                Console.WriteLine($"[Controller] GetMyNominations - UserId: {userId}");

                var result = await _nominationService.GetMyNominationsAsync(userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        /// <summary>
        /// Fetches the nomination history for the logged-in user, optionally filtered by status.
        /// </summary>
        [HttpGet("my-history")]
        [Authorize(Roles = "Employee,Manager")]
        public async Task<IActionResult> GetMyNominationHistory([FromQuery] string? status = null)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                                  ?? User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || userId == 0)
                {
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                Console.WriteLine($"[Controller] GetMyNominationHistory - UserId: {userId}, Status Filter: {status ?? "All"}");

                var result = await _nominationService.GetMyNominationHistoryAsync(userId, status);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        /// <summary>
        /// Retrieves all nominations submitted by the manager's team, with optional status filtering.
        /// </summary>
        [HttpGet("manager-team-nominations")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> GetManagerTeamNominations([FromQuery] string? status = null)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                                  ?? User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int managerId) || managerId == 0)
                {
                    return Unauthorized(new { message = "Manager ID not found in token" });
                }

                Console.WriteLine($"[Controller] GetManagerTeamNominations - ManagerId: {managerId}, Status: {status ?? "All"}");

                var result = await _nominationService.GetManagerTeamNominationsAsync(managerId, status);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        /// <summary>
        /// Retrieves nominations that require the logged-in manager's (L2) review.
        /// </summary>
        [HttpGet("pending-manager-review")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> GetPendingManagerReview()
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                                  ?? User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int managerId) || managerId == 0)
                {
                    return Unauthorized(new { message = "Manager ID not found in token" });
                }

                Console.WriteLine($"[Controller] GetPendingManagerReview - ManagerId (UserId): {managerId}");

                var result = await _nominationService.GetPendingManagerReviewAsync(managerId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Retrieves nominations requiring Department Head review, based on the logged-in user’s role.
        /// </summary>
        [HttpGet("pending-depthead-review")]
        [Authorize(Roles = "Department Head,DepartmentHead,DEPTHEAD")]
        public async Task<IActionResult> GetPendingDeptHeadReview()
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                                  ?? User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int deptHeadId) || deptHeadId == 0)
                {
                    return Unauthorized(new { message = "Department Head ID not found in token" });
                }

                Console.WriteLine($"[Controller] GetPendingDeptHeadReview - DeptHeadId (UserId): {deptHeadId}");

                var result = await _nominationService.GetPendingDeptHeadReviewAsync(deptHeadId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Retrieves all nominations in the system, optionally filtered by nomination status.
        /// </summary>
        [HttpGet("all-nominations")]
        [Authorize]
        public async Task<IActionResult> GetAllNominations([FromQuery] string? status = null)
        {
            try
            {
                Console.WriteLine($"[Controller] GetAllNominations - Status Filter: {status ?? "All"}");

                var result = await _nominationService.GetAllNominationsAsync(status);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Allows L2 Managers to review a nomination and either approve or reject it.
        /// </summary>
        [HttpPut("{id}/manager-review")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> ManagerReview(int id, [FromBody] ManagerReviewRequestDto request)
        {
            try
            {
                NominationValidator.ValidateManagerReview(request);

                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                                  ?? User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int managerId) || managerId == 0)
                {
                    return Unauthorized(new { message = "Manager ID not found in token" });
                }

                Console.WriteLine($"[Controller] ManagerReview - NominationId: {id}, Action: {request.ActionTaken}");

                var result = await _nominationService.ManagerReviewNominationAsync(id, managerId, request);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        /// <summary>
        /// Allows Department Heads to perform the final review action (Approve / Reject) on a nomination.
        /// </summary>
        [HttpPut("{id}/department-head-review")]
        [Authorize(Roles = "Department Head,DepartmentHead,DEPTHEAD")]
        public async Task<IActionResult> DepartmentHeadReview(int id, [FromBody] DepartmentHeadReviewRequestDto request)
        {
            try
            {
                Console.WriteLine($"[Controller] DepartmentHeadReview - NominationId: {id}");
                Console.WriteLine($"[Controller] Request.Action: {request?.Action ?? "NULL"}");
                Console.WriteLine($"[Controller] Request.ReviewRemarks: {request?.ReviewRemarks ?? "NULL"}");
                Console.WriteLine($"[Controller] Request.MeritScore: {request?.MeritScore?.ToString() ?? "NULL"}");
                Console.WriteLine($"[Controller] Request.DiversityScore: {request?.DiversityScore?.ToString() ?? "NULL"}");
                Console.WriteLine($"[Controller] Request.ConflictOfInterest: {request?.ConflictOfInterest?.ToString() ?? "NULL"}");

                if (request == null)
                {
                    return BadRequest(new { message = "Request body is required" });
                }

                if (string.IsNullOrEmpty(request.Action))
                {
                    return BadRequest(new { message = "Action is required" });
                }

                if (request.Action != "Approved" && request.Action != "Rejected")
                {
                    return BadRequest(new { message = "Action must be 'Approved' or 'Rejected'" });
                }

                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                                  ?? User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int deptHeadId) || deptHeadId == 0)
                {
                    return Unauthorized(new { message = "Department Head ID not found in token" });
                }

                Console.WriteLine($"[Controller] DeptHeadId from token: {deptHeadId}");

                var result = await _nominationService.DepartmentHeadReviewAsync(id, deptHeadId, request);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                Console.WriteLine($"[Controller] ArgumentException: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                Console.WriteLine($"[Controller] UnauthorizedAccessException: {ex.Message}");
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Controller] Exception: {ex.Message}");
                Console.WriteLine($"[Controller] StackTrace: {ex.StackTrace}");
                return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        /// <summary>
        /// Checks if the user is eligible to submit a self-nomination for a specific opportunity.
        /// </summary>
        [HttpPost("check-eligibility")]
        [Authorize(Roles = "Employee,Manager")]
        public async Task<IActionResult> CheckEligibility([FromBody] EligibilityCheckRequestDto request)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                                  ?? User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || userId == 0)
                {
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                Console.WriteLine($"[Controller] CheckEligibility - UserId: {userId}, OpportunityId: {request.OpportunityId}");

                var result = await _nominationService.CheckEligibilityAsync(userId, request.OpportunityId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
