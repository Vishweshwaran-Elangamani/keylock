using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using System.Security.Claims;
 
namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ManagerNominationController : ControllerBase
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<ManagerNominationController> _logger;
 
        public ManagerNominationController(EEPZDbContext context, ILogger<ManagerNominationController> logger)
        {
            _context = context;
            _logger = logger;
        }
 
        [HttpGet("reward-types")]
public async Task<IActionResult> GetRewardTypes()
{
    try
    {
        _logger.LogInformation("[GET_REWARD_TYPES] Fetching visible reward types for manager nominations");
 
        var rewardTypes = await _context.Rewardtypes
            .Where(rt => rt.IsActive == true
                      && rt.IsVisibleForManagerNomination == true)  // ADD THIS FILTER
            .Select(rt => new
            {
                rt.RewardTypeId,
                rt.RewardCategory,
                rt.RewardName,
                rt.Description,
                rt.IsActive
            })
            .ToListAsync();
 
        _logger.LogInformation($"[GET_REWARD_TYPES] Found {rewardTypes.Count} visible reward types");
 
        return Ok(new
        {
            success = true,
            data = rewardTypes,
            message = $"Found {rewardTypes.Count} visible reward types"
        });
    }
    catch (Exception ex)
    {
        _logger.LogError($"[GET_REWARD_TYPES] Error: {ex.Message}");
        return StatusCode(500, new { success = false, message = ex.Message });
    }
}
 
 
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
 
