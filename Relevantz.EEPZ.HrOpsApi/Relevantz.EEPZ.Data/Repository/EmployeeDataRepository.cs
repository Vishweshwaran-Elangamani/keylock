using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;

namespace Relevantz.EEPZ.Data.Repository
{
    /// <summary>
    /// Repository for employee data analytics and reporting.
    /// Provides methods for goal tracking, adoption rates, and employee statistics.
    /// </summary>
    public class EmployeeDataRepository : IEmployeeDataRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<EmployeeDataRepository> _logger;

        public EmployeeDataRepository(EEPZDbContext context, ILogger<EmployeeDataRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves all employees who have not set any goals.
        /// </summary>
        /// <param name="currentUserId">Optional user ID to exclude from results</param>
        /// <returns>List of employees without goals, including days without goals and recommended actions</returns>
        public async Task<List<EmployeeWithoutGoalsDto>> GetEmployeesWithoutGoalsAsync(int? currentUserId)
        {
            try
            {
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

                return usersWithoutGoals;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingEmployeesWithoutGoals);
                throw;
            }
        }

        /// <summary>
        /// Calculates the goal adoption rate across all employees.
        /// Includes monthly trends and goal type distribution.
        /// </summary>
        /// <returns>Goal adoption statistics including rates, trends, and distributions</returns>
        public async Task<GoalAdoptionRateDto> GetGoalAdoptionRateAsync()
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

                return new GoalAdoptionRateDto
                {
                    TotalEmployees = totalEmployees,
                    EmployeesWithGoals = employeesWithGoals,
                    EmployeesWithoutGoals = totalEmployees - employeesWithGoals,
                    AdoptionRate = adoptionRate,
                    MonthlyTrend = monthlyTrend,
                    GoalTypeDistribution = goalTypeDistribution
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingGoalAdoptionRate);
                throw;
            }
        }

        /// <summary>
        /// Retrieves comprehensive goal statistics including completion rates and distributions.
        /// </summary>
        /// <returns>Goal statistics including totals, completion rates, and status breakdowns</returns>
        public async Task<GoalStatisticsDto> GetGoalStatisticsAsync()
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

                return new GoalStatisticsDto
                {
                    TotalGoals = totalGoals,
                    CompletedGoals = completedGoals,
                    InProgressGoals = inProgressGoals,
                    ExpiredGoals = expiredGoals,
                    CompletionRate = completionRate,
                    GoalsByStatus = goalsByStatus,
                    TopGoalTypes = topGoalTypes
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingGoalStatistics);
                throw;
            }
        }

        /// <summary>
        /// Retrieves all departments in simplified format, ordered by name.
        /// </summary>
        /// <returns>List of departments with ID and name</returns>
        public async Task<List<DepartmentSimpleDto>> GetAllDepartmentsAsync()
        {
            try
            {
                var departments = await _context.Departments
                    .AsNoTracking()
                    .OrderBy(d => d.DepartmentName)
                    .Select(d => new DepartmentSimpleDto
                    {
                        DepartmentId = d.DepartmentId,
                        DepartmentName = d.DepartmentName
                    })
                    .ToListAsync();

                return departments;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingAllDepartments);
                throw;
            }
        }

        /// <summary>
        /// Retrieves a single department by its ID in simplified format.
        /// </summary>
        /// <param name="id">The department ID</param>
        /// <returns>Department with ID and name if found, otherwise null</returns>
        public async Task<DepartmentSimpleDto?> GetDepartmentByIdAsync(int id)
        {
            try
            {
                if (id <= 0)
                    return null;

                var department = await _context.Departments
                    .AsNoTracking()
                    .FirstOrDefaultAsync(d => d.DepartmentId == id);

                if (department == null)
                    return null;

                return new DepartmentSimpleDto
                {
                    DepartmentId = department.DepartmentId,
                    DepartmentName = department.DepartmentName
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingDepartmentById, id);
                throw;
            }
        }

        /// <summary>
        /// Retrieves user information with associated employee data for goal management.
        /// </summary>
        /// <param name="userId">The user ID</param>
        /// <returns>User data with employee information if found, otherwise null</returns>
        public async Task<UserForGoalDto?> GetUserWithEmployeeAsync(int userId)
        {
            try
            {
                if (userId <= 0)
                    return null;

                return await _context.Userauthentications
                    .Where(u => u.UserId == userId)
                    .Select(u => new UserForGoalDto
                    {
                        UserId = u.UserId,
                        EmployeeId = u.EmployeeId,
                        Email = u.Email,
                        CreatedAt = u.CreatedAt
                    })
                    .FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingUserWithEmployee, userId);
                throw;
            }
        }

        /// <summary>
        /// Retrieves all distinct goal types that an employee has created.
        /// </summary>
        /// <param name="employeeId">The employee ID</param>
        /// <returns>List of goal types created by the employee</returns>
        public async Task<List<string>> GetExistingGoalTypesForEmployeeAsync(int employeeId)
        {
            try
            {
                if (employeeId <= 0)
                    return new List<string>();

                return await _context.Goals
                    .Where(g => g.CreatedBy == employeeId)
                    .Select(g => g.GoalType)
                    .Distinct()
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingExistingGoalTypesForEmployee, employeeId);
                throw;
            }
        }

        /// <summary>
        /// Retrieves multiple users by their IDs for goal management.
        /// </summary>
        /// <param name="userIds">List of user IDs to retrieve</param>
        /// <returns>List of users with employee data</returns>
        public async Task<List<UserForGoalDto>> GetUsersByIdsAsync(List<int> userIds)
        {
            try
            {
                if (userIds == null || !userIds.Any())
                    return new List<UserForGoalDto>();

                return await _context.Userauthentications
                    .Where(u => userIds.Contains(u.UserId))
                    .Select(u => new UserForGoalDto
                    {
                        UserId = u.UserId,
                        EmployeeId = u.EmployeeId,
                        Email = u.Email,
                        CreatedAt = u.CreatedAt
                    })
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingUsersByIds);
                throw;
            }
        }

        /// <summary>
        /// Retrieves users who have not created any goals, optionally filtered by days since account creation.
        /// </summary>
        /// <param name="filterByDays">Optional minimum number of days since account creation</param>
        /// <returns>List of users without goals</returns>
        public async Task<List<UserForGoalDto>> GetUsersWithoutGoalsAsync(int? filterByDays = null)
        {
            try
            {
                if (filterByDays.HasValue && filterByDays.Value < 0)
                    filterByDays = null;

                var allUsers = await _context.Userauthentications
                    .Where(u => u.Status == "Active")
                    .Select(u => new UserForGoalDto
                    {
                        UserId = u.UserId,
                        EmployeeId = u.EmployeeId,
                        Email = u.Email,
                        CreatedAt = u.CreatedAt
                    })
                    .ToListAsync();

                var employeesWithGoals = await _context.Goals
                    .Where(g => g.CreatedBy != null)
                    .Select(g => g.CreatedBy)
                    .Distinct()
                    .ToListAsync();

                var usersWithoutGoals = allUsers
                    .Where(u => u.EmployeeId.HasValue && !employeesWithGoals.Contains(u.EmployeeId.Value))
                    .ToList();

                if (filterByDays.HasValue)
                {
                    usersWithoutGoals = usersWithoutGoals
                        .Where(u => (DateTime.Now - u.CreatedAt).Days >= filterByDays.Value)
                        .ToList();
                }

                return usersWithoutGoals;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingUsersWithoutGoals);
                throw;
            }
        }
    }
}
