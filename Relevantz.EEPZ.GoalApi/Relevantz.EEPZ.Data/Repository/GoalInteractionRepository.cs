using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Enums;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interface;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class GoalInteractionRepository : IGoalInteractionRepository
    {
        private readonly EEPZDbContext _db;
        private readonly IBaseGoalRepository _baseRepo;
        private readonly IWebHostEnvironment environment;

        public GoalInteractionRepository(
            EEPZDbContext db,
            IBaseGoalRepository baseRepository,
            IWebHostEnvironment _environment
        )
        {
            _db = db;
            _baseRepo = baseRepository;
            environment = _environment;
        }

        public async Task AddCommentAsync(GoalComment comment)
        {
            await _db.GoalComments.AddAsync(comment);
        }

        public async Task<List<GoalComment>> GetCommentsByGoalAsync(int goalId)
        {
            var result = await _db
                .GoalComments.Where(c => c.GoalId == goalId)
                .OrderByDescending(c => c.CommentedOn)
                .ToListAsync();

            return result;
        }

        public async Task<List<Goalprogresslog>> GetProgressLogsByGoalAsync(int goalId)
        {
            var result = await _db
                .Goalprogresslogs.Where(p => p.GoalId == goalId)
                .OrderByDescending(p => p.UpdatedOn)
                .ToListAsync();

            return result;
        }

        public async Task<List<ProjectEmployeeModel>> GetProjectSubordinatesAsync(
            int projectId,
            int managerEmployeeMasterId
        )
        {
            var subordinateMasterIds = await _baseRepo.GetSubordinateEmployeeMasterIdsAsync(
                managerEmployeeMasterId
            );

            if (!subordinateMasterIds.Any())
            {
                return new List<ProjectEmployeeModel>();
            }

            var projectEmployees = await GetProjectEmployeesAsync(projectId);
            var projectSubordinates = projectEmployees
                .Where(emp => subordinateMasterIds.Contains(emp.EmpMasterId))
                .ToList();

            return projectSubordinates;
        }

        public async Task<List<ProjectEmployeeModel>> GetProjectEmployeesAsync(int projectId)
        {
            var employees = await _db
                .Employeedetailsmasters.Where(edm =>
                    _db.Projectemployees.Where(pe => pe.ProjectId == projectId)
                        .Select(pe => pe.EmployeeId)
                        .Contains(edm.EmployeeId)
                )
                .Include(edm => edm.Employee)
                    .ThenInclude(emp => emp.Userprofile)
                .AsNoTracking()
                .ToListAsync();

            var result = employees
                .Select(edm => new ProjectEmployeeModel
                {
                    EmpMasterId = edm.EmployeeMasterId,
                    FirstName = edm.Employee?.Userprofile?.FirstName ?? "Unknown",
                    LastName = edm.Employee?.Userprofile?.LastName ?? "Unknown",
                })
                .ToList();

            return result;
        }
    }
}
