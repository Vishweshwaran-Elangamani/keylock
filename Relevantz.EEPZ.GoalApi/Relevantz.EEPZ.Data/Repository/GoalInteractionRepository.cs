using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interface;
using Serilog;

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

            Log.Debug("GoalInteractionRepository initialized.");
        }

        public async Task AddComment(GoalComment comment)
        {
            Log.Information(
                "AddComment START | GoalId={GoalId} | CommentedBy={UserId}",
                comment?.GoalId,
                comment?.CommentedBy
            );

            await _db.GoalComments.AddAsync(comment);

            Log.Information("AddComment END | Comment added (not saved yet)");
        }

        public async Task<List<GoalComment>> GetCommentsByGoal(int goalId)
        {
            Log.Information("GetCommentsByGoal START | GoalId={GoalId}", goalId);

            var result = await _db.GoalComments
                .Where(c => c.GoalId == goalId)
                .OrderByDescending(c => c.CommentedOn)
                .ToListAsync();

            Log.Information(
                "GetCommentsByGoal END | GoalId={GoalId} | Count={Count}",
                goalId, result.Count
            );

            return result;
        }

        public async Task<List<Goalprogresslog>> GetProgressLogsByGoal(int goalId)
        {
            Log.Information("GetProgressLogsByGoal START | GoalId={GoalId}", goalId);

            var result = await _db.Goalprogresslogs
                .Where(p => p.GoalId == goalId)
                .OrderByDescending(p => p.UpdatedOn)
                .ToListAsync();

            Log.Information(
                "GetProgressLogsByGoal END | GoalId={GoalId} | Count={Count}",
                goalId, result.Count
            );

            return result;
        }

        public async Task<List<ProjectEmployeeModel>> FetchProjectTeam(
            int projectId,
            int managerEmployeeMasterId
        )
        {
            Log.Information(
                "FetchProjectTeam START | ProjectId={ProjectId} | ManagerId={ManagerId}",
                projectId,
                managerEmployeeMasterId
            );

            var subordinateMasterIds = await _baseRepo.GetSubordinateEmployeeMasterIds(
                managerEmployeeMasterId
            );

            if (!subordinateMasterIds.Any())
            {
                Log.Information(
                    "FetchProjectTeam | No subordinates found | ManagerId={ManagerId}",
                    managerEmployeeMasterId
                );
                return new List<ProjectEmployeeModel>();
            }

            var projectEmployees = await GetProjectEmployees(projectId);

            var projectSubordinates = projectEmployees
                .Where(emp => subordinateMasterIds.Contains(emp.EmpMasterId))
                .ToList();

            Log.Information(
                "FetchProjectTeam END | ProjectId={ProjectId} | ManagerId={ManagerId} | SubordinateCount={Count}",
                projectId,
                managerEmployeeMasterId,
                projectSubordinates.Count
            );

            return projectSubordinates;
        }

        public async Task<List<ProjectEmployeeModel>> GetProjectEmployees(int projectId)
        {
            Log.Information("GetProjectEmployees START | ProjectId={ProjectId}", projectId);

            var employees = await _db.Employeedetailsmasters
                .Where(edm =>
                    _db.Projectemployees
                        .Where(pe => pe.ProjectId == projectId)
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

            Log.Information(
                "GetProjectEmployees END | ProjectId={ProjectId} | Count={Count}",
                projectId, result.Count
            );

            return result;
        }
    }
}