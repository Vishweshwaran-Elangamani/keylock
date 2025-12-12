using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace PerformanceManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HRNominationController : ControllerBase
    {
        private readonly IAppraisalProcessService _appraisalService;
        private readonly EEPZDbContext _context;
        private readonly ILogger<HRNominationController> _logger;

        public HRNominationController(
            IAppraisalProcessService appraisalService, 
            EEPZDbContext context, 
            ILogger<HRNominationController> logger)
        {
            _appraisalService = appraisalService;
            _context = context;
            _logger = logger;
        }

        [HttpGet("hr/manager-nominations")]
        public async Task<IActionResult> GetAllManagerNominationsForHR()
        {
            try
            {
                var nominations = await _context.Recognitionstatuses
                    .Where(n => n.NominationType == "ManagerNomination" && n.Status == "Pending")
                    .Include(n => n.NomineeEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(n => n.NominatedByEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .ToListAsync();

                var nominationDtos = new List<object>();

                foreach (var n in nominations)
                {

                    var opportunity = await _context.Recognitiondetails
                        .Where(o => o.OpportunityId == n.OpportunityId)
                        .Include(o => o.RewardType)
                        .FirstOrDefaultAsync();

                    var nomineeDept = await _context.Employeedetailsmasters
                        .Where(edm => edm.EmployeeId == n.NomineeEmployeeId)
                        .Include(edm => edm.Department)
                        .FirstOrDefaultAsync();

                    var parameterValues = await _context.Nominationparametervalues
                        .Where(pv => pv.NominationId == n.NominationId)
                        .Include(pv => pv.Parameter)
                        .Select(pv => new
                        {
                            pv.ParameterId,
                            ParameterName = pv.Parameter.ParameterName,
                            ParameterType = pv.Parameter.ParameterType,
                            pv.ParameterValue,
                            IsRequired = pv.Parameter.IsRequired
                        })
                        .ToListAsync();

                    nominationDtos.Add(new
                    {
                        n.NominationId,
                        n.OpportunityId,
                        OpportunityName = opportunity?.OpportunityName ?? "Unknown",
                        OpportunityDeadline = opportunity?.Deadline,
                        RewardType = opportunity?.RewardType != null ? new
                        {
                            opportunity.RewardType.RewardTypeId,
                            opportunity.RewardType.RewardName,
                            opportunity.RewardType.RewardCategory
                        } : null,
                        NomineeEmployeeId = n.NomineeEmployeeId,
                        NomineeName = n.NomineeEmployee.Userprofile.FirstName + " " + n.NomineeEmployee.Userprofile.LastName,
                        NomineeEmail = n.NomineeEmployee.Userprofile.PersonalEmail,
                        NomineeDepartmentId = nomineeDept?.DepartmentId,
                        NomineeDepartmentName = nomineeDept?.Department?.DepartmentName ?? "Unknown",
                        ManagerEmployeeId = n.NominatedByEmployeeId,
                        ManagerName = n.NominatedByEmployee.Userprofile.FirstName + " " + n.NominatedByEmployee.Userprofile.LastName,
                        n.Justification,
                        n.SubmittedAt,
                        n.Status,
                        ParameterValues = parameterValues
                    });
                }

                var groupedNominations = nominationDtos
                    .GroupBy(n => new
                    {
                        ((dynamic)n).OpportunityId,
                        ((dynamic)n).OpportunityName,
                        ((dynamic)n).OpportunityDeadline,
                        ((dynamic)n).RewardType
                    })
                    .Select(g => new
                    {
                        OpportunityId = g.Key.OpportunityId,
                        OpportunityName = g.Key.OpportunityName,
                        OpportunityDeadline = g.Key.OpportunityDeadline,
                        RewardType = g.Key.RewardType,
                        NominationCount = g.Count(),
                        Nominations = g.ToList()
                    })
                    .ToList();

                return Ok(new
                {
                    success = true,
                    data = groupedNominations,
                    totalNominations = nominationDtos.Count,
                    totalOpportunities = groupedNominations.Count,
                    message = $"Found {nominationDtos.Count} pending nominations"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[HR_ALL_NOMINATIONS] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpPost("hr/nominations/reject")]
        public async Task<IActionResult> RejectNominations([FromBody] HRNominationRejectDto dto)
        {
            try
            {
                if (dto.SelectedNominationIds == null || dto.SelectedNominationIds.Count == 0)
                {
                    return BadRequest(new { success = false, message = "No nominations selected" });
                }

                var hrEmployeeId = dto.HrUserId;

                var nominationsToReject = await _context.Recognitionstatuses
                    .Where(n => dto.SelectedNominationIds.Contains(n.NominationId))
                    .ToListAsync();

                if (nominationsToReject.Count == 0)
                {
                    return NotFound(new { success = false, message = "No nominations found" });
                }

                var now = DateTime.UtcNow;

                foreach (var nomination in nominationsToReject)
                {
                    nomination.Status = "Rejected";
                    nomination.ReviewedByEmployeeId = (int?)hrEmployeeId;
                    nomination.ReviewedAt = now;
                    nomination.ReviewRemarks = dto.RejectionRemarks ?? "Rejected by HR";

                    var tracking = new Nominationvisibilitytracking
                    {
                        NominationId = nomination.NominationId,
                        ViewedByEmployeeId = (int)hrEmployeeId,
                        ActionTaken = "Rejected",
                        ViewedAt = now
                    };
                    _context.Nominationvisibilitytrackings.Add(tracking);
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    rejectedCount = nominationsToReject.Count,
                    message = $"{nominationsToReject.Count} nomination(s) rejected successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[REJECT_NOMINATIONS] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

       [HttpPost("hr/nominations/approve")]

public async Task<IActionResult> ApproveNominations([FromBody] HRNominationApprovalDto dto)

{

    try

    {

        if (dto.SelectedNominationIds == null || dto.SelectedNominationIds.Count == 0)

        {

            return BadRequest(new { success = false, message = "No nominations selected" });

        }

        if (dto.SelectedNominationIds.Count > 3)

        {

            return BadRequest(new { success = false, message = "Maximum 3 nominees can be selected per opportunity" });

        }

        var hrEmployeeId = dto.HrUserId;

        var selectedNominations = await _context.Recognitionstatuses

            .Where(n => dto.SelectedNominationIds.Contains(n.NominationId))

            .ToListAsync();

        if (selectedNominations.Count == 0)

        {

            return NotFound(new { success = false, message = "No nominations found" });

        }

        var now = DateTime.UtcNow;

        foreach (var nomination in selectedNominations)

        {

            nomination.Status = "Approved";

            nomination.ReviewedByEmployeeId = hrEmployeeId;

            nomination.ReviewedAt = now;

            nomination.ReviewRemarks = dto.ApprovalRemarks ?? "Selected by HR";

            var tracking = new Nominationvisibilitytracking

            {

                NominationId = nomination.NominationId,

                ViewedByEmployeeId = hrEmployeeId,

                ActionTaken = "Approved",

                ViewedAt = now

            };

            _context.Nominationvisibilitytrackings.Add(tracking);

        }

        await _context.SaveChangesAsync();

        return Ok(new

        {

            success = true,

            approvedCount = selectedNominations.Count,

            message = $"{selectedNominations.Count} nomination(s) approved successfully"

        });

    }

    catch (Exception ex)

    {

        _logger.LogError($"[HR_APPROVE] Error: {ex.Message}");

        return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });

    }

}

        [HttpGet("reward-types")]
        public async Task<IActionResult> GetAllRewardTypes([FromQuery] bool activeOnly = false)
        {
            try
            {
                var query = _context.Rewardtypes.AsQueryable();

                if (activeOnly)
                {
                    query = query.Where(rt => rt.IsActive == true);
                }

                var rewardTypes = await query
                    .Select(rt => new
                    {
                        rt.RewardTypeId,
                        rt.RewardCategory,
                        rt.RewardName,
                        rt.Description,
                        rt.IsActive,
                        rt.CreatedAt,
                        ParameterCount = _context.Nominationparameters.Count(p => p.RewardTypeId == rt.RewardTypeId)
                    })
                    .OrderBy(rt => rt.RewardCategory)
                    .ThenBy(rt => rt.RewardName)
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    data = rewardTypes,
                    message = $"Found {rewardTypes.Count} reward types"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[GET_REWARD_TYPES] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("reward-types")]
        public async Task<IActionResult> CreateRewardType([FromBody] CreateRewardTypeDto dto)
        {
            try
            {
                var rewardType = new Rewardtype
                {
                    RewardCategory = dto.RewardCategory,
                    RewardName = dto.RewardName,
                    Description = dto.Description,
                    IsActive = true,
                    CreatedBy = dto.CreatedBy,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Rewardtypes.Add(rewardType);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    data = new { rewardTypeId = rewardType.RewardTypeId },
                    message = "Reward type created successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[CREATE_REWARD_TYPE] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("reward-types/{rewardTypeId}")]
        public async Task<IActionResult> UpdateRewardType(int rewardTypeId, [FromBody] UpdateRewardTypeDto dto)
        {
            try
            {
                var rewardType = await _context.Rewardtypes.FindAsync(rewardTypeId);
                if (rewardType == null)
                {
                    return NotFound(new { success = false, message = "Reward type not found" });
                }

                rewardType.RewardName = dto.RewardName;
                rewardType.Description = dto.Description;
                rewardType.IsActive = dto.IsActive;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Reward type updated successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[UPDATE_REWARD_TYPE] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

       
        [HttpGet("reward-types/{rewardTypeId}/parameters")]
        public async Task<IActionResult> GetParametersByRewardType(int rewardTypeId)
        {
            try
            {
                var parameters = await _context.Nominationparameters
                    .Where(p => p.RewardTypeId == rewardTypeId)
                    .OrderBy(p => p.SortOrder)
                    .Select(p => new
                    {
                        p.ParameterId,
                        p.ParameterName,
                        p.ParameterType,
                        p.IsRequired,
                        p.PlaceholderText,
                        p.MinimumValue,
                        p.MaximumValue,
                        p.SortOrder
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    data = parameters,
                    message = $"Found {parameters.Count} parameters"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[GET_PARAMETERS] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("parameters")]
        public async Task<IActionResult> CreateParameter([FromBody] CreateParameterDto dto)
        {
            try
            {
                var parameter = new Nominationparameter
                {
                    RewardTypeId = dto.RewardTypeId,
                    ParameterName = dto.ParameterName,
                    ParameterType = dto.ParameterType,
                    IsRequired = dto.IsRequired,
                    PlaceholderText = dto.PlaceholderText,
                    MinimumValue = dto.MinimumValue,
                    MaximumValue = dto.MaximumValue,
                    SortOrder = dto.SortOrder,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Nominationparameters.Add(parameter);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    data = new { parameterId = parameter.ParameterId },
                    message = "Parameter created successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[CREATE_PARAMETER] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("parameters/{parameterId}")]
        public async Task<IActionResult> UpdateParameter(int parameterId, [FromBody] UpdateParameterDto dto)
        {
            try
            {
                var parameter = await _context.Nominationparameters.FindAsync(parameterId);
                if (parameter == null)
                {
                    return NotFound(new { success = false, message = "Parameter not found" });
                }

                parameter.ParameterName = dto.ParameterName;
                parameter.ParameterType = dto.ParameterType;
                parameter.IsRequired = dto.IsRequired;
                parameter.PlaceholderText = dto.PlaceholderText;
                parameter.MinimumValue = dto.MinimumValue;
                parameter.MaximumValue = dto.MaximumValue;
                parameter.SortOrder = dto.SortOrder;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Parameter updated successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[UPDATE_PARAMETER] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("parameters/{parameterId}")]
        public async Task<IActionResult> DeleteParameter(int parameterId)
        {
            try
            {
                var parameter = await _context.Nominationparameters.FindAsync(parameterId);
                if (parameter == null)
                {
                    return NotFound(new { success = false, message = "Parameter not found" });
                }

                _context.Nominationparameters.Remove(parameter);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Parameter deleted successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[DELETE_PARAMETER] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }



        [HttpGet("nomination-details/{nominationId}")]
        public async Task<IActionResult> GetNominationDetails(int nominationId)
        {
            try
            {
                var nomination = await _context.Recognitionstatuses
                    .Where(n => n.NominationId == nominationId)
                    .Include(n => n.NomineeEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(n => n.NominatedByEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .FirstOrDefaultAsync();

                if (nomination == null)
                {
                    return NotFound(new { success = false, message = "Nomination not found" });
                }

                var opportunity = await _context.Recognitiondetails
                    .Where(o => o.OpportunityId == nomination.OpportunityId)
                    .Include(o => o.RewardType)
                    .FirstOrDefaultAsync();

                var nomineeDept = await _context.Employeedetailsmasters
                    .Where(edm => edm.EmployeeId == nomination.NomineeEmployeeId)
                    .Include(edm => edm.Department)
                    .FirstOrDefaultAsync();

                var parameterValues = await _context.Nominationparametervalues
                    .Where(pv => pv.NominationId == nominationId)
                    .Include(pv => pv.Parameter)
                    .Select(pv => new
                    {
                        pv.Parameter.ParameterName,
                        pv.Parameter.ParameterType,
                        pv.ParameterValue
                    })
                    .ToListAsync();

                var result = new
                {
                    nomination.NominationId,
                    nomination.Status,
                    nomination.Justification,
                    nomination.SubmittedAt,
                    nomination.ReviewedAt,
                    nomination.ReviewRemarks,
                    Nominee = new
                    {
                        nomination.NomineeEmployee.EmployeeId,
                        nomination.NomineeEmployee.Userprofile.FirstName,
                        nomination.NomineeEmployee.Userprofile.LastName,
                        nomination.NomineeEmployee.Userprofile.PersonalEmail,
                        Department = new
                        {
                            nomineeDept?.DepartmentId,
                            DepartmentName = nomineeDept?.Department?.DepartmentName ?? "Unknown"
                        }
                    },
                    NominatedBy = new
                    {
                        nomination.NominatedByEmployee.Userprofile.FirstName,
                        nomination.NominatedByEmployee.Userprofile.LastName
                    },
                    Opportunity = opportunity != null ? new
                    {
                        opportunity.OpportunityName,
                        opportunity.Description,
                        opportunity.Deadline,
                        RewardType = opportunity.RewardType != null ? new
                        {
                            opportunity.RewardType.RewardName,
                            opportunity.RewardType.RewardCategory
                        } : null
                    } : null,
                    ParameterValues = parameterValues
                };

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[NOMINATION_DETAILS] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("approved-profiles")]
        public async Task<IActionResult> GetApprovedProfiles()
        {
            try
            {
                var approvedNominations = await _context.Recognitionstatuses
                    .Where(n => n.Status == "Approved")
                    .Include(n => n.NomineeEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .ToListAsync();

                var result = new List<object>();
                foreach (var n in approvedNominations)
                {
                    var opportunity = await _context.Recognitiondetails
                        .Where(o => o.OpportunityId == n.OpportunityId)
                        .Include(o => o.RewardType)
                        .FirstOrDefaultAsync();

                    var dept = await _context.Employeedetailsmasters
                        .Where(edm => edm.EmployeeId == n.NomineeEmployeeId)
                        .Include(edm => edm.Department)
                        .FirstOrDefaultAsync();

                    result.Add(new
                    {
                        n.NominationId,
                        n.Justification,
                        n.SubmittedAt,
                        n.ReviewedAt,
                        Nominee = new
                        {
                            n.NomineeEmployee.EmployeeId,
                            n.NomineeEmployee.Userprofile.FirstName,
                            n.NomineeEmployee.Userprofile.LastName,
                            DepartmentName = dept?.Department?.DepartmentName ?? "Unknown"
                        },
                        Opportunity = opportunity != null ? new
                        {
                            opportunity.OpportunityName,
                            RewardType = opportunity.RewardType?.RewardName ?? "Unknown",
                            RewardCategory = opportunity.RewardType?.RewardCategory ?? "Unknown"
                        } : null
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = result,
                    message = $"Found {result.Count} approved profiles"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[APPROVED_PROFILES] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("rejected-profiles")]
        public async Task<IActionResult> GetRejectedProfiles()
        {
            try
            {
                var rejectedNominations = await _context.Recognitionstatuses
                    .Where(n => n.Status == "Rejected")
                    .Include(n => n.NomineeEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .ToListAsync();

                _logger.LogInformation($"[REJECTED_PROFILES] Found {rejectedNominations.Count} rejected nominations");

                var result = new List<object>();

                foreach (var n in rejectedNominations)
                {
                    var opportunity = await _context.Recognitiondetails
                        .Where(o => o.OpportunityId == n.OpportunityId)
                        .Include(o => o.RewardType)
                        .FirstOrDefaultAsync();

                    var dept = await _context.Employeedetailsmasters
                        .Where(edm => edm.EmployeeId == n.NomineeEmployeeId)
                        .Include(edm => edm.Department)
                        .FirstOrDefaultAsync();

                    result.Add(new
                    {
                        n.NominationId,
                        n.Justification,
                        n.SubmittedAt,
                        n.ReviewedAt,
                        n.ReviewRemarks,
                        Nominee = new
                        {
                            n.NomineeEmployee.EmployeeId,
                            n.NomineeEmployee.Userprofile.FirstName,
                            n.NomineeEmployee.Userprofile.LastName,
                            DepartmentName = dept?.Department?.DepartmentName ?? "Unknown"
                        },
                        Opportunity = opportunity != null ? new
                        {
                            opportunity.OpportunityName,
                            RewardType = opportunity.RewardType?.RewardName ?? "Unknown",
                            RewardCategory = opportunity.RewardType?.RewardCategory ?? "Unknown"
                        } : null
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = result,
                    message = $"Found {result.Count} rejected profiles"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[REJECTED_PROFILES] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }


[HttpGet("statistics")]
public async Task<IActionResult> GetStatistics()
{
    try
    {
        var totalNominations = await _context.Recognitionstatuses.CountAsync();
        var pendingNominations = await _context.Recognitionstatuses.CountAsync(n => n.Status == "Pending");
        var approvedNominations = await _context.Recognitionstatuses.CountAsync(n => n.Status == "Approved");
        var rejectedNominations = await _context.Recognitionstatuses.CountAsync(n => n.Status == "Rejected");
        var activeOpportunities = await _context.Recognitiondetails.CountAsync(o => o.Status == "Active");

        var nominationsWithOpportunities = await _context.Recognitionstatuses
            .Include(n => n.Opportunity)
                .ThenInclude(o => o.RewardType)
            .ToListAsync();

        var recognitionCount = nominationsWithOpportunities
            .Count(x => x.Opportunity?.RewardType?.RewardCategory == "Recognition");

        var promotionCount = nominationsWithOpportunities
            .Count(x => x.Opportunity?.RewardType?.RewardCategory == "Promotion");

        return Ok(new
        {
            success = true,
            data = new
            {
                totalNominations,
                pendingNominations,
                approvedNominations,
                rejectedNominations,
                activeOpportunities,
                recognitionCount,
                promotionCount
            }
        });
    }
    catch (Exception ex)
    {
        _logger.LogError($"[STATISTICS] Error: {ex.Message}");
        return StatusCode(500, new { success = false, message = ex.Message });
    }
}

    public class ReviewMetricsDto
    {
        public int NominationId { get; set; }
        public int ReviewedByEmployeeId { get; set; }
        public decimal? MeritScore { get; set; }
        public decimal? DiversityScore { get; set; }
        public bool ConflictOfInterest { get; set; }
        public string ReviewNotes { get; set; }
    }
}

}