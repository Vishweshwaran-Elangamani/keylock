using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;

namespace PerformanceManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DepartmentHeadNominationController : ControllerBase
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<DepartmentHeadNominationController> _logger;

        public DepartmentHeadNominationController(
            EEPZDbContext context,
            ILogger<DepartmentHeadNominationController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// ✅ Get all approved nominations for Department Head's department
        /// GET: /api/DepartmentHeadNomination/depthead/3/approved-nominations
        /// </summary>
        [HttpGet("depthead/{deptHeadEmployeeId}/approved-nominations")]
        public async Task<IActionResult> GetApprovedNominationsByDeptHead(int deptHeadEmployeeId)
        {
            try
            {
                // ✅ STEP 1: Get Department Head's department details
                var deptHeadDetails = await _context.Employeedetailsmasters
                    .Where(edm => edm.EmployeeId == deptHeadEmployeeId)
                    .Include(edm => edm.Department)
                    .FirstOrDefaultAsync();

                if (deptHeadDetails == null || deptHeadDetails.Department == null)
                {
                    return NotFound(new 
                    { 
                        success = false, 
                        message = $"No department found for Department Head Employee ID {deptHeadEmployeeId}" 
                    });
                }

                var departmentId = deptHeadDetails.DepartmentId;
                var departmentName = deptHeadDetails.Department.DepartmentName;

                // ✅ STEP 2: Get all approved nominations (FIXED: Use Recognitionstatuses)
                var nominations = await _context.Recognitionstatuses
                    .Where(n => n.NominationType == "ManagerNomination" && n.Status == "Approved")
                    .Include(n => n.NomineeEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(n => n.NominatedByEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(n => n.ReviewedByEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .ToListAsync();

                var nominationDtos = new List<object>();
                
                // ✅ STEP 3: Filter nominations by department
                foreach (var n in nominations)
                {
                    // ✅ Fetch opportunity separately with RewardType
                    var opportunity = await _context.Recognitiondetails
                        .Where(o => o.OpportunityId == n.OpportunityId)
                        .Include(o => o.RewardType)
                        .FirstOrDefaultAsync();

                    var nomineeDept = await _context.Employeedetailsmasters
                        .Where(edm => edm.EmployeeId == n.NomineeEmployeeId)
                        .Include(edm => edm.Department)
                        .FirstOrDefaultAsync();

                    // Only include nominations from the same department
                    if (nomineeDept?.DepartmentId != departmentId)
                    {
                        continue;
                    }

                    // ✅ STEP 4: Fetch parameter values
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
                        OpportunityDescription = opportunity?.Description,
                        OpportunityDeadline = opportunity?.Deadline,
                        RewardType = opportunity?.RewardType != null ? new
                        {
                            opportunity.RewardType.RewardTypeId,
                            opportunity.RewardType.RewardName,
                            opportunity.RewardType.RewardCategory
                        } : null,
                        Nominee = new
                        {
                            EmployeeId = n.NomineeEmployeeId,
                            FullName = $"{n.NomineeEmployee.Userprofile.FirstName} {n.NomineeEmployee.Userprofile.LastName}",
                            FirstName = n.NomineeEmployee.Userprofile.FirstName,
                            LastName = n.NomineeEmployee.Userprofile.LastName,
                            Email = n.NomineeEmployee.Userprofile.PersonalEmail,
                            DepartmentId = nomineeDept?.DepartmentId,
                            DepartmentName = nomineeDept?.Department?.DepartmentName ?? "Unknown"
                        },
                        NominatedBy = new
                        {
                            EmployeeId = n.NominatedByEmployeeId,
                            FullName = $"{n.NominatedByEmployee.Userprofile.FirstName} {n.NominatedByEmployee.Userprofile.LastName}",
                            FirstName = n.NominatedByEmployee.Userprofile.FirstName,
                            LastName = n.NominatedByEmployee.Userprofile.LastName
                        },
                        ReviewedBy = n.ReviewedByEmployee != null ? new
                        {
                            EmployeeId = n.ReviewedByEmployeeId,
                            FullName = $"{n.ReviewedByEmployee.Userprofile.FirstName} {n.ReviewedByEmployee.Userprofile.LastName}"
                        } : null,
                        n.Justification,
                        n.SubmittedAt,
                        n.ReviewedAt,
                        n.ReviewRemarks,
                        n.Status,
                        ParameterValues = parameterValues
                    });
                }

                // ✅ STEP 5: Group nominations by opportunity
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
                    deptHeadEmployeeId = deptHeadEmployeeId,
                    departmentId = departmentId,
                    departmentName = departmentName,
                    data = groupedNominations,
                    totalNominations = nominationDtos.Count,
                    totalOpportunities = groupedNominations.Count,
                    message = $"Found {nominationDtos.Count} approved nominations in {departmentName} department"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[DH_APPROVED_NOMINATIONS] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get detailed view of a specific approved nomination
        /// GET: /api/DepartmentHeadNomination/nomination-details/24
        /// </summary>
        [HttpGet("nomination-details/{nominationId}")]
        public async Task<IActionResult> GetNominationDetails(int nominationId)
        {
            try
            {
                // ✅ FIXED: Use Recognitionstatuses instead of Nominations
                var nomination = await _context.Recognitionstatuses
                    .Where(n => n.NominationId == nominationId && n.Status == "Approved")
                    .Include(n => n.NomineeEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(n => n.NominatedByEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(n => n.ReviewedByEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .FirstOrDefaultAsync();

                if (nomination == null)
                {
                    return NotFound(new { success = false, message = "Approved nomination not found" });
                }

                // ✅ Fetch opportunity separately with RewardType
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
                        pv.ParameterId,
                        ParameterName = pv.Parameter.ParameterName,
                        ParameterType = pv.Parameter.ParameterType,
                        pv.ParameterValue,
                        IsRequired = pv.Parameter.IsRequired,
                        PlaceholderText = pv.Parameter.PlaceholderText
                    })
                    .ToListAsync();

                var result = new
                {
                    nomination.NominationId,
                    nomination.Status,
                    Opportunity = opportunity != null ? new
                    {
                        opportunity.OpportunityId,
                        opportunity.OpportunityName,
                        opportunity.Description,
                        opportunity.Deadline,
                        RewardType = opportunity.RewardType != null ? new
                        {
                            opportunity.RewardType.RewardTypeId,
                            opportunity.RewardType.RewardName,
                            opportunity.RewardType.RewardCategory,
                            opportunity.RewardType.Description
                        } : null
                    } : null,
                    Nominee = new
                    {
                        EmployeeId = nomination.NomineeEmployeeId,
                        FirstName = nomination.NomineeEmployee.Userprofile.FirstName,
                        LastName = nomination.NomineeEmployee.Userprofile.LastName,
                        FullName = $"{nomination.NomineeEmployee.Userprofile.FirstName} {nomination.NomineeEmployee.Userprofile.LastName}",
                        Email = nomination.NomineeEmployee.Userprofile.PersonalEmail,
                        Department = new
                        {
                            DepartmentId = nomineeDept?.DepartmentId,
                            DepartmentName = nomineeDept?.Department?.DepartmentName ?? "Unknown"
                        }
                    },
                    NominatedBy = new
                    {
                        EmployeeId = nomination.NominatedByEmployeeId,
                        FirstName = nomination.NominatedByEmployee.Userprofile.FirstName,
                        LastName = nomination.NominatedByEmployee.Userprofile.LastName,
                        FullName = $"{nomination.NominatedByEmployee.Userprofile.FirstName} {nomination.NominatedByEmployee.Userprofile.LastName}"
                    },
                    ReviewedBy = nomination.ReviewedByEmployee != null ? new
                    {
                        EmployeeId = nomination.ReviewedByEmployeeId,
                        FirstName = nomination.ReviewedByEmployee.Userprofile.FirstName,
                        LastName = nomination.ReviewedByEmployee.Userprofile.LastName,
                        FullName = $"{nomination.ReviewedByEmployee.Userprofile.FirstName} {nomination.ReviewedByEmployee.Userprofile.LastName}"
                    } : null,
                    nomination.Justification,
                    nomination.SubmittedAt,
                    nomination.ReviewedAt,
                    nomination.ReviewRemarks,
                    ParameterValues = parameterValues
                };

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[DH_NOMINATION_DETAILS] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get statistics for Department Head's department
        /// GET: /api/DepartmentHeadNomination/depthead/3/statistics
        /// </summary>
        [HttpGet("depthead/{deptHeadEmployeeId}/statistics")]
        public async Task<IActionResult> GetDepartmentStatistics(int deptHeadEmployeeId)
        {
            try
            {
                // Get Department Head's department
                var deptHeadDetails = await _context.Employeedetailsmasters
                    .Where(edm => edm.EmployeeId == deptHeadEmployeeId)
                    .Include(edm => edm.Department)
                    .FirstOrDefaultAsync();

                if (deptHeadDetails == null || deptHeadDetails.Department == null)
                {
                    return NotFound(new { success = false, message = "Department not found" });
                }

                var departmentId = deptHeadDetails.DepartmentId;
                var departmentName = deptHeadDetails.Department.DepartmentName;

                // ✅ FIXED: Use Recognitionstatuses instead of Nominations
                var allNominations = await _context.Recognitionstatuses
                    .Where(n => n.Status == "Approved")
                    .ToListAsync();

                var departmentNominations = new List<Recognitionstatus>();
                
                foreach (var n in allNominations)
                {
                    var dept = await _context.Employeedetailsmasters
                        .Where(edm => edm.EmployeeId == n.NomineeEmployeeId)
                        .FirstOrDefaultAsync();

                    if (dept?.DepartmentId == departmentId)
                    {
                        departmentNominations.Add(n);
                    }
                }

                // ✅ Fetch opportunities with RewardType for statistics
                var nominationsWithDetails = new List<(Recognitionstatus nomination, Recognitiondetail opportunity)>();
                
                foreach (var nom in departmentNominations)
                {
                    var opp = await _context.Recognitiondetails
                        .Where(o => o.OpportunityId == nom.OpportunityId)
                        .Include(o => o.RewardType)
                        .FirstOrDefaultAsync();
                    
                    if (opp != null)
                    {
                        nominationsWithDetails.Add((nom, opp));
                    }
                }

                var totalApproved = nominationsWithDetails.Count;
                var recognitionCount = nominationsWithDetails.Count(x => 
                    x.opportunity.RewardType?.RewardCategory == "Recognition");
                var promotionCount = nominationsWithDetails.Count(x => 
                    x.opportunity.RewardType?.RewardCategory == "Promotion");

                var byOpportunity = nominationsWithDetails
                    .GroupBy(x => x.opportunity.OpportunityName)
                    .Select(g => new
                    {
                        OpportunityName = g.Key,
                        Count = g.Count()
                    })
                    .OrderByDescending(x => x.Count)
                    .ToList();

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        deptHeadEmployeeId,
                        departmentId,
                        departmentName,
                        totalApproved,
                        recognitionCount,
                        promotionCount,
                        byOpportunity
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[DH_STATISTICS] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get all employees in Department Head's department
        /// GET: /api/DepartmentHeadNomination/depthead/3/employees
        /// </summary>
        [HttpGet("depthead/{deptHeadEmployeeId}/employees")]
        public async Task<IActionResult> GetDepartmentEmployees(int deptHeadEmployeeId)
        {
            try
            {
                // Get Department Head's department
                var deptHeadDetails = await _context.Employeedetailsmasters
                    .Where(edm => edm.EmployeeId == deptHeadEmployeeId)
                    .Include(edm => edm.Department)
                    .FirstOrDefaultAsync();

                if (deptHeadDetails == null || deptHeadDetails.Department == null)
                {
                    return NotFound(new { success = false, message = "Department not found" });
                }

                var departmentId = deptHeadDetails.DepartmentId;
                var departmentName = deptHeadDetails.Department.DepartmentName;

                var employees = await _context.Employeedetailsmasters
                    .Where(edm => edm.DepartmentId == departmentId)
                    .Include(edm => edm.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(edm => edm.Role)
                    .Select(edm => new
                    {
                        edm.EmployeeId,
                        FullName = $"{edm.Employee.Userprofile.FirstName} {edm.Employee.Userprofile.LastName}",
                        Email = edm.Employee.Userprofile.PersonalEmail,
                        RoleName = edm.Role.RoleName,
                        EmployeeStatus = edm.Employee.EmploymentStatus,
                        IsActive = edm.Employee.IsActive
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        DeptHeadEmployeeId = deptHeadEmployeeId,
                        DepartmentId = departmentId,
                        DepartmentName = departmentName,
                        TotalEmployees = employees.Count,
                        Employees = employees
                    },
                    message = $"Found {employees.Count} employees in {departmentName}"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[DH_EMPLOYEES] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
