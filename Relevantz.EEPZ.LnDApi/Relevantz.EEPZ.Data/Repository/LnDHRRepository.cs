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

        /// <summary>
        /// Gets paginated active employees with search across name, email, and department 
        /// </summary>
        public async Task<(List<SubordinateEmployeeResponseModel> Items, int TotalCount)> GetAllOrganizationEmployees(
      OrganizationEmployeesRequestModel request
  )
        {
            Log.Information(
                "GetAllOrganizationEmployeesAsync called. SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}, ExcludeDepartment={ExcludeDepartment}",
                request.SearchTerm ?? "none", request.PageNumber, request.PageSize, request.ExcludeDepartment ?? "none"
            );

            var baseQuery = _context.Employees
                .Include(e => e.Userprofile)
                .Include(e => e.Userauthentication)
                .Include(e => e.Employeedetailsmasters)
                .ThenInclude(ed => ed.Department)
                .Where(e => e.EmploymentStatus == "Active");


            if (!string.IsNullOrEmpty(request.ExcludeDepartment))
            {
                baseQuery = baseQuery.Where(e =>
                    !e.Employeedetailsmasters.Any(edm => edm.Department.DepartmentName == request.ExcludeDepartment)
                );
            }


            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                var lowerSearchTerm = request.SearchTerm.ToLower();
                baseQuery = baseQuery.Where(e =>
                    (e.Userprofile.FirstName + " " + e.Userprofile.LastName)
                        .ToLower().Contains(lowerSearchTerm)
                    || e.Userauthentication.Email.ToLower().Contains(lowerSearchTerm)
                    || e.Employeedetailsmasters.Any(edm => edm.Department.DepartmentName.ToLower().Contains(lowerSearchTerm))
                );
            }

            var totalCount = await baseQuery.CountAsync();


            var items = await baseQuery
                .OrderBy(e => e.Userprofile.FirstName)
                .ThenBy(e => e.Userprofile.LastName)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(e => new SubordinateEmployeeResponseModel
                {
                    EmployeeId = e.EmployeeId,
                    EmployeeName = e.Userprofile != null
                        ? e.Userprofile.FirstName + " " + e.Userprofile.LastName
                        : null,
                    Email = e.Userauthentication != null ? e.Userauthentication.Email : null,
                    DepartmentName = e.Employeedetailsmasters.FirstOrDefault(ed => ed.Department != null) != null
                        ? e.Employeedetailsmasters.FirstOrDefault(ed => ed.Department != null).Department.DepartmentName
                        : null
                })
                .ToListAsync();

            Log.Information(
                "GetAllOrganizationEmployeesAsync completed. ReturnedCount={Count}, TotalCount={TotalCount}",
                items.Count, totalCount
            );

            return (items, totalCount);
        }


        /// <summary>
        /// Gets paginated skills for a specific employee with SME data included 
        /// </summary>
        public async Task<(
     List<Lndemployeeskillmapper> Items,
     int TotalCount
 )> GetEmployeeSkillsById(
     int employeeId,
     EmployeeSkillsByIdRequestModel request
 )
        {
            Log.Information(
                "GetEmployeeSkillsByIdAsync called. EmployeeId={EmployeeId}, SearchTerm={SearchTerm}, Page={PageNumber}",
                employeeId,
                request.SearchTerm ?? "none",
                request.PageNumber
            );

            var query = _context.Lndemployeeskillmappers
                .Include(m => m.Employee)
                    .ThenInclude(e => e.Userprofile)
                .Include(m => m.Skill)
                    .ThenInclude(s => s.Lndsmes)
                .AsNoTracking()
                .Where(m => m.EmployeeId == employeeId);


            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                query = query.Where(m =>
                    m.Skill.SkillName.Contains(request.SearchTerm));
            }

            var pageSize = 10;

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((request.PageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            Log.Information(
                "GetEmployeeSkillsByIdAsync completed. EmployeeId={EmployeeId}, ReturnedCount={Count}, TotalCount={TotalCount}",
                employeeId,
                items.Count,
                totalCount
            );

            return (items, totalCount);
        }

        #endregion

        #region Assignment Queries

        /// <summary>
        /// Gets paginated organization-wide assignments with filtering, search, and sorting 
        /// </summary>
        public async Task<(List<Lndassignment> Items, int TotalCount)>
     GetAllOrganizationAssignments(OrganizationAssignmentsRequestModel request)
        {
            var query = _context.Lndassignments
                .Include(a => a.MenteeEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(a => a.MenteeEmployee)
                    .ThenInclude(e => e.Employeedetailsmasters)
                        .ThenInclude(ed => ed.Department)
                .Include(a => a.Skill)
                .Include(a => a.Sme)
                    .ThenInclude(s => s.Employee)
                        .ThenInclude(e => e.Userprofile)
                .AsNoTracking()
                .AsQueryable();


            if (!string.IsNullOrEmpty(request.StatusFilter))
            {
                query = query.Where(a => a.Status == request.StatusFilter);
            }


            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                var search = request.SearchTerm.ToLower();

                query = query.Where(a =>
                    (a.Skill.SkillName ?? "").ToLower().Contains(search) ||
                    (a.MenteeEmployee.Userprofile.FirstName ?? "").ToLower().Contains(search) ||
                    (a.MenteeEmployee.Userprofile.LastName ?? "").ToLower().Contains(search) ||
                    (a.Sme.Employee.Userprofile.FirstName ?? "").ToLower().Contains(search) ||
                    (a.Sme.Employee.Userprofile.LastName ?? "").ToLower().Contains(search)
                );
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            return (items, totalCount);
        }


        /// <summary>
        /// Gets all organization assignments for Excel export without pagination 
        /// </summary>
        public async Task<List<Lndassignment>> GetAllOrganizationAssignmentsForExport(
      ExportOrganizationAssignmentsRequestModel request
  )
        {
            Log.Information(
                "GetAllOrganizationAssignmentsForExportAsync called. StatusFilter={StatusFilter}, SearchTerm={SearchTerm}",
                request.StatusFilter ?? "all",
                request.SearchTerm ?? "none"
            );

            var query = _context.Lndassignments
                .Include(a => a.MenteeEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(a => a.MenteeEmployee)
                    .ThenInclude(e => e.Employeedetailsmasters)
                        .ThenInclude(ed => ed.Department)
                .Include(a => a.Skill)
                .Include(a => a.Sme)
                    .ThenInclude(s => s.Employee)
                        .ThenInclude(e => e.Userprofile)
                .AsNoTracking()
                .AsQueryable();


            if (!string.IsNullOrEmpty(request.StatusFilter))
            {
                query = query.Where(a => a.Status == request.StatusFilter);
            }


            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                var lowerSearchTerm = request.SearchTerm.ToLower();

                query = query.Where(a =>
                    (a.MenteeEmployee.Userprofile.FirstName ?? "").ToLower().Contains(lowerSearchTerm)
                    || (a.MenteeEmployee.Userprofile.LastName ?? "").ToLower().Contains(lowerSearchTerm)
                    || (
                        (a.MenteeEmployee.Userprofile.FirstName ?? "")
                        + " "
                        + (a.MenteeEmployee.Userprofile.LastName ?? "")
                    ).ToLower().Contains(lowerSearchTerm)
                    || (a.Sme.Employee.Userprofile.FirstName ?? "").ToLower().Contains(lowerSearchTerm)
                    || (a.Sme.Employee.Userprofile.LastName ?? "").ToLower().Contains(lowerSearchTerm)
                    || (
                        (a.Sme.Employee.Userprofile.FirstName ?? "")
                        + " "
                        + (a.Sme.Employee.Userprofile.LastName ?? "")
                    ).ToLower().Contains(lowerSearchTerm)
                    || (a.Skill.SkillName ?? "").ToLower().Contains(lowerSearchTerm)
                );
            }

            var items = await query.ToListAsync();

            Log.Information(
                "GetAllOrganizationAssignmentsForExportAsync completed. TotalCount={Count}",
                items.Count
            );

            return items;
        }

        #endregion
    }
}
