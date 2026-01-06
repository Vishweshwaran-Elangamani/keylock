using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repositories.Interface;
using Serilog;

namespace Relevantz.EEPZ.Data.Repositories.Implementations
{
    public class LnDEmployeeSkillRepository : ILnDEmployeeSkillRepository
    {
        #region Dependencies

        private readonly EEPZDbContext _context;

        public LnDEmployeeSkillRepository(EEPZDbContext context)    
        {
            _context = context;
        }

        #endregion

        #region Employee Queries

        /// <summary>Gets an employee by ID with profile, authentication, and department details.</summary>
        public async Task<Employee?> GetEmployeeByIdAsync(int employeeId)
        {
            Log.Debug("GetEmployeeByIdAsync called. EmployeeId={EmployeeId}", employeeId);

            var employee = await _context
                .Employees.Include(e => e.Userprofile)
                .Include(e => e.Userauthentication)
                .Include(e => e.Employeedetailsmasters)
                .ThenInclude(ed => ed.Department)
                .FirstOrDefaultAsync(e => e.EmployeeId == employeeId);         

            if (employee == null)
            {
                Log.Warning("GetEmployeeByIdAsync: Employee not found. EmployeeId={EmployeeId}", employeeId);
            }

            return employee;                                              
        }

        /// <summary>Gets paginated subordinate employees with search across name, email, and department.</summary>
        public async Task<(List<Employee> Items, int TotalCount)> GetSubordinateEmployeesAsync(
            int managerId,
            string? searchTerm,
            int pageNumber,
            int pageSize
        )
        {
            Log.Information(
                "GetSubordinateEmployeesAsync called. ManagerId={ManagerId}, SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                managerId, searchTerm ?? "none", pageNumber, pageSize
            );

            IQueryable<Employee> query = _context
                .Employees.Include(e => e.Userprofile)
                .Include(e => e.Userauthentication)
                .Include(e => e.Employeedetailsmasters)
                .ThenInclude(ed => ed.Department)
                .Where(e =>
                    e.ReportingManagerEmployeeId == managerId
                    && e.EmploymentStatus == LnDConstants.EMPLOYMENT_STATUS.ACTIVE
                );

            if (!string.IsNullOrEmpty(searchTerm))
            {
                var lowerSearchTerm = searchTerm.ToLower();

                query = query.Where(e =>
                    e.Userprofile.FirstName.ToLower().Contains(lowerSearchTerm)
                    || e.Userprofile.LastName.ToLower().Contains(lowerSearchTerm)
                    || (e.Userprofile.FirstName + " " + e.Userprofile.LastName)
                        .ToLower()
                        .Contains(lowerSearchTerm)
                    || e.Userauthentication.Email.ToLower().Contains(lowerSearchTerm)
                    || (
                        e.Employeedetailsmasters.Any()
                        && e.Employeedetailsmasters.First()
                            .Department.DepartmentName.ToLower()
                            .Contains(lowerSearchTerm)
                    )
                );
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderBy(e => e.Userprofile.FirstName)
                .ThenBy(e => e.Userprofile.LastName)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            Log.Information(
                "GetSubordinateEmployeesAsync completed. ManagerId={ManagerId}, ReturnedCount={Count}, TotalCount={TotalCount}",
                managerId, items.Count, totalCount
            );

            return (items, totalCount);
        }

        #endregion

        #region Skill Queries

        /// <summary>Gets all skills ordered by skill name.</summary>
        public async Task<List<MasterSkill>> GetAllSkillsAsync()
        {
            Log.Debug("GetAllSkillsAsync called");

            var skills = await _context.MasterSkills.OrderBy(s => s.SkillName).ToListAsync();

            Log.Information("GetAllSkillsAsync completed. SkillCount={Count}", skills.Count);

            return skills;
        }

        /// <summary>Gets a single skill by ID.</summary>
        public async Task<MasterSkill?> GetSkillByIdAsync(int skillId)
        {
            Log.Debug("GetSkillByIdAsync called. SkillId={SkillId}", skillId);

            var skill = await _context.MasterSkills.FirstOrDefaultAsync(s => s.SkillId == skillId);

            if (skill == null)
            {
                Log.Warning("GetSkillByIdAsync: Skill not found. SkillId={SkillId}", skillId);
            }

            return skill;
        }

        #endregion

        #region Skill Mapping Queries

        /// <summary>Gets paginated subordinate skill mappings with optional employee filter and search.</summary>
        public async Task<(
            List<Lndemployeeskillmapper> Items,
            int TotalCount
        )> GetSubordinateSkillsAsync(
            int managerId,
            int? employeeId,
            string? searchTerm,
            string? sortBy,
            int pageNumber,
            int pageSize
        )
        {
            Log.Information(
                "GetSubordinateSkillsAsync called. ManagerId={ManagerId}, EmployeeId={EmployeeId}, SearchTerm={SearchTerm}, SortBy={SortBy}, Page={PageNumber}",
                managerId, employeeId?.ToString() ?? "all", searchTerm ?? "none", sortBy ?? "default", pageNumber
            );

            var query = _context
                .Lndemployeeskillmappers.Include(m => m.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(m => m.Skill)
                .ThenInclude(s => s.Lndsmes)
                .Where(m => m.Employee.ReportingManagerEmployeeId == managerId);

            if (employeeId.HasValue)
                query = query.Where(m => m.EmployeeId == employeeId.Value);

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(m =>
                    m.Skill.SkillName.Contains(searchTerm)
                    || m.Employee.Userprofile.FirstName.Contains(searchTerm)
                    || m.Employee.Userprofile.LastName.Contains(searchTerm)
                );
            }

            query = sortBy?.ToLower() switch
            {
                LnDConstants.SORT_FIELDS.SKILL_NAME => query.OrderBy(m => m.Skill.SkillName),
                LnDConstants.SORT_FIELDS.RATING => query.OrderByDescending(m => m.Rating),
                LnDConstants.SORT_FIELDS.CREATED_ON => query.OrderByDescending(m => m.CreatedOn),
                _ => query.OrderBy(m => m.Employee.Userprofile.FirstName),
            };

            var totalCount = await query.CountAsync();
            var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

            Log.Information(
                "GetSubordinateSkillsAsync completed. ManagerId={ManagerId}, ReturnedCount={Count}, TotalCount={TotalCount}",
                managerId, items.Count, totalCount
            );

            return (items, totalCount);
        }

        /// <summary>Gets paginated skill mappings for a specific employee.</summary>
        public async Task<(List<Lndemployeeskillmapper> Items, int TotalCount)> GetMySkillsAsync(
            int employeeId,
            string? searchTerm,
            int pageNumber,
            int pageSize
        )
        {
            Log.Information(
                "GetMySkillsAsync called. EmployeeId={EmployeeId}, SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                employeeId, searchTerm ?? "none", pageNumber, pageSize
            );

            var query = _context
                .Lndemployeeskillmappers.Include(m => m.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(m => m.Skill)
                .ThenInclude(s => s.Lndsmes)
                .Where(m => m.EmployeeId == employeeId);

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(m => m.Skill.SkillName.Contains(searchTerm));
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderBy(m => m.Skill.SkillName)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            Log.Information(
                "GetMySkillsAsync completed. EmployeeId={EmployeeId}, ReturnedCount={Count}, TotalCount={TotalCount}",
                employeeId, items.Count, totalCount
            );

            return (items, totalCount);
        }

        /// <summary>Gets a skill mapping by employee ID and skill ID.</summary>
        public async Task<Lndemployeeskillmapper?> GetEmployeeSkillMappingAsync(
            int employeeId,
            int skillId
        )
        {
            Log.Debug(
                "GetEmployeeSkillMappingAsync called. EmployeeId={EmployeeId}, SkillId={SkillId}",
                employeeId, skillId
            );

            var mapping = await _context
                .Lndemployeeskillmappers.Include(m => m.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(m => m.Skill)
                .FirstOrDefaultAsync(m => m.EmployeeId == employeeId && m.SkillId == skillId);

            if (mapping == null)
            {
                Log.Debug(
                    "GetEmployeeSkillMappingAsync: Mapping not found. EmployeeId={EmployeeId}, SkillId={SkillId}",
                    employeeId, skillId
                );
            }

            return mapping;
        }

        /// <summary>Gets a skill mapping by mapper ID.</summary>
        public async Task<Lndemployeeskillmapper?> GetEmployeeSkillMappingByIdAsync(int mapperId)
        {
            Log.Debug("GetEmployeeSkillMappingByIdAsync called. MapperId={MapperId}", mapperId);

            var mapping = await _context
                .Lndemployeeskillmappers.Include(m => m.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(m => m.Skill)
                .FirstOrDefaultAsync(m => m.MapperId == mapperId);

            if (mapping == null)
            {
                Log.Warning("GetEmployeeSkillMappingByIdAsync: Mapping not found. MapperId={MapperId}", mapperId);
            }

            return mapping;
        }

        /// <summary>Gets existing skill IDs for an employee from a list of skill IDs.</summary>
        public async Task<List<int>> GetExistingSkillMappingsAsync(
            int employeeId,
            List<int> skillIds
        )
        {
            Log.Debug(
                "GetExistingSkillMappingsAsync called. EmployeeId={EmployeeId}, SkillIdsCount={Count}",
                employeeId, skillIds.Count
            );

            var existingSkillIds = await _context
                .Lndemployeeskillmappers.Where(m =>
                    m.EmployeeId == employeeId && skillIds.Contains(m.SkillId)
                )
                .Select(m => m.SkillId)
                .ToListAsync();

            Log.Debug(
                "GetExistingSkillMappingsAsync completed. EmployeeId={EmployeeId}, ExistingCount={Count}",
                employeeId, existingSkillIds.Count
            );

            return existingSkillIds;
        }

        #endregion

        #region Skill Mapping Modifications

        /// <summary>Adds a single skill mapping and returns the saved entity with generated ID.</summary>
        public async Task<Lndemployeeskillmapper> AddEmployeeSkillAsync(
            Lndemployeeskillmapper mapper
        )
        {
            Log.Information(
                "AddEmployeeSkillAsync called. EmployeeId={EmployeeId}, SkillId={SkillId}, Rating={Rating}",
                mapper.EmployeeId, mapper.SkillId, mapper.Rating
            );

            _context.Lndemployeeskillmappers.Add(mapper);
            await _context.SaveChangesAsync();

            Log.Information(
                "AddEmployeeSkillAsync completed. MapperId={MapperId}, EmployeeId={EmployeeId}, SkillId={SkillId}",
                mapper.MapperId, mapper.EmployeeId, mapper.SkillId
            );

            return (await GetEmployeeSkillMappingByIdAsync(mapper.MapperId))!;
        }

        /// <summary>Adds multiple skill mappings in bulk and returns the saved entities.</summary>
        public async Task<List<Lndemployeeskillmapper>> AddEmployeeSkillsAsync(
            List<Lndemployeeskillmapper> mappers
        )
        {
            Log.Information(
                "AddEmployeeSkillsAsync called. MappingsCount={Count}",
                mappers.Count
            );

            _context.Lndemployeeskillmappers.AddRange(mappers);
            await _context.SaveChangesAsync();

            Log.Information(
                "AddEmployeeSkillsAsync completed. SavedCount={Count}",
                mappers.Count
            );

            return mappers;
        }

        /// <summary>Updates an existing skill mapping in the database context (requires SaveChanges).</summary>
        public async Task UpdateEmployeeSkillAsync(Lndemployeeskillmapper mapper)
        {
            Log.Information(
                "UpdateEmployeeSkillAsync called. MapperId={MapperId}, EmployeeId={EmployeeId}, SkillId={SkillId}, Rating={Rating}",
                mapper.MapperId, mapper.EmployeeId, mapper.SkillId, mapper.Rating
            );

            _context.Lndemployeeskillmappers.Update(mapper);

            Log.Debug("UpdateEmployeeSkillAsync: Mapper updated in context. Pending SaveChanges");
        }

        /// <summary>Deletes a skill mapping from the database context (requires SaveChanges).</summary>
        public async Task DeleteEmployeeSkillAsync(Lndemployeeskillmapper mapper)
        {
            Log.Information(
                "DeleteEmployeeSkillAsync called. MapperId={MapperId}, EmployeeId={EmployeeId}, SkillId={SkillId}",
                mapper.MapperId, mapper.EmployeeId, mapper.SkillId
            );

            _context.Lndemployeeskillmappers.Remove(mapper);

            Log.Debug("DeleteEmployeeSkillAsync: Mapper removed from context. Pending SaveChanges");
        }


        public async Task<List<Lndapproval>> GetPendingSkillApprovalsAsync(int employeeId, int skillId)
        {
            Log.Debug(
                "GetPendingSkillApprovalsAsync called. EmployeeId={EmployeeId}, SkillId={SkillId}",
                employeeId, skillId
            );

            var approvals = await _context.Lndapprovals
                .Where(a => a.SkillId == skillId
                         && a.RequesterEmployeeId == employeeId
                         && a.Status == LnDConstants.APPROVAL_STATUS.PENDING
                         && a.ApprovalType == LnDConstants.APPROVAL_TYPE.SME_REQUEST)
                .ToListAsync();

            Log.Debug(
                "GetPendingSkillApprovalsAsync completed. Count={Count}",
                approvals.Count
            );

            return approvals;  
        }

        /// <summary>Gets active assignments for a specific employee and skill.</summary>
        public async Task<List<Lndassignment>> GetActiveAssignmentsForSkillAsync(int employeeId, int skillId)
        {
            Log.Debug(
                "GetActiveAssignmentsForSkillAsync called. EmployeeId={EmployeeId}, SkillId={SkillId}",
                employeeId, skillId
            );

            var assignments = await _context.Lndassignments
                .Where(a => a.MenteeEmployeeId == employeeId
                         && a.SkillId == skillId
                         && (a.Status == LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS
                             || a.Status == LnDConstants.ASSIGNMENT_STATUS.OVERDUE
                             || a.Status == LnDConstants.ASSIGNMENT_STATUS.PENDING_SME_ACKNOWLEDGEMENT
                             || a.Status == LnDConstants.ASSIGNMENT_STATUS.PENDING_MANAGER_ACKNOWLEDGEMENT))
                .ToListAsync();

            Log.Debug(
                "GetActiveAssignmentsForSkillAsync completed. Count={Count}",
                assignments.Count
            );

            return assignments;
        }

        /// <summary>Gets pending approvals for specific assignments.</summary>
        public async Task<List<Lndapproval>> GetPendingAssignmentApprovalsAsync(List<int> assignmentIds)
        {
            Log.Debug(
                "GetPendingAssignmentApprovalsAsync called. AssignmentCount={Count}",
                assignmentIds.Count
            );

            if (!assignmentIds.Any())
            {
                return new List<Lndapproval>();
            }

            var approvals = await _context.Lndapprovals
                .Where(a => assignmentIds.Contains(a.AssignmentId.Value)
                         && a.Status == LnDConstants.APPROVAL_STATUS.PENDING)
                .ToListAsync();

            Log.Debug(
                "GetPendingAssignmentApprovalsAsync completed. Count={Count}",
                approvals.Count
            );

            return approvals;
        }

        /// <summary>Deletes multiple approvals from the database.</summary>
        public async Task DeleteApprovalsAsync(List<Lndapproval> approvals)
        {
            Log.Debug(
                "DeleteApprovalsAsync called. Count={Count}",
                approvals.Count
            );

            if (approvals.Any())
            {
                _context.Lndapprovals.RemoveRange(approvals);
                Log.Debug("DeleteApprovalsAsync: Approvals marked for deletion");
            }

            await Task.CompletedTask;
        }

        /// <summary>Deletes multiple assignments from the database.</summary>
        public async Task DeleteAssignmentsAsync(List<Lndassignment> assignments)
        {
            Log.Debug(
                "DeleteAssignmentsAsync called. Count={Count}",
                assignments.Count
            );

            if (assignments.Any())
            {
                _context.Lndassignments.RemoveRange(assignments);
                Log.Debug("DeleteAssignmentsAsync: Assignments marked for deletion");
            }

            await Task.CompletedTask;
        }




        #endregion
    }
}


