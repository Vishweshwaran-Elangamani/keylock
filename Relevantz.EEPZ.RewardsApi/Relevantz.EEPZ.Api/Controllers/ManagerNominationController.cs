
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class ManagerNominationController : ControllerBase
    {
        private readonly EEPZDbContext _context;
        private readonly IManagerNominationService _managerNominationService;
        private readonly ILogger<ManagerNominationController> _logger;

        public ManagerNominationController(
            EEPZDbContext context,
            ILogger<ManagerNominationController> logger,
             IManagerNominationService managerNominationService
        )
        {
            _context = context;
            _logger = logger;
            _managerNominationService = managerNominationService;
        }

        // -------------------------------------------------------------
        // GET: api/ManagerNomination/reward-types
        // -------------------------------------------------------------
        [HttpGet("reward-types")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetRewardTypes(CancellationToken cancellationToken)
        {
            _logger.LogInformation("[GET_REWARD_TYPES] Fetching visible reward types for manager nominations");

            var rewardTypes = await _context.Rewardtypes
                .AsNoTracking()
                .Where(rt => rt.IsActive == true && rt.IsVisibleForManagerNomination == true)
                .Select(rt => new
                {
                    rt.RewardTypeId,
                    rt.RewardCategory,
                    rt.RewardName,
                    rt.Description,
                    rt.IsActive
                })
                .ToListAsync(cancellationToken);

            _logger.LogInformation("[GET_REWARD_TYPES] Found {Count} visible reward types", rewardTypes.Count);

            return Ok(new
            {
                success = true,
                data = rewardTypes,
                message = $"Found {rewardTypes.Count} visible reward types"
            });
        }

        // -------------------------------------------------------------
        // GET: api/ManagerNomination/opportunities
        // -------------------------------------------------------------
        [HttpGet("opportunities")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetOpportunities(CancellationToken cancellationToken)
        {
            _logger.LogInformation("[GET_OPPORTUNITIES] Fetching all active opportunities");

            var today = DateOnly.FromDateTime(DateTime.Today);
            var opportunities = await (
                from o in _context.Recognitiondetails.AsNoTracking()
                join rt in _context.Rewardtypes.AsNoTracking()
                    on o.RewardTypeId equals rt.RewardTypeId into rtg
                from rt in rtg.DefaultIfEmpty()
                join d in _context.Departments.AsNoTracking()
                    on o.DepartmentId equals d.DepartmentId into dg
                from d in dg.DefaultIfEmpty()
                where o.Status == "Active" && o.Deadline >= today
                select new
                {
                    o.OpportunityId,
                    o.OpportunityName,
                    o.Description,
                    o.Deadline,
                    o.Requirements,
                    o.EligibilityCriteria,
                    RewardType = rt == null ? null : new
                    {
                        rt.RewardTypeId,
                        rt.RewardCategory,
                        rt.RewardName
                    },
                    Department = d == null ? null : new
                    {
                        d.DepartmentId,
                        d.DepartmentName
                    }
                }
            ).ToListAsync(cancellationToken);

            _logger.LogInformation("[GET_OPPORTUNITIES] Found {Count} active opportunities", opportunities.Count);

            return Ok(new
            {
                success = true,
                data = opportunities,
                message = $"Found {opportunities.Count} active opportunities"
            });
        }

        // -------------------------------------------------------------
        // GET: api/ManagerNomination/opportunities/{rewardTypeId}
        // -------------------------------------------------------------
        [HttpGet("opportunities/{rewardTypeId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetOpportunitiesByRewardType([FromRoute] int rewardTypeId, CancellationToken cancellationToken)
        {
            _logger.LogInformation("[GET_OPPORTUNITIES_BY_REWARD] Fetching opportunities for Reward Type: {RewardTypeId}", rewardTypeId);

            var validationRewardType = await _context.Rewardtypes
                .AsNoTracking()
                .FirstOrDefaultAsync(rt =>
                    rt.RewardTypeId == rewardTypeId &&
                    rt.IsActive == true &&
                    rt.IsVisibleForManagerNomination == true, cancellationToken);

            if (validationRewardType is null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Reward type not available for manager nominations"
                });
            }

            var today = DateOnly.FromDateTime(DateTime.Today);

            var opportunities = await (
                from o in _context.Recognitiondetails.AsNoTracking()
                join rt in _context.Rewardtypes.AsNoTracking()
                    on o.RewardTypeId equals rt.RewardTypeId into rtg
                from rt in rtg.DefaultIfEmpty()
                where o.Status == "Active" &&
                      o.Deadline >= today &&
                      o.RewardTypeId == rewardTypeId
                select new
                {
                    o.OpportunityId,
                    o.OpportunityName,
                    o.Description,
                    o.Deadline,
                    RewardTypeName = rt != null ? rt.RewardName : "Unknown"
                }
            ).ToListAsync(cancellationToken);

            _logger.LogInformation("[GET_OPPORTUNITIES_BY_REWARD] Found {Count} opportunities for Reward Type {RewardTypeId}", opportunities.Count, rewardTypeId);

            return Ok(new
            {
                success = true,
                data = opportunities,
                message = $"Found {opportunities.Count} opportunities"
            });
        }

        // -------------------------------------------------------------
        // GET: api/ManagerNomination/parameters/{rewardTypeId}
        // -------------------------------------------------------------
        [HttpGet("parameters/{rewardTypeId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetNominationParameters([FromRoute] int rewardTypeId, CancellationToken cancellationToken)
        {
            _logger.LogInformation("[GET_PARAMETERS] Fetching parameters for Reward Type: {RewardTypeId}", rewardTypeId);

            var parameters = await _context.Nominationparameters
                .AsNoTracking()
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
                .ToListAsync(cancellationToken);

            _logger.LogInformation("[GET_PARAMETERS] Found {Count} parameters for Reward Type {RewardTypeId}", parameters.Count, rewardTypeId);

            return Ok(new
            {
                success = true,
                data = parameters,
                message = $"Found {parameters.Count} parameters"
            });
        }

        // -------------------------------------------------------------
        // GET: api/ManagerNomination/team/{managerId}
        // -------------------------------------------------------------
        [HttpGet("team/{managerId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetTeamMembers([FromRoute] int managerId, CancellationToken cancellationToken)
        {
            _logger.LogInformation("[GET_TEAM_MEMBERS] Fetching team members for Manager ID: {ManagerId}", managerId);

            var managerProjectsAsL1 = await _context.Projects
                .AsNoTracking()
                .Where(p => p.ResourceOwnerEmployeeId == managerId || p.L1approverEmployeeId == managerId)
                .Select(p => p.ProjectId)
                .ToListAsync(cancellationToken);

            _logger.LogInformation("[GET_TEAM_MEMBERS] Manager {ManagerId} is L1 on {Count} projects", managerId, managerProjectsAsL1.Count);

            if (managerProjectsAsL1.Count == 0)
            {
                return Ok(new
                {
                    success = true,
                    data = Array.Empty<object>(),
                    message = "No team members found. You must be an L1 manager on a project to nominate employees."
                });
            }

            var resourceOwnerIds = await _context.Projects
                .AsNoTracking()
                .Where(p => p.ResourceOwnerEmployeeId != null)
                .Select(p => p.ResourceOwnerEmployeeId!.Value)
                .Distinct()
                .ToListAsync(cancellationToken);

            var l1ApproverIds = await _context.Projects
                .AsNoTracking()
                .Where(p => p.L1approverEmployeeId != null)
                .Select(p => p.L1approverEmployeeId!.Value)
                .Distinct()
                .ToListAsync(cancellationToken);

            var l2ApproverIds = await _context.Projects
                .AsNoTracking()
                .Where(p => p.L2approverEmployeeId != null)
                .Select(p => p.L2approverEmployeeId!.Value)
                .Distinct()
                .ToListAsync(cancellationToken);

            var allManagerIds = new HashSet<int>(resourceOwnerIds);
            allManagerIds.UnionWith(l1ApproverIds);
            allManagerIds.UnionWith(l2ApproverIds);

            _logger.LogInformation("[GET_TEAM_MEMBERS] Found {Count} employees who are managers/approvers", allManagerIds.Count);

            var teamMembers = await _context.Projectemployees
                .AsNoTracking()
                .Where(pe => managerProjectsAsL1.Contains(pe.ProjectId))
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
                .GroupBy(x => x.EmployeeId)
                .Select(g => g.First())
                .ToListAsync(cancellationToken);

            _logger.LogInformation("[GET_TEAM_MEMBERS] Found {Count} regular employees for Manager {ManagerId}", teamMembers.Count, managerId);

            return Ok(new
            {
                success = true,
                data = teamMembers,
                message = $"Found {teamMembers.Count} team members"
            });
        }

        // -------------------------------------------------------------
        // POST: api/ManagerNomination/submit
        // -------------------------------------------------------------
        
[HttpPost("submit")]
[ProducesResponseType(StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[ProducesResponseType(StatusCodes.Status400BadRequest)]
public async Task<IActionResult> CreateNomination(
    [FromBody] Relevantz.EEPZ.Common.DTOs.Request.NominationSubmitDto request,
    CancellationToken cancellationToken)
{
    if (request is null)
        return BadRequest(new { success = false, message = "Payload is required" });

    var res = await _managerNominationService.SubmitNominationAsync(request);

    var type = res.GetType();
    var statusProp = type.GetProperty("statusCode") ?? type.GetProperty("StatusCode");
    var code = 200;
    if (statusProp != null)
    {
        var val = statusProp.GetValue(res);
        if (val is int i) code = i;
        else if (val != null && int.TryParse(val.ToString(), out var parsed)) code = parsed;
    }

    return StatusCode(code, res);
}


        // -------------------------------------------------------------
        // GET: api/ManagerNomination/employee-nominations/{employeeId}
        // -------------------------------------------------------------
        [HttpGet("employee-nominations/{employeeId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetEmployeeNominations([FromRoute] int employeeId, CancellationToken cancellationToken)
        {
            _logger.LogInformation("[GET_EMPLOYEE_NOMINATIONS] Fetching nominations for Employee {EmployeeId}", employeeId);

            var nominations = await (
                from n in _context.Recognitionstatuses.AsNoTracking()
                join o in _context.Recognitiondetails.AsNoTracking()
                    on n.OpportunityId equals o.OpportunityId
                join rt in _context.Rewardtypes.AsNoTracking()
                    on o.RewardTypeId equals rt.RewardTypeId
                where n.NomineeEmployeeId == employeeId &&
                      n.NominationType == "ManagerNomination"
                select new
                {
                    n.NominationId,
                    n.Status,
                    n.SubmittedAt,
                    RewardTypeId = o.RewardTypeId,
                    RewardTypeName = rt.RewardName,
                    OpportunityName = o.OpportunityName
                }
            ).ToListAsync(cancellationToken);

            _logger.LogInformation("[GET_EMPLOYEE_NOMINATIONS] Found {Count} nominations for Employee {EmployeeId}", nominations.Count, employeeId);

            return Ok(new
            {
                success = true,
                data = nominations,
                message = $"Found {nominations.Count} existing nominations"
            });
        }

        // -------------------------------------------------------------
        // GET: api/ManagerNomination/my-nominations/{managerId}
        // -------------------------------------------------------------
        [HttpGet("my-nominations/{managerId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMyNominations([FromRoute] int managerId, CancellationToken cancellationToken)
        {
            _logger.LogInformation("[GET_MY_NOMINATIONS] Fetching nominations for Manager {ManagerId}", managerId);

            var result = await (
                from n in _context.Recognitionstatuses.AsNoTracking()
                join o in _context.Recognitiondetails.AsNoTracking()
                    on n.OpportunityId equals o.OpportunityId
                join rt in _context.Rewardtypes.AsNoTracking()
                    on o.RewardTypeId equals rt.RewardTypeId into rtg
                from rt in rtg.DefaultIfEmpty()
                join edm in _context.Employeedetailsmasters.AsNoTracking()
                    on n.NomineeEmployeeId equals edm.EmployeeId into edmg
                from edm in edmg.DefaultIfEmpty()
                join d in _context.Departments.AsNoTracking()
                    on edm!.DepartmentId equals d.DepartmentId into dg
                from d in dg.DefaultIfEmpty()
                join up in _context.Userprofiles.AsNoTracking()
                    on n.NomineeEmployeeId equals up.EmployeeId into upg
                from up in upg.DefaultIfEmpty()
                where n.NominatedByEmployeeId == managerId
                select new
                {
                    n.NominationId,
                    n.Status,
                    n.Justification,
                    n.SubmittedAt,
                    n.ReviewedAt,
                    n.ReviewRemarks,
                    RewardTypeId = o.RewardTypeId,
                    Nominee = new
                    {
                        EmployeeId = n.NomineeEmployeeId,
                        FirstName = up != null ? up.FirstName : "Unknown",
                        LastName = up != null ? up.LastName : string.Empty,
                        DepartmentName = d != null ? d.DepartmentName : "Unknown",
                        Department = d == null ? null : new
                        {
                            d.DepartmentId,
                            d.DepartmentName
                        }
                    },
                    Opportunity = new
                    {
                        OpportunityName = o.OpportunityName,
                        Deadline = o.Deadline,
                        RewardType = rt != null ? rt.RewardName : "Unknown"
                    }
                }
            ).ToListAsync(cancellationToken);

            return Ok(new
            {
                success = true,
                data = result,
                message = $"Found {result.Count} nominations"
            });
        }

        // -------------------------------------------------------------
        // GET: api/ManagerNomination/nomination-details/{nominationId}
        // -------------------------------------------------------------
        [HttpGet("nomination-details/{nominationId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetNomination([FromRoute] int nominationId, CancellationToken cancellationToken)
        {
            _logger.LogInformation("[GET_NOMINATION_DETAILS] Fetching details for Nomination {NominationId}", nominationId);

            var baseInfo = await (
                from n in _context.Recognitionstatuses.AsNoTracking()
                join o in _context.Recognitiondetails.AsNoTracking()
                    on n.OpportunityId equals o.OpportunityId into og
                from o in og.DefaultIfEmpty()
                join rt in _context.Rewardtypes.AsNoTracking()
                    on o!.RewardTypeId equals rt.RewardTypeId into rtg
                from rt in rtg.DefaultIfEmpty()
                join nomineeEmp in _context.Employees.AsNoTracking()
                    on n.NomineeEmployeeId equals nomineeEmp.EmployeeId into neg
                from nomineeEmp in neg.DefaultIfEmpty()
                join nomineeUp in _context.Userprofiles.AsNoTracking()
                    on nomineeEmp!.EmployeeId equals nomineeUp.EmployeeId into nug
                from nomineeUp in nug.DefaultIfEmpty()
                join nominatorEmp in _context.Employees.AsNoTracking()
                    on n.NominatedByEmployeeId equals nominatorEmp.EmployeeId into nog
                from nominatorEmp in nog.DefaultIfEmpty()
                join nominatorUp in _context.Userprofiles.AsNoTracking()
                    on nominatorEmp!.EmployeeId equals nominatorUp.EmployeeId into nupg
                from nominatorUp in nupg.DefaultIfEmpty()
                where n.NominationId == nominationId
                select new
                {
                    Nomination = n,
                    Opportunity = o,
                    RewardType = rt,
                    NomineeProfile = nomineeUp,
                    NominatorProfile = nominatorUp
                }
            ).FirstOrDefaultAsync(cancellationToken);

            if (baseInfo is null)
            {
                _logger.LogWarning("[GET_NOMINATION_DETAILS] Nomination {NominationId} not found", nominationId);
                return NotFound(new { success = false, message = "Nomination not found" });
            }

            var parameterResults = await (
                from pv in _context.Nominationparametervalues.AsNoTracking()
                join p in _context.Nominationparameters.AsNoTracking()
                    on pv.ParameterId equals p.ParameterId
                where pv.NominationId == nominationId
                select new
                {
                    p.ParameterId,
                    p.ParameterName,
                    p.ParameterType,
                    pv.ParameterValue
                }
            ).ToListAsync(cancellationToken);

            var result = new
            {
                baseInfo.Nomination.NominationId,
                baseInfo.Nomination.Status,
                baseInfo.Nomination.Justification,
                baseInfo.Nomination.SubmittedAt,
                baseInfo.Nomination.ReviewedAt,
                baseInfo.Nomination.ReviewRemarks,
                Nominee = new
                {
                    EmployeeId = baseInfo.Nomination.NomineeEmployeeId,
                    FirstName = baseInfo.NomineeProfile?.FirstName ?? "Unknown",
                    LastName = baseInfo.NomineeProfile?.LastName ?? string.Empty,
                    Email = baseInfo.NomineeProfile?.PersonalEmail ?? string.Empty
                },
                NominatedBy = new
                {
                    FirstName = baseInfo.NominatorProfile?.FirstName ?? "Unknown",
                    LastName = baseInfo.NominatorProfile?.LastName ?? string.Empty
                },
                Opportunity = new
                {
                    OpportunityName = baseInfo.Opportunity?.OpportunityName ?? "Unknown",
                    Description = baseInfo.Opportunity?.Description ?? string.Empty,
                    RewardType = baseInfo.RewardType?.RewardName ?? "Unknown"
                },
                ParameterValues = parameterResults
            };

            _logger.LogInformation("[GET_NOMINATION_DETAILS] Nomination {NominationId} details retrieved with {ParamCount} parameters",
                nominationId, parameterResults.Count);

            return Ok(new { success = true, data = result });
        }
    }

    // -------------------------------------------------------------
    // DTOs (keep here or move to a separate folder/namespace)
    // -------------------------------------------------------------
    public class NominationSubmitDto
    {
        public int? RewardTypeId { get; set; }

        [Range(1, int.MaxValue)]
        public int NomineeEmployeeId { get; set; }

        [Range(1, int.MaxValue)]
        public int NominatedByEmployeeId { get; set; }

        [Required]
        [MinLength(5)]
        public string Justification { get; set; } = string.Empty;

        public List<ParameterValueDto> ParameterValues { get; set; } = new();
    }

    public class ParameterValueDto
    {
        [Range(1, int.MaxValue)]
        public int ParameterId { get; set; }

        public string? Value { get; set; }
    }
}
