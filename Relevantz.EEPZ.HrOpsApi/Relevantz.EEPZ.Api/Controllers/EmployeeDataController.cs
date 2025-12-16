using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using System.Security.Claims;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeeDataController : ControllerBase
    {
        private readonly IComplianceService _complianceService;
        private readonly IPolicyService _policyService;
        private readonly EEPZDbContext _context;
        private readonly IEmailService _emailService;
        private readonly ILogger<EmployeeDataController> _logger;

        public EmployeeDataController(
            IComplianceService complianceService,
            IPolicyService policyService,
            EEPZDbContext context,
            IEmailService emailService,
            ILogger<EmployeeDataController> logger)
        {
            _complianceService = complianceService;
            _policyService = policyService;
            _context = context;
            _emailService = emailService;
            _logger = logger;
        }

        // ==================== GOAL TRACKING ENDPOINTS ====================

        /// <summary>
        /// Get overall compliance overview - HR ONLY
        /// </summary>
        [HttpGet("goal-tracking/overview")]
        public async Task<IActionResult> GetComplianceOverview()
        {
            var result = await _complianceService.GetComplianceOverviewAsync();
            return Ok(result);
        }

        /// <summary>
/// Get employees who have not set any goals
/// Excludes Admin users and current logged-in user
/// </summary>
[HttpGet("goal-tracking/employees-without-goals")]
public async Task<IActionResult> GetEmployeesWithoutGoals()
{
    try
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst("sub")?.Value;

        int? currentUserId = null;
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int parsedUserId))
        {
            currentUserId = parsedUserId;
            _logger.LogInformation($"Current logged-in user ID: {currentUserId}");
        }
        else
        {
            _logger.LogWarning("Unable to extract user ID from JWT token");
        }

        var allUsers = _context.Userauthentications
            .Include(u => u.Employee)
                .ThenInclude(e => e.Userprofile)
            .Include(u => u.Employee)
                .ThenInclude(e => e.Employeedetailsmasters)
                    .ThenInclude(ed => ed.Department)
            .Include(u => u.Employee)
                .ThenInclude(e => e.Employeedetailsmasters)
                    .ThenInclude(ed => ed.Role)
            .Where(u => u.Status == "Active")
            .ToList();

        var employeesWithGoals = await _context.Goals
            .Where(g => g.CreatedBy != null)
            .Select(g => g.CreatedBy)
            .Distinct()
            .ToListAsync();

        var usersWithoutGoals = allUsers
            .Where(u => !employeesWithGoals.Contains(u.EmployeeId)
                     && (!currentUserId.HasValue || u.UserId != currentUserId.Value)
                     && !u.Employee.Employeedetailsmasters.Any(ed => ed.Role.RoleName == "Admin"))
            .Select(u => new EmployeeWithoutGoalsDto
            {
                UserId = u.UserId,
                EmployeeUserId = u.EmployeeId,
                Email = u.Email,
                EmployeeCompanyId = u.Employee?.EmployeeCompanyId,
                DaysWithoutGoals = (DateTime.Now - u.CreatedAt).Days,
                RecommendedAction = "Encourage goal setting for career development",
                EmployeeName = u.Employee?.Userprofile != null
                    ? $"{u.Employee.Userprofile.FirstName} {u.Employee.Userprofile.LastName}"
                    : string.Empty,
                DepartmentName = u.Employee?.Employeedetailsmasters
                    .FirstOrDefault()?.Department?.DepartmentName ?? string.Empty
            })
            .ToList();

        _logger.LogInformation($"Found {usersWithoutGoals.Count} employees without goals (excluding Admins and user ID: {currentUserId})");

        return Ok(new
        {
            success = true,
            message = $"Found {usersWithoutGoals.Count} employees without goals",
            data = new
            {
                totalEmployeesWithoutGoals = usersWithoutGoals.Count,
                employees = usersWithoutGoals
            }
        });
    }
    catch (Exception ex)
    {
        _logger.LogError($"Error getting employees without goals: {ex.Message}");
        return StatusCode(500, new { success = false, message = ex.Message });
    }
}


        /// <summary>
        /// Get personalized goal suggestions for an employee
        /// </summary>
        [HttpGet("goal-tracking/suggest-goals/{userId}")]
        public async Task<IActionResult> SuggestGoals(int userId)
        {
            try
            {
                var user = await _context.Userauthentications
                    .Include(u => u.Employee)
                    .FirstOrDefaultAsync(u => u.UserId == userId);

                if (user == null)
                    return NotFound(new { success = false, message = "User not found" });

                // Get existing goal types for this employee
                var existingGoalTypes = await _context.Goals
                    .Where(g => g.CreatedBy == user.EmployeeId)
                    .Select(g => g.GoalType)
                    .Distinct()
                    .ToListAsync();

                var suggestions = new List<GoalSuggestionDto>();

                // Suggestion 1: Training/Certification (if not exists)
                if (!existingGoalTypes.Contains("Training"))
                {
                    suggestions.Add(new GoalSuggestionDto
                    {
                        GoalType = "Training",
                        GoalTitle = "Complete Technical Certification",
                        GoalDescription = "Obtain an industry-recognized certification relevant to your role",
                        Reason = "Enhance technical skills and boost career growth",
                        Priority = "High",
                        EstimatedDuration = "3-6 months",
                        PolicyCompliant = true
                    });
                }

                // Suggestion 2: Leadership (if not exists)
                if (!existingGoalTypes.Contains("Leadership"))
                {
                    suggestions.Add(new GoalSuggestionDto
                    {
                        GoalType = "Leadership",
                        GoalTitle = "Lead a Small Team Project",
                        GoalDescription = "Take ownership of a project and coordinate with 2-3 team members",
                        Reason = "Develop leadership and management capabilities",
                        Priority = "Medium",
                        EstimatedDuration = "2-3 months",
                        PolicyCompliant = true
                    });
                }

                // Suggestion 3: Process Improvement (always show)
                suggestions.Add(new GoalSuggestionDto
                {
                    GoalType = "Process Improvement",
                    GoalTitle = "Improve Team Workflow Efficiency",
                    GoalDescription = "Identify and implement one process improvement in your team",
                    Reason = "Contribute to operational excellence",
                    Priority = "Medium",
                    EstimatedDuration = "1-2 months",
                    PolicyCompliant = true
                });

                // Suggestion 4: Soft Skills (always show)
                suggestions.Add(new GoalSuggestionDto
                {
                    GoalType = "Soft Skills",
                    GoalTitle = "Enhance Communication Skills",
                    GoalDescription = "Attend workshop on effective professional communication",
                    Reason = "Improve interpersonal and presentation abilities",
                    Priority = "Low",
                    EstimatedDuration = "1 month",
                    PolicyCompliant = true
                });

                // Suggestion 5: Mentorship (always show)
                suggestions.Add(new GoalSuggestionDto
                {
                    GoalType = "Mentorship",
                    GoalTitle = "Mentor a Junior Team Member",
                    GoalDescription = "Guide and support a junior colleague for their skill development",
                    Reason = "Develop coaching skills and give back to the team",
                    Priority = "Low",
                    EstimatedDuration = "Ongoing",
                    PolicyCompliant = true
                });

                return Ok(new
                {
                    success = true,
                    message = "Goal suggestions generated",
                    data = new
                    {
                        userId = user.UserId,
                        email = user.Email,
                        totalSuggestions = suggestions.Count,
                        suggestions,
                        note = "These goals are aligned with your career path and company policies"
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error suggesting goals for user {userId}: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Send goal setting reminders to employees via email
        /// Supports single, multiple, or bulk sending
        /// </summary>
        [HttpPost("goal-tracking/send-goal-reminders")]
        public async Task<IActionResult> SendGoalReminders([FromBody] SendGoalReminderRequestDto request)
        {
            try
            {
                var sentTo = new List<object>();
                var failedSends = new List<object>();

                if (request.SendType == "single" && request.UserId.HasValue)
                {
                    // Send to single user
                    var user = await _context.Userauthentications
                        .FirstOrDefaultAsync(u => u.UserId == request.UserId.Value);

                    if (user == null)
                        return NotFound(new { success = false, message = "User not found" });

                    // Get goal suggestions if requested
                    List<string> suggestions = new();
                    if (request.IncludeGoalSuggestions)
                    {
                        suggestions = new List<string>
                        {
                            "Complete Technical Certification",
                            "Lead a Small Team Project",
                            "Improve Team Workflow Efficiency",
                            "Enhance Communication Skills",
                            "Mentor a Junior Team Member"
                        };
                    }

                    var userName = user.Email.Split('@')[0];

                    var emailSent = await _emailService.SendGoalReminderEmailAsync(
                        user.Email,
                        userName,
                        suggestions
                    );

                    if (emailSent)
                    {
                        sentTo.Add(new
                        {
                            userId = user.UserId,
                            email = user.Email,
                            status = "sent",
                            sentAt = DateTime.Now
                        });
                        _logger.LogInformation($" Reminder email sent to {user.Email}");
                    }
                    else
                    {
                        failedSends.Add(new
                        {
                            userId = user.UserId,
                            email = user.Email,
                            error = "Email delivery failed"
                        });
                        _logger.LogWarning($" Failed to send reminder email to {user.Email}");
                    }
                }
                else if (request.SendType == "multiple" && request.UserIds != null && request.UserIds.Any())
                {
                    var users = await _context.Userauthentications
                        .Where(u => request.UserIds.Contains(u.UserId))
                        .ToListAsync();

                    foreach (var user in users)
                    {
                        List<string> suggestions = new();
                        if (request.IncludeGoalSuggestions)
                        {
                            suggestions = new List<string>
                            {
                                "Complete Technical Certification",
                                "Lead a Small Team Project",
                                "Improve Team Workflow Efficiency",
                                "Enhance Communication Skills",
                                "Mentor a Junior Team Member"
                            };
                        }

                        var userName = user.Email.Split('@')[0];
                        var emailSent = await _emailService.SendGoalReminderEmailAsync(
                            user.Email,
                            userName,
                            suggestions
                        );

                        if (emailSent)
                        {
                            sentTo.Add(new
                            {
                                userId = user.UserId,
                                email = user.Email,
                                status = "sent",
                                sentAt = DateTime.Now
                            });
                        }
                        else
                        {
                            failedSends.Add(new
                            {
                                userId = user.UserId,
                                email = user.Email,
                                error = "Email delivery failed"
                            });
                        }

                        await Task.Delay(100);
                    }

                    _logger.LogInformation($" Bulk reminders sent: {sentTo.Count} successful, {failedSends.Count} failed");
                }
                else if (request.SendType == "all")
                {
                    // Send to all employees without goals
                    var allUsers = await _context.Userauthentications
                        .Where(u => u.Status == "Active")
                        .ToListAsync();

                    var employeesWithGoals = await _context.Goals
                        .Where(g => g.CreatedBy != null)
                        .Select(g => g.CreatedBy)
                        .Distinct()
                        .ToListAsync();

                    var usersWithoutGoals = allUsers
                        .Where(u => !employeesWithGoals.Contains(u.EmployeeId))
                        .ToList();

                    if (request.FilterByDays.HasValue)
                    {
                        usersWithoutGoals = usersWithoutGoals
                            .Where(u => (DateTime.Now - u.CreatedAt).Days >= request.FilterByDays.Value)
                            .ToList();
                    }

                    foreach (var user in usersWithoutGoals)
                    {
                        List<string> suggestions = new();
                        if (request.IncludeGoalSuggestions)
                        {
                            suggestions = new List<string>
                            {
                                "Complete Technical Certification",
                                "Lead a Small Team Project",
                                "Improve Team Workflow Efficiency",
                                "Enhance Communication Skills",
                                "Mentor a Junior Team Member"
                            };
                        }

                        var userName = user.Email.Split('@')[0];
                        var emailSent = await _emailService.SendGoalReminderEmailAsync(
                            user.Email,
                            userName,
                            suggestions
                        );

                        if (emailSent)
                        {
                            sentTo.Add(new
                            {
                                userId = user.UserId,
                                email = user.Email,
                                status = "sent",
                                sentAt = DateTime.Now
                            });
                        }
                        else
                        {
                            failedSends.Add(new
                            {
                                userId = user.UserId,
                                email = user.Email,
                                error = "Email delivery failed"
                            });
                        }
                        
                        await Task.Delay(100);
                    }

                    _logger.LogInformation($" Mass reminders sent: {sentTo.Count} successful, {failedSends.Count} failed");
                }

                return Ok(new
                {
                    success = true,
                    message = $"Reminders sent to {sentTo.Count} employee(s), {failedSends.Count} failed",
                    data = new
                    {
                        totalSent = sentTo.Count,
                        successful = sentTo.Count,
                        failed = failedSends.Count,
                        sentTo,
                        failedSends
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error sending goal reminders: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get goal adoption rate statistics across the organization
        /// </summary>
        [HttpGet("goal-tracking/goal-adoption-rate")]
        public async Task<IActionResult> GetGoalAdoptionRate()
        {
            try
            {
                var totalEmployees = await _context.Userauthentications
                    .Where(u => u.Status == "Active")
                    .CountAsync();

                var employeesWithGoals = await _context.Goals
                    .Where(g => g.CreatedBy != null)
                    .Select(g => g.CreatedBy)
                    .Distinct()
                    .CountAsync();

                var adoptionRate = totalEmployees > 0
                    ? Math.Round((double)employeesWithGoals / totalEmployees * 100, 2)
                    : 0;

                // Monthly trend (last 6 months)
                var sixMonthsAgo = DateTime.Now.AddMonths(-6);
                var monthlyTrend = await _context.Goals
                    .Where(g => g.Goalcreatedat >= sixMonthsAgo && g.Goalcreatedat != null)
                    .GroupBy(g => new { g.Goalcreatedat.Value.Year, g.Goalcreatedat.Value.Month })
                    .Select(g => new MonthlyGoalTrendDto
                    {
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        MonthName = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yyyy"),
                        NewGoals = g.Count()
                    })
                    .OrderBy(g => g.Year).ThenBy(g => g.Month)
                    .ToListAsync();

                // Goal type distribution
                var goalTypeDistribution = await _context.Goals
                    .GroupBy(g => g.GoalType ?? "Unspecified")
                    .Select(g => new GoalTypeDistributionDto
                    {
                        GoalType = g.Key,
                        Count = g.Count(),
                        Percentage = totalEmployees > 0
                            ? Math.Round((double)g.Count() / totalEmployees * 100, 2)
                            : 0
                    })
                    .OrderByDescending(g => g.Count)
                    .ToListAsync();

                var result = new GoalAdoptionRateDto
                {
                    TotalEmployees = totalEmployees,
                    EmployeesWithGoals = employeesWithGoals,
                    EmployeesWithoutGoals = totalEmployees - employeesWithGoals,
                    AdoptionRate = adoptionRate,
                    MonthlyTrend = monthlyTrend,
                    GoalTypeDistribution = goalTypeDistribution
                };

                return Ok(new { success = true, message = "Success", data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error getting goal adoption rate: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get detailed goal statistics for HR dashboard
        /// </summary>
        [HttpGet("goal-tracking/goal-statistics")]
        public async Task<IActionResult> GetGoalStatistics()
        {
            try
            {
                var totalGoals = await _context.Goals.CountAsync();
               
                var completedGoals = await _context.Goals
                    .CountAsync(g => g.Goalstatus == "completed");

                var inProgressGoals = await _context.Goals
                    .CountAsync(g => g.Goalstatus == "inprogress");

                var expiredGoals = await _context.Goals
                    .CountAsync(g => g.Goalendat < DateTime.Now
                              && g.Goalstatus != "completed"
                              && g.Goalstatus != "closed");

                var completionRate = totalGoals > 0
                    ? Math.Round((double)completedGoals / totalGoals * 100, 2)
                    : 0;

                var goalsByStatus = await _context.Goals
                    .GroupBy(g => g.Goalstatus ?? "unknown")
                    .ToDictionaryAsync(g => g.Key, g => g.Count());

                var topGoalTypes = await _context.Goals
                    .GroupBy(g => g.GoalType ?? "Unspecified")
                    .Select(g => new GoalTypeCountDto
                    {
                        GoalType = g.Key,
                        Count = g.Count()
                    })
                    .OrderByDescending(g => g.Count)
                    .Take(5)
                    .ToListAsync();

                var result = new GoalStatisticsDto
                {
                    TotalGoals = totalGoals,
                    CompletedGoals = completedGoals,
                    InProgressGoals = inProgressGoals,
                    ExpiredGoals = expiredGoals,
                    CompletionRate = completionRate,
                    GoalsByStatus = goalsByStatus,
                    TopGoalTypes = topGoalTypes
                };

                return Ok(new { success = true, message = "Success", data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error getting goal statistics: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ==================== DEPARTMENT ENDPOINTS ====================

        [HttpGet("department/all")]
        public async Task<IActionResult> GetAllDepartments()
        {
            try
            {
                Console.WriteLine(" Backend: Getting all departments");
               
                var departments = await _context.Departments
                    .AsNoTracking()
                    .OrderBy(d => d.DepartmentName)
                    .Select(d => new
                    {
                        d.DepartmentId,
                        d.DepartmentName
                    })
                    .ToListAsync();

                Console.WriteLine($" Backend: Found {departments.Count} departments");

                return Ok(new
                {
                    success = true,
                    message = $"Retrieved {departments.Count} departments",
                    data = departments
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Backend Error: {ex.Message}");
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpGet("department/{id}")]
        public async Task<IActionResult> GetDepartmentById(int id)
        {
            try
            {
                var department = await _context.Departments
                    .AsNoTracking()
                    .FirstOrDefaultAsync(d => d.DepartmentId == id);

                if (department == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Department not found"
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = department
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // ==================== EMPLOYEE POLICY ENDPOINTS ====================

        [HttpGet("policy/published")]
        [Authorize]
        public async Task<IActionResult> GetPublishedPolicies()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "Unknown";
               
                _logger.LogInformation($" User {userId} (Role: {userRole}) fetching published policies");

                var response = await _policyService.GetPublishedPoliciesAsync();
               
                _logger.LogInformation($" Returned {response.Data?.Count ?? 0} published policies to user {userId}");
               
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error fetching published policies: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Failed to fetch policies" });
            }
        }

        [HttpGet("policy/{policyId}")]
        [Authorize]
        public async Task<IActionResult> GetPolicyById(int policyId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "Unknown";
               
                _logger.LogInformation($" User {userId} (Role: {userRole}) requesting policy {policyId}");
               
                var response = await _policyService.GetPolicyByIdAsync(policyId);

                if (!response.Success)
                {
                    _logger.LogWarning($" Policy {policyId} not found for user {userId}");
                    return NotFound(response);
                }

                // Only return if published
                if (!response.Data.IsPublished)
                {
                    _logger.LogWarning($" Policy {policyId} is not published. Access denied for user {userId}");
                    return NotFound(new { success = false, message = "Policy not found or not published" });
                }

                _logger.LogInformation($" User {userId} viewed policy {policyId}: {response.Data.PolicyName}");
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error fetching policy {policyId}: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Failed to fetch policy" });
            }
        }
    }
}
