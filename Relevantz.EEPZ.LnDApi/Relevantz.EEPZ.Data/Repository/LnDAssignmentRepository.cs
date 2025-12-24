using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repositories.Interface;     

namespace Relevantz.EEPZ.Data.Repositories.Implementations
{
    public class LnDAssignmentRepository : ILnDAssignmentRepository
    {
        private readonly EEPZDbContext _context;

        public LnDAssignmentRepository(EEPZDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all assignments that are overdue (past deadline and not completed)
        /// </summary>
        public async Task<List<Lndassignment>> GetOverdueAssignmentsAsync()
        {
            var today = DateTime.Now.Date;

            return await _context
                .Lndassignments.Include(a => a.MenteeEmployee)
                .Include(a => a.Sme)
                .Include(a => a.Skill)
                .Where(a =>
                    a.Deadline.HasValue
                    && a.Deadline.Value.Date < today
                    && a.Status != LnDConstants.ASSIGNMENT_STATUS.COMPLETED
                    && a.Status != LnDConstants.ASSIGNMENT_STATUS.OVERDUE
                )
                .ToListAsync();
        }

        /// <summary>
        /// Mark assignments as overdue
        /// </summary>
        public async Task<int> MarkAssignmentsAsOverdueAsync()
        {
            var overdueAssignments = await GetOverdueAssignmentsAsync();

            foreach (var assignment in overdueAssignments)
            {
                assignment.Status = LnDConstants.ASSIGNMENT_STATUS.OVERDUE;
                assignment.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);
            }

            _context.Lndassignments.UpdateRange(overdueAssignments);
            return await _context.SaveChangesAsync();
        }

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
                .Lndassignments
                .Include(a => a.MenteeEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Sme)
                .ThenInclude(s => s.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .Include(a => a.Lndapprovals)
                .Where(a => a.MenteeEmployee.ReportingManagerEmployeeId == managerId);

            if (!string.IsNullOrEmpty(statusFilter))
            {
                query = query.Where(a => a.Status == statusFilter);
            }

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

                    _ => query.OrderByDescending(a => a.CreatedOn),
                };
            }
            else
            {
                query = query.OrderByDescending(a => a.CreatedOn);
            }

            var totalCount = await query.CountAsync();

            var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();


            foreach (var item in items)
            {
                var latestApproval = item.Lndapprovals
                    .OrderByDescending(ap => ap.UpdatedOn)
                    .FirstOrDefault();

                if (latestApproval != null && !string.IsNullOrEmpty(latestApproval.Notes))
                {
                    item.CompletionNotes = latestApproval.Notes;
                }
            }

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

            if (!string.IsNullOrEmpty(statusFilter))
            {
                query = query.Where(a => a.Status == statusFilter);
            }

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(a =>
                    a.Skill.SkillName.Contains(searchTerm)
                    || a.MenteeEmployee.Userprofile.FirstName.Contains(searchTerm)
                    || a.MenteeEmployee.Userprofile.LastName.Contains(searchTerm)
                );
            }

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

                    _ => query.OrderByDescending(a => a.CreatedOn),
                };
            }
            else
            {
                query = query.OrderByDescending(a => a.CreatedOn);
            }

            var totalCount = await query.CountAsync();

            var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

            return (items, totalCount);
        }

        public async Task<List<Lndassignment>> GetAllTeamAssignmentsForExportAsync(
            int managerId,
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder
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
                .Where(a => a.MenteeEmployee.ReportingManagerEmployeeId == managerId)
                .AsQueryable();

            if (!string.IsNullOrEmpty(statusFilter))
            {
                query = query.Where(a => a.Status == statusFilter);
            }

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(a =>
                    (a.Skill.SkillName ?? "").Contains(searchTerm)
                    || (a.MenteeEmployee.Userprofile.FirstName ?? "").Contains(searchTerm)
                    || (a.MenteeEmployee.Userprofile.LastName ?? "").Contains(searchTerm)
                    || (
                        (a.MenteeEmployee.Userprofile.FirstName ?? "")
                        + " "
                        + (a.MenteeEmployee.Userprofile.LastName ?? "")
                    ).Contains(searchTerm)
                    || (a.Sme.Employee.Userprofile.FirstName ?? "").Contains(searchTerm)
                    || (a.Sme.Employee.Userprofile.LastName ?? "").Contains(searchTerm)
                );
            }

            query = ApplyAssignmentSorting(query, sortField, sortOrder);

            return await query.ToListAsync();
        }

        private IQueryable<Lndassignment> ApplyAssignmentSorting(
            IQueryable<Lndassignment> query,
            string? sortField,
            string? sortOrder
        )
        {
            var isAscending =
                string.IsNullOrEmpty(sortOrder)
                || sortOrder.ToLower() == LnDConstants.SORT_ORDER.ASC;

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


    }
}


