using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Utils;
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


        public async Task<List<EmployeeWithoutGoalsDto>> GetEmployeesWithoutGoalsAsync(int? currentUserId)
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


        public async Task<GoalAdoptionRateDto> GetGoalAdoptionRateAsync()
{
    var totalEmployees = await _context.Userauthentications
        .Where(u => u.Status == "Active")
        .CountAsync();

    var employeesWithGoals = await _context.Goals
        .Where(g => g.CreatedBy != null)
        .Select(g => g.CreatedBy)
        .Distinct()
        .CountAsync();
        
    var employeesWithoutGoals = Math.Max(0, totalEmployees - employeesWithGoals);

    var adoptionRate = totalEmployees > 0
        ? Math.Round((double)employeesWithGoals / totalEmployees * 100, 2)
        : 0;

    var sixMonthsAgo = DateTime.Now.AddMonths(-6);

    var monthlyTrend = await _context.Goals
        .Where(g => g.Goalcreatedat >= sixMonthsAgo && g.Goalcreatedat != null)
        .GroupBy(g => new { g.Goalcreatedat!.Value.Year, g.Goalcreatedat!.Value.Month })
        .Select(g => new MonthlyGoalTrendDto
        {
            Year = g.Key.Year,
            Month = g.Key.Month,
            MonthName = g.Key.Year > 0 && g.Key.Month > 0
                ? new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yyyy")
                : "Unknown",
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
        EmployeesWithoutGoals = employeesWithoutGoals,
        AdoptionRate = adoptionRate,
        MonthlyTrend = monthlyTrend,
        GoalTypeDistribution = goalTypeDistribution
    };
}


        public async Task<GoalStatisticsDto> GetGoalStatisticsAsync()
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


        public async Task<List<DepartmentSimpleDto>> GetAllDepartmentsAsync()
        {
            return await _context.Departments
                .AsNoTracking()
                .OrderBy(d => d.DepartmentName)
                .Select(d => new DepartmentSimpleDto
                {
                    DepartmentId = d.DepartmentId,
                    DepartmentName = d.DepartmentName
                })
                .ToListAsync();
        }


        public async Task<DepartmentSimpleDto?> GetDepartmentByIdAsync(int id)
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


        public async Task<UserForGoalDto?> GetUserWithEmployeeAsync(int userId)
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


        public async Task<List<string>> GetExistingGoalTypesForEmployeeAsync(int employeeId)
        {
            if (employeeId <= 0)
                return new List<string>();


            return await _context.Goals
                .Where(g => g.CreatedBy == employeeId && !string.IsNullOrEmpty(g.GoalType))
                .Select(g => g.GoalType!)
                .Distinct()
                .ToListAsync();
        }


        public async Task<List<UserForGoalDto>> GetUsersByIdsAsync(List<int> userIds)
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


        public async Task<List<UserForGoalDto>> GetUsersWithoutGoalsAsync(int? filterByDays = null)
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
    }
}
