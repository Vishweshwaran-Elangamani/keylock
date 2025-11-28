using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repositories.Interface;

namespace Relevantz.EEPZ.Data.Repositories.Implementations
{
    public class LnDRepository : ILnDRepository
    {
        private readonly EEPZDbContext _context;

        public LnDRepository(EEPZDbContext context)
        {
            _context = context;
        }

        #region Employee Management

        public async Task<Employee?> GetEmployeeByIdAsync(int employeeId)
        {
            return await _context
                .Employees.Include(e => e.Userprofile)
                .Include(e => e.Userauthentication)
                .Include(e => e.Employeedetailsmasters)
                .ThenInclude(ed => ed.Department)
                .FirstOrDefaultAsync(e => e.EmployeeId == employeeId);
        }

        public async Task<Lndsme?> GetSmeFromEmployeeId(
            Dictionary<string, object> assignmentDetails
        )
        {
            var smeIdElement = (JsonElement)assignmentDetails["SmeId"];
            int SmeEmployeeId = smeIdElement.GetInt32();

            return await _context.Lndsmes.FirstOrDefaultAsync(s => s.EmployeeId == SmeEmployeeId);
        }

        public async Task<(List<Employee> Items, int TotalCount)> GetSubordinateEmployeesAsync(
            int managerId,
            string? searchTerm,
            int pageNumber,
            int pageSize
        )
        {
            IQueryable<Employee> query = _context
                .Employees.Include(e => e.Userprofile)
                .Include(e => e.Userauthentication)
                .Include(e => e.Employeedetailsmasters)
                .ThenInclude(ed => ed.Department)
                .Where(e =>
                    e.ReportingManagerEmployeeId == managerId && e.EmploymentStatus == LnDConstants.EMPLOYMENT_STATUS.ACTIVE
                );

            // Apply search filter if provided
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

            // Get total count for pagination
            var totalCount = await query.CountAsync();

            // Apply pagination
            var items = await query
                .OrderBy(e => e.Userprofile.FirstName)
                .ThenBy(e => e.Userprofile.LastName)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        #endregion

        #region Skills Management

        public async Task<List<MasterSkill>> GetAllSkillsAsync()
        {
            return await _context.MasterSkills.OrderBy(s => s.SkillName).ToListAsync();
        }

        public async Task<MasterSkill?> GetSkillByIdAsync(int skillId)
        {
            return await _context.MasterSkills.FirstOrDefaultAsync(s => s.SkillId == skillId);
        }

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

            return (items, totalCount);
        }

