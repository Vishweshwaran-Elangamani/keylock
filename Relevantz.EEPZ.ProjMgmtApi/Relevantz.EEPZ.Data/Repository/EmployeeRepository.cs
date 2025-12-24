using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class EmployeeRepository : IEmployeeRepository
    {
        private readonly EEPZDbContext _context;

        public EmployeeRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<List<EmployeeDto>> GetAllEmployeesAsync()
        {
            return await _context.Employeedetailsmasters
                .Include(e => e.Employee).ThenInclude(e => e.Userprofile)
                .Include(e => e.Employee).ThenInclude(e => e.Userauthentication)
                .Include(e => e.Role)
                .Include(e => e.Department)
                .Where(e => e.Employee.IsActive == true)
                .OrderBy(e => e.Employee.Userprofile.FirstName)
                .Select(e => new EmployeeDto
                {
                    EmployeeMasterId = e.EmployeeMasterId,
                    EmployeeId = e.EmployeeId,
                    EmployeeCompanyId = e.Employee.EmployeeCompanyId,
                    FirstName = e.Employee.Userprofile.FirstName,
                    LastName = e.Employee.Userprofile.LastName,
                    Email = e.Employee.Userauthentication.Email,
                    RoleName = e.Role.RoleName,
                    DepartmentName = e.Department.DepartmentName
                }).ToListAsync();
        }

        public async Task<List<EmployeeDto>> GetManagersAsync()
        {
            var managerRoles = new[]
            {
                "Project Manager", "Team Lead", "Technical Architect",
                "HR Manager", "Senior Software Engineer", "Senior Manager",
                "Director", "Vice President", "CTO", "CEO"
            };

            return await _context.Employeedetailsmasters
                .Include(e => e.Employee).ThenInclude(e => e.Userprofile)
                .Include(e => e.Employee).ThenInclude(e => e.Userauthentication)
                .Include(e => e.Role)
                .Include(e => e.Department)
                .Where(e => e.Employee.IsActive == true && managerRoles.Contains(e.Role.RoleName))
                .OrderBy(e => e.Employee.Userprofile.FirstName)
                .Select(e => new EmployeeDto
                {
                    EmployeeMasterId = e.EmployeeMasterId,
                    EmployeeId = e.EmployeeId,
                    EmployeeCompanyId = e.Employee.EmployeeCompanyId,
                    FirstName = e.Employee.Userprofile.FirstName,
                    LastName = e.Employee.Userprofile.LastName,
                    Email = e.Employee.Userauthentication.Email,
                    RoleName = e.Role.RoleName,
                    DepartmentName = e.Department.DepartmentName
                }).ToListAsync();
        }

        public async Task<EmployeeDto?> GetEmployeeByIdAsync(int employeeMasterId)
        {
            return await _context.Employeedetailsmasters
                .Include(e => e.Employee).ThenInclude(e => e.Userprofile)
                .Include(e => e.Employee).ThenInclude(e => e.Userauthentication)
                .Include(e => e.Role)
                .Include(e => e.Department)
                .Where(e => e.EmployeeMasterId == employeeMasterId)
                .Select(e => new EmployeeDto
                {
                    EmployeeMasterId = e.EmployeeMasterId,
                    EmployeeId = e.EmployeeId,
                    EmployeeCompanyId = e.Employee.EmployeeCompanyId,
                    FirstName = e.Employee.Userprofile.FirstName,
                    LastName = e.Employee.Userprofile.LastName,
                    Email = e.Employee.Userauthentication.Email,
                    RoleName = e.Role.RoleName,
                    DepartmentName = e.Department.DepartmentName,
                    IsActive = e.Employee.IsActive
                }).FirstOrDefaultAsync();
        }

        public async Task<List<EmployeeDto>> SearchEmployeesAsync(string query)
        {
            var searchTerm = query.ToLower();
            return await _context.Employeedetailsmasters
                .Include(e => e.Employee).ThenInclude(e => e.Userprofile)
                .Include(e => e.Employee).ThenInclude(e => e.Userauthentication)
                .Include(e => e.Role)
                .Include(e => e.Department)
                .Where(e => e.Employee.IsActive == true &&
                           (e.Employee.Userprofile.FirstName.ToLower().Contains(searchTerm) ||
                            e.Employee.Userprofile.LastName.ToLower().Contains(searchTerm) ||
                            e.Employee.EmployeeCompanyId.ToLower().Contains(searchTerm) ||
                            e.Employee.Userauthentication.Email.ToLower().Contains(searchTerm)))
                .OrderBy(e => e.Employee.Userprofile.FirstName)
                .Take(50)
                .Select(e => new EmployeeDto
                {
                    EmployeeMasterId = e.EmployeeMasterId,
                    EmployeeId = e.EmployeeId,
                    EmployeeCompanyId = e.Employee.EmployeeCompanyId,
                    FirstName = e.Employee.Userprofile.FirstName,
                    LastName = e.Employee.Userprofile.LastName,
                    Email = e.Employee.Userauthentication.Email,
                    RoleName = e.Role.RoleName,
                    DepartmentName = e.Department.DepartmentName
                }).ToListAsync();
        }

        public async Task<List<EmployeeDto>> GetEmployeesByDepartmentAsync(int departmentId)
        {
            return await _context.Employeedetailsmasters
                .Include(e => e.Employee).ThenInclude(e => e.Userprofile)
                .Include(e => e.Employee).ThenInclude(e => e.Userauthentication)
                .Include(e => e.Role)
                .Include(e => e.Department)
                .Where(e => e.Employee.IsActive == true && e.DepartmentId == departmentId)
                .OrderBy(e => e.Employee.Userprofile.FirstName)
                .Select(e => new EmployeeDto
                {
                    EmployeeMasterId = e.EmployeeMasterId,
                    EmployeeId = e.EmployeeId,
                    EmployeeCompanyId = e.Employee.EmployeeCompanyId,
                    FirstName = e.Employee.Userprofile.FirstName,
                    LastName = e.Employee.Userprofile.LastName,
                    Email = e.Employee.Userauthentication.Email,
                    RoleName = e.Role.RoleName,
                    DepartmentName = e.Department.DepartmentName
                }).ToListAsync();
        }

        public async Task<List<EmployeeDto>> GetEmployeesByRoleAsync(int roleId)
        {
            return await _context.Employeedetailsmasters
                .Include(e => e.Employee).ThenInclude(e => e.Userprofile)
                .Include(e => e.Employee).ThenInclude(e => e.Userauthentication)
                .Include(e => e.Role)
                .Include(e => e.Department)
                .Where(e => e.Employee.IsActive == true && e.RoleId == roleId)
                .OrderBy(e => e.Employee.Userprofile.FirstName)
                .Select(e => new EmployeeDto
                {
                    EmployeeMasterId = e.EmployeeMasterId,
                    EmployeeId = e.EmployeeId,
                    EmployeeCompanyId = e.Employee.EmployeeCompanyId,
                    FirstName = e.Employee.Userprofile.FirstName,
                    LastName = e.Employee.Userprofile.LastName,
                    Email = e.Employee.Userauthentication.Email,
                    RoleName = e.Role.RoleName,
                    DepartmentName = e.Department.DepartmentName
                }).ToListAsync();
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
                }).ToListAsync();
        }

        public async Task<List<string>> GetAllBusinessUnitsAsync()
        {
            var businessUnits = await _context.Projects
                .Where(p => !string.IsNullOrEmpty(p.BusinessUnit))
                .Select(p => p.BusinessUnit!)
                .Distinct()
                .OrderBy(bu => bu)
                .ToListAsync();

            if (!businessUnits.Any())
            {
                businessUnits = new List<string>
                {
                    "Information Technology",
                    "Human Resources",
                    "Finance",
                    "Operations",
                    "Sales and Marketing",
                    "Customer Service",
                    "Research and Development"
                };
            }

            return businessUnits;
        }

        public async Task<List<EmployeeDto>> GetInitialStageEmployeesAsync()
        {
            var resourcePoolProject = await _context.Projects
                .FirstOrDefaultAsync(p => p.ProjectName.ToLower() == "org.rz.resourcepool");

            var resourcePoolProjectId = resourcePoolProject?.ProjectId;
            var mappedEmployeeMasterIds = new List<int>();

            if (resourcePoolProjectId.HasValue)
            {
                mappedEmployeeMasterIds = await _context.Projectemployees
                    .Where(pe => pe.ProjectId == resourcePoolProjectId.Value)
                    .Select(pe => pe.EmployeeId)
                    .ToListAsync();
            }

            return await _context.Employeedetailsmasters
                .Include(e => e.Employee).ThenInclude(e => e.Userprofile)
                .Include(e => e.Employee).ThenInclude(e => e.Userauthentication)
                .Include(e => e.Role)
                .Include(e => e.Department)
                .Where(e => e.Employee.IsActive == true &&
                           e.Employee.ReportingManagerEmployeeId == null &&
                           !mappedEmployeeMasterIds.Contains(e.EmployeeMasterId))
                .OrderBy(e => e.Employee.Userprofile.FirstName)
                .Select(e => new EmployeeDto
                {
                    EmployeeMasterId = e.EmployeeMasterId,
                    EmployeeId = e.EmployeeId,
                    EmployeeCompanyId = e.Employee.EmployeeCompanyId,
                    FirstName = e.Employee.Userprofile.FirstName,
                    LastName = e.Employee.Userprofile.LastName,
                    Email = e.Employee.Userauthentication.Email,
                    RoleName = e.Role.RoleName,
                    DepartmentName = e.Department.DepartmentName
                }).ToListAsync();
        }

        public async Task<(int mappedCount, List<string> errors)> MapEmployeesToResourcePoolAsync(List<int> employeeMasterIds)
        {
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
            var errorsList = new List<string>();

            foreach (var empMasterId in employeeMasterIds)
            {
                var employeeDetails = await _context.Employeedetailsmasters
                    .Include(e => e.Employee)
                    .FirstOrDefaultAsync(e => e.EmployeeMasterId == empMasterId);

                if (employeeDetails == null)
                {
                    errorsList.Add($"Employee with ID {empMasterId} not found");
                    continue;
                }

                var existingMapping = await _context.Projectemployees
                    .AnyAsync(pe => pe.ProjectId == resourcePoolProject.ProjectId && 
                                   pe.EmployeeId == empMasterId);

                if (!existingMapping)
                {
                    var projectEmployee = new Projectemployee
                    {
                        ProjectId = resourcePoolProject.ProjectId,
                        EmployeeId = empMasterId,
                        AssignedAt = DateTime.UtcNow,
                        IsPrimary = true
                    };

                    _context.Projectemployees.Add(projectEmployee);

                    var employee = employeeDetails.Employee;
                    if (employee != null)
                    {
                        employee.ReportingManagerEmployeeId = l2ApproverEmployeeId.Value;
                        employee.UpdatedAt = DateTime.UtcNow;
                        _context.Entry(employee).State = EntityState.Modified;
                    }

                    mappedCount++;
                }
            }

            await _context.SaveChangesAsync();
            return (mappedCount, errorsList);
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
                }).FirstOrDefaultAsync();
        }
    }
}
