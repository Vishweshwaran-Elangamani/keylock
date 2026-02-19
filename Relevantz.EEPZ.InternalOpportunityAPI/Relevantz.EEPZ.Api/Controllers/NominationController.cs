using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.ViewModels.Common;
using Relevantz.EEPZ.Common.ViewModels.Nomination.Request;
using Relevantz.EEPZ.Common.Validators;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Api.Constants;

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
            // Fallback lookup is used because some identity providers populate "sub" instead of NameIdentifier
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                              ?? User.FindFirst("sub");

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || userId == 0)
            {
                return Unauthorized(new { message = MessageConstants.UserIdNotFoundInToken });
            }


            var result = await _nominationService.CreateSelfNominationAsync(userId, request);

            return CreatedAtAction(nameof(GetNominationById), new { id = result.NominationId }, result);
        }

        /// <summary>
        /// Allows managers to nominate employees on their team.
        /// Validates nominee information and saves the nomination.
        /// </summary>
        [HttpPost("manager-nominate")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> ManagerNominate([FromBody] CreateManagerNominationRequestDto request)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                              ?? User.FindFirst("sub");

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int managerId) || managerId == 0)
            {
                return Unauthorized(new { message = MessageConstants.ManagerIdNotFoundInToken });
            }


            var result = await _nominationService.CreateManagerNominationAsync(managerId, request);

            return CreatedAtAction(nameof(GetNominationById), new { id = result.NominationId }, result);
        }

        /// <summary>
        /// Retrieves all nominations in the system, optionally filtered by nomination status.
        /// MUST BE BEFORE GetNominationById to avoid route conflicts
        /// </summary>
        [HttpGet("all-nomination")]
        [Authorize]
        public async Task<IActionResult> GetAllNominations([FromQuery] string? status = null)
        {

            var result = await _nominationService.GetAllNominationsAsync(status);
            return Ok(result);
        }

        /// <summary>
        /// Returns the logged-in employee's pending nominations (Self or Manager nominated).
        /// </summary>
        [HttpGet("my-nomination")]
        [Authorize(Roles = "Employee,Manager")]
        public async Task<IActionResult> GetMyNominations()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                              ?? User.FindFirst("sub");

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || userId == 0)
            {
                var allClaims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
                return Unauthorized(new { message = MessageConstants.UserIdNotFoundInToken, availableClaims = allClaims });
            }

            var result = await _nominationService.GetMyNominationsAsync(userId);
            return Ok(result);
        }

        /// <summary>
        /// Fetches the nomination history for the logged-in user, optionally filtered by status.
        /// </summary>
        [HttpGet("my-history")]
        [Authorize(Roles = "Employee,Manager")]
        public async Task<IActionResult> GetMyNominationHistory([FromQuery] string? status = null)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                              ?? User.FindFirst("sub");

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || userId == 0)
            {
                return Unauthorized(new { message = MessageConstants.UserIdNotFoundInToken });
            }

            var result = await _nominationService.GetMyNominationHistoryAsync(userId, status);
            return Ok(result);
        }

        /// <summary>
        /// Retrieves all nominations submitted by the manager's team, with optional status filtering.
        /// </summary>
        [HttpGet("manager-team-nomination")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> GetManagerTeamNominations([FromQuery] string? status = null)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                              ?? User.FindFirst("sub");

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int managerId) || managerId == 0)
            {
                return Unauthorized(new { message = MessageConstants.ManagerIdNotFoundInToken });
            }

            var result = await _nominationService.GetManagerTeamNominationsAsync(managerId, status);
            return Ok(result);
        }

        /// <summary>
        /// Retrieves nominations that require the logged-in manager's (L2) review.
        /// </summary>
        [HttpGet("pending-manager-review")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> GetPendingManagerReview()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                              ?? User.FindFirst("sub");

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int managerId) || managerId == 0)
            {
                return Unauthorized(new { message = MessageConstants.ManagerIdNotFoundInToken });
            }

            var result = await _nominationService.GetPendingManagerReviewAsync(managerId);
            return Ok(result);
        }

        /// <summary>
        /// Retrieves nominations requiring Department Head review, based on the logged-in user's role.
        /// </summary>
        [HttpGet("pending-depthead-review")]
        [Authorize(Roles = "Department Head,DepartmentHead,DEPTHEAD")]
        public async Task<IActionResult> GetPendingDeptHeadReview()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                              ?? User.FindFirst("sub");

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int deptHeadId) || deptHeadId == 0)
            {
                return Unauthorized(new { message = MessageConstants.DepartmentHeadIdNotFoundInToken });
            }

            var result = await _nominationService.GetPendingDeptHeadReviewAsync(deptHeadId);
            return Ok(result);
        }

        /// <summary>
        /// Retrieves a nomination by its unique nomination ID.
        /// THIS MUST BE AFTER all specific string routes to avoid conflicts
        /// </summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetNominationById(int id)
        {
            var result = await _nominationService.GetNominationByIdAsync(id);
            return Ok(result);
        }

        /// <summary>
        /// Allows L2 Managers to review a nomination and either approve or reject it.
        /// </summary>
        [HttpPut("{id}/manager-review")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> ManagerReview(int id, [FromBody] ManagerReviewRequestDto request)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                              ?? User.FindFirst("sub");

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int managerId) || managerId == 0)
            {
                return Unauthorized(new { message = MessageConstants.ManagerIdNotFoundInToken });
            }

            var result = await _nominationService.ManagerReviewNominationAsync(id, managerId, request);
            return Ok(result);
        }

        /// <summary>
        /// Allows Department Heads to perform the final review action (Approve / Reject) on a nomination.
        /// </summary>
        [HttpPut("{id}/department-head-review")]
        [Authorize(Roles = "Department Head,DepartmentHead,DEPTHEAD")]
        public async Task<IActionResult> DepartmentHeadReview(int id, [FromBody] DepartmentHeadReviewRequestDto request)
        {

            if (request == null)
            {
                return BadRequest(new { message = MessageConstants.RequestBodyRequired });
            }

            if (string.IsNullOrEmpty(request.Action))
            {
                return BadRequest(new { message = MessageConstants.ActionRequired });
            }

            if (request.Action != "Approved" && request.Action != "Rejected")
            {
                return BadRequest(new { message = MessageConstants.ActionMustBeApprovedOrRejected });
            }

            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                              ?? User.FindFirst("sub");

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int deptHeadId) || deptHeadId == 0)
            {
                return Unauthorized(new { message = MessageConstants.DepartmentHeadIdNotFoundInToken });
            }

            var result = await _nominationService.DepartmentHeadReviewAsync(id, deptHeadId, request);
            return Ok(result);
        }

        /// <summary>
        /// Checks if the user is eligible to submit a self-nomination for a specific opportunity.
        /// </summary>
        [HttpPost("check-eligibility")]
        [Authorize(Roles = "Employee,Manager")]
        public async Task<IActionResult> CheckEligibility([FromBody] EligibilityCheckRequestDto request)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                              ?? User.FindFirst("sub");

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || userId == 0)
            {
                return Unauthorized(new { message = MessageConstants.UserIdNotFoundInToken });
            }

            var result = await _nominationService.CheckEligibilityAsync(userId, request.OpportunityId);
            return Ok(result);
        }
    }
}