        public async Task<Lndemployeeskillmapper?> GetEmployeeSkillMappingAsync(
            int employeeId,
            int skillId
        )
        {
            return await _context
                .Lndemployeeskillmappers.Include(m => m.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(m => m.Skill)
                .FirstOrDefaultAsync(m => m.EmployeeId == employeeId && m.SkillId == skillId);
        }

        public async Task<Lndemployeeskillmapper?> GetEmployeeSkillMappingByIdAsync(int mapperId)
        {
            return await _context
                .Lndemployeeskillmappers.Include(m => m.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(m => m.Skill)
                .FirstOrDefaultAsync(m => m.MapperId == mapperId);
        }

        public async Task<Lndemployeeskillmapper> AddEmployeeSkillAsync(
            Lndemployeeskillmapper mapper
        )
        {
            _context.Lndemployeeskillmappers.Add(mapper);
            await _context.SaveChangesAsync();

            // Reload with includes
            return (await GetEmployeeSkillMappingByIdAsync(mapper.MapperId))!;
        }

        public async Task<List<Lndemployeeskillmapper>> AddEmployeeSkillsAsync(
            List<Lndemployeeskillmapper> mappers
        )
        {
            _context.Lndemployeeskillmappers.AddRange(mappers);
            await _context.SaveChangesAsync();
            return mappers;
        }

        public async Task UpdateEmployeeSkillAsync(Lndemployeeskillmapper mapper)
        {
            _context.Lndemployeeskillmappers.Update(mapper);
        }

        public async Task DeleteEmployeeSkillAsync(Lndemployeeskillmapper mapper)
        {
            _context.Lndemployeeskillmappers.Remove(mapper);
        }

        public async Task<(List<Lndemployeeskillmapper> Items, int TotalCount)> GetMySkillsAsync(
            int employeeId,
            string? searchTerm,
            int pageNumber,
            int pageSize
        )
        {
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

            return (items, totalCount);
        }

        public async Task<List<int>> GetExistingSkillMappingsAsync(
            int employeeId,
            List<int> skillIds
        )
        {
            return await _context
                .Lndemployeeskillmappers.Where(m =>
                    m.EmployeeId == employeeId && skillIds.Contains(m.SkillId)
                )
                .Select(m => m.SkillId)
                .ToListAsync();
        }

        #endregion

        #region SME Management

        public async Task<bool> IsEmployeeSmeAsync(int employeeId)
        {
            return await _context.Lndsmes.AnyAsync(s =>
                s.EmployeeId == employeeId && s.IsActive == true
            );
        }

        public async Task<Lndsme?> GetActiveSmeAsync(int employeeId, int skillId)
        {
            return await _context.Lndsmes.FirstOrDefaultAsync(s =>
                s.EmployeeId == employeeId && s.SkillId == skillId && s.IsActive == true
            );
        }

        public async Task<Lndsme> AddSmeAsync(Lndsme sme)
        {
            _context.Lndsmes.Add(sme);
            return sme;
        }

        public async Task UpdateSmeAsync(Lndsme sme)
        {
            _context.Lndsmes.Update(sme);
        }

        public async Task<(
            List<Lndsme> Items,
            int TotalCount
        )> GetAvailableSmesWithAssignmentCountsAsync(
            int skillId,
            string? searchTerm,
            int pageNumber,
            int pageSize,
            int maxAssignments
        )
        {
            var query = _context
                .Lndsmes.Include(s => s.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(s => s.Skill)
                .Where(s => s.SkillId == skillId && s.IsActive == true);

            var smesWithCounts = await query
                .Select(s => new
                {
                    Sme = s,
                    InProgressCount = _context.Lndassignments.Count(a =>
                        a.SmeId == s.SmeId && a.Status == LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS
                    ),
                })
                .ToListAsync();

            var availableSmesWithCounts = smesWithCounts
                .Where(sc => sc.InProgressCount < maxAssignments)
                .ToList();

            if (!string.IsNullOrEmpty(searchTerm))
            {
                availableSmesWithCounts = availableSmesWithCounts
                    .Where(sc =>
                        sc.Sme.Employee.Userprofile.FirstName.Contains(
                            searchTerm,
                            StringComparison.OrdinalIgnoreCase
                        )
                        || sc.Sme.Employee.Userprofile.LastName.Contains(
                            searchTerm,
                            StringComparison.OrdinalIgnoreCase
                        )
                    )
                    .ToList();
            }

            var totalCount = availableSmesWithCounts.Count;
            var items = availableSmesWithCounts
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(sc => sc.Sme)
                .ToList();

            return (items, totalCount);
        }

        #endregion

        #region Assignment Management

        public async Task<Lndassignment?> GetAssignmentByIdAsync(int assignmentId)
        {
            return await _context
                .Lndassignments.Include(a => a.MenteeEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Sme)
                .ThenInclude(s => s.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .FirstOrDefaultAsync(a => a.AssignmentId == assignmentId);
        }

        public async Task<Lndassignment> AddAssignmentAsync(Lndassignment assignment)
        {
            _context.Lndassignments.Add(assignment);
            return assignment;
        }

        public async Task UpdateAssignmentAsync(Lndassignment assignment)
        {
            _context.Lndassignments.Update(assignment);
        }

        public async Task<(List<Lndassignment> Items, int TotalCount)> GetMyAssignmentsAsync(
            int employeeId,
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        )
        {
            var query = _context
                .Lndassignments.Include(a => a.MenteeEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Sme)
                .ThenInclude(s => s.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .Where(a => a.MenteeEmployeeId == employeeId);

            if (!string.IsNullOrEmpty(statusFilter))
            {
                query = query.Where(a => a.Status == statusFilter);
            }

            if (!string.IsNullOrEmpty(searchTerm))
            {
                var lowerSearchTerm = searchTerm.ToLower();

                query = query.Where(a =>
                    a.Skill.SkillName.ToLower().Contains(lowerSearchTerm)
                    || (
                        (a.Sme.Employee.Userprofile.FirstName ?? "")
                        + " "
                        + (a.Sme.Employee.Userprofile.LastName ?? "")
                    )
                        .ToLower()
                        .Contains(lowerSearchTerm)
                    || (
                        (a.MenteeEmployee.Userprofile.FirstName ?? "")
                        + " "
                        + (a.MenteeEmployee.Userprofile.LastName ?? "")
                    )
                        .ToLower()
                        .Contains(lowerSearchTerm)
                    || a.Status.ToLower().Contains(lowerSearchTerm)
                    || (
                        a.CompletionNotes != null
                        && a.CompletionNotes.ToLower().Contains(lowerSearchTerm)
                    )
                );
            }

            var totalCount = await query.CountAsync();

            query = ApplyAssignmentSorting(query, sortField, sortOrder);

            var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

            return (items, totalCount);
        }

        public async Task<(List<Lndassignment> Items, int TotalCount)> GetTeamAssignmentsAsync(
            int managerId,
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        )
        {
            var query = _context
                .Lndassignments.Include(a => a.MenteeEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Sme)
                .ThenInclude(s => s.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .Where(a => a.MenteeEmployee.ReportingManagerEmployeeId == managerId);

            // Apply status filter
            if (!string.IsNullOrEmpty(statusFilter))
            {
                query = query.Where(a => a.Status == statusFilter);
            }

            // Apply search filter
            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(a =>
                    a.Skill.SkillName.Contains(searchTerm)
                    || a.MenteeEmployee.Userprofile.FirstName.Contains(searchTerm)
                    || a.MenteeEmployee.Userprofile.LastName.Contains(searchTerm)
                    || (
                        a.MenteeEmployee.Userprofile.FirstName
                        + " "
                        + a.MenteeEmployee.Userprofile.LastName
                    ).Contains(searchTerm)
                    || a.Sme.Employee.Userprofile.FirstName.Contains(searchTerm)
                    || a.Sme.Employee.Userprofile.LastName.Contains(searchTerm)
                    || (
                        a.Sme.Employee.Userprofile.FirstName
                        + " "
                        + a.Sme.Employee.Userprofile.LastName
                    ).Contains(searchTerm)
                );
            }

            // Apply sorting
            if (!string.IsNullOrWhiteSpace(sortField))
            {
                var isAscending = sortOrder?.ToLower() != LnDConstants.SORT_ORDER.DESC;

                query = sortField.ToLower() switch
                {
                    LnDConstants.SORT_FIELDS.MENTEE_NAME => isAscending
                        ? query
                            .OrderBy(a => a.MenteeEmployee.Userprofile.FirstName)
                            .ThenBy(a => a.MenteeEmployee.Userprofile.LastName)
                        : query
                            .OrderByDescending(a => a.MenteeEmployee.Userprofile.FirstName)
                            .ThenByDescending(a => a.MenteeEmployee.Userprofile.LastName),

                    LnDConstants.SORT_FIELDS.SKILL_NAME => isAscending
                        ? query.OrderBy(a => a.Skill.SkillName)
                        : query.OrderByDescending(a => a.Skill.SkillName),

                    LnDConstants.SORT_FIELDS.SME_NAME => isAscending
                        ? query
                            .OrderBy(a => a.Sme.Employee.Userprofile.FirstName)
                            .ThenBy(a => a.Sme.Employee.Userprofile.LastName)
                        : query
                            .OrderByDescending(a => a.Sme.Employee.Userprofile.FirstName)
                            .ThenByDescending(a => a.Sme.Employee.Userprofile.LastName),

                    LnDConstants.SORT_FIELDS.STATUS => isAscending
                        ? query.OrderBy(a => a.Status)
                        : query.OrderByDescending(a => a.Status),

                    LnDConstants.SORT_FIELDS.CREATED_ON => isAscending
                        ? query.OrderBy(a => a.CreatedOn)
                        : query.OrderByDescending(a => a.CreatedOn),

                    LnDConstants.SORT_FIELDS.DEADLINE => isAscending
                        ? query.OrderBy(a => a.Deadline)
                        : query.OrderByDescending(a => a.Deadline),

                    LnDConstants.SORT_FIELDS.COMPLETION_RATING => isAscending
                        ? query.OrderBy(a => a.CompletionRating ?? 0)
                        : query.OrderByDescending(a => a.CompletionRating ?? 0),

                    _ => query.OrderByDescending(a => a.CreatedOn), // Default sort
                };
            }
            else
            {
                // Default sorting when no sortField is specified
                query = query.OrderByDescending(a => a.CreatedOn);
            }

            var totalCount = await query.CountAsync();

            var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

            return (items, totalCount);
        }

        public async Task<(List<Lndassignment> Items, int TotalCount)> GetSmeAssignmentsAsync(
            int smeEmployeeId,
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        )
        {
            var query = _context
                .Lndassignments.Include(a => a.MenteeEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Sme)
                .ThenInclude(s => s.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .Where(a => a.Sme.EmployeeId == smeEmployeeId);

            // Apply status filter
            if (!string.IsNullOrEmpty(statusFilter))
            {
                query = query.Where(a => a.Status == statusFilter);
            }

            // Apply search filter
            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(a =>
                    a.Skill.SkillName.Contains(searchTerm)
                    || a.MenteeEmployee.Userprofile.FirstName.Contains(searchTerm)
                    || a.MenteeEmployee.Userprofile.LastName.Contains(searchTerm)
                );
            }

            // Apply sorting
            if (!string.IsNullOrWhiteSpace(sortField))
            {
                var isAscending = sortOrder?.ToLower() != LnDConstants.SORT_ORDER.DESC;

                query = sortField.ToLower() switch
                {
                    LnDConstants.SORT_FIELDS.MENTEE_NAME => isAscending
                        ? query
                            .OrderBy(a => a.MenteeEmployee.Userprofile.FirstName)
                            .ThenBy(a => a.MenteeEmployee.Userprofile.LastName)
                        : query
                            .OrderByDescending(a => a.MenteeEmployee.Userprofile.FirstName)
                            .ThenByDescending(a => a.MenteeEmployee.Userprofile.LastName),

                    LnDConstants.SORT_FIELDS.SKILL_NAME => isAscending
                          ? query.OrderBy(a => a.Skill.SkillName)
                          : query.OrderByDescending(a => a.Skill.SkillName),

                    LnDConstants.SORT_FIELDS.STATUS => isAscending
                            ? query.OrderBy(a => a.Status)
                            : query.OrderByDescending(a => a.Status),

                    LnDConstants.SORT_FIELDS.CREATED_ON => isAscending
                        ? query.OrderBy(a => a.CreatedOn)
                        : query.OrderByDescending(a => a.CreatedOn),

                    LnDConstants.SORT_FIELDS.DEADLINE => isAscending
                        ? query.OrderBy(a => a.Deadline)
                        : query.OrderByDescending(a => a.Deadline),

                    LnDConstants.SORT_FIELDS.COMPLETION_RATING => isAscending
                        ? query.OrderBy(a => a.CompletionRating ?? 0)
                        : query.OrderByDescending(a => a.CompletionRating ?? 0),

                    _ => query.OrderByDescending(a => a.CreatedOn), // Default sort
                };
            }
            else
            {
                // Default sorting when no sortField is specified
                query = query.OrderByDescending(a => a.CreatedOn);
            }

            var totalCount = await query.CountAsync();

            var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

            return (items, totalCount);
        }

        public async Task<int> GetSmeInProgressAssignmentCountAsync(int smeId)
        {
            return await _context.Lndassignments.CountAsync(a =>
                a.SmeId == smeId && a.Status == LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS
            );
        }

        private IQueryable<Lndassignment> ApplyAssignmentSorting(
            IQueryable<Lndassignment> query,
            string? sortField,
            string? sortOrder
        )
        {
            var isAscending = string.IsNullOrEmpty(sortOrder) || sortOrder.ToLower() == LnDConstants.SORT_ORDER.ASC;

            return sortField?.ToLower() switch
            {
                LnDConstants.SORT_FIELDS.SKILL_NAME => isAscending
                    ? query.OrderBy(a => a.Skill.SkillName)
                    : query.OrderByDescending(a => a.Skill.SkillName),
                LnDConstants.SORT_FIELDS.SME_NAME => isAscending
                    ? query
                        .OrderBy(a => a.Sme.Employee.Userprofile.FirstName)
                        .ThenBy(a => a.Sme.Employee.Userprofile.LastName)
                    : query
                        .OrderByDescending(a => a.Sme.Employee.Userprofile.FirstName)
                        .ThenByDescending(a => a.Sme.Employee.Userprofile.LastName),
                LnDConstants.SORT_FIELDS.STATUS => isAscending
                    ? query.OrderBy(a => a.Status)
                    : query.OrderByDescending(a => a.Status),
                LnDConstants.SORT_FIELDS.CREATED_ON => isAscending
                    ? query.OrderBy(a => a.CreatedOn)
                    : query.OrderByDescending(a => a.CreatedOn),
                LnDConstants.SORT_FIELDS.DEADLINE => isAscending
                    ? query.OrderBy(a => a.Deadline)
                    : query.OrderByDescending(a => a.Deadline),
                LnDConstants.SORT_FIELDS.COMPLETION_RATING => isAscending
                    ? query.OrderBy(a => a.CompletionRating ?? 0)
                    : query.OrderByDescending(a => a.CompletionRating ?? 0),
                _ => query.OrderByDescending(a => a.CreatedOn),
            };
        }

        #endregion

        #region Approval Management

        public async Task<Lndapproval?> GetApprovalByIdAsync(int approvalId)
        {
            return await _context
                .Lndapprovals.Include(a => a.RequesterEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.ApproverEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .Include(a => a.Attachment)
                .Include(a => a.Assignment)
                .ThenInclude(a => a.MenteeEmployee)
                .ThenInclude(e => e.Userprofile)
                .FirstOrDefaultAsync(a => a.ApprovalId == approvalId);
        }

        public async Task<Lndapproval?> GetPendingSmeRegistrationAsync(int employeeId, int skillId)
        {
            return await _context.Lndapprovals.FirstOrDefaultAsync(a =>
                a.RequesterEmployeeId == employeeId
                && a.SkillId == skillId
                && a.ApprovalType == LnDConstants.APPROVAL_TYPE.SME_REGISTRATION
                && a.Status == LnDConstants.APPROVAL_STATUS.PENDING
            );
        }

        public async Task<Lndapproval> AddApprovalAsync(Lndapproval approval)
        {
            _context.Lndapprovals.Add(approval);
            return approval;
        }

        public async Task UpdateApprovalAsync(Lndapproval approval)
        {
            _context.Lndapprovals.Update(approval);
        }

        public async Task<(List<Lndapproval> Items, int TotalCount)> GetMyApprovalsAsync(
            int employeeId,
            string? approvalType,
            string? status,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        )
        {
            var query = _context
                .Lndapprovals.Include(a => a.RequesterEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.ApproverEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .Include(a => a.Attachment)
                .Where(a => a.ApproverEmployeeId == employeeId);

            // Apply approval type filter
            if (!string.IsNullOrEmpty(approvalType))
            {
                query = query.Where(a => a.ApprovalType == approvalType);
            }

            // Apply status filter
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(a => a.Status == status);
            }

            // Apply sorting
            if (!string.IsNullOrWhiteSpace(sortField))
            {
                var isAscending = sortOrder?.ToLower() != LnDConstants.SORT_ORDER.DESC;

                query = sortField.ToLower() switch
                {
                    LnDConstants.SORT_FIELDS.APPROVAL_TYPE => isAscending
                        ? query.OrderBy(a => a.ApprovalType)
                        : query.OrderByDescending(a => a.ApprovalType),

                    LnDConstants.SORT_FIELDS.REQUESTER_NAME => isAscending
                        ? query
                            .OrderBy(a => a.RequesterEmployee.Userprofile.FirstName)
                            .ThenBy(a => a.RequesterEmployee.Userprofile.LastName)
                        : query
                            .OrderByDescending(a => a.RequesterEmployee.Userprofile.FirstName)
                            .ThenByDescending(a => a.RequesterEmployee.Userprofile.LastName),

                    LnDConstants.SORT_FIELDS.APPROVER_NAME => isAscending
                        ? query
                            .OrderBy(a => a.ApproverEmployee.Userprofile.FirstName)
                            .ThenBy(a => a.ApproverEmployee.Userprofile.LastName)
                        : query
                            .OrderByDescending(a => a.ApproverEmployee.Userprofile.FirstName)
                            .ThenByDescending(a => a.ApproverEmployee.Userprofile.LastName),

                    LnDConstants.SORT_FIELDS.REQUESTED_ON => isAscending
                        ? query.OrderBy(a => a.RequestedOn)
                        : query.OrderByDescending(a => a.RequestedOn),

                    LnDConstants.SORT_FIELDS.STATUS => isAscending
                        ? query.OrderBy(a => a.Status)
                        : query.OrderByDescending(a => a.Status),

                    _ => query.OrderByDescending(a => a.RequestedOn), // Default sort
                };
            }
            else
            {
                // Default sorting when no sortField is specified
                query = query.OrderByDescending(a => a.RequestedOn);
            }

            var totalCount = await query.CountAsync();

            var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

            return (items, totalCount);
        }

        public async Task<(List<Lndapproval> Items, int TotalCount)> GetApprovalHistoryAsync(
            int employeeId,
            string? approvalType,
            string? status,
            string? role,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        )
        {
            var query = _context
                .Lndapprovals.Include(a => a.RequesterEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.ApproverEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .Include(a => a.Attachment)
                .AsQueryable();

            if (!string.IsNullOrEmpty(role) && role.ToLower() != LnDConstants.ROLE_FILTERS.ALL)
            {
                if (role.ToLower() == LnDConstants.ROLE_FILTERS.REQUESTER)
                {
                    query = query.Where(a => a.RequesterEmployeeId == employeeId);
                }
                else if (role.ToLower() == LnDConstants.ROLE_FILTERS.APPROVER)
                {
                    query = query.Where(a => a.ApproverEmployeeId == employeeId);
                }
            }
            else
            {
                query = query.Where(a =>
                    a.RequesterEmployeeId == employeeId || a.ApproverEmployeeId == employeeId
                );
            }

            if (!string.IsNullOrEmpty(approvalType))
            {
                query = query.Where(a => a.ApprovalType == approvalType);
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(a => a.Status == status);
            }

            if (!string.IsNullOrEmpty(searchTerm))
            {
                var lowerSearchTerm = searchTerm.ToLower();
                query = query.Where(a =>
                    (
                        a.RequesterEmployee.Userprofile.FirstName
                        + " "
                        + a.RequesterEmployee.Userprofile.LastName
                    )
                        .ToLower()
                        .Contains(lowerSearchTerm)
                    || (
                        a.ApproverEmployee != null
                        && (
                            a.ApproverEmployee.Userprofile.FirstName
                            + " "
                            + a.ApproverEmployee.Userprofile.LastName
                        )
                            .ToLower()
                            .Contains(lowerSearchTerm)
                    )
                    || (a.Skill != null && a.Skill.SkillName.ToLower().Contains(lowerSearchTerm))
                    || (a.Notes != null && a.Notes.ToLower().Contains(lowerSearchTerm))
                    || a.ApprovalType.ToLower().Contains(lowerSearchTerm)
                    || a.Status.ToLower().Contains(lowerSearchTerm)
                );
            }

            var totalCount = await query.CountAsync();

            query = ApplyApprovalSorting(query, sortField, sortOrder);

            var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

            return (items, totalCount);
        }

        public async Task<Lndapproval?> GetPendingAssignmentApprovalAsync(
            int assignmentId,
            string approvalType
        )
        {
            return await _context.Lndapprovals.FirstOrDefaultAsync(a =>
                a.AssignmentId == assignmentId
                && a.Status == LnDConstants.APPROVAL_STATUS.PENDING
                && a.ApprovalType == approvalType
            );
        }

        private IQueryable<Lndapproval> ApplyApprovalSorting(
            IQueryable<Lndapproval> query,
            string? sortField,
            string? sortOrder
        )
        {
            var isAscending = string.IsNullOrEmpty(sortOrder) || sortOrder.ToLower() == "asc";

            return sortField?.ToLower() switch
            {
                LnDConstants.SORT_FIELDS.APPROVAL_TYPE => isAscending
                    ? query.OrderBy(a => a.ApprovalType)
                    : query.OrderByDescending(a => a.ApprovalType),
                LnDConstants.SORT_FIELDS.SKILL_NAME => isAscending
                    ? query.OrderBy(a => a.Skill != null ? a.Skill.SkillName : "")
                    : query.OrderByDescending(a => a.Skill != null ? a.Skill.SkillName : ""),
                LnDConstants.SORT_FIELDS.REQUESTER_NAME => isAscending
                    ? query
                        .OrderBy(a => a.RequesterEmployee.Userprofile.FirstName)
                        .ThenBy(a => a.RequesterEmployee.Userprofile.LastName)
                    : query
                        .OrderByDescending(a => a.RequesterEmployee.Userprofile.FirstName)
                        .ThenByDescending(a => a.RequesterEmployee.Userprofile.LastName),
                LnDConstants.SORT_FIELDS.APPROVER_NAME => isAscending
                    ? query
                        .OrderBy(a =>
                            a.ApproverEmployee != null
                                ? a.ApproverEmployee.Userprofile.FirstName
                                : ""
                        )
                        .ThenBy(a =>
                            a.ApproverEmployee != null
                                ? a.ApproverEmployee.Userprofile.LastName
                                : ""
                        )
                    : query
                        .OrderByDescending(a =>
                            a.ApproverEmployee != null
                                ? a.ApproverEmployee.Userprofile.FirstName
                                : ""
                        )
                        .ThenByDescending(a =>
                            a.ApproverEmployee != null
                                ? a.ApproverEmployee.Userprofile.LastName
                                : ""
                        ),
                LnDConstants.SORT_FIELDS.STATUS => isAscending
                    ? query.OrderBy(a => a.Status)
                    : query.OrderByDescending(a => a.Status),
                LnDConstants.SORT_FIELDS.REQUESTED_ON => isAscending
                    ? query.OrderBy(a => a.RequestedOn)
                    : query.OrderByDescending(a => a.RequestedOn),
                _ => query.OrderByDescending(a => a.UpdatedOn ?? a.RequestedOn),
            };
        }

        #endregion

        #region Attachment Management 

        public async Task<Lndattachment> AddAttachmentAsync(Lndattachment attachment)
        {
            _context.Lndattachments.Add(attachment);
            return attachment;
        }

        public async Task<Lndattachment?> GetAttachmentByIdAsync(int attachmentId)
        {
            return await _context.Lndattachments.FirstOrDefaultAsync(a =>
                a.AttachmentId == attachmentId
            );
        }

        #endregion

        #region HR Management
        public async Task<List<Lndassignment>> GetAllOrganizationAssignmentsForExportAsync(
    string? statusFilter,
    string? searchTerm,
    string? sortField,
    string? sortOrder)
        {
            var query = _context
                .Lndassignments
                .Include(a => a.MenteeEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .Include(a => a.Sme)
                    .ThenInclude(s => s.Employee)
                        .ThenInclude(e => e.Userprofile)
                .AsQueryable();

            // Apply status filter
            if (!string.IsNullOrEmpty(statusFilter))
            {
                query = query.Where(a => a.Status == statusFilter);
            }

            // Apply search filter
            if (!string.IsNullOrEmpty(searchTerm))
            {
                var lowerSearchTerm = searchTerm.ToLower();
                query = query.Where(a =>
                    (a.MenteeEmployee.Userprofile.FirstName ?? "").ToLower().Contains(lowerSearchTerm) ||
                    (a.MenteeEmployee.Userprofile.LastName ?? "").ToLower().Contains(lowerSearchTerm) ||
                    ((a.MenteeEmployee.Userprofile.FirstName ?? "") + " " + (a.MenteeEmployee.Userprofile.LastName ?? ""))
                        .ToLower().Contains(lowerSearchTerm) ||
                    (a.Sme.Employee.Userprofile.FirstName ?? "").ToLower().Contains(lowerSearchTerm) ||
                    (a.Sme.Employee.Userprofile.LastName ?? "").ToLower().Contains(lowerSearchTerm) ||
                    (a.Skill.SkillName ?? "").ToLower().Contains(lowerSearchTerm)
                );
            }

            // Apply sorting
            query = ApplyAssignmentSorting(query, sortField, sortOrder);

            // Return all results (no pagination for export)
            return await query.ToListAsync();
        }

        public async Task<(List<Employee> Items, int TotalCount)> GetAllOrganizationEmployeesAsync(
            string? searchTerm,
            int pageNumber,
            int pageSize
        )
        {
            var baseQuery = _context.Employees.Where(e => e.EmploymentStatus == "Active");

            if (!string.IsNullOrEmpty(searchTerm))
            {
                var lowerSearchTerm = searchTerm.ToLower();

                baseQuery = baseQuery.Where(e =>
                    (e.Userprofile.FirstName + " " + e.Userprofile.LastName)
                        .ToLower()
                        .Contains(lowerSearchTerm)
                    || e.Userauthentication.Email.ToLower().Contains(lowerSearchTerm)
                    || e.Employeedetailsmasters.Any(edm =>
                        edm.Department.DepartmentName.ToLower().Contains(lowerSearchTerm))
                );
            }



            var totalCount = await baseQuery.CountAsync();

            var items = await baseQuery
                .Include(e => e.Userprofile)
                .Include(e => e.Userauthentication)
                .Include(e => e.Employeedetailsmasters)
                .ThenInclude(ed => ed.Department)
                .OrderBy(e => e.Userprofile.FirstName)
                .ThenBy(e => e.Userprofile.LastName)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<(
            List<Lndassignment> Items,
            int TotalCount
        )> GetAllOrganizationAssignmentsAsync(
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        )
        {
            var query = _context
                .Lndassignments.Include(a => a.MenteeEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.MenteeEmployee)
                .ThenInclude(e => e.Employeedetailsmasters)
                .ThenInclude(ed => ed.Department)
                .Include(a => a.Skill)
                .Include(a => a.Sme)
                .ThenInclude(s => s.Employee)
                .ThenInclude(e => e.Userprofile)
                .AsQueryable();

            if (!string.IsNullOrEmpty(statusFilter))
            {
                query = query.Where(a => a.Status == statusFilter);
            }

            if (!string.IsNullOrEmpty(searchTerm))
            {
                var lowerSearchTerm = searchTerm.ToLower();

                query = query.Where(a =>
                    (a.MenteeEmployee.Userprofile.FirstName ?? "")
                        .ToLower()
                        .Contains(lowerSearchTerm)
                    || (a.MenteeEmployee.Userprofile.LastName ?? "")
                        .ToLower()
                        .Contains(lowerSearchTerm)
                    || (
                        (a.MenteeEmployee.Userprofile.FirstName ?? "")
                        + " "
                        + (a.MenteeEmployee.Userprofile.LastName ?? "")
                    )
                        .ToLower()
                        .Contains(lowerSearchTerm)
                    || (a.Sme.Employee.Userprofile.FirstName ?? "")
                        .ToLower()
                        .Contains(lowerSearchTerm)
                    || (a.Sme.Employee.Userprofile.LastName ?? "")
                        .ToLower()
                        .Contains(lowerSearchTerm)
                    || (
                        (a.Sme.Employee.Userprofile.FirstName ?? "")
                        + " "
                        + (a.Sme.Employee.Userprofile.LastName ?? "")
                    )
                        .ToLower()
                        .Contains(lowerSearchTerm)
                    || (a.Skill.SkillName ?? "").ToLower().Contains(lowerSearchTerm)
                );
            }

            var totalCount = await query.CountAsync();

            query = ApplyAssignmentSorting(query, sortField, sortOrder);

            var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

            return (items, totalCount);
        }

        public async Task<(List<Lndsme> Items, int TotalCount)> GetAllActiveSmesAsync(
            string? searchTerm,
            int pageNumber,
            int pageSize
        )
        {
            var query = _context
                .Lndsmes.Where(s => s.IsActive.Value)
                .Include(s => s.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(s => s.Employee)
                .ThenInclude(e => e.Employeedetailsmasters)
                .ThenInclude(ed => ed.Department)
                .Include(s => s.Skill)
                .AsQueryable();

            if (!string.IsNullOrEmpty(searchTerm))
            {
                var lowerSearchTerm = searchTerm.ToLower();

                query = query.Where(s =>
                    (s.Employee.Userprofile.FirstName ?? "").ToLower().Contains(lowerSearchTerm)
                    || (s.Employee.Userprofile.LastName ?? "").ToLower().Contains(lowerSearchTerm)
                    || (
                        (s.Employee.Userprofile.FirstName ?? "")
                        + " "
                        + (s.Employee.Userprofile.LastName ?? "")
                    )
                        .ToLower()
                        .Contains(lowerSearchTerm)
                    || (s.Skill.SkillName ?? "").ToLower().Contains(lowerSearchTerm)
                    || (
                        s.Employee.Employeedetailsmasters.Any()
                        && (
                            s.Employee.Employeedetailsmasters.First().Department.DepartmentName
                            ?? ""
                        )
                            .ToLower()
                            .Contains(lowerSearchTerm)
                    )
                );
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderBy(s => s.Employee.Userprofile.FirstName)
                .ThenBy(s => s.Employee.Userprofile.LastName)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<(
            List<Lndemployeeskillmapper> Items,
            int TotalCount
        )> GetEmployeeSkillsByIdAsync(
            int employeeId,
            string? searchTerm,
            string? sortBy,
            int pageNumber,
            int pageSize
        )
        {
            var query = _context
                .Lndemployeeskillmappers.Where(m => m.EmployeeId == employeeId)
                .Include(m => m.Skill)
                .AsQueryable();

            if (!string.IsNullOrEmpty(searchTerm))
            {
                var lowerSearchTerm = searchTerm.ToLower();
                query = query.Where(m => m.Skill.SkillName.ToLower().Contains(lowerSearchTerm));
            }

            var totalCount = await query.CountAsync();

            if (!string.IsNullOrEmpty(sortBy))
            {
                query = sortBy.ToLower() switch
                {
                    LnDConstants.SORT_FIELDS.SKILL_NAME => query.OrderBy(m => m.Skill.SkillName),
                    LnDConstants.SORT_FIELDS.RATING => query.OrderByDescending(m => m.Rating),
                    _ => query.OrderBy(m => m.Skill.SkillName),
                };
            }
            else
            {
                query = query.OrderBy(m => m.Skill.SkillName);
            }

            var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

            return (items, totalCount);
        }

        #endregion


        #region Unit of Work

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        #endregion
    }
}
