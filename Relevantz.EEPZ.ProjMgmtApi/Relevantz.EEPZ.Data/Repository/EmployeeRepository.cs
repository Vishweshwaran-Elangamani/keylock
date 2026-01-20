using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class EmployeeRepository : IEmployeeRepository
    {
        private readonly EEPZDbContext _context;

        public EmployeeRepository(EEPZDbContext context)
        {
            _context = context;
        }

        private IQueryable<Employeedetailsmaster> BuildEmployeeQuery()
        {
            return _context.Employeedetailsmasters
                .AsNoTracking()
                .Include(e => e.Employee).ThenInclude(e => e.Userprofile)
                .Include(e => e.Employee).ThenInclude(e => e.Userauthentication)
                .Include(e => e.Role)
                .Include(e => e.Department)
                .Where(e => e.Employee.IsActive == true);
        }

        public async Task<List<EmployeeBasicInfo>> GetEmployeesAsync(int? departmentId, int? roleId, string? searchTerm)
        {
            var query = BuildEmployeeQuery();

            if (departmentId.HasValue)
                query = query.Where(e => e.DepartmentId == departmentId.Value);

            if (roleId.HasValue)
                query = query.Where(e => e.RoleId == roleId.Value);

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.Trim();
                var like = $"%{term}%";

                query = query.Where(e =>
                    EF.Functions.Like(e.Employee.Userprofile.FirstName ?? "", like) ||
                    EF.Functions.Like(e.Employee.Userprofile.LastName ?? "", like) ||
                    EF.Functions.Like(e.Employee.EmployeeCompanyId ?? "", like) ||
                    EF.Functions.Like(e.Employee.Userauthentication.Email ?? "", like));
            }

            return await query
                .OrderBy(e => e.Employee.Userprofile.FirstName)
                .ThenBy(e => e.Employee.Userprofile.LastName)
                .Take(50)
                .Select(e => new EmployeeBasicInfo
                {
                    EmployeeMasterId = e.EmployeeMasterId,
                    EmployeeId = e.EmployeeId,
                    EmployeeCompanyId = e.Employee.EmployeeCompanyId,
                    FirstName = e.Employee.Userprofile.FirstName,
                    LastName = e.Employee.Userprofile.LastName,
                    Email = e.Employee.Userauthentication.Email,
                    RoleName = e.Role.RoleName,
                    DepartmentName = e.Department.DepartmentName
                })
                .ToListAsync();
        }

        public async Task<List<EmployeeBasicInfo>> GetEmployeesByRoleNamesAsync(List<string> roleNames)
        {
            if (roleNames == null || roleNames.Count == 0)
                return new List<EmployeeBasicInfo>();

            return await BuildEmployeeQuery()
                .Where(e => roleNames.Contains(e.Role.RoleName))
                .OrderBy(e => e.Employee.Userprofile.FirstName)
                .ThenBy(e => e.Employee.Userprofile.LastName)
                .Select(e => new EmployeeBasicInfo
                {
                    EmployeeMasterId = e.EmployeeMasterId,
                    EmployeeId = e.EmployeeId,
                    EmployeeCompanyId = e.Employee.EmployeeCompanyId,
                    FirstName = e.Employee.Userprofile.FirstName,
                    LastName = e.Employee.Userprofile.LastName,
                    Email = e.Employee.Userauthentication.Email,
                    RoleName = e.Role.RoleName,
                    DepartmentName = e.Department.DepartmentName
                })
                .ToListAsync();
        }

        public async Task<EmployeeBasicInfo?> GetEmployeeByIdAsync(int employeeMasterId)
        {
            return await BuildEmployeeQuery()
                .Where(e => e.EmployeeMasterId == employeeMasterId)
                .Select(e => new EmployeeBasicInfo
                {
                    EmployeeMasterId = e.EmployeeMasterId,
                    EmployeeId = e.EmployeeId,
                    EmployeeCompanyId = e.Employee.EmployeeCompanyId,
                    FirstName = e.Employee.Userprofile.FirstName,
                    LastName = e.Employee.Userprofile.LastName,
                    Email = e.Employee.Userauthentication.Email,
                    RoleName = e.Role.RoleName,
                    DepartmentName = e.Department.DepartmentName
                })
                .FirstOrDefaultAsync();
        }

        public async Task<List<DepartmentDto>> GetAllDepartmentsAsync()
        {
            return await _context.Set<Department>()
                .AsNoTracking()
                .OrderBy(d => d.DepartmentName)
                .Select(d => new DepartmentDto
                {
                    DepartmentId = d.DepartmentId,
                    DepartmentName = d.DepartmentName,
                    BudgetAllocated = d.BudgetAllocated,
                    CostCenter = d.CostCenter
                })
                .ToListAsync();
        }

        public async Task<DepartmentDetailDto?> GetDepartmentByIdAsync(int departmentId)
        {
            return await _context.Set<Department>()
                .AsNoTracking()
                .Where(d => d.DepartmentId == departmentId)
                .Select(d => new DepartmentDetailDto
                {
                    DepartmentId = d.DepartmentId,
                    DepartmentName = d.DepartmentName,
                    BudgetAllocated = d.BudgetAllocated,
                    CostCenter = d.CostCenter,
                    CreatedAt = d.CreatedAt,
                    UpdatedAt = d.UpdatedAt
                })
                .FirstOrDefaultAsync();
        }

        public async Task<List<string>> GetAllBusinessUnitsAsync()
        {
            return await _context.Projects
                .AsNoTracking()
                .Where(p => !string.IsNullOrEmpty(p.BusinessUnit))
                .Select(p => p.BusinessUnit!)
                .Distinct()
                .OrderBy(bu => bu)
                .ToListAsync();
        }

        public async Task<List<EmployeeBasicInfo>> GetInitialStageEmployeesAsync()
        {
            var resourcePoolProject = await _context.Projects
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.ProjectName.ToLower() == AppConstants.ProjectNames.ResourcePoolProjectName);

            var resourcePoolProjectId = resourcePoolProject?.ProjectId;

            var mappedEmployeeMasterIds = resourcePoolProjectId.HasValue
                ? await _context.Projectemployees
                    .AsNoTracking()
                    .Where(pe => pe.ProjectId == resourcePoolProjectId.Value)
                    .Select(pe => pe.EmployeeId)
                    .ToListAsync()
                : new List<int>();

            return await BuildEmployeeQuery()
                .Where(e =>
                    e.Employee.ReportingManagerEmployeeId == null &&
                    !mappedEmployeeMasterIds.Contains(e.EmployeeMasterId))
                .OrderBy(e => e.Employee.Userprofile.FirstName)
                .ThenBy(e => e.Employee.Userprofile.LastName)
                .Select(e => new EmployeeBasicInfo
                {
                    EmployeeMasterId = e.EmployeeMasterId,
                    EmployeeId = e.EmployeeId,
                    EmployeeCompanyId = e.Employee.EmployeeCompanyId,
                    FirstName = e.Employee.Userprofile.FirstName,
                    LastName = e.Employee.Userprofile.LastName,
                    Email = e.Employee.Userauthentication.Email,
                    RoleName = e.Role.RoleName,
                    DepartmentName = e.Department.DepartmentName
                })
                .ToListAsync();
        }

        public async Task<(int mappedCount, List<string> errors)> MapEmployeesToResourcePoolAsync(List<int> employeeMasterIds)
        {
            var errors = new List<string>();

            if (employeeMasterIds == null || employeeMasterIds.Count == 0)
                return (0, errors);

            var resourcePoolProject = await _context.Projects
                .Include(p => p.L2approverEmployee).ThenInclude(e => e.Employee)
                .FirstOrDefaultAsync(p => p.ProjectName.ToLower() == AppConstants.ProjectNames.ResourcePoolProjectName);

            if (resourcePoolProject == null)
                return (0, new List<string> { AppConstants.RepositoryErrors.ResourcePoolProjectNotFound });

            if (!resourcePoolProject.L2approverEmployeeId.HasValue)
                return (0, new List<string> { AppConstants.RepositoryErrors.ResourcePoolProjectL2ApproverMissing });

            var l2ApproverEmployeeId = resourcePoolProject.L2approverEmployee?.EmployeeId;

            if (!l2ApproverEmployeeId.HasValue)
                return (0, new List<string> { AppConstants.RepositoryErrors.ResourcePoolProjectInvalidL2ApproverConfig });

            var mappedCount = 0;

            foreach (var empMasterId in employeeMasterIds.Distinct())
            {
                var employeeDetails = await _context.Employeedetailsmasters
                    .Include(e => e.Employee)
                    .FirstOrDefaultAsync(e => e.EmployeeMasterId == empMasterId);

                if (employeeDetails == null)
                {
                    errors.Add($"{AppConstants.RepositoryErrors.EmployeeNotFoundPrefix}: {empMasterId}");
                    continue;
                }

                var exists = await _context.Projectemployees.AnyAsync(pe =>
                    pe.ProjectId == resourcePoolProject.ProjectId &&
                    pe.EmployeeId == empMasterId);

                if (exists)
                    continue;

                _context.Projectemployees.Add(new Projectemployee
                {
                    ProjectId = resourcePoolProject.ProjectId,
                    EmployeeId = empMasterId,
                    AssignedAt = DateTime.UtcNow,
                    IsPrimary = true
                });

                if (employeeDetails.Employee != null)
                {
                    employeeDetails.Employee.ReportingManagerEmployeeId = l2ApproverEmployeeId.Value;
                    employeeDetails.Employee.UpdatedAt = DateTime.UtcNow;
                    _context.Entry(employeeDetails.Employee).State = EntityState.Modified;
                }

                mappedCount++;
            }

            await _context.SaveChangesAsync();
            return (mappedCount, errors);
        }
    }
}
