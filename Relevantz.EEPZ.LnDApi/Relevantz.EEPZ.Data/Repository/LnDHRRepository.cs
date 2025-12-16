using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repositories.Interface;

namespace Relevantz.EEPZ.Data.Repositories.Implementations
{
    public class LnDHRRepository : ILnDHRRepository
    {
        private readonly EEPZDbContext _context;

        public LnDHRRepository(EEPZDbContext context)
        {
            _context = context;
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

        public async Task<List<Lndassignment>> GetAllOrganizationAssignmentsForExportAsync(
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

            query = ApplyAssignmentSorting(query, sortField, sortOrder);

            return await query.ToListAsync();
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
                .Lndemployeeskillmappers.Include(m => m.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(m => m.Skill)
                .ThenInclude(s => s.Lndsmes)
                .Where(m => m.EmployeeId == employeeId);

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(m => m.Skill.SkillName.Contains(searchTerm));
            }

            query = sortBy?.ToLower() switch
            {
                LnDConstants.SORT_FIELDS.SKILL_NAME => query.OrderBy(m => m.Skill.SkillName),
                LnDConstants.SORT_FIELDS.RATING => query.OrderByDescending(m => m.Rating),
                LnDConstants.SORT_FIELDS.CREATED_ON => query.OrderByDescending(m => m.CreatedOn),
                _ => query.OrderBy(m => m.Skill.SkillName),
            };

            var totalCount = await query.CountAsync();
            var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

            return (items, totalCount);
        }

        private IQueryable<Lndassignment> ApplyAssignmentSorting(
            IQueryable<Lndassignment> query,
            string? sortField,
            string? sortOrder
        )
        {
            var isAscending = string.IsNullOrEmpty(sortOrder) ||
                             sortOrder.ToLower() == LnDConstants.SORT_ORDER.ASC;

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

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}
