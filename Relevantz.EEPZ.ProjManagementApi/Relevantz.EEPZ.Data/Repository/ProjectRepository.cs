using Relevantz.EEPZ.Data;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class ProjectRepository : IProjectRepository
    {
        private readonly EEPZDbContext _context;

        public ProjectRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Project?> GetProjectByIdAsync(int projectId)
        {
            return await _context.Projects
                .Include(p => p.ResourceOwnerEmployee)
                    .ThenInclude(e => e!.Employee)
                        .ThenInclude(e => e!.Userprofile)
                .Include(p => p.ResourceOwnerEmployee)
                    .ThenInclude(e => e!.Role)
                .Include(p => p.ResourceOwnerEmployee)
                    .ThenInclude(e => e!.Department)
                .Include(p => p.L1approverEmployee)
                    .ThenInclude(e => e!.Employee)
                        .ThenInclude(e => e!.Userprofile)
                .Include(p => p.L1approverEmployee)
                    .ThenInclude(e => e!.Role)
                .Include(p => p.L1approverEmployee)
                    .ThenInclude(e => e!.Department)
                .Include(p => p.L2approverEmployee)
                    .ThenInclude(e => e!.Employee)
                        .ThenInclude(e => e!.Userprofile)
                .Include(p => p.L2approverEmployee)
                    .ThenInclude(e => e!.Role)
                .Include(p => p.L2approverEmployee)
                    .ThenInclude(e => e!.Department)
                .FirstOrDefaultAsync(p => p.ProjectId == projectId);
        }

        public async Task<List<Project>> GetAllProjectsAsync()
        {
            return await _context.Projects
                .Include(p => p.ResourceOwnerEmployee)
                    .ThenInclude(e => e!.Employee)
                        .ThenInclude(e => e!.Userprofile)
                .Include(p => p.ResourceOwnerEmployee)
                    .ThenInclude(e => e!.Role)
                .Include(p => p.L1approverEmployee)
                    .ThenInclude(e => e!.Employee)
                        .ThenInclude(e => e!.Userprofile)
                .Include(p => p.L1approverEmployee)
                    .ThenInclude(e => e!.Role)
                .Include(p => p.L2approverEmployee)
                    .ThenInclude(e => e!.Employee)
                        .ThenInclude(e => e!.Userprofile)
                .Include(p => p.L2approverEmployee)
                    .ThenInclude(e => e!.Role)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<Project> CreateProjectAsync(Project project)
        {
            _context.Projects.Add(project);
            await _context.SaveChangesAsync();
            return project;
        }

        public async Task<Project> UpdateProjectAsync(Project project)
        {
            _context.Projects.Update(project);
            await _context.SaveChangesAsync();
            return project;
        }

        public async Task<bool> DeleteProjectAsync(int projectId)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null)
                return false;

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ProjectExistsAsync(int projectId)
        {
            return await _context.Projects.AnyAsync(p => p.ProjectId == projectId);
        }

        public async Task<bool> ProjectNameExistsAsync(string projectName, int? excludeProjectId = null)
        {
            var query = _context.Projects.Where(p => p.ProjectName.ToLower() == projectName.ToLower());

            if (excludeProjectId.HasValue)
            {
                query = query.Where(p => p.ProjectId != excludeProjectId.Value);
            }

            return await query.AnyAsync();
        }

        public async Task<bool> UpdateReportingManagersAsync(int projectId, int? resourceOwnerId, int? l1ApproverId, int? l2ApproverId)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null)
                return false;

            project.ResourceOwnerEmployeeId = resourceOwnerId;
            project.L1approverEmployeeId = l1ApproverId;
            project.L2approverEmployeeId = l2ApproverId;
            project.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<Projectemployee>> GetProjectEmployeesAsync(int projectId)
        {
            return await _context.Projectemployees
                .Where(pe => pe.ProjectId == projectId)
                .Include(pe => pe.Employee)
                    .ThenInclude(e => e.Employee)
                        .ThenInclude(e => e!.Userprofile)
                .Include(pe => pe.Employee)
                    .ThenInclude(e => e.Role)
                .Include(pe => pe.Employee)
                    .ThenInclude(e => e.Department)
                .ToListAsync();
        }

        public async Task<bool> MapEmployeesToProjectAsync(int projectId, List<Projectemployee> employees)
        {
            var employeeIds = employees.Select(e => e.EmployeeId).ToList();

            var existingMappings = await _context.Projectemployees
                .Where(pe => pe.ProjectId == projectId && employeeIds.Contains(pe.EmployeeId))
                .Select(pe => pe.EmployeeId)
                .ToListAsync();

            var newEmployees = employees
                .Where(e => !existingMappings.Contains(e.EmployeeId))
                .ToList();

            if (!newEmployees.Any())
                return false;

            foreach (var emp in newEmployees.Where(e => e.IsPrimary))
            {
                var existingPrimaries = await _context.Projectemployees
                    .Where(pe => pe.EmployeeId == emp.EmployeeId && pe.IsPrimary)
                    .ToListAsync();

                foreach (var primary in existingPrimaries)
                {
                    primary.IsPrimary = false;
                }
            }

            await _context.Projectemployees.AddRangeAsync(newEmployees);

            var changes = await _context.SaveChangesAsync();

            return changes > 0;
        }

        public async Task<bool> UnmapEmployeesFromProjectAsync(int projectId, List<int> employeeIds)
        {
            var mappingsToRemove = await _context.Projectemployees
                .Where(pe => pe.ProjectId == projectId && employeeIds.Contains(pe.EmployeeId))
                .ToListAsync();

            if (mappingsToRemove.Any())
            {
                _context.Projectemployees.RemoveRange(mappingsToRemove);
                await _context.SaveChangesAsync();
            }

            return true;
        }

        public async Task<Employee?> GetEmployeeByIdAsync(int employeeId)
        {
            return await _context.Employees
                .FirstOrDefaultAsync(e => e.EmployeeId == employeeId);
        }

        public async Task<bool> IsEmployeeMappedToProjectAsync(int projectId, int employeeId)
        {
            return await _context.Projectemployees
                .AnyAsync(pe => pe.ProjectId == projectId && pe.EmployeeId == employeeId);
        }

        public async Task<Employeedetailsmaster?> GetEmployeeDetailsByIdAsync(int employeeMasterId)
        {
            return await _context.Employeedetailsmasters
                .Include(e => e.Employee)
                    .ThenInclude(e => e!.Userprofile)
                .Include(e => e.Employee)
                    .ThenInclude(e => e!.Userauthentication)
                .Include(e => e.Role)
                .Include(e => e.Department)
                .FirstOrDefaultAsync(e => e.EmployeeMasterId == employeeMasterId);
        }

        public async Task<List<Projectemployee>> GetProjectEmployeesByEmployeeIdAsync(int employeeId)
        {
            return await _context.Projectemployees
                .Where(pe => pe.EmployeeId == employeeId)
                .ToListAsync();
        }

        public async Task<List<Employeedetailsmaster>> GetEmployeeDetailsByIdsAsync(List<int> employeeMasterIds)
        {
            return await _context.Employeedetailsmasters
                .Where(e => employeeMasterIds.Contains(e.EmployeeMasterId))
                .Include(e => e.Employee)
                    .ThenInclude(e => e!.Userprofile)
                .Include(e => e.Employee)
                    .ThenInclude(e => e!.Userauthentication)
                .Include(e => e.Role)
                .Include(e => e.Department)
                .ToListAsync();
        }

        public async Task<bool> EmployeeMasterExistsAsync(int employeeMasterId)
        {
            return await _context.Employeedetailsmasters
                .AnyAsync(e => e.EmployeeMasterId == employeeMasterId);
        }

        // ✅ NEW: Get EmployeeId from EmployeeMasterId
        public async Task<int?> GetEmployeeIdByMasterIdAsync(int employeeMasterId)
        {
            var employeeDetails = await _context.Employeedetailsmasters
                .Where(edm => edm.EmployeeMasterId == employeeMasterId)
                .Select(edm => edm.EmployeeId)
                .FirstOrDefaultAsync();

            return employeeDetails > 0 ? employeeDetails : null;
        }

        // ✅ NEW: Update Employee entity
        public async Task<bool> UpdateEmployeeAsync(Employee employee)
        {
            try
            {
                _context.Entry(employee).State = EntityState.Modified;
                employee.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        // ✅ NEW: Batch update primary flags for project employees
        public async Task<bool> UpdateProjectEmployeePrimaryFlagsAsync(List<Projectemployee> projectEmployees)
        {
            try
            {
                foreach (var pe in projectEmployees)
                {
                    _context.Entry(pe).State = EntityState.Modified;
                }
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