[HttpGet("opportunities/{rewardTypeId}")]
public async Task<IActionResult> GetOpportunitiesByRewardType(int rewardTypeId)
{
    try
    {
        _logger.LogInformation($"[GET_OPPORTUNITIES_BY_REWARD] Fetching opportunities for Reward Type: {rewardTypeId}");
 
        // ✅ FIXED: Renamed validation variable to avoid conflict
        var validationRewardType = await _context.Rewardtypes
            .FirstOrDefaultAsync(rt => rt.RewardTypeId == rewardTypeId
                                    && rt.IsActive == true
                                    && rt.IsVisibleForManagerNomination == true);
       
        if (validationRewardType == null)
            return NotFound(new { success = false, message = "Reward type not available for manager nominations" });
 
        var opportunities = await _context.Recognitiondetails
            .Where(o => o.Status == "Active"
                     && o.Deadline >= DateOnly.FromDateTime(DateTime.Today)
                     && o.RewardTypeId == rewardTypeId)
            .ToListAsync();
 
        var result = new List<object>();
        foreach (var o in opportunities)
        {
            // ✅ Original variable name is fine here (no conflict)
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
 
        [HttpGet("team/{managerId}")]
        public async Task<IActionResult> GetTeamMembers(int managerId)
        {
            try
            {
                _logger.LogInformation($"[GET_TEAM_MEMBERS] Fetching team members for Manager ID: {managerId}");
 
                var userRole = User.FindFirstValue(ClaimTypes.Role);
                _logger.LogInformation($"[GET_TEAM_MEMBERS] User Role from token: {userRole ?? "Not found"}");
 
                var managerProjectsAsL1 = await _context.Projects
                    .Where(p => p.ResourceOwnerEmployeeId == managerId || p.L1approverEmployeeId == managerId)
                    .Select(p => p.ProjectId)
                    .ToListAsync();
 
                _logger.LogInformation($"[GET_TEAM_MEMBERS] Manager {managerId} is L1 on {managerProjectsAsL1.Count} projects");
 
                if (!managerProjectsAsL1.Any())
                {
                    _logger.LogInformation($"[GET_TEAM_MEMBERS] No L1 projects found for Manager {managerId}");
                    return Ok(new
                    {
                        success = true,
                        data = new List<object>(),
                        message = "No team members found. You must be an L1 manager on a project to nominate employees."
                    });
                }
 
                var resourceOwnerIds = await _context.Projects
                    .Where(p => p.ResourceOwnerEmployeeId != null)
                    .Select(p => p.ResourceOwnerEmployeeId.Value)
                    .Distinct()
                    .ToListAsync();
 
                var l1ApproverIds = await _context.Projects
                    .Where(p => p.L1approverEmployeeId != null)
                    .Select(p => p.L1approverEmployeeId.Value)
                    .Distinct()
                    .ToListAsync();
 
                var l2ApproverIds = await _context.Projects
                    .Where(p => p.L2approverEmployeeId != null)
                    .Select(p => p.L2approverEmployeeId.Value)
                    .Distinct()
                    .ToListAsync();
 
                var allManagerIds = new HashSet<int>();
                allManagerIds.UnionWith(resourceOwnerIds);
                allManagerIds.UnionWith(l1ApproverIds);
                allManagerIds.UnionWith(l2ApproverIds);
 
                _logger.LogInformation($"[GET_TEAM_MEMBERS] Found {allManagerIds.Count} employees who are managers/approvers");
 
                var teamMembers = await _context.Projectemployees
                    .Where(pe => managerProjectsAsL1.Contains(pe.ProjectId))
                    .Include(pe => pe.Employee)
                        .ThenInclude(edm => edm.Employee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(pe => pe.Employee)
                        .ThenInclude(edm => edm.Department)
                    .Where(pe => pe.Employee.Employee.EmploymentStatus == "Active")
                    .Where(pe => !allManagerIds.Contains(pe.Employee.EmployeeId))
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
 
                _logger.LogInformation($"[GET_TEAM_MEMBERS] Found {teamMembers.Count} regular employees for Manager {managerId}");
 
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
 
        [HttpPost("submit")]
public async Task<IActionResult> SubmitNomination([FromBody] NominationSubmitDto dto)
{
    try
    {
        _logger.LogInformation($"[SUBMIT_NOMINATION] Submitting nomination for Employee {dto.NomineeEmployeeId}");

        if (dto.NomineeEmployeeId <= 0 || dto.NominatedByEmployeeId <= 0)
            return BadRequest(new { success = false, message = "Invalid employee IDs" });

        if (string.IsNullOrEmpty(dto.Justification))
            return BadRequest(new { success = false, message = "Justification is required" });

        if (dto.RewardTypeId == null || dto.RewardTypeId <= 0)
            return BadRequest(new { success = false, message = "Reward Type is required" });

        var isL1Manager = await _context.Projects
            .AnyAsync(p => p.ResourceOwnerEmployeeId == dto.NominatedByEmployeeId
                        || p.L1approverEmployeeId == dto.NominatedByEmployeeId);

        if (!isL1Manager)
        {
            _logger.LogWarning($"[SUBMIT_NOMINATION] Employee {dto.NominatedByEmployeeId} is not an L1 manager on any project");
            return StatusCode(403, new { success = false, message = "Only L1 managers can submit nominations" });
        }

        var managerProjectsAsL1 = await _context.Projects
            .Where(p => p.ResourceOwnerEmployeeId == dto.NominatedByEmployeeId
                     || p.L1approverEmployeeId == dto.NominatedByEmployeeId)
            .Select(p => p.ProjectId)
            .ToListAsync();

        var nomineeInManagerProjects = await _context.Projectemployees
            .AnyAsync(pe => managerProjectsAsL1.Contains(pe.ProjectId)
                         && pe.Employee.EmployeeId == dto.NomineeEmployeeId);

        if (!nomineeInManagerProjects)
        {
            _logger.LogWarning($"[SUBMIT_NOMINATION] Nominee {dto.NomineeEmployeeId} is not in manager's L1 projects");
            return StatusCode(403, new { success = false, message = "You can only nominate employees from projects where you are L1 manager" });
        }

        var rewardType = await _context.Rewardtypes
            .FirstOrDefaultAsync(rt => rt.RewardTypeId == dto.RewardTypeId
                                    && rt.IsActive == true
                                    && rt.IsVisibleForManagerNomination == true);

        if (rewardType == null)
            return BadRequest(new {
                success = false,
                message = "Invalid reward type or not available for manager nominations"
            });

        _logger.LogInformation($"[SUBMIT_NOMINATION] Reward Type: {rewardType.RewardName} (Visible: {rewardType.IsVisibleForManagerNomination})");

        // ✅ NEW: Check if this employee has already been nominated for THIS specific reward type
        var existingNomination = await _context.Recognitionstatuses
            .Include(n => n.Opportunity)
            .FirstOrDefaultAsync(n => n.NomineeEmployeeId == dto.NomineeEmployeeId
                                   && n.Opportunity.RewardTypeId == dto.RewardTypeId
                                   && n.NominationType == "ManagerNomination");

        if (existingNomination != null)
        {
            _logger.LogWarning($"[SUBMIT_NOMINATION] Employee {dto.NomineeEmployeeId} already nominated for RewardType {dto.RewardTypeId}");
            
            return BadRequest(new
            {
                success = false,
                message = $"This employee has already been nominated for {rewardType.RewardName}. Please select a different award."
            });
        }

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

        if (dto.ParameterValues != null && dto.ParameterValues.Any())
        {
            var uniqueParams = dto.ParameterValues
                .GroupBy(p => p.ParameterId)
                .Select(g => g.First())
                .ToList();

            foreach (var param in uniqueParams)
            {
                if (param.ParameterId <= 0) continue;

                var parameterExists = await _context.Nominationparameters
                    .AnyAsync(np => np.ParameterId == param.ParameterId
                        && np.RewardTypeId == dto.RewardTypeId);

                if (!parameterExists) continue;

                var existingParamValue = await _context.Nominationparametervalues
                    .FirstOrDefaultAsync(npv => npv.NominationId == recognitionstatus.NominationId
                                              && npv.ParameterId == param.ParameterId);

                if (existingParamValue != null)
                {
                    existingParamValue.ParameterValue = param.Value ?? "";
                    existingParamValue.CreatedAt = DateTime.UtcNow;
                    _context.Nominationparametervalues.Update(existingParamValue);
                }
                else
                {
                    var paramValue = new Nominationparametervalue
                    {
                        NominationId = recognitionstatus.NominationId,
                        ParameterId = param.ParameterId,
                        ParameterValue = param.Value ?? "",
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Nominationparametervalues.Add(paramValue);
                }
            }

            await _context.SaveChangesAsync();
        }

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



// ✅ NEW: Get existing nominations for an employee
[HttpGet("employee-nominations/{employeeId}")]
public async Task<IActionResult> GetEmployeeNominations(int employeeId)
{
    try
    {
        _logger.LogInformation($"[GET_EMPLOYEE_NOMINATIONS] Fetching nominations for Employee {employeeId}");

        var nominations = await _context.Recognitionstatuses
            .Include(n => n.Opportunity)
                .ThenInclude(o => o.RewardType)
            .Where(n => n.NomineeEmployeeId == employeeId
                     && n.NominationType == "ManagerNomination")
            .Select(n => new
            {
                n.NominationId,
                n.Status,
                n.SubmittedAt,
                RewardTypeId = n.Opportunity.RewardTypeId,
                RewardTypeName = n.Opportunity.RewardType.RewardName,
                OpportunityName = n.Opportunity.OpportunityName
            })
            .ToListAsync();

        _logger.LogInformation($"[GET_EMPLOYEE_NOMINATIONS] Found {nominations.Count} nominations for Employee {employeeId}");

        return Ok(new
        {
            success = true,
            data = nominations,
            message = $"Found {nominations.Count} existing nominations"
        });
    }
    catch (Exception ex)
    {
        _logger.LogError($"[GET_EMPLOYEE_NOMINATIONS] Error: {ex.Message}");
        return StatusCode(500, new { success = false, message = ex.Message });
    }
}



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
                        RewardTypeId = opportunity?.RewardTypeId,
                        Nominee = new
                        {
                            EmployeeId = nomineeEmployee?.EmployeeId ?? 0,
                            FirstName = userProfile?.FirstName ?? "Unknown",
                            LastName = userProfile?.LastName ?? "",
                            DepartmentName = department?.DepartmentName ?? "Unknown",
                            Department = department != null ? new
                            {
                                DepartmentId = department.DepartmentId,
                                DepartmentName = department.DepartmentName
                            } : null
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
 
 
 