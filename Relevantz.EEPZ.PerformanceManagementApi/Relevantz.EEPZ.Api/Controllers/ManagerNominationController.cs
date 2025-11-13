using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ManagerNominationController : ControllerBase
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<ManagerNominationController> _logger;

        public ManagerNominationController(EEPZDbContext context, ILogger<ManagerNominationController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get all active reward types (Recognition, Promotion, etc.)
        /// </summary>
        [HttpGet("reward-types")]
        public async Task<IActionResult> GetRewardTypes()
        {
            try
            {
                _logger.LogInformation("[GET_REWARD_TYPES] Fetching all active reward types");

                var rewardTypes = await _context.Rewardtypes
                    .Where(rt => rt.IsActive == true)
                    .Select(rt => new
                    {
                        rt.RewardTypeId,
                        rt.RewardCategory,
                        rt.RewardName,
                        rt.Description,
                        rt.IsActive
                    })
                    .ToListAsync();

                _logger.LogInformation($"[GET_REWARD_TYPES] Found {rewardTypes.Count} active reward types");

                return Ok(new
                {
                    success = true,
                    data = rewardTypes,
                    message = $"Found {rewardTypes.Count} active reward types"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[GET_REWARD_TYPES] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get all active opportunities
        /// ✅ FIXED: Removed broken Include navigation
        /// </summary>
        [HttpGet("opportunities")]
        public async Task<IActionResult> GetOpportunities()
        {
            try
            {
                _logger.LogInformation("[GET_OPPORTUNITIES] Fetching all active opportunities");

                var opportunities = await _context.Recognitiondetails
                    .Where(o => o.Status == "Active" && o.Deadline >= DateOnly.FromDateTime(DateTime.Today))
                    .ToListAsync();

                var result = new List<object>();
                foreach (var o in opportunities)
                {
                    // ✅ Fetch RewardType and Department separately
                    var rewardType = await _context.Rewardtypes
                        .FirstOrDefaultAsync(rt => rt.RewardTypeId == o.RewardTypeId);
                    
                    var department = await _context.Departments
                        .FirstOrDefaultAsync(d => d.DepartmentId == o.DepartmentId);

                    result.Add(new
                    {
                        o.OpportunityId,
                        o.OpportunityName,
                        o.Description,
                        o.Deadline,
                        o.Requirements,
                        o.EligibilityCriteria,
                        RewardType = rewardType != null ? new
                        {
                            rewardType.RewardTypeId,
                            rewardType.RewardCategory,
                            rewardType.RewardName
                        } : null,
                        Department = department != null ? new
                        {
                            department.DepartmentId,
                            department.DepartmentName
                        } : null
                    });
                }

                _logger.LogInformation($"[GET_OPPORTUNITIES] Found {result.Count} active opportunities");

                return Ok(new
                {
                    success = true,
                    data = result,
                    message = $"Found {result.Count} active opportunities"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[GET_OPPORTUNITIES] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get opportunities by specific reward type
        /// ✅ FIXED: Removed broken Include navigation
        /// </summary>
        [HttpGet("opportunities/{rewardTypeId}")]
        public async Task<IActionResult> GetOpportunitiesByRewardType(int rewardTypeId)
        {
            try
            {
                _logger.LogInformation($"[GET_OPPORTUNITIES_BY_REWARD] Fetching opportunities for Reward Type: {rewardTypeId}");

                var opportunities = await _context.Recognitiondetails
                    .Where(o => o.Status == "Active"
                        && o.Deadline >= DateOnly.FromDateTime(DateTime.Today)
                        && o.RewardTypeId == rewardTypeId)
                    .ToListAsync();

                var result = new List<object>();
                foreach (var o in opportunities)
                {
                    // ✅ Fetch RewardType separately
                    var rewardType = await _context.Rewardtypes
                        .FirstOrDefaultAsync(rt => rt.RewardTypeId == o.RewardTypeId);

                    result.Add(new
                    {
                        o.OpportunityId,
                        o.OpportunityName,
                        o.Description,
                        o.Deadline,
                        RewardTypeName = rewardType?.RewardName ?? "Unknown"
                    });
                }

                _logger.LogInformation($"[GET_OPPORTUNITIES_BY_REWARD] Found {result.Count} opportunities for Reward Type {rewardTypeId}");

                return Ok(new
                {
                    success = true,
                    data = result,
                    message = $"Found {result.Count} opportunities"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[GET_OPPORTUNITIES_BY_REWARD] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get nomination parameters for a specific reward type
        /// HR-CREATED PARAMETERS are stored in NominationParameter table with RewardTypeId
        /// </summary>
        [HttpGet("parameters/{rewardTypeId}")]
        public async Task<IActionResult> GetNominationParameters(int rewardTypeId)
        {
            try
            {
                _logger.LogInformation($"[GET_PARAMETERS] Fetching parameters for Reward Type: {rewardTypeId}");

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

                _logger.LogInformation($"[GET_PARAMETERS] Found {parameters.Count} parameters for Reward Type {rewardTypeId}");

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

        /// <summary>
        /// Get team members for a specific manager
        /// Retrieves employees from projects where manager is ResourceOwner, L1 Approver, or L2 Approver
        /// </summary>
        [HttpGet("team/{managerId}")]
        public async Task<IActionResult> GetTeamMembers(int managerId)
        {
            try
            {
                _logger.LogInformation($"[GET_TEAM_MEMBERS] Fetching team members for Manager ID: {managerId}");

                var managerProjects = await _context.Projects
                    .Where(p => p.ResourceOwnerEmployeeId == managerId
                             || p.L1approverEmployeeId == managerId
                             || p.L2approverEmployeeId == managerId)
                    .Select(p => p.ProjectId)
                    .ToListAsync();

                _logger.LogInformation($"[GET_TEAM_MEMBERS] Manager {managerId} is associated with {managerProjects.Count} projects");

                if (!managerProjects.Any())
                {
                    _logger.LogInformation($"[GET_TEAM_MEMBERS] No projects found for Manager {managerId}");
                    return Ok(new
                    {
                        success = true,
                        data = new List<object>(),
                        message = "No team members found for this manager"
                    });
                }

                var teamMembers = await _context.Projectemployees
                    .Where(pe => managerProjects.Contains(pe.ProjectId))
                    .Include(pe => pe.Employee)
                        .ThenInclude(edm => edm.Employee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(pe => pe.Employee)
                        .ThenInclude(edm => edm.Department)
                    .Where(pe => pe.Employee.Employee.EmploymentStatus == "Active")
                    .Select(pe => new
                    {
                        pe.Employee.Employee.EmployeeId,
                        FirstName = pe.Employee.Employee.Userprofile.FirstName,
                        LastName = pe.Employee.Employee.Userprofile.LastName,
                        Email = pe.Employee.Employee.Userprofile.PersonalEmail,
                        Department = new
                        {
                            pe.Employee.Department.DepartmentId,
                            pe.Employee.Department.DepartmentName
                        }
                    })
                    .Distinct()
                    .ToListAsync();

                _logger.LogInformation($"[GET_TEAM_MEMBERS] Found {teamMembers.Count} team members for Manager {managerId}");

                return Ok(new
                {
                    success = true,
                    data = teamMembers,
                    message = $"Found {teamMembers.Count} team members"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[GET_TEAM_MEMBERS] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Submit a nomination for a team member
        /// Manager selects reward type (Recognition/Promotion) and fills HR-created parameters
        /// OpportunityId is REQUIRED (from RecognitionDetails table)
        /// </summary>
        [HttpPost("submit")]
        public async Task<IActionResult> SubmitNomination([FromBody] NominationSubmitDto dto)
        {
            try
            {
                _logger.LogInformation($"[SUBMIT_NOMINATION] Submitting nomination for Employee {dto.NomineeEmployeeId}");

                // Validate
                if (dto.NomineeEmployeeId <= 0 || dto.NominatedByEmployeeId <= 0)
                    return BadRequest(new { success = false, message = "Invalid employee IDs" });

                if (string.IsNullOrEmpty(dto.Justification))
                    return BadRequest(new { success = false, message = "Justification is required" });

                if (dto.RewardTypeId == null || dto.RewardTypeId <= 0)
                    return BadRequest(new { success = false, message = "Reward Type is required" });

                // Verify reward type exists
                var rewardType = await _context.Rewardtypes
                    .FirstOrDefaultAsync(rt => rt.RewardTypeId == dto.RewardTypeId && rt.IsActive == true);

                if (rewardType == null)
                    return BadRequest(new { success = false, message = "Invalid reward type" });

                _logger.LogInformation($"[SUBMIT_NOMINATION] Reward Type: {rewardType.RewardName}");

                // Find or create a default opportunity for this reward type
                var defaultOpportunity = await _context.Recognitiondetails
                    .FirstOrDefaultAsync(o => o.RewardTypeId == dto.RewardTypeId
                        && o.OpportunityName.Contains("Manager"));

                int opportunityId;

                if (defaultOpportunity == null)
                {
                    _logger.LogInformation($"[SUBMIT_NOMINATION] Creating default opportunity for RewardType {dto.RewardTypeId}");

                    defaultOpportunity = new Recognitiondetail
                    {
                        RewardTypeId = dto.RewardTypeId.Value,
                        OpportunityName = $"Manager Direct Nomination - {rewardType.RewardName}",
                        Description = "Direct nomination by manager for this reward type",
                        DepartmentId = 1,
                        Deadline = DateOnly.FromDateTime(DateTime.Now.AddYears(10)),
                        Status = "Active",
                        PostedByUserId = 1,
                        CreatedAt = DateTime.UtcNow,
                        Requirements = "Nominated by direct manager",
                        EligibilityCriteria = "Active employees"
                    };

                    _context.Recognitiondetails.Add(defaultOpportunity);
                    await _context.SaveChangesAsync();

                    opportunityId = defaultOpportunity.OpportunityId;
                    _logger.LogInformation($"[SUBMIT_NOMINATION] Default opportunity created: {opportunityId}");
                }
                else
                {
                    opportunityId = defaultOpportunity.OpportunityId;
                }

                // Create nomination
                var recognitionstatus = new Recognitionstatus
                {
                    OpportunityId = opportunityId,
                    NomineeEmployeeId = dto.NomineeEmployeeId,
                    NominationType = "ManagerNomination",
                    NominatedByEmployeeId = dto.NominatedByEmployeeId,
                    Justification = dto.Justification,
                    Status = "Pending",
                    SubmittedAt = DateTime.UtcNow,
                    ReviewRemarks = $"DirectManagerNomination|RewardType:{dto.RewardTypeId}|User-Submitted"
                };

                _context.Recognitionstatuses.Add(recognitionstatus);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"[SUBMIT_NOMINATION] Nomination created: {recognitionstatus.NominationId}");

                // Add parameter values
                if (dto.ParameterValues != null && dto.ParameterValues.Any())
                {
                    foreach (var param in dto.ParameterValues)
                    {
                        if (param.ParameterId <= 0) continue;

                        var parameterExists = await _context.Nominationparameters
                            .AnyAsync(np => np.ParameterId == param.ParameterId
                                && np.RewardTypeId == dto.RewardTypeId);

                        if (!parameterExists) continue;

                        var paramValue = new Nominationparametervalue
                        {
                            NominationId = recognitionstatus.NominationId,
                            ParameterId = param.ParameterId,
                            ParameterValue = param.Value ?? "",
                            CreatedAt = DateTime.UtcNow
                        };

                        _context.Nominationparametervalues.Add(paramValue);
                    }

                    await _context.SaveChangesAsync();
                }

                // Add tracking
                var tracking = new Nominationvisibilitytracking
                {
                    NominationId = recognitionstatus.NominationId,
                    ViewedByEmployeeId = dto.NominatedByEmployeeId,
                    ActionTaken = "Submitted",
                    ViewedAt = DateTime.UtcNow
                };

                _context.Nominationvisibilitytrackings.Add(tracking);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    data = new { nominationId = recognitionstatus.NominationId },
                    message = "Nomination submitted successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[SUBMIT_NOMINATION] Error: {ex.Message}\n{ex.InnerException?.Message}");
                return StatusCode(500, new { success = false, message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        /// <summary>
        /// Get all nominations submitted by a specific manager
        /// ✅ FIXED: Removed broken Include navigation
        /// </summary>
        [HttpGet("my-nominations/{managerId}")]
        public async Task<IActionResult> GetMyNominations(int managerId)
        {
            try
            {
                _logger.LogInformation($"[GET_MY_NOMINATIONS] Fetching nominations for Manager {managerId}");

                var nominations = await _context.Recognitionstatuses
                    .Where(n => n.NominatedByEmployeeId == managerId)
                    .ToListAsync();

                _logger.LogInformation($"[GET_MY_NOMINATIONS] Found {nominations.Count} nominations for Manager {managerId}");

                var result = new List<object>();
                foreach (var n in nominations)
                {
                    // ✅ Fetch related data separately
                    var opportunity = await _context.Recognitiondetails
                        .FirstOrDefaultAsync(o => o.OpportunityId == n.OpportunityId);

                    var rewardType = opportunity != null
                        ? await _context.Rewardtypes.FirstOrDefaultAsync(rt => rt.RewardTypeId == opportunity.RewardTypeId)
                        : null;

                    var nomineeEmployee = await _context.Employees
                        .FirstOrDefaultAsync(e => e.EmployeeId == n.NomineeEmployeeId);

                    var userProfile = nomineeEmployee != null
                        ? await _context.Userprofiles.FirstOrDefaultAsync(up => up.EmployeeId == nomineeEmployee.EmployeeId)
                        : null;

                    var dept = await _context.Employeedetailsmasters
                        .Where(edm => edm.EmployeeId == n.NomineeEmployeeId)
                        .FirstOrDefaultAsync();

                    var department = dept != null
                        ? await _context.Departments.FirstOrDefaultAsync(d => d.DepartmentId == dept.DepartmentId)
                        : null;

                    result.Add(new
                    {
                        n.NominationId,
                        n.Status,
                        n.Justification,
                        n.SubmittedAt,
                        n.ReviewedAt,
                        n.ReviewRemarks,
                        Nominee = new
                        {
                            EmployeeId = nomineeEmployee?.EmployeeId ?? 0,
                            FirstName = userProfile?.FirstName ?? "Unknown",
                            LastName = userProfile?.LastName ?? "",
                            DepartmentName = department?.DepartmentName ?? "Unknown"
                        },
                        Opportunity = new
                        {
                            OpportunityName = opportunity?.OpportunityName ?? "Unknown",
                            Deadline = opportunity?.Deadline,
                            RewardType = rewardType?.RewardName ?? "Unknown"
                        }
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = result,
                    message = $"Found {result.Count} nominations"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[GET_MY_NOMINATIONS] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get detailed information about a specific nomination
        /// Including all HR-created parameters filled by manager
        /// ✅ FIXED: Removed broken Include navigation
        /// </summary>
        [HttpGet("nomination-details/{nominationId}")]
        public async Task<IActionResult> GetNominationDetails(int nominationId)
        {
            try
            {
                _logger.LogInformation($"[GET_NOMINATION_DETAILS] Fetching details for Nomination {nominationId}");

                var nomination = await _context.Recognitionstatuses
                    .FirstOrDefaultAsync(n => n.NominationId == nominationId);

                if (nomination == null)
                {
                    _logger.LogWarning($"[GET_NOMINATION_DETAILS] Nomination {nominationId} not found");
                    return NotFound(new { success = false, message = "Nomination not found" });
                }

                // ✅ Fetch related data separately
                var opportunity = await _context.Recognitiondetails
                    .FirstOrDefaultAsync(o => o.OpportunityId == nomination.OpportunityId);

                var rewardType = opportunity != null
                    ? await _context.Rewardtypes.FirstOrDefaultAsync(rt => rt.RewardTypeId == opportunity.RewardTypeId)
                    : null;

                var nomineeEmployee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.EmployeeId == nomination.NomineeEmployeeId);

                var nomineeProfile = nomineeEmployee != null
                    ? await _context.Userprofiles.FirstOrDefaultAsync(up => up.EmployeeId == nomineeEmployee.EmployeeId)
                    : null;

                var nominatorEmployee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.EmployeeId == nomination.NominatedByEmployeeId);

                var nominatorProfile = nominatorEmployee != null
                    ? await _context.Userprofiles.FirstOrDefaultAsync(up => up.EmployeeId == nominatorEmployee.EmployeeId)
                    : null;

                // Get all parameter values
                var parameterValues = await _context.Nominationparametervalues
                    .Where(pv => pv.NominationId == nominationId)
                    .ToListAsync();

                var parameterResults = new List<object>();
                foreach (var pv in parameterValues)
                {
                    var parameter = await _context.Nominationparameters
                        .FirstOrDefaultAsync(p => p.ParameterId == pv.ParameterId);

                    if (parameter != null)
                    {
                        parameterResults.Add(new
                        {
                            parameter.ParameterId,
                            parameter.ParameterName,
                            parameter.ParameterType,
                            pv.ParameterValue
                        });
                    }
                }

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
                        EmployeeId = nomineeEmployee?.EmployeeId ?? 0,
                        FirstName = nomineeProfile?.FirstName ?? "Unknown",
                        LastName = nomineeProfile?.LastName ?? "",
                        Email = nomineeProfile?.PersonalEmail ?? ""
                    },
                    NominatedBy = new
                    {
                        FirstName = nominatorProfile?.FirstName ?? "Unknown",
                        LastName = nominatorProfile?.LastName ?? ""
                    },
                    Opportunity = new
                    {
                        OpportunityName = opportunity?.OpportunityName ?? "Unknown",
                        Description = opportunity?.Description ?? "",
                        RewardType = rewardType?.RewardName ?? "Unknown"
                    },
                    ParameterValues = parameterResults
                };

                _logger.LogInformation($"[GET_NOMINATION_DETAILS] Nomination {nominationId} details retrieved with {parameterResults.Count} parameters");

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[GET_NOMINATION_DETAILS] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    public class NominationSubmitDto
    {
        public int? RewardTypeId { get; set; }
        public int NomineeEmployeeId { get; set; }
        public int NominatedByEmployeeId { get; set; }
        public string Justification { get; set; }
        public List<ParameterValueDto> ParameterValues { get; set; }
    }

    public class ParameterValueDto
    {
        public int ParameterId { get; set; }
        public string Value { get; set; }
    }
}
