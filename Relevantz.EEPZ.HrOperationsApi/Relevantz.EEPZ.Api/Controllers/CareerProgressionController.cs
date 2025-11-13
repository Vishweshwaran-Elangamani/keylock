using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Relevantz.EEPZ.Api.Controllers
{
   [Route("api/[controller]")]
    [ApiController]
    public class CareerProgressionController : ControllerBase
    {
        private readonly ICareerProgressionService _careerProgressionService;
 
        public CareerProgressionController(ICareerProgressionService careerProgressionService)
        {
            _careerProgressionService = careerProgressionService;
        }
 
        //  UPDATED: Check if employee already has pending nomination
        [HttpGet("check-pending/{employeeUserId}")]
        public async Task<IActionResult> CheckPendingNomination(int employeeUserId)
        {
            try
            {
                if (employeeUserId <= 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid employee ID",
                        data = (object)null
                    });
                }
 
                Console.WriteLine($"Controller: CheckPendingNomination for EmployeeId={employeeUserId}");
                var result = await _careerProgressionService.CheckPendingNominationAsync(employeeUserId);
               
                if (result.Success)
                {
                    return Ok(result);
                }
               
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in CheckPendingNomination: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while checking pending nomination",
                    data = (object)null
                });
            }
        }
 
        //  UPDATED: Manager creates promotion nomination
        [HttpPost("create")]
        public async Task<IActionResult> CreatePromotion([FromBody] CreatePromotionRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }
 
                // Validate required fields
                if (request.EmployeeUserId <= 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid EmployeeUserId",
                        data = (object)null
                    });
                }
 
                if (request.ManagerId <= 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid ManagerId",
                        data = (object)null
                    });
                }
 
                if (string.IsNullOrEmpty(request.NewRole))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "NewRole is required",
                        data = (object)null
                    });
                }
 
                Console.WriteLine($" Manager ID from request: {request.ManagerId}");
                Console.WriteLine($" Creating promotion for Employee: {request.EmployeeUserId}");
                Console.WriteLine($" NewRole: {request.NewRole}");
                if (!string.IsNullOrEmpty(request.AdditionalJustification))
                {
                    Console.WriteLine($" Additional Justification: {request.AdditionalJustification}");
                }
 
                //  PASS request and ManagerId to service
                var result = await _careerProgressionService.CreatePromotionAsync(request, request.ManagerId);
               
                //  CHECK response status
                if (result.Success)
                {
                    // NEW PROMOTION CREATED
                    return Ok(result);
                }
               
                // FAILED - Could be duplicate or missing justification
                // Return 400 with error message (not 500)
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Error in CreatePromotion: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                return StatusCode(500, new
                {
                    success = false,
                    message = $"An error occurred while creating promotion: {ex.Message}",
                    data = (object)null
                });
            }
        }
 
        //  Manager updates ONLY post/role (NOT salary)
        [HttpPut("update")]
        public async Task<IActionResult> UpdatePromotion([FromBody] UpdatePromotionRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }
 
                var result = await _careerProgressionService.UpdatePromotionAsync(request);
               
                if (result.Success)
                {
                    return Ok(result);
                }
               
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in UpdatePromotion: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while updating promotion",
                    data = (object)null
                });
            }
        }
 
        //  UPDATED: Check for favoritism (before DeptHead approves)
        [HttpGet("{promotionId}/favoritism-check")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> CheckFavoritismHistory(int promotionId)
        {
            try
            {
                if (promotionId <= 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid promotion ID",
                        data = (object)null
                    });
                }
 
                Console.WriteLine($"Controller: CheckFavoritismHistory called for promotionId={promotionId}");
                var result = await _careerProgressionService.CheckFavoritismHistoryAsync(promotionId);
                Console.WriteLine($"Controller: Service returned Success={result.Success}");
               
                if (result.Success)
                {
                    return Ok(result);
                }
               
                return NotFound(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in CheckFavoritismHistory: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while checking favoritism history",
                    data = (object)null
                });
            }
        }
 
        //  Department Head approves promotion
        [HttpPut("approve")]
        public async Task<IActionResult> ApprovePromotion([FromBody] ApprovePromotionRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }
 
                Console.WriteLine($"Controller: ApprovePromotion called by DepartmentHead for promotionId={request.PromotionId}");
                var result = await _careerProgressionService.ApprovePromotionAsync(request);
               
                if (result.Success)
                {
                    return Ok(result);
                }
               
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in ApprovePromotion: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while approving promotion",
                    data = (object)null
                });
            }
        }
 
        //  Department Head rejects promotion
        [HttpPut("reject")]
        public async Task<IActionResult> RejectPromotion([FromBody] RejectPromotionRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }
 
                Console.WriteLine($"Controller: RejectPromotion called by DepartmentHead for promotionId={request.PromotionId}");
                var result = await _careerProgressionService.RejectPromotionAsync(request);
               
                if (result.Success)
                {
                    return Ok(result);
                }
               
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in RejectPromotion: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while rejecting promotion",
                    data = (object)null
                });
            }
        }
 
        //  HR handles payroll (AFTER DeptHead approves)
        [HttpPost("update-payroll")]
        public async Task<IActionResult> UpdatePayrollForPromotion([FromBody] UpdatePayrollRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }
 
                Console.WriteLine($"Controller: UpdatePayrollForPromotion called by HR");
                var result = await _careerProgressionService.UpdatePayrollForPromotionAsync(request);
               
                if (result.Success)
                {
                    return Ok(result);
                }
               
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in UpdatePayrollForPromotion: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while updating payroll",
                    data = (object)null
                });
            }
        }
 
        //  NEW: HR submits approved promotion to Leadership
        [HttpPut("{promotionId}/submit-to-leadership")]
        public async Task<IActionResult> SubmitToLeadership(int promotionId)
        {
            try
            {
                if (promotionId <= 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid promotion ID",
                        data = (object)null
                    });
                }
 
                Console.WriteLine($"Controller: SubmitToLeadership called for promotionId={promotionId}");
                var result = await _careerProgressionService.SubmitToLeadershipAsync(promotionId);
                Console.WriteLine($"Controller: Service returned Success={result.Success}");
               
                if (result.Success)
                {
                    return Ok(result);
                }
               
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in SubmitToLeadership: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while submitting to leadership",
                    data = (object)null
                });
            }
        }
 
        //  Get all promotions
        [HttpGet("all")]
        public async Task<IActionResult> GetAllPromotions()
        {
            try
            {
                Console.WriteLine("Controller: GetAllPromotions called");
                var result = await _careerProgressionService.GetAllPromotionsAsync();
                Console.WriteLine($"Controller: Service returned Success={result.Success}, Data Count={result.Data?.Count ?? 0}");
               
                if (result.Success)
                {
                    return Ok(result);
                }
               
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Controller Error in GetAllPromotions: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                return StatusCode(500, new
                {
                    success = false,
                    message = $"An error occurred while fetching promotions: {ex.Message}",
                    data = (object)null
                });
            }
        }
 
        //  Get promotion by ID
        [HttpGet("{promotionId}")]
        public async Task<IActionResult> GetPromotionById(int promotionId)
        {
            try
            {
                if (promotionId <= 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid promotion ID",
                        data = (object)null
                    });
                }
 
                var result = await _careerProgressionService.GetPromotionByIdAsync(promotionId);
               
                if (result.Success)
                {
                    return Ok(result);
                }
               
                return NotFound(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPromotionById: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching promotion",
                    data = (object)null
                });
            }
        }
 
        //  Get promotions by employee
        [HttpGet("by-employee/{employeeUserId}")]
        public async Task<IActionResult> GetPromotionsByEmployee(int employeeUserId)
        {
            try
            {
                if (employeeUserId <= 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid employee user ID",
                        data = (object)null
                    });
                }
 
                var result = await _careerProgressionService.GetPromotionsByEmployeeAsync(employeeUserId);
               
                if (result.Success)
                {
                    return Ok(result);
                }
               
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPromotionsByEmployee: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching employee promotions",
                    data = (object)null
                });
            }
        }
 
        //  Get promotions by status (Pending, Approved, Rejected)
        [HttpGet("by-status/{status}")]
        public async Task<IActionResult> GetPromotionsByStatus(string status)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(status))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Status cannot be empty",
                        data = (object)null
                    });
                }
 
                Console.WriteLine($"Controller: GetPromotionsByStatus called with status={status}");
                var result = await _careerProgressionService.GetPromotionsByStatusAsync(status);
                Console.WriteLine($"Controller: Service returned Success={result.Success}, Data Count={result.Data?.Count ?? 0}");
               
                if (result.Success)
                {
                    return Ok(result);
                }
               
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Controller Error in GetPromotionsByStatus: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching promotions by status",
                    data = (object)null
                });
            }
        }
 
        //  Get pending reviews for Department Head
        [HttpGet("pending-review")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetPendingReviews()
        {
            try
            {
                Console.WriteLine("Controller: GetPendingReviews called by DepartmentHead");
                var result = await _careerProgressionService.GetPromotionsByStatusAsync("Pending");
                Console.WriteLine($"Controller: Service returned Success={result.Success}, Pending Count={result.Data?.Count ?? 0}");
               
                if (result.Success)
                {
                    return Ok(result);
                }
               
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Controller Error in GetPendingReviews: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching pending reviews",
                    data = (object)null
                });
            }
        }
 
        //  UPDATED: Get promotions submitted to leadership (Leadership role - VIEW ONLY)
        [HttpGet("submitted-to-leadership")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetSubmittedToLeadership()
        {
            try
            {
                Console.WriteLine(" Controller: GetSubmittedToLeadership called by Leadership");
               
                //  Get all "Approved" promotions
                var result = await _careerProgressionService.GetPromotionsByStatusAsync("Approved");
               
                if (!result.Success || result.Data == null)
                {
                    Console.WriteLine(" No approved promotions found");
                    return Ok(new ApiResponseDto<List<object>>
                    {
                        Success = true,
                        Message = "No promotions submitted to leadership yet",
                        Data = new List<object>()
                    });
                }
               
                //  UPDATED FILTER: Only show if BOTH conditions are true:
                // 1. NewSalary > 0 (HR updated payroll)
                // 2. ApprovedAt is NOT NULL (HR clicked "Submit to Leadership")
                var submittedToLeadership = result.Data
                    .Where(p => p.NewSalary > 0 && p.ApprovedAt != null)
                    .ToList();
               
                Console.WriteLine($" Found {submittedToLeadership.Count} promotions submitted to leadership");
                Console.WriteLine($"   - With payroll updated (NewSalary > 0): {result.Data.Count(p => p.NewSalary > 0)}");
                Console.WriteLine($"   - Actually submitted (ApprovedAt != null): {submittedToLeadership.Count}");
               
                return Ok(new ApiResponseDto<List<PromotionResponseDto>>
                {
                    Success = true,
                    Message = $"Found {submittedToLeadership.Count} promotions submitted to leadership",
                    Data = submittedToLeadership
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Controller Error in GetSubmittedToLeadership: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching promotions submitted to leadership",
                    data = (object)null
                });
            }
        }
    }
 
 
 
 
}
