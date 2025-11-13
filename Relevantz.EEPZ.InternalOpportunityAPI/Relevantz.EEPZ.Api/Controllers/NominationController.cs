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

        [HttpPost("self-nominate")]
        [Authorize(Roles = "Employee,Manager")]
        public async Task<IActionResult> SelfNominate([FromBody] CreateSelfNominationRequestDto request)
        {
            try
            {
                NominationValidator.ValidateSelfNomination(request);

                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? 
                                 User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || userId <= 0)
                {
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                Console.WriteLine($"✓ Self-Nominate - UserId: {userId}, OpportunityId: {request.OpportunityId}");

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

        [HttpPost("manager-nominate")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> ManagerNominate([FromBody] CreateManagerNominationRequestDto request)
        {
            try
            {
                NominationValidator.ValidateManagerNomination(request);

                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? 
                                 User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int managerId) || managerId <= 0)
                {
                    return Unauthorized(new { message = "Manager ID not found in token" });
                }

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

        [HttpGet("my-nominations")]
        [Authorize(Roles = "Employee,Manager")]
        public async Task<IActionResult> GetMyNominations()
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? 
                                 User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || userId <= 0)
                {
                    var allClaims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
                    return Unauthorized(new 
                    { 
                        message = "User ID not found in token",
                        availableClaims = allClaims
                    });
                }

                Console.WriteLine($"✓ GetMyNominations - UserId: {userId}");

                var result = await _nominationService.GetMyNominationsAsync(userId);
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        // ✅ MANAGER: Get nominations pending their team's review
        [HttpGet("pending-manager-review")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> GetPendingManagerReview()
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? 
                                 User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int managerId) || managerId <= 0)
                {
                    return Unauthorized(new { message = "Manager ID not found in token" });
                }

                Console.WriteLine($"✓ GetPendingManagerReview - ManagerId (UserId): {managerId}");

                var result = await _nominationService.GetPendingManagerReviewAsync(managerId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ✅ DEPARTMENT HEAD: Get nominations pending their approval
        [HttpGet("pending-depthead-review")]
        [Authorize(Roles = "Department Head,DepartmentHead,DEPT_HEAD")]
        public async Task<IActionResult> GetPendingDeptHeadReview()
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? 
                                 User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int deptHeadId) || deptHeadId <= 0)
                {
                    return Unauthorized(new { message = "Department Head ID not found in token" });
                }

                Console.WriteLine($"✓ GetPendingDeptHeadReview - DeptHeadId (UserId): {deptHeadId}");

                var result = await _nominationService.GetPendingDeptHeadReviewAsync(deptHeadId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ✅ HR: Get ALL nominations with optional status filter
        [HttpGet("all-nominations")]
        [Authorize(Roles = "HR,Admin,Employee")]
        public async Task<IActionResult> GetAllNominations([FromQuery] string? status = null)
        {
            try
            {
                Console.WriteLine($"✓ GetAllNominations - Status Filter: {status ?? "All"}");

                var result = await _nominationService.GetAllNominationsAsync(status);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}/manager-review")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> ManagerReview(int id, [FromBody] ManagerReviewRequestDto request)
        {
            try
            {
                NominationValidator.ValidateManagerReview(request);

                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? 
                                 User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int managerId) || managerId <= 0)
                {
                    return Unauthorized(new { message = "Manager ID not found in token" });
                }

                Console.WriteLine($"✓ ManagerReview - NominationId: {id}, Action: {request.ActionTaken}");

                var result = await _nominationService.ManagerReviewNominationAsync(id, managerId, request);
                return Ok(result);
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

        [HttpPut("{id}/department-head-review")]
        [Authorize(Roles = "Department Head,DepartmentHead,DEPT_HEAD")]
        public async Task<IActionResult> DepartmentHeadReview(int id, [FromBody] DepartmentHeadReviewRequestDto request)
        {
            try
            {
                NominationValidator.ValidateDeptHeadReview(request);

                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? 
                                 User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int deptHeadId) || deptHeadId <= 0)
                {
                    return Unauthorized(new { message = "Department Head ID not found in token" });
                }

                Console.WriteLine($"✓ DepartmentHeadReview - NominationId: {id}, Action: {request.Action}");

                var result = await _nominationService.DepartmentHeadReviewAsync(id, deptHeadId, request);
                return Ok(result);
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

        [HttpPost("check-eligibility")]
        [Authorize(Roles = "Employee")]
        public async Task<IActionResult> CheckEligibility([FromBody] EligibilityCheckRequestDto request)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? 
                                 User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || userId <= 0)
                {
                    return Unauthorized(new { message = "User ID not found in token" });
                }

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
