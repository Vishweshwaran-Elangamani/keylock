
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class ManagerNominationController : ControllerBase
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<ManagerNominationController> _logger;

        public ManagerNominationController(
            EEPZDbContext context,
            ILogger<ManagerNominationController> logger
        )
        {
            _context = context;
            _logger = logger;
        }

        // -------------------------------------------------------------
        // GET: api/ManagerNomination/reward-types
        // -------------------------------------------------------------
        [HttpGet("reward-types")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetRewardTypes(CancellationToken ct)
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
                .ToListAsync(ct);

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
        public async Task<IActionResult> GetOpportunities(CancellationToken ct)
        {
            _logger.LogInformation("[GET_OPPORTUNITIES] Fetching all active opportunities");

            var today = DateOnly.FromDateTime(DateTime.Today);

            // Left joins to avoid N+1 and to not rely on navigation properties
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
            ).ToListAsync(ct);

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
        public async Task<IActionResult> GetOpportunitiesByRewardType([FromRoute] int rewardTypeId, CancellationToken ct)
        {
            _logger.LogInformation("[GET_OPPORTUNITIES_BY_REWARD] Fetching opportunities for Reward Type: {RewardTypeId}", rewardTypeId);

            var validationRewardType = await _context.Rewardtypes
                .AsNoTracking()
                .FirstOrDefaultAsync(rt =>
                    rt.RewardTypeId == rewardTypeId &&
                    rt.IsActive == true &&
                    rt.IsVisibleForManagerNomination == true, ct);

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
            ).ToListAsync(ct);

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
        public async Task<IActionResult> GetNominationParameters([FromRoute] int rewardTypeId, CancellationToken ct)
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
                .ToListAsync(ct);

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
        public async Task<IActionResult> GetTeamMembers([FromRoute] int managerId, CancellationToken ct)
        {
            _logger.LogInformation("[GET_TEAM_MEMBERS] Fetching team members for Manager ID: {ManagerId}", managerId);

            // Projects where the user is L1 or Resource Owner
            var managerProjectsAsL1 = await _context.Projects
                .AsNoTracking()
                .Where(p => p.ResourceOwnerEmployeeId == managerId || p.L1approverEmployeeId == managerId)
                .Select(p => p.ProjectId)
                .ToListAsync(ct);

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

            // Prepare set of employees who are managers/approvers (to exclude)
            var resourceOwnerIds = await _context.Projects
                .AsNoTracking()
                .Where(p => p.ResourceOwnerEmployeeId != null)
                .Select(p => p.ResourceOwnerEmployeeId!.Value)
                .Distinct()
                .ToListAsync(ct);

            var l1ApproverIds = await _context.Projects
                .AsNoTracking()
                .Where(p => p.L1approverEmployeeId != null)
                .Select(p => p.L1approverEmployeeId!.Value)
                .Distinct()
                .ToListAsync(ct);

            var l2ApproverIds = await _context.Projects
                .AsNoTracking()
                .Where(p => p.L2approverEmployeeId != null)
                .Select(p => p.L2approverEmployeeId!.Value)
                .Distinct()
                .ToListAsync(ct);

            var allManagerIds = new HashSet<int>(resourceOwnerIds);
            allManagerIds.UnionWith(l1ApproverIds);
            allManagerIds.UnionWith(l2ApproverIds);

            _logger.LogInformation("[GET_TEAM_MEMBERS] Found {Count} employees who are managers/approvers", allManagerIds.Count);

            // Pull team members assigned to the manager's projects, only Active, and not managers
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
                // distinct employees if they appear in multiple projects
                .GroupBy(x => x.EmployeeId)
                .Select(g => g.First())
                .ToListAsync(ct);

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
        public async Task<IActionResult> SubmitNomination([FromBody] NominationSubmitDto dto, CancellationToken ct)
        {
            _logger.LogInformation("[SUBMIT_NOMINATION] Submitting nomination for Employee {Nominee}", dto?.NomineeEmployeeId);

            if (dto is null)
            {
                return BadRequest(new { success = false, message = "Payload is required" });
            }

            // Basic validation (kept to preserve caller expectations)
            if (dto.NomineeEmployeeId <= 0 || dto.NominatedByEmployeeId <= 0)
                return BadRequest(new { success = false, message = "Invalid employee IDs" });

            if (string.IsNullOrWhiteSpace(dto.Justification))
                return BadRequest(new { success = false, message = "Justification is required" });

            if (dto.RewardTypeId is null || dto.RewardTypeId <= 0)
                return BadRequest(new { success = false, message = "Reward Type is required" });

            // Only L1 managers can submit
            var isL1Manager = await _context.Projects
                .AsNoTracking()
                .AnyAsync(p =>
                    p.ResourceOwnerEmployeeId == dto.NominatedByEmployeeId ||
                    p.L1approverEmployeeId == dto.NominatedByEmployeeId, ct);

            if (!isL1Manager)
            {
                _logger.LogWarning("[SUBMIT_NOMINATION] Employee {ManagerId} is not an L1 manager on any project", dto.NominatedByEmployeeId);
                return StatusCode(403, new { success = false, message = "Only L1 managers can submit nominations" });
            }

            // Ensure nominee belongs to one of the manager's L1 projects
            var managerProjectsAsL1 = await _context.Projects
                .AsNoTracking()
                .Where(p => p.ResourceOwnerEmployeeId == dto.NominatedByEmployeeId
                         || p.L1approverEmployeeId == dto.NominatedByEmployeeId)
                .Select(p => p.ProjectId)
                .ToListAsync(ct);

            var nomineeInManagerProjects = await _context.Projectemployees
                .AsNoTracking()
                .AnyAsync(pe =>
                    managerProjectsAsL1.Contains(pe.ProjectId) &&
                    pe.Employee.EmployeeId == dto.NomineeEmployeeId, ct);

            if (!nomineeInManagerProjects)
            {
                _logger.LogWarning("[SUBMIT_NOMINATION] Nominee {Nominee} is not in manager's L1 projects", dto.NomineeEmployeeId);
                return StatusCode(403, new
                {
                    success = false,
                    message = "You can only nominate employees from projects where you are L1 manager"
                });
            }

            // Reward type must be active and visible
            var rewardType = await _context.Rewardtypes
                .AsNoTracking()
                .FirstOrDefaultAsync(rt =>
                    rt.RewardTypeId == dto.RewardTypeId &&
                    rt.IsActive == true &&
                    rt.IsVisibleForManagerNomination == true, ct);

            if (rewardType is null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid reward type or not available for manager nominations"
                });
            }

            // Already nominated for same reward type?
            var alreadyExists = await (
                from n in _context.Recognitionstatuses.AsNoTracking()
                join o in _context.Recognitiondetails.AsNoTracking()
                    on n.OpportunityId equals o.OpportunityId
                where n.NomineeEmployeeId == dto.NomineeEmployeeId
                      && n.NominationType == "ManagerNomination"
                      && o.RewardTypeId == dto.RewardTypeId
                select n.NominationId
            ).AnyAsync(ct);

            if (alreadyExists)
            {
                _logger.LogWarning("[SUBMIT_NOMINATION] Employee {Nominee} already nominated for RewardType {RewardTypeId}", dto.NomineeEmployeeId, dto.RewardTypeId);
                return BadRequest(new
                {
                    success = false,
                    message = $"This employee has already been nominated for {rewardType.RewardName}. Please select a different award."
                });
            }

            // Use a transaction for atomicity of the whole submission
            await using var tx = await _context.Database.BeginTransactionAsync(ct);

            // Get or create the default "Manager" opportunity for this reward type
            var defaultOpportunity = await _context.Recognitiondetails
                .FirstOrDefaultAsync(o =>
                    o.RewardTypeId == dto.RewardTypeId &&
                    o.OpportunityName.Contains("Manager"), ct);

            if (defaultOpportunity is null)
            {
                defaultOpportunity = new Recognitiondetail
                {
                    RewardTypeId = dto.RewardTypeId!.Value,
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
                await _context.SaveChangesAsync(ct);

                _logger.LogInformation("[SUBMIT_NOMINATION] Default opportunity created: {OpportunityId}", defaultOpportunity.OpportunityId);
            }

            var recognitionstatus = new Recognitionstatus
            {
                OpportunityId = defaultOpportunity.OpportunityId,
                NomineeEmployeeId = dto.NomineeEmployeeId,
                NominationType = "ManagerNomination",
                NominatedByEmployeeId = dto.NominatedByEmployeeId,
                Justification = dto.Justification,
                Status = "Pending",
                SubmittedAt = DateTime.UtcNow,
                ReviewRemarks = $"DirectManagerNomination|RewardType:{dto.RewardTypeId}|User-Submitted"
            };

            _context.Recognitionstatuses.Add(recognitionstatus);
            await _context.SaveChangesAsync(ct);

            _logger.LogInformation("[SUBMIT_NOMINATION] Nomination created: {NominationId}", recognitionstatus.NominationId);

            // Parameter values (only for parameters valid for this reward type)
            if (dto.ParameterValues is { Count: > 0 })
            {
                var uniqueParams = dto.ParameterValues
                    .GroupBy(p => p.ParameterId)
                    .Select(g => g.First())
                    .ToList();

                var validParamIds = await _context.Nominationparameters
                    .AsNoTracking()
                    .Where(np => np.RewardTypeId == dto.RewardTypeId)
                    .Select(np => np.ParameterId)
                    .ToListAsync(ct);

                var validParamSet = new HashSet<int>(validParamIds);

                var toInsert = new List<Nominationparametervalue>();
                foreach (var p in uniqueParams)
                {
                    if (p.ParameterId <= 0 || !validParamSet.Contains(p.ParameterId))
                        continue;

                    toInsert.Add(new Nominationparametervalue
                    {
                        NominationId = recognitionstatus.NominationId,
                        ParameterId = p.ParameterId,
                        ParameterValue = p.Value ?? string.Empty,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                if (toInsert.Count > 0)
                {
                    _context.Nominationparametervalues.AddRange(toInsert);
                    await _context.SaveChangesAsync(ct);
                }
            }

            // Visibility tracking
            var tracking = new Nominationvisibilitytracking
            {
                NominationId = recognitionstatus.NominationId,
                ViewedByEmployeeId = dto.NominatedByEmployeeId,
                ActionTaken = "Submitted",
                ViewedAt = DateTime.UtcNow
            };

            _context.Nominationvisibilitytrackings.Add(tracking);
            await _context.SaveChangesAsync(ct);

            await tx.CommitAsync(ct);

            return Ok(new
            {
                success = true,
                data = new { nominationId = recognitionstatus.NominationId },
                message = "Nomination submitted successfully"
            });
        }

        // -------------------------------------------------------------
        // GET: api/ManagerNomination/employee-nominations/{employeeId}
        // -------------------------------------------------------------
        [HttpGet("employee-nominations/{employeeId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetEmployeeNominations([FromRoute] int employeeId, CancellationToken ct)
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
            ).ToListAsync(ct);

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
        public async Task<IActionResult> GetMyNominations([FromRoute] int managerId, CancellationToken ct)
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
            ).ToListAsync(ct);

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
        public async Task<IActionResult> GetNominationDetails([FromRoute] int nominationId, CancellationToken ct)
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
            ).FirstOrDefaultAsync(ct);

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
            ).ToListAsync(ct);

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
