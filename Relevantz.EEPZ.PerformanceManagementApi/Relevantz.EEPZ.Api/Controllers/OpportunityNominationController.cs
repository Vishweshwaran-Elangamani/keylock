
using Microsoft.AspNetCore.Mvc;

using Microsoft.EntityFrameworkCore;

using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OpportunityNominationController : ControllerBase
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<OpportunityNominationController> _logger;

        public OpportunityNominationController(EEPZDbContext context, ILogger<OpportunityNominationController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("opportunities")]
        public async Task<IActionResult> GetAllOpportunities()
        {
            try
            {
                var opportunities = await _context.Internalopportunities
                    .Include(o => o.Department)
                    .Where(o => o.Status == "Active")
                    .Select(o => new
                    {
                        o.OpportunityId,
                        o.OpportunityName,
                        DepartmentName = o.Department != null ? o.Department.DepartmentName : null,
                        o.Description,
                        o.Requirements,
                        o.EligibilityCriteria,
                        o.Deadline,
                        o.Status
                    })
                    .OrderBy(o => o.OpportunityName)
                    .ToListAsync();

                return Ok(new { success = true, data = opportunities, count = opportunities.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching opportunities");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("nominate")]
        public async Task<IActionResult> NominateEmployee([FromBody] NominationRequest request)
        {
            if (request == null)
                return BadRequest(new { success = false, message = "Invalid request" });

            if (string.IsNullOrWhiteSpace(request.Justification) || request.Justification.Trim().Length < 10)
                return BadRequest(new { success = false, message = "Justification is required and must be at least 10 characters." });

            if (!request.OpportunityId.HasValue || request.OpportunityId.Value <= 0)
                return BadRequest(new { success = false, message = "OpportunityId is required and must be a positive integer." });

            try
            {
                var opportunity = await _context.Internalopportunities
                    .FirstOrDefaultAsync(o => o.OpportunityId == request.OpportunityId.Value && o.Status == "Active");

                if (opportunity == null)
                    return BadRequest(new { success = false, message = "Selected opportunity is not available." });

                var nominee = await _context.Userauthentications.FirstOrDefaultAsync(u => u.UserId == request.NomineeUserId);
                if (nominee == null) return BadRequest(new { success = false, message = "Nominee not found." });

                var nominator = await _context.Userauthentications.FirstOrDefaultAsync(u => u.UserId == request.NominatedByUserId);
                if (nominator == null) return BadRequest(new { success = false, message = "Nominator not found." });

                var recentNom = await _context.Recognitionstatuses
                    .FirstOrDefaultAsync(n => n.NomineeEmployeeId == request.NomineeUserId && n.NominatedByEmployeeId == request.NominatedByUserId && n.SubmittedAt >= DateTime.UtcNow.AddDays(-30));

                if (recentNom != null) return BadRequest(new { success = false, message = "Employee already nominated recently." });

                var recognitionstatus = new Recognitionstatus
                {
                    OpportunityId = request.OpportunityId.Value,
                    NomineeEmployeeId = request.NomineeUserId,
                    NominatedByEmployeeId = request.NominatedByUserId,
                    Justification = request.Justification?.Trim(),
                    NominationType = "ManagerNomination",
                    Status = "Pending",
                    SubmittedAt = DateTime.UtcNow
                };

                _context.Recognitionstatuses.Add(recognitionstatus);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, nominationId = recognitionstatus.NominationId });
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error creating nomination");
                return StatusCode(500, new { success = false, message = dbEx.InnerException?.Message ?? dbEx.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error creating nomination");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("manager/{managerId}/project-team")]
        public async Task<IActionResult> GetManagerProjectTeam(int managerId)
        {
            try
            {
                var projects = await _context.Projects
                    .Where(p => p.L1approverEmployeeId == managerId || p.L2approverEmployeeId == managerId)
                    .ToListAsync();

                var projectIds = projects.Select(p => p.ProjectId).ToList();
                var projectEmployees = await _context.Projectemployees.Where(pe => projectIds.Contains(pe.ProjectId)).ToListAsync();

                var employeeDetailIds = projectEmployees.Select(pe => pe.EmployeeId).Distinct().ToList();
                var employeeDetails = await _context.Employeedetailsmasters.Include(ed => ed.Employee).Where(ed => employeeDetailIds.Contains(ed.EmployeeMasterId)).ToListAsync();

                var userAuths = await _context.Userauthentications.Where(ua => employeeDetails.Select(e => e.EmployeeId).Contains(ua.EmployeeId)).ToListAsync();
                var recognitionstatus = await _context.Recognitionstatuses.OrderByDescending(n => n.SubmittedAt).ToListAsync();

                var employeeIds = employeeDetails.Select(e => e.EmployeeId).Distinct().ToList();
                var userProfiles = await _context.Userprofiles.Where(up => employeeIds.Contains(up.EmployeeId)).ToListAsync();

                var result = projects.Select(p => new
                {
                    ProjectId = p.ProjectId,
                    ProjectName = p.ProjectName,
                    TeamMembers = projectEmployees.Where(pe => pe.ProjectId == p.ProjectId).Select(pe =>
                    {
                        var edm = employeeDetails.FirstOrDefault(e => e.EmployeeMasterId == pe.EmployeeId);
                        var user = edm != null ? userAuths.FirstOrDefault(u => u.EmployeeId == edm.EmployeeId) : null;
                        var profile = edm != null ? userProfiles.FirstOrDefault(up => up.EmployeeId == edm.EmployeeId) : null;
                        var latestNom = user != null ? recognitionstatus.FirstOrDefault(n => n.NomineeEmployeeId == user.UserId) : null;
                        return new
                        {
                            EmployeeId = pe.EmployeeId,
                            UserId = user?.UserId ?? -1,
                            Name = profile != null ? $"{profile.FirstName} {profile.LastName}" : (edm?.Employee?.EmployeeCompanyId ?? "N/A"),
                            Email = edm?.Employee?.EmployeeCompanyId ?? "N/A",
                            Designation = edm?.RoleId != null ? edm.RoleId.ToString() : "N/A",
                            Recognition = latestNom?.Justification ?? "No nomination yet"
                        };
                    }).ToList()
                }).ToList();

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching project team");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    public class NominationRequest
    {
        [System.ComponentModel.DataAnnotations.Required]
        public int NomineeUserId { get; set; }

        [System.ComponentModel.DataAnnotations.Required]
        public int NominatedByUserId { get; set; }

        public int? OpportunityId { get; set; }

        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.StringLength(65535, MinimumLength = 10)]
        public string? Justification { get; set; }

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    }
}
