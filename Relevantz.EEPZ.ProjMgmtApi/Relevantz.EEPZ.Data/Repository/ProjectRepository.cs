using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class ProjectRepository : IProjectRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<ProjectRepository> _logger;

        public ProjectRepository(EEPZDbContext context, ILogger<ProjectRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Project?> GetProjectByIdAsync(int projectId)
        {
            return await _context.Projects
                .AsNoTracking()
                .Include(p => p.Projectemployees)
                    .ThenInclude(pe => pe.Employee)
                        .ThenInclude(e => e!.Employee)
                            .ThenInclude(e => e!.Userprofile)
                .Include(p => p.Projectemployees)
                    .ThenInclude(pe => pe.Employee)
                        .ThenInclude(e => e!.Role)
                .Include(p => p.Projectemployees)
                    .ThenInclude(pe => pe.Employee)
                        .ThenInclude(e => e!.Department)
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
                .AsNoTracking()
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
            await using var transaction = await _context.Database.BeginTransactionAsync();

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Project created with ID: {ProjectId}", project.ProjectId);

            var managerMasterIds = new List<int?>
                {
                    project.ResourceOwnerEmployeeId,
                    project.L1approverEmployeeId,
                    project.L2approverEmployeeId,
                }
                .Where(id => id.HasValue && id.Value > 0)
                .Select(id => id!.Value)
                .Distinct()
                .ToList();

            _logger.LogInformation(
                "Manager master IDs to map: {ManagerMasterIds}",
                string.Join(", ", managerMasterIds));

            if (managerMasterIds.Any())
            {
                var managerDetails = await _context.Employeedetailsmasters
                    .AsNoTracking()
                    .Where(edm => managerMasterIds.Contains(edm.EmployeeMasterId))
                    .Select(edm => new { edm.EmployeeMasterId, edm.EmployeeId })
                    .ToListAsync();

                _logger.LogInformation(
                    "Found {Count} manager records in Employeedetailsmaster",
                    managerDetails.Count);

                var validManagerEmployeeIds = managerDetails
                    .Where(md => md.EmployeeId > 0)
                    .Select(md => md.EmployeeId)
                    .ToList();

                _logger.LogInformation(
                    "Valid manager EmployeeIds to map: {Ids}",
                    string.Join(", ", validManagerEmployeeIds));

                var missingMasterIds = managerMasterIds
                    .Except(managerDetails.Select(md => md.EmployeeMasterId))
                    .ToList();

                if (missingMasterIds.Any())
                {
                    _logger.LogWarning(
                        "These EmployeeMasterIds were not found in Employeedetailsmaster: {Ids}",
                        string.Join(", ", missingMasterIds));
                }

                var invalidMasterIds = managerDetails
                    .Where(md => md.EmployeeId <= 0)
                    .Select(md => md.EmployeeMasterId)
                    .ToList();

                if (invalidMasterIds.Any())
                {
                    _logger.LogWarning(
                        "These EmployeeMasterIds have invalid/null EmployeeId: {Ids}",
                        string.Join(", ", invalidMasterIds));
                }

                if (validManagerEmployeeIds.Any())
                {
                    var existingMappings = await _context.Projectemployees
                        .AsNoTracking()
                        .Where(pe =>
                            pe.ProjectId == project.ProjectId &&
                            validManagerEmployeeIds.Contains(pe.EmployeeId))
                        .Select(pe => pe.EmployeeId)
                        .ToListAsync();

                    var newManagerEmployeeIds = validManagerEmployeeIds
                        .Except(existingMappings)
                        .ToList();

                    _logger.LogInformation(
                        "New managers to add to Projectemployees: {Count}",
                        newManagerEmployeeIds.Count);

                    if (newManagerEmployeeIds.Any())
                    {
                        var projectEmployees = newManagerEmployeeIds
                            .Select(empId => new Projectemployee
                            {
                                ProjectId = project.ProjectId,
                                EmployeeId = empId,
                                IsPrimary = false,
                            })
                            .ToList();

                        await _context.Projectemployees.AddRangeAsync(projectEmployees);
                        var savedCount = await _context.SaveChangesAsync();

                        _logger.LogInformation(
                            "Successfully saved {SavedCount} Projectemployee records",
                            savedCount);
                    }
                }
            }
            else
            {
                _logger.LogInformation("No managers assigned to this project");
            }

            await UpdateManagerHierarchyAsync(
                project.ResourceOwnerEmployeeId,
                project.L1approverEmployeeId,
                project.L2approverEmployeeId);

            await transaction.CommitAsync();
            _logger.LogInformation("CreateProject transaction committed successfully");

            return project;
        }

        public async Task<Project> UpdateProjectAsync(Project project)
        {
            var existingProject = await _context.Projects
                .FirstOrDefaultAsync(p => p.ProjectId == project.ProjectId);

            if (existingProject == null)
                return null;

            existingProject.ProjectName = project.ProjectName;
            existingProject.Description = project.Description;
            existingProject.StartDate = project.StartDate;
            existingProject.EndDate = project.EndDate;
            existingProject.Status = project.Status;
            existingProject.UpdatedAt = DateTime.UtcNow;

            _context.Projects.Update(existingProject);
            await _context.SaveChangesAsync();

            return existingProject;
        }

        public async Task<bool> DeleteProjectAsync(int projectId)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            var project = await _context.Projects.FindAsync(projectId);
            if (project == null)
            {
                _logger.LogWarning("Project {ProjectId} not found for deletion", projectId);
                return false;
            }

            _logger.LogInformation(
                "Deleting project {ProjectId}: {ProjectName}",
                projectId,
                project.ProjectName);

            var allMappings = await _context.Projectemployees
                .Where(pe => pe.ProjectId == projectId)
                .ToListAsync();

            _logger.LogInformation(
                "Found {Count} total mappings for this project",
                allMappings.Count);

            var managerMasterIds = new List<int?>
                {
                    project.ResourceOwnerEmployeeId,
                    project.L1approverEmployeeId,
                    project.L2approverEmployeeId,
                }
                .Where(id => id.HasValue && id.Value > 0)
                .Select(id => id!.Value)
                .Distinct()
                .ToList();

            var managerEmployeeIds = new List<int>();

            if (managerMasterIds.Any())
            {
                managerEmployeeIds = await _context.Employeedetailsmasters
                    .AsNoTracking()
                    .Where(edm => managerMasterIds.Contains(edm.EmployeeMasterId))
                    .Select(edm => edm.EmployeeId)
                    .ToListAsync();

                _logger.LogInformation(
                    "Manager EmployeeIds for project {ProjectId}: {Ids}",
                    projectId,
                    string.Join(", ", managerEmployeeIds));
            }

            var actualEmployeeMappings = allMappings
                .Where(pe => !managerEmployeeIds.Contains(pe.EmployeeId))
                .ToList();

            var managerMappings = allMappings
                .Where(pe => managerEmployeeIds.Contains(pe.EmployeeId))
                .ToList();

            _logger.LogInformation(
                "Actual employee mappings: {ActualCount}, Manager-only mappings: {ManagerCount}",
                actualEmployeeMappings.Count,
                managerMappings.Count);

            if (actualEmployeeMappings.Any())
            {
                _logger.LogWarning(
                    "Cannot delete project {ProjectId}: {Count} employees still mapped",
                    projectId,
                    actualEmployeeMappings.Count);

                return false;
            }

            if (managerMappings.Any())
            {
                _context.Projectemployees.RemoveRange(managerMappings);
                _logger.LogInformation(
                    "Removing {Count} manager mappings for project {ProjectId}",
                    managerMappings.Count,
                    projectId);
            }

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
            _logger.LogInformation("Project {ProjectId} deleted successfully", projectId);

            return true;
        }

        public async Task<bool> ProjectExistsAsync(int projectId)
        {
            return await _context.Projects
                .AsNoTracking()
                .AnyAsync(p => p.ProjectId == projectId);
        }

        public async Task<bool> ProjectNameExistsAsync(string projectName, int? excludeProjectId = null)
        {
            var query = _context.Projects
                .AsNoTracking()
                .Where(p => p.ProjectName.ToLower() == projectName.ToLower());

            if (excludeProjectId.HasValue)
            {
                query = query.Where(p => p.ProjectId != excludeProjectId.Value);
            }

            return await query.AnyAsync();
        }

        public async Task<bool> UpdateReportingManagersAsync(
     int projectId,
     int? resourceOwnerId,
     int? l1ApproverId,
     int? l2ApproverId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var project = await _context.Projects.FindAsync(projectId);
                if (project == null)
                {
                    _logger.LogWarning("Project {ProjectId} not found for manager update", projectId);
                    return false;
                }

                _logger.LogInformation(
                    "Updating managers for Project {ProjectId}. ResourceOwner: {ResourceOwner}, L1: {L1}, L2: {L2}",
                    projectId, resourceOwnerId, l1ApproverId, l2ApproverId);

                project.ResourceOwnerEmployeeId = resourceOwnerId;
                project.L1approverEmployeeId = l1ApproverId;
                project.L2approverEmployeeId = l2ApproverId;
                project.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var managerMasterIds = new List<int?> { resourceOwnerId, l1ApproverId, l2ApproverId }
                    .Where(id => id.HasValue && id.Value > 0)
                    .Select(id => id!.Value)
                    .Distinct()
                    .ToList();

                List<int> validManagerEmployeeIds = new List<int>();
                if (managerMasterIds.Any())
                {
                    validManagerEmployeeIds = await _context.Employeedetailsmasters
                        .Where(edm => managerMasterIds.Contains(edm.EmployeeMasterId))
                        .Select(edm => edm.EmployeeId)
                        .Where(eid => eid > 0)
                        .ToListAsync();

                    _logger.LogInformation(
                        "Found {FoundCount}/{TotalCount} managers for project {ProjectId}",
                        validManagerEmployeeIds.Count, managerMasterIds.Count, projectId);
                }

                if (validManagerEmployeeIds.Any())
                {
                    var existingMappings = await _context.Projectemployees
                        .Where(pe => pe.ProjectId == projectId && validManagerEmployeeIds.Contains(pe.EmployeeId))
                        .Select(pe => pe.EmployeeId)
                        .ToListAsync();

                    var newManagerEmployeeIds = validManagerEmployeeIds.Except(existingMappings).ToList();

                    _logger.LogInformation(
                        "Managers to add: {NewCount}, already mapped: {ExistingCount}",
                        newManagerEmployeeIds.Count, existingMappings.Count);

                    if (newManagerEmployeeIds.Any())
                    {
                        var newProjectEmployees = newManagerEmployeeIds.Select(empId => new Projectemployee
                        {
                            ProjectId = projectId,
                            EmployeeId = empId,
                            IsPrimary = false,
                        }).ToList();

                        await _context.Projectemployees.AddRangeAsync(newProjectEmployees);
                        await _context.SaveChangesAsync();
                    }
                }

                await transaction.CommitAsync();
                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                return false;
            }
        }

        public async Task<List<Projectemployee>> GetProjectEmployeesAsync(int projectId)
        {
            return await _context.Projectemployees
                .AsNoTracking()
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
            var employeeIds = employees.Select(e => e.EmployeeId).Distinct().ToList();

            var existingMappings = await _context.Projectemployees
                .Where(pe => pe.ProjectId == projectId && employeeIds.Contains(pe.EmployeeId))
                .ToListAsync();

            var existingByEmpId = existingMappings.ToDictionary(pe => pe.EmployeeId, pe => pe);
            var inserts = new List<Projectemployee>();
            var anyChange = false;

            foreach (var incoming in employees)
            {
                if (existingByEmpId.TryGetValue(incoming.EmployeeId, out var existing))
                {
                    if (incoming.IsPrimary && !existing.IsPrimary)
                    {
                        var otherPrimaries = await _context.Projectemployees
                            .Where(pe => pe.EmployeeId == incoming.EmployeeId && pe.IsPrimary && pe.ProjectId != projectId)
                            .ToListAsync();

                        foreach (var p in otherPrimaries)
                            p.IsPrimary = false;

                        existing.IsPrimary = true;
                        anyChange = true;
                    }
                    else if (!incoming.IsPrimary && existing.IsPrimary)
                    {
                        existing.IsPrimary = false;
                        anyChange = true;
                    }
                }
                else
                {
                    inserts.Add(new Projectemployee
                    {
                        ProjectId = projectId,
                        EmployeeId = incoming.EmployeeId,
                        AssignedAt = DateTime.UtcNow,
                        IsPrimary = incoming.IsPrimary
                    });

                    if (incoming.IsPrimary)
                    {
                        var otherPrimaries = await _context.Projectemployees
                            .Where(pe => pe.EmployeeId == incoming.EmployeeId && pe.IsPrimary)
                            .ToListAsync();

                        foreach (var p in otherPrimaries)
                            p.IsPrimary = false;
                    }
                    anyChange = true;
                }
            }

            if (inserts.Any())
                await _context.Projectemployees.AddRangeAsync(inserts);

            if (anyChange || inserts.Any())
            {
                await _context.SaveChangesAsync();
                return true;
            }

            return true;
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

        public async Task<bool> IsEmployeeMappedToProjectAsync(int projectId, int employeeId)
        {
            return await _context.Projectemployees
                .AsNoTracking()
                .AnyAsync(pe => pe.ProjectId == projectId && pe.EmployeeId == employeeId);
        }

        public async Task<Employeedetailsmaster?> GetEmployeeDetailsByIdAsync(int employeeMasterId)
        {
            return await _context.Employeedetailsmasters
                .AsNoTracking()
                .Include(e => e.Employee)
                    .ThenInclude(e => e!.Userprofile)
                .Include(e => e.Employee)
                    .ThenInclude(e => e!.Userauthentication)
                .Include(e => e.Role)
                .Include(e => e.Department)
                .FirstOrDefaultAsync(e => e.EmployeeMasterId == employeeMasterId);
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
                .AsNoTracking()
                .AnyAsync(e => e.EmployeeMasterId == employeeMasterId);
        }

        public async Task<Employee?> GetEmployeeByIdAsync(int employeeId)
        {
            return await _context.Employees
                .FirstOrDefaultAsync(e => e.EmployeeId == employeeId);
        }

        public async Task<List<Projectemployee>> GetProjectEmployeesByEmployeeIdAsync(int employeeId)
        {
            return await _context.Projectemployees
                .AsNoTracking()
                .Where(pe => pe.EmployeeId == employeeId)
                .ToListAsync();
        }

        public async Task<int?> GetEmployeeIdByMasterIdAsync(int employeeMasterId)
        {
            var employeeId = await _context.Employeedetailsmasters
                .AsNoTracking()
                .Where(edm => edm.EmployeeMasterId == employeeMasterId)
                .Select(edm => edm.EmployeeId)
                .FirstOrDefaultAsync();

            return employeeId > 0 ? employeeId : null;
        }

        public async Task<bool> UpdateEmployeeAsync(Employee employee)
        {
            employee.UpdatedAt = DateTime.UtcNow;
            _context.Entry(employee).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateProjectEmployeePrimaryFlagsAsync(List<Projectemployee> projectEmployees)
        {
            foreach (var pe in projectEmployees)
            {
                _context.Entry(pe).State = EntityState.Modified;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<Dictionary<int, (int ProjectId, string ProjectName)?>> GetAllEmployeesWithPrimaryProjectAsync()
        {
            _logger.LogInformation("Fetching all employees with primary project information");

            var employeesWithPrimaryProjects = await _context.Employeedetailsmasters
                .AsNoTracking()
                .Where(edm => edm.Employee != null && edm.Employee.IsActive == true)
                .Select(edm => new
                {
                    edm.EmployeeMasterId,
                    PrimaryProject = _context.Projectemployees
                        .Where(pe => pe.EmployeeId == edm.EmployeeId && pe.IsPrimary)
                        .Select(pe => new
                        {
                            ProjectId = pe.Project!.ProjectId,
                            ProjectName = pe.Project.ProjectName,
                        })
                        .FirstOrDefault(),
                })
                .ToListAsync();

            _logger.LogInformation(
                "Found {Count} active employees for primary project lookup",
                employeesWithPrimaryProjects.Count);

            var result = employeesWithPrimaryProjects.ToDictionary(
                emp => emp.EmployeeMasterId,
                emp => emp.PrimaryProject != null
                    ? ((int ProjectId, string ProjectName)?)(emp.PrimaryProject.ProjectId, emp.PrimaryProject.ProjectName)
                    : null);

            var withPrimaryCount = result.Count(kvp => kvp.Value.HasValue);
            var withoutPrimaryCount = result.Count(kvp => !kvp.Value.HasValue);

            _logger.LogInformation(
                "Employees with primary project: {WithPrimary}, without primary: {WithoutPrimary}",
                withPrimaryCount,
                withoutPrimaryCount);

            return result;
        }

        public async Task<int> MoveUnmappedEmployeesToResourcePoolAsync(List<int> employeeIds)
        {
            _logger.LogInformation(
                "Checking {Count} employees for resource pool auto-assignment",
                employeeIds.Count);

            var resourcePoolProject = await _context.Projects
                .FirstOrDefaultAsync(p => p.ProjectName.ToLower() == "org.rz.resourcepool");

            if (resourcePoolProject == null)
            {
                _logger.LogWarning("Resource pool project 'org.rz.resourcepool' not found");
                return 0;
            }

            int? l2ApproverEmployeeId = null;
            if (resourcePoolProject.L2approverEmployeeId.HasValue)
            {
                l2ApproverEmployeeId = await GetEmployeeIdByMasterIdAsync(resourcePoolProject.L2approverEmployeeId.Value);
            }

            var movedCount = 0;

            foreach (var empMasterId in employeeIds)
            {
                var otherProjectMappings = await _context.Projectemployees
                    .Where(pe => pe.EmployeeId == empMasterId)
                    .ToListAsync();

                if (otherProjectMappings.Any())
                {
                    _logger.LogInformation(
                        "Employee {EmployeeMasterId} still has {Count} project mapping(s). Not moving to resource pool",
                        empMasterId,
                        otherProjectMappings.Count);

                    continue;
                }

                _logger.LogInformation(
                    "Employee {EmployeeMasterId} has no project mappings. Moving to resource pool",
                    empMasterId);

                var existingResourcePoolMapping = await _context.Projectemployees
                    .FirstOrDefaultAsync(pe =>
                        pe.ProjectId == resourcePoolProject.ProjectId &&
                        pe.EmployeeId == empMasterId);

                if (existingResourcePoolMapping != null)
                {
                    _logger.LogInformation(
                        "Employee {EmployeeMasterId} is already in resource pool",
                        empMasterId);

                    continue;
                }

                var resourcePoolMapping = new Projectemployee
                {
                    ProjectId = resourcePoolProject.ProjectId,
                    EmployeeId = empMasterId,
                    AssignedAt = DateTime.UtcNow,
                    IsPrimary = true,
                };

                await _context.Projectemployees.AddAsync(resourcePoolMapping);

                if (l2ApproverEmployeeId.HasValue)
                {
                    var actualEmployeeId = await GetEmployeeIdByMasterIdAsync(empMasterId);
                    if (actualEmployeeId.HasValue)
                    {
                        var employee = await _context.Employees
                            .FirstOrDefaultAsync(e => e.EmployeeId == actualEmployeeId.Value);

                        if (employee != null)
                        {
                            employee.ReportingManagerEmployeeId = l2ApproverEmployeeId.Value;
                            employee.UpdatedAt = DateTime.UtcNow;
                            _context.Entry(employee).State = EntityState.Modified;

                            _logger.LogInformation(
                                "Updated reporting manager for employee {EmployeeId} to {ManagerId}",
                                employee.EmployeeId,
                                l2ApproverEmployeeId.Value);
                        }
                    }
                }

                movedCount++;
            }

            if (movedCount > 0)
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation(
                    "Successfully moved {Count} employee(s) to resource pool",
                    movedCount);
            }

            return movedCount;
        }

        public async Task<Project?> GetResourcePoolProjectAsync()
        {
            return await _context.Projects
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.ProjectName.ToLower() == "org.rz.resourcepool");
        }

        public async Task<List<Projectemployee>> GetResourcePoolMappingsAsync(
            int resourcePoolProjectId,
            List<int> employeeIds)
        {
            return await _context.Projectemployees
                .Where(pe => pe.ProjectId == resourcePoolProjectId && employeeIds.Contains(pe.EmployeeId))
                .ToListAsync();
        }

        public async Task<List<Projectemployee>> GetOtherProjectMappingsAsync(
            int resourcePoolProjectId,
            List<int> employeeIds)
        {
            return await _context.Projectemployees
                .Where(pe => pe.ProjectId != resourcePoolProjectId && employeeIds.Contains(pe.EmployeeId))
                .ToListAsync();
        }

        public async Task<bool> RemoveProjectEmployeeMappingsAsync(List<Projectemployee> mappings)
        {
            if (!mappings.Any())
            {
                return false;
            }

            _context.Projectemployees.RemoveRange(mappings);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Removed {Count} project-employee mappings", mappings.Count);
            return true;
        }

        private async Task UpdateManagerHierarchyAsync(
            int? resourceOwnerId,
            int? l1ApproverId,
            int? l2ApproverId)
        {
            _logger.LogInformation(
                "Updating manager reporting hierarchy. ResourceOwnerId: {ResourceOwnerId}, L1: {L1}, L2: {L2}",
                resourceOwnerId,
                l1ApproverId,
                l2ApproverId);

            var resourceOwnerEmployeeId = resourceOwnerId.HasValue
                ? await GetEmployeeIdByMasterIdAsync(resourceOwnerId.Value)
                : null;

            var l1ApproverEmployeeId = l1ApproverId.HasValue
                ? await GetEmployeeIdByMasterIdAsync(l1ApproverId.Value)
                : null;

            var l2ApproverEmployeeId = l2ApproverId.HasValue
                ? await GetEmployeeIdByMasterIdAsync(l2ApproverId.Value)
                : null;

            _logger.LogInformation(
                "Resolved EmployeeIds - ResourceOwner: {ResourceOwnerEmployeeId}, L1: {L1EmployeeId}, L2: {L2EmployeeId}",
                resourceOwnerEmployeeId,
                l1ApproverEmployeeId,
                l2ApproverEmployeeId);

            if (l1ApproverEmployeeId.HasValue && l1ApproverEmployeeId.Value > 0)
            {
                var l1Employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.EmployeeId == l1ApproverEmployeeId.Value);

                if (l1Employee == null)
                {
                    _logger.LogWarning(
                        "L1 approver employee not found (EmployeeId {EmployeeId})",
                        l1ApproverEmployeeId);

                    return;
                }

                var newReportingManagerId = l2ApproverEmployeeId ?? resourceOwnerEmployeeId;

                if (l1Employee.ReportingManagerEmployeeId != newReportingManagerId)
                {
                    l1Employee.ReportingManagerEmployeeId = newReportingManagerId;
                    l1Employee.UpdatedAt = DateTime.UtcNow;

                    _logger.LogInformation(
                        "Updated L1 approver {EmployeeId} reporting manager to {ManagerId}",
                        l1Employee.EmployeeId,
                        newReportingManagerId);
                }
            }

            if (l2ApproverEmployeeId.HasValue && l2ApproverEmployeeId.Value > 0)
            {
                var l2Employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.EmployeeId == l2ApproverEmployeeId.Value);

                if (l2Employee == null)
                {
                    _logger.LogWarning(
                        "L2 approver employee not found (EmployeeId {EmployeeId})",
                        l2ApproverEmployeeId);

                    return;
                }

                if (l2Employee.ReportingManagerEmployeeId != resourceOwnerEmployeeId)
                {
                    l2Employee.ReportingManagerEmployeeId = resourceOwnerEmployeeId;
                    l2Employee.UpdatedAt = DateTime.UtcNow;

                    _logger.LogInformation(
                        "Updated L2 approver {EmployeeId} reporting manager to {ManagerId}",
                        l2Employee.EmployeeId,
                        resourceOwnerEmployeeId);
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Manager hierarchy updated successfully");
        }
    }
}
