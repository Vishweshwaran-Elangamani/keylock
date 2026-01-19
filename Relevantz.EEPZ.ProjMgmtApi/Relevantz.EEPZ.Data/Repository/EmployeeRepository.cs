using Microsoft.EntityFrameworkCore;
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
                var term = searchTerm.Trim().ToLower();

                query = query.Where(e =>
                    e.Employee.Userprofile.FirstName.ToLower().Contains(term) ||
                    e.Employee.Userprofile.LastName.ToLower().Contains(term) ||
                    e.Employee.EmployeeCompanyId.ToLower().Contains(term) ||
                    e.Employee.Userauthentication.Email.ToLower().Contains(term));
            }

            return await query
                .OrderBy(e => e.Employee.Userprofile.FirstName)
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
            return await BuildEmployeeQuery()
                .Where(e => roleNames.Contains(e.Role.RoleName))
                .OrderBy(e => e.Employee.Userprofile.FirstName)
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
                .Where(p => !string.IsNullOrEmpty(p.BusinessUnit))
                .Select(p => p.BusinessUnit)
                .Distinct()
                .OrderBy(bu => bu)
                .ToListAsync();
        }

        public async Task<List<EmployeeBasicInfo>> GetInitialStageEmployeesAsync()
        {
            var resourcePoolProject = await _context.Projects
                .FirstOrDefaultAsync(p => p.ProjectName.ToLower() == "org.rz.resourcepool");

            var resourcePoolProjectId = resourcePoolProject?.ProjectId;

            var mappedEmployeeMasterIds = resourcePoolProjectId.HasValue
                ? await _context.Projectemployees
                    .Where(pe => pe.ProjectId == resourcePoolProjectId.Value)
                    .Select(pe => pe.EmployeeId)
                    .ToListAsync()
                : new List<int>();

            return await BuildEmployeeQuery()
                .Where(e =>
                    e.Employee.ReportingManagerEmployeeId == null &&
                    !mappedEmployeeMasterIds.Contains(e.EmployeeMasterId))
                .OrderBy(e => e.Employee.Userprofile.FirstName)
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

            var resourcePoolProject = await _context.Projects
                .Include(p => p.L2approverEmployee).ThenInclude(e => e.Employee)
                .FirstOrDefaultAsync(p => p.ProjectName.ToLower() == "org.rz.resourcepool");

            if (resourcePoolProject == null)
                return (0, new List<string> { "Resource pool project 'org.rz.resourcepool' not found" });

            if (!resourcePoolProject.L2approverEmployeeId.HasValue)
                return (0, new List<string> { "Resource pool project does not have L2 Approver assigned" });

            var l2ApproverEmployeeId = resourcePoolProject.L2approverEmployee?.EmployeeId;

            if (!l2ApproverEmployeeId.HasValue)
                return (0, new List<string> { "Invalid L2 Approver configuration for resource pool" });

            var mappedCount = 0;

            foreach (var empMasterId in employeeMasterIds)
            {
                var employeeDetails = await _context.Employeedetailsmasters
                    .Include(e => e.Employee)
                    .FirstOrDefaultAsync(e => e.EmployeeMasterId == empMasterId);

                if (employeeDetails == null)
                {
                    errors.Add($"Employee with ID {empMasterId} not found");
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
