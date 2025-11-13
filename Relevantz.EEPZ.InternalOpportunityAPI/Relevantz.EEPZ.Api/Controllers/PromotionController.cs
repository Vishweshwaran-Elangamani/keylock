using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.ViewModels.Promotion.Request;
using Relevantz.EEPZ.Core.IService;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PromotionController : ControllerBase
    {
        private readonly IPromotionService _promotionService;

        public PromotionController(IPromotionService promotionService)
        {
            _promotionService = promotionService;
        }

        // ✅ CREATE PROMOTION (ONLY FROM APPROVED NOMINATION)
        [HttpPost("create")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> CreatePromotion([FromBody] CreatePromotionRequestDto request)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? 
                                 User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || userId <= 0)
                {
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                Console.WriteLine($"✓ CreatePromotion - UserId: {userId}, NominationId: {request.NominationId}");

                var result = await _promotionService.CreatePromotionAsync(request, userId);

                return CreatedAtAction(nameof(GetPromotionById), new { id = result.PromotionId }, result);
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

        // ✅ GET PROMOTION BY ID
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetPromotionById(int id)
        {
            try
            {
                var result = await _promotionService.GetPromotionByIdAsync(id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // ✅ GET ALL PROMOTIONS
        [HttpGet("list")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> GetAllPromotions()
        {
            try
            {
                var result = await _promotionService.GetAllPromotionsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ✅ GET PENDING HR APPROVAL
        [HttpGet("pending-hr-approval")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> GetPendingHrApproval()
        {
            try
            {
                var result = await _promotionService.GetPendingHrApprovalAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ✅ APPROVE PROMOTION
        [HttpPut("{id}/approve")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> ApprovePromotion(int id, [FromBody] ApprovePromotionRequestDto request)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? 
                                 User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || userId <= 0)
                {
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                Console.WriteLine($"✓ ApprovePromotion - PromotionId: {id}, Remarks: {request.ApprovalRemarks}");

                var result = await _promotionService.ApprovePromotionAsync(id, userId, request.ApprovalRemarks);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        // ✅ REJECT PROMOTION
        [HttpPut("{id}/reject")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> RejectPromotion(int id)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? 
                                 User.FindFirst("sub");

                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || userId <= 0)
                {
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                Console.WriteLine($"✓ RejectPromotion - PromotionId: {id}");

                var result = await _promotionService.RejectPromotionAsync(id, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        // ✅ GET EMPLOYEE PROMOTIONS
        [HttpGet("employee/{employeeUserId}")]
        [Authorize]
        public async Task<IActionResult> GetEmployeePromotions(int employeeUserId)
        {
            try
            {
                var result = await _promotionService.GetPromotionsByEmployeeAsync(employeeUserId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ✅ GET PROMOTION HISTORY
        [HttpGet("history/{employeeUserId}")]
        [Authorize]
        public async Task<IActionResult> GetPromotionHistory(int employeeUserId)
        {
            try
            {
                var result = await _promotionService.GetPromotionHistoryByEmployeeAsync(employeeUserId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ✅ NEW: Get pending leadership approval
[HttpGet("pending-leadership-approval")]
[Authorize(Roles = "Leadership")]
public async Task<IActionResult> GetPendingLeadershipApproval()
{
    try
    {
        Console.WriteLine($"✓ GetPendingLeadershipApproval");

        var result = await _promotionService.GetPendingLeadershipApprovalAsync();
        return Ok(result);
    }
    catch (Exception ex)
    {
        return BadRequest(new { message = ex.Message });
    }
}

// ✅ NEW: Leadership approves promotion (FINAL)
[HttpPut("{id}/leadership-approve")]
[Authorize(Roles = "Leadership")]
public async Task<IActionResult> LeadershipApprovePromotion(int id, [FromBody] ApprovePromotionRequestDto request)
{
    try
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? 
                         User.FindFirst("sub");

        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || userId <= 0)
        {
            return Unauthorized(new { message = "User ID not found in token" });
        }

        Console.WriteLine($"✓ LeadershipApprovePromotion - PromotionId: {id}, Remarks: {request.ApprovalRemarks}");

        var result = await _promotionService.ApprovePromotionByLeadershipAsync(id, userId, request.ApprovalRemarks);
        return Ok(result);
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message });
    }
}

// ✅ NEW: Leadership rejects promotion
[HttpPut("{id}/leadership-reject")]
[Authorize(Roles = "Leadership")]
public async Task<IActionResult> LeadershipRejectPromotion(int id, [FromBody] ApprovePromotionRequestDto request)
{
    try
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? 
                         User.FindFirst("sub");

        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId) || userId <= 0)
        {
            return Unauthorized(new { message = "User ID not found in token" });
        }

        Console.WriteLine($"✓ LeadershipRejectPromotion - PromotionId: {id}, Remarks: {request.ApprovalRemarks}");

        var result = await _promotionService.RejectPromotionByLeadershipAsync(id, userId, request.ApprovalRemarks);
        return Ok(result);
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message });
    }
}

    }
}
