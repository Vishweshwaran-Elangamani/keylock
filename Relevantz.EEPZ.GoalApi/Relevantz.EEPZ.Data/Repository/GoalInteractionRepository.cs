using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Enums;
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
        }

        public async Task AddCommentAsync(GoalComment comment)
        {
            try
            {
                Log.Information(
                    "[AddCommentAsync] Adding comment for goal {GoalId}",
                    comment.GoalId
                );
                await _db.GoalComments.AddAsync(comment);
                Log.Information("[AddCommentAsync] Comment added successfully");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[AddCommentAsync] Error adding comment");
                throw;
            }
        }

        public async Task<List<GoalComment>> GetCommentsByGoalAsync(int goalId)
        {
            try
            {
                Log.Information(
                    "[GetCommentsByGoalAsync] Fetching comments for goal {GoalId}",
                    goalId
                );
                var result = await _db
                    .GoalComments.Where(c => c.GoalId == goalId)
                    .OrderByDescending(c => c.CommentedOn)
                    .ToListAsync();
                Log.Information("[GetCommentsByGoalAsync] Found {Count} comments", result.Count);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetCommentsByGoalAsync] Error fetching comments");
                throw;
            }
        }

        public async Task<List<Goalprogresslog>> GetProgressLogsByGoalAsync(int goalId)
        {
            try
            {
                Log.Information(
                    "[GetProgressLogsByGoalAsync] Fetching progress logs for goal {GoalId}",
                    goalId
                );
                var result = await _db
                    .Goalprogresslogs.Where(p => p.GoalId == goalId)
                    .OrderByDescending(p => p.UpdatedOn)
                    .ToListAsync();
                Log.Information(
                    "[GetProgressLogsByGoalAsync] Found {Count} progress logs",
                    result.Count
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetProgressLogsByGoalAsync] Error fetching progress logs");
                throw;
            }
        }

        public async Task<List<ProjectEmployeeModel>> GetProjectSubordinatesAsync(
            int projectId,
            int managerEmployeeMasterId
        )
        {
            try
            {
                Log.Information(
                    "[GetProjectSubordinatesAsync] Fetching subordinates for manager {ManagerID} in project {ProjectId}",
                    managerEmployeeMasterId,
                    projectId
                );

                var subordinateMasterIds = await _baseRepo.GetSubordinateEmployeeMasterIdsAsync(
                    managerEmployeeMasterId
                );

                if (!subordinateMasterIds.Any())
                {
                    Log.Warning(
                        "[GetProjectSubordinatesAsync] No subordinates found for manager {ManagerID}",
                        managerEmployeeMasterId
                    );
                    return new List<ProjectEmployeeModel>();
                }

                var projectEmployees = await GetProjectEmployeesAsync(projectId);
                var projectSubordinates = projectEmployees
                    .Where(emp => subordinateMasterIds.Contains(emp.EmpMasterId))
                    .ToList();

                Log.Information(
                    "[GetProjectSubordinatesAsync] Found {Count} subordinates in project",
                    projectSubordinates.Count
                );
                return projectSubordinates;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetProjectSubordinatesAsync] Error fetching project subordinates");
                throw;
            }
        }

        public async Task<List<ProjectEmployeeModel>> GetProjectEmployeesAsync(int projectId)
        {
            try
            {
                Log.Information(
                    "[GetProjectEmployeesAsync] Fetching employees for project {ProjectId}",
                    projectId
                );

                // Include full navigation chain BEFORE querying
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

                Log.Information(
                    "[GetProjectEmployeesAsync] Found {Count} employees for project",
                    employees.Count
                );

                // Convert to DTO with proper null coalescing
                var result = employees
                    .Select(edm => new ProjectEmployeeModel
                    {
                        EmpMasterId = edm.EmployeeMasterId,
                        FirstName = edm.Employee?.Userprofile?.FirstName ?? "Unknown",
                        LastName = edm.Employee?.Userprofile?.LastName ?? "Unknown",
                    })
                    .ToList();

                Log.Information(
                    "[GetProjectEmployeesAsync] Converted {Count} employees to Models",
                    result.Count
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetProjectEmployeesAsync] Error fetching project employees");
                throw;
            }
        }
    }
}
