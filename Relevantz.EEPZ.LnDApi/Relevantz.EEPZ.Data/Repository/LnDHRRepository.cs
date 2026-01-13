using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repositories.Interface;
using Serilog;

namespace Relevantz.EEPZ.Data.Repositories.Implementations
{
    public class LnDHRRepository : ILnDHRRepository
    {
        #region Dependencies

        private readonly EEPZDbContext _context;

        public LnDHRRepository(EEPZDbContext context)
        {
            _context = context;
        }

        #endregion

        #region Employee Queries

        /// <summary>Gets paginated active employees with search across name, email, and department.</summary>
        public async Task<(List<Employee> Items, int TotalCount)> GetAllOrganizationEmployees(
            OrganizationEmployeesRequestModel request
        )
        {
            Log.Information(
                "GetAllOrganizationEmployeesAsync called. SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                request.SearchTerm ?? "none", request.PageNumber, request.PageSize
            );

            var baseQuery = _context.Employees.Where(e => e.EmploymentStatus == "Active");

            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                var lowerSearchTerm = request.SearchTerm.ToLower();

                baseQuery = baseQuery.Where(e =>
                    (e.Userprofile.FirstName + " " + e.Userprofile.LastName)
                        .ToLower()
                        .Contains(lowerSearchTerm)
                    || e.Userauthentication.Email.ToLower().Contains(lowerSearchTerm)
                    || e.Employeedetailsmasters.Any(edm =>
                        edm.Department.DepartmentName.ToLower().Contains(lowerSearchTerm)
                    )
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
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            Log.Information(
                "GetAllOrganizationEmployeesAsync completed. ReturnedCount={Count}, TotalCount={TotalCount}",
                items.Count, totalCount
            );

            return (items, totalCount);
        }

        /// <summary>Gets paginated skills for a specific employee with SME data included.</summary>
        public async Task<(
            List<Lndemployeeskillmapper> Items,
            int TotalCount
        )> GetEmployeeSkillsById(
            int employeeId,
            EmployeeSkillsByIdRequestModel request
        )
        {
            Log.Information(
                "GetEmployeeSkillsByIdAsync called. EmployeeId={EmployeeId}, SearchTerm={SearchTerm}, SortBy={SortBy}, Page={PageNumber}",
                employeeId, request.SearchTerm ?? "none", request.SortBy ?? "default", request.PageNumber
            );

            var query = _context
                .Lndemployeeskillmappers.Include(m => m.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(m => m.Skill)
                .ThenInclude(s => s.Lndsmes)
                .Where(m => m.EmployeeId == employeeId);

            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                query = query.Where(m => m.Skill.SkillName.Contains(request.SearchTerm));
            }

            query = request.SortBy?.ToLower() switch
            {
                LnDConstants.SORT_FIELDS.SKILL_NAME => query.OrderBy(m => m.Skill.SkillName),
                LnDConstants.SORT_FIELDS.RATING => query.OrderByDescending(m => m.Rating),
                LnDConstants.SORT_FIELDS.CREATED_ON => query.OrderByDescending(m => m.CreatedOn),
                _ => query.OrderBy(m => m.Skill.SkillName),
            };

            var pageSize = 10;
            var totalCount = await query.CountAsync();
            var items = await query.Skip((request.PageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

            Log.Information(
                "GetEmployeeSkillsByIdAsync completed. EmployeeId={EmployeeId}, ReturnedCount={Count}, TotalCount={TotalCount}",
                employeeId, items.Count, totalCount
            );

            return (items, totalCount);
        }

        #endregion

        #region Assignment Queries

        /// <summary>Gets paginated organization-wide assignments with filtering, search, and sorting.</summary>
        public async Task<(
            List<Lndassignment> Items,
            int TotalCount
        )> GetAllOrganizationAssignments(OrganizationAssignmentsRequestModel request)
        {
            Log.Information(
                "GetAllOrganizationAssignmentsAsync called. StatusFilter={StatusFilter}, SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                request.StatusFilter ?? "all", request.SearchTerm ?? "none", request.PageNumber, request.PageSize
            );

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

            if (!string.IsNullOrEmpty(request.StatusFilter))
            {
                query = query.Where(a => a.Status == request.StatusFilter);
            }

            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                var lowerSearchTerm = request.SearchTerm.ToLower();

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

            query = ApplyAssignmentSorting(query, request.SortField, request.SortOrder);

            var items = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            Log.Information(
                "GetAllOrganizationAssignmentsAsync completed. ReturnedCount={Count}, TotalCount={TotalCount}",
                items.Count, totalCount
            );

            return (items, totalCount);
        }

        /// <summary>Gets all organization assignments for Excel export without pagination.</summary>
        public async Task<List<Lndassignment>> GetAllOrganizationAssignmentsForExport(
            ExportOrganizationAssignmentsRequestModel request
        )
        {
            Log.Information(
                "GetAllOrganizationAssignmentsForExportAsync called. StatusFilter={StatusFilter}, SearchTerm={SearchTerm}",
                request.StatusFilter ?? "all", request.SearchTerm ?? "none"
            );

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

            if (!string.IsNullOrEmpty(request.StatusFilter))
            {
                query = query.Where(a => a.Status == request.StatusFilter);
            }

            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                var lowerSearchTerm = request.SearchTerm.ToLower();

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

            query = ApplyAssignmentSorting(query, request.SortField, request.SortOrder);

            var items = await query.ToListAsync();

            Log.Information(
                "GetAllOrganizationAssignmentsForExportAsync completed. TotalCount={Count}",
                items.Count
            );

            return items;
        }

        #endregion

        #region Private Helpers

        /// <summary>Applies sorting logic to assignment queries based on sort field and order.</summary>
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

        #endregion
    }
}
