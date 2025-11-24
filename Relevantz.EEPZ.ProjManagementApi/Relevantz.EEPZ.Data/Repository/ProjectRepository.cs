using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;

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
            return await _context
                .Projects
                // ✅ Load Projectemployees junction table (contains IsPrimary)
                .Include(p => p.Projectemployees)
                .ThenInclude(pe => pe.Employee) // Employeedetailsmaster
                .ThenInclude(e => e!.Employee) // Employee entity
                .ThenInclude(e => e!.Userprofile)
                .Include(p => p.Projectemployees)
                .ThenInclude(pe => pe.Employee)
                .ThenInclude(e => e!.Role)
                .Include(p => p.Projectemployees)
                .ThenInclude(pe => pe.Employee)
                .ThenInclude(e => e!.Department)
                // ... (manager includes remain the same)
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
            return await _context
                .Projects.Include(p => p.ResourceOwnerEmployee)
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
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // ✅ Step 1: Add the project
                _context.Projects.Add(project);
                await _context.SaveChangesAsync();

                Console.WriteLine($"✅ Project created with ID: {project.ProjectId}");

                // ✅ Step 2: Collect manager EmployeeMasterIds
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

                Console.WriteLine(
                    $"📋 Manager Master IDs to map: {string.Join(", ", managerMasterIds)}"
                );

                if (managerMasterIds.Any())
                {
                    // ✅ Step 3: Get FULL employee details (not just EmployeeId)
                    var managerDetails = await _context
                        .Employeedetailsmasters.Where(edm =>
                            managerMasterIds.Contains(edm.EmployeeMasterId)
                        )
                        .Select(edm => new { edm.EmployeeMasterId, edm.EmployeeId })
                        .ToListAsync();

                    Console.WriteLine(
                        $"👥 Found {managerDetails.Count} manager records in Employeedetailsmaster:"
                    );
                    foreach (var detail in managerDetails)
                    {
                        Console.WriteLine(
                            $"   - MasterId: {detail.EmployeeMasterId} → EmployeeId: {detail.EmployeeId})"
                        );
                    }

                    // ✅ Step 4: Filter out invalid EmployeeIds (null or 0)
                    var validManagerEmployeeIds = managerDetails
                        .Where(md => md.EmployeeId > 0) // ⚠️ CRITICAL: Filter null/0 values
                        .Select(md => md.EmployeeId)
                        .ToList();

                    Console.WriteLine(
                        $"✅ Valid EmployeeIds to map: {string.Join(", ", validManagerEmployeeIds)}"
                    );

                    // ✅ Step 5: Warn about missing mappings
                    var missingMasterIds = managerMasterIds
                        .Except(managerDetails.Select(md => md.EmployeeMasterId))
                        .ToList();
                    if (missingMasterIds.Any())
                    {
                        Console.WriteLine(
                            $"⚠️ WARNING: These EmployeeMasterIds were NOT found in Employeedetailsmaster: {string.Join(", ", missingMasterIds)}"
                        );
                    }

                    var invalidMasterIds = managerDetails
                        .Where(md => md.EmployeeId <= 0)
                        .Select(md => md.EmployeeMasterId)
                        .ToList();
                    if (invalidMasterIds.Any())
                    {
                        Console.WriteLine(
                            $"⚠️ WARNING: These EmployeeMasterIds have invalid/null EmployeeId: {string.Join(", ", invalidMasterIds)}"
                        );
                    }

                    // ✅ Step 6: Check existing mappings
                    var existingMappings = await _context
                        .Projectemployees.Where(pe =>
                            pe.ProjectId == project.ProjectId
                            && validManagerEmployeeIds.Contains(pe.EmployeeId)
                        )
                        .Select(pe => pe.EmployeeId)
                        .ToListAsync();

                    var newManagerEmployeeIds = validManagerEmployeeIds
                        .Except(existingMappings)
                        .ToList();

                    Console.WriteLine(
                        $"➕ New managers to add to Projectemployees: {newManagerEmployeeIds.Count}"
                    );

                    // ✅ Step 7: Create Projectemployee records
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

                        Console.WriteLine(
                            $"✅ Successfully saved {savedCount} Projectemployee records"
                        );
                    }
                }
                else
                {
                    Console.WriteLine("ℹ️ No managers assigned to this project");
                }

                // ✅ NEW: Update manager reporting hierarchy
                await UpdateManagerHierarchyAsync(
                    project.ResourceOwnerEmployeeId,
                    project.L1approverEmployeeId,
                    project.L2approverEmployeeId
                );

                await transaction.CommitAsync();
                Console.WriteLine("✅ Transaction committed successfully");

                return project;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"❌ Error in CreateProjectAsync: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        public async Task<Project> UpdateProjectAsync(Project project)
        {
            _context.Projects.Update(project);
            await _context.SaveChangesAsync();
            return project;
        }

        public async Task<bool> DeleteProjectAsync(int projectId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var project = await _context.Projects.FindAsync(projectId);
                if (project == null)
                {
                    Console.WriteLine($"❌ Project {projectId} not found");
                    return false;
                }

                Console.WriteLine($"🗑️ Deleting Project {projectId}: {project.ProjectName}");

                // ✅ Step 1: Check for actual employee mappings (non-managers)
                var allMappings = await _context
                    .Projectemployees.Where(pe => pe.ProjectId == projectId)
                    .ToListAsync();

                Console.WriteLine($"📋 Found {allMappings.Count} total mappings for this project");

                // ✅ Step 2: Identify manager EmployeeIds
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
                    managerEmployeeIds = await _context
                        .Employeedetailsmasters.Where(edm =>
                            managerMasterIds.Contains(edm.EmployeeMasterId)
                        )
                        .Select(edm => edm.EmployeeId)
                        .ToListAsync();

                    Console.WriteLine(
                        $"👔 Manager EmployeeIds: {string.Join(", ", managerEmployeeIds)}"
                    );
                }

                // ✅ Step 3: Separate actual employees from managers
                var actualEmployeeMappings = allMappings
                    .Where(pe => !managerEmployeeIds.Contains(pe.EmployeeId))
                    .ToList();

                var managerMappings = allMappings
                    .Where(pe => managerEmployeeIds.Contains(pe.EmployeeId))
                    .ToList();

                Console.WriteLine($"👥 Actual employee mappings: {actualEmployeeMappings.Count}");
                Console.WriteLine($"👔 Manager-only mappings: {managerMappings.Count}");

                // ✅ Step 4: Block deletion if actual employees are mapped
                if (actualEmployeeMappings.Any())
                {
                    await transaction.RollbackAsync();
                    Console.WriteLine(
                        $"❌ Cannot delete: {actualEmployeeMappings.Count} employees still mapped"
                    );
                    return false;
                }

                // ✅ Step 5: Remove manager mappings automatically
                if (managerMappings.Any())
                {
                    _context.Projectemployees.RemoveRange(managerMappings);
                    Console.WriteLine($"🧹 Removing {managerMappings.Count} manager mappings");
                }

                // ✅ Step 6: Delete the project
                _context.Projects.Remove(project);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
                Console.WriteLine($"✅ Project {projectId} deleted successfully");

                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"❌ Error in DeleteProjectAsync: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        public async Task<bool> ProjectExistsAsync(int projectId)
        {
            return await _context.Projects.AnyAsync(p => p.ProjectId == projectId);
        }

        public async Task<bool> ProjectNameExistsAsync(
            string projectName,
            int? excludeProjectId = null
        )
        {
            var query = _context.Projects.Where(p =>
                p.ProjectName.ToLower() == projectName.ToLower()
            );

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
            int? l2ApproverId
        )
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null)
            {
                Console.WriteLine($"❌ Project {projectId} not found");
                return false;
            }

            Console.WriteLine($"📝 Updating managers for Project {projectId}:");
            Console.WriteLine($"   - Resource Owner: {resourceOwnerId}");
            Console.WriteLine($"   - L1 Approver: {l1ApproverId}");
            Console.WriteLine($"   - L2 Approver: {l2ApproverId}");

            // ✅ Update project's reporting manager fields
            project.ResourceOwnerEmployeeId = resourceOwnerId;
            project.L1approverEmployeeId = l1ApproverId;
            project.L2approverEmployeeId = l2ApproverId;
            project.UpdatedAt = DateTime.Now;

            // ✅ Collect all manager EmployeeMasterIds
            var managerMasterIds = new List<int?> { resourceOwnerId, l1ApproverId, l2ApproverId }
                .Where(id => id.HasValue && id.Value > 0)
                .Select(id => id!.Value)
                .Distinct()
                .ToList();

            if (managerMasterIds.Any())
            {
                // ✅ Get manager details with validation
                var managerDetails = await _context
                    .Employeedetailsmasters.Where(edm =>
                        managerMasterIds.Contains(edm.EmployeeMasterId)
                    )
                    .Include(edm => edm.Employee)
                    .ThenInclude(e => e!.Userprofile)
                    .ToListAsync();

                Console.WriteLine(
                    $"👥 Found {managerDetails.Count}/{managerMasterIds.Count} managers:"
                );
                foreach (var detail in managerDetails)
                {
                    var name =
                        $"{detail.Employee?.Userprofile?.FirstName} {detail.Employee?.Userprofile?.LastName}";
                    Console.WriteLine(
                        $"   - {name} (MasterId: {detail.EmployeeMasterId}, EmployeeId: {detail.EmployeeId})"
                    );
                }

                // ✅ Filter valid EmployeeIds
                var validManagerEmployeeIds = managerDetails
                    .Where(md => md.EmployeeId > 0)
                    .Select(md => md.EmployeeId)
                    .ToList();

                // ✅ Warn about problems
                var invalidManagers = managerDetails.Where(md => md.EmployeeId <= 0).ToList();
                if (invalidManagers.Any())
                {
                    Console.WriteLine(
                        $"⚠️ WARNING: {invalidManagers.Count} managers have invalid EmployeeId:"
                    );
                    foreach (var invalid in invalidManagers)
                    {
                        var name =
                            $"{invalid.Employee?.Userprofile?.FirstName} {invalid.Employee?.Userprofile?.LastName}";
                        Console.WriteLine(
                            $"   - {name} (MasterId: {invalid.EmployeeMasterId}, EmployeeId: {invalid.EmployeeId})"
                        );
                    }
                }

                // ✅ Check existing mappings
                var existingMappings = await _context
                    .Projectemployees.Where(pe =>
                        pe.ProjectId == projectId && validManagerEmployeeIds.Contains(pe.EmployeeId)
                    )
                    .Select(pe => pe.EmployeeId)
                    .ToListAsync();

                var newManagerEmployeeIds = validManagerEmployeeIds
                    .Except(existingMappings)
                    .ToList();

                Console.WriteLine(
                    $"➕ Managers to add: {newManagerEmployeeIds.Count}, Already mapped: {existingMappings.Count}"
                );

                // ✅ Add new manager mappings
                if (newManagerEmployeeIds.Any())
                {
                    var newProjectEmployees = newManagerEmployeeIds
                        .Select(empId => new Projectemployee
                        {
                            ProjectId = projectId,
                            EmployeeId = empId,
                            IsPrimary = false,
                        })
                        .ToList();

                    await _context.Projectemployees.AddRangeAsync(newProjectEmployees);
                    Console.WriteLine(
                        $"✅ Adding {newProjectEmployees.Count} new Projectemployee records"
                    );
                }
            }

            // ✅ NEW: Update manager reporting hierarchy
            await UpdateManagerHierarchyAsync(resourceOwnerId, l1ApproverId, l2ApproverId);

            await _context.SaveChangesAsync();
            Console.WriteLine("✅ UpdateReportingManagersAsync completed successfully");

            return true;
        }

        public async Task<List<Projectemployee>> GetProjectEmployeesAsync(int projectId)
        {
            return await _context
                .Projectemployees.Where(pe => pe.ProjectId == projectId)
                .Include(pe => pe.Employee)
                .ThenInclude(e => e.Employee)
                .ThenInclude(e => e!.Userprofile)
                .Include(pe => pe.Employee)
                .ThenInclude(e => e.Role)
                .Include(pe => pe.Employee)
                .ThenInclude(e => e.Department)
                .ToListAsync();
        }

        public async Task<bool> MapEmployeesToProjectAsync(
            int projectId,
            List<Projectemployee> employees
        )
        {
            var employeeIds = employees.Select(e => e.EmployeeId).ToList();

            var existingMappings = await _context
                .Projectemployees.Where(pe =>
                    pe.ProjectId == projectId && employeeIds.Contains(pe.EmployeeId)
                )
                .Select(pe => pe.EmployeeId)
                .ToListAsync();

            var newEmployees = employees
                .Where(e => !existingMappings.Contains(e.EmployeeId))
                .ToList();

            if (!newEmployees.Any())
                return false;

            foreach (var emp in newEmployees.Where(e => e.IsPrimary))
            {
                var existingPrimaries = await _context
                    .Projectemployees.Where(pe => pe.EmployeeId == emp.EmployeeId && pe.IsPrimary)
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
    var mappingsToRemove = await _context
        .Projectemployees.Where(pe =>
            pe.ProjectId == projectId && employeeIds.Contains(pe.EmployeeId)
        )
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
            return await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeId == employeeId);
        }

        public async Task<bool> IsEmployeeMappedToProjectAsync(int projectId, int employeeId)
        {
            return await _context.Projectemployees.AnyAsync(pe =>
                pe.ProjectId == projectId && pe.EmployeeId == employeeId
            );
        }

        public async Task<Employeedetailsmaster?> GetEmployeeDetailsByIdAsync(int employeeMasterId)
        {
            return await _context
                .Employeedetailsmasters.Include(e => e.Employee)
                .ThenInclude(e => e!.Userprofile)
                .Include(e => e.Employee)
                .ThenInclude(e => e!.Userauthentication)
                .Include(e => e.Role)
                .Include(e => e.Department)
                .FirstOrDefaultAsync(e => e.EmployeeMasterId == employeeMasterId);
        }

        public async Task<List<Projectemployee>> GetProjectEmployeesByEmployeeIdAsync(
            int employeeId
        )
        {
            return await _context
                .Projectemployees.Where(pe => pe.EmployeeId == employeeId)
                .ToListAsync();
        }

        public async Task<List<Employeedetailsmaster>> GetEmployeeDetailsByIdsAsync(
            List<int> employeeMasterIds
        )
        {
            return await _context
                .Employeedetailsmasters.Where(e => employeeMasterIds.Contains(e.EmployeeMasterId))
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
            return await _context.Employeedetailsmasters.AnyAsync(e =>
                e.EmployeeMasterId == employeeMasterId
            );
        }

        // ✅ NEW: Get EmployeeId from EmployeeMasterId
        public async Task<int?> GetEmployeeIdByMasterIdAsync(int employeeMasterId)
        {
            var employeeDetails = await _context
                .Employeedetailsmasters.Where(edm => edm.EmployeeMasterId == employeeMasterId)
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
        public async Task<bool> UpdateProjectEmployeePrimaryFlagsAsync(
            List<Projectemployee> projectEmployees
        )
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

        // ==================== ✅ NEW: GET ALL EMPLOYEES WITH PRIMARY PROJECT ====================

        /// <summary>
        /// ✅ NEW: Get all active employees with their primary project information
        /// </summary>
        /// <returns>
        /// Dictionary where:
        /// - Key: EmployeeMasterId
        /// - Value: Tuple containing (ProjectId, ProjectName) of their primary project, or null if none
        /// </returns>
        public async Task<
            Dictionary<int, (int ProjectId, string ProjectName)?>
        > GetAllEmployeesWithPrimaryProjectAsync()
        {
            try
            {
                Console.WriteLine("🔍 Fetching all employees with primary project information...");

                // ✅ Query all active employees and their primary projects in one efficient query
                var employeesWithPrimaryProjects = await _context
                    .Employeedetailsmasters.Where(edm =>
                        edm.Employee != null && edm.Employee.IsActive == true
                    )
                    .Select(edm => new
                    {
                        EmployeeMasterId = edm.EmployeeMasterId,
                        FirstName = edm.Employee!.Userprofile!.FirstName,
                        LastName = edm.Employee.Userprofile.LastName,
                        // ✅ FIXED: Navigate through Employeedetailsmaster's Projectemployees collection
                        PrimaryProject = _context
                            .Projectemployees.Where(pe =>
                                pe.EmployeeId == edm.EmployeeId && pe.IsPrimary
                            )
                            .Select(pe => new
                            {
                                ProjectId = pe.Project!.ProjectId,
                                ProjectName = pe.Project.ProjectName,
                            })
                            .FirstOrDefault(),
                    })
                    .ToListAsync();

                Console.WriteLine($"✅ Found {employeesWithPrimaryProjects.Count} active employees");

                // ✅ Convert to dictionary for O(1) lookup performance
                var result = employeesWithPrimaryProjects.ToDictionary(
                    emp => emp.EmployeeMasterId,
                    emp =>
                        emp.PrimaryProject != null
                            ? ((int ProjectId, string ProjectName)?)
                                (emp.PrimaryProject.ProjectId, emp.PrimaryProject.ProjectName)
                            : null
                );

                var withPrimaryCount = result.Count(kvp => kvp.Value.HasValue);
                var withoutPrimaryCount = result.Count(kvp => !kvp.Value.HasValue);

                Console.WriteLine($"📊 Statistics:");
                Console.WriteLine($"   - Employees with primary project: {withPrimaryCount}");
                Console.WriteLine($"   - Employees without primary project: {withoutPrimaryCount}");

                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"❌ Error in GetAllEmployeesWithPrimaryProjectAsync: {ex.Message}"
                );
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        /// <summary>
        /// ⚙️ Updates the reporting manager hierarchy for project managers
        /// L1 Approver reports to L2 Approver, L2 Approver reports to Resource Owner
        /// </summary>
        private async Task UpdateManagerHierarchyAsync(
            int? resourceOwnerId,
            int? l1ApproverId,
            int? l2ApproverId
        )
        {
            try
            {
                Console.WriteLine("🔄 Updating manager reporting hierarchy...");

                // ✅ Step 1: Get the actual EmployeeIds from EmployeeMasterIds
                var resourceOwnerEmployeeId = resourceOwnerId.HasValue
                    ? await GetEmployeeIdByMasterIdAsync(resourceOwnerId.Value)
                    : null;
                var l1ApproverEmployeeId = l1ApproverId.HasValue
                    ? await GetEmployeeIdByMasterIdAsync(l1ApproverId.Value)
                    : null;
                var l2ApproverEmployeeId = l2ApproverId.HasValue
                    ? await GetEmployeeIdByMasterIdAsync(l2ApproverId.Value)
                    : null;

                Console.WriteLine($"   - Resource Owner EmployeeId: {resourceOwnerEmployeeId}");
                Console.WriteLine($"   - L1 Approver EmployeeId: {l1ApproverEmployeeId}");
                Console.WriteLine($"   - L2 Approver EmployeeId: {l2ApproverEmployeeId}");

                // ✅ Step 2: Update L1 Approver's reporting manager
                if (l1ApproverEmployeeId.HasValue && l1ApproverEmployeeId.Value > 0)
                {
                    var l1Employee = await _context.Employees.FirstOrDefaultAsync(e =>
                        e.EmployeeId == l1ApproverEmployeeId.Value
                    );

                    if (l1Employee != null)
                    {
                        var newReportingManagerId = l2ApproverEmployeeId ?? resourceOwnerEmployeeId;

                        if (l1Employee.ReportingManagerEmployeeId != newReportingManagerId)
                        {
                            l1Employee.ReportingManagerEmployeeId = newReportingManagerId;
                            l1Employee.UpdatedAt = DateTime.UtcNow;
                            Console.WriteLine(
                                $"✅ Updated L1 Approver's ReportingManagerEmployeeId: {newReportingManagerId}"
                            );
                        }
                    }
                    else
                    {
                        Console.WriteLine(
                            $"⚠️ WARNING: L1 Approver Employee not found (EmployeeId: {l1ApproverEmployeeId})"
                        );
                    }
                }

                // ✅ Step 3: Update L2 Approver's reporting manager
                if (l2ApproverEmployeeId.HasValue && l2ApproverEmployeeId.Value > 0)
                {
                    var l2Employee = await _context.Employees.FirstOrDefaultAsync(e =>
                        e.EmployeeId == l2ApproverEmployeeId.Value
                    );

                    if (l2Employee != null)
                    {
                        if (l2Employee.ReportingManagerEmployeeId != resourceOwnerEmployeeId)
                        {
                            l2Employee.ReportingManagerEmployeeId = resourceOwnerEmployeeId;
                            l2Employee.UpdatedAt = DateTime.UtcNow;
                            Console.WriteLine(
                                $"✅ Updated L2 Approver's ReportingManagerEmployeeId: {resourceOwnerEmployeeId}"
                            );
                        }
                    }
                    else
                    {
                        Console.WriteLine(
                            $"⚠️ WARNING: L2 Approver Employee not found (EmployeeId: {l2ApproverEmployeeId})"
                        );
                    }
                }

                await _context.SaveChangesAsync();
                Console.WriteLine("✅ Manager hierarchy updated successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error updating manager hierarchy: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }
        /// <summary>
/// ✅ NEW: Automatically move employees to resource pool if they have no project mappings
/// Also updates L1/L2 reporting manager logic
/// </summary>
public async Task<int> MoveUnmappedEmployeesToResourcePoolAsync(List<int> employeeIds)
{
    try
    {
        Console.WriteLine($"🔄 Checking {employeeIds.Count} employees for resource pool auto-assignment...");

        // Get resource pool project
        var resourcePoolProject = await _context.Projects
            .FirstOrDefaultAsync(p => p.ProjectName.ToLower() == "org.rz.resourcepool");

        if (resourcePoolProject == null)
        {
            Console.WriteLine("⚠️ Resource pool project not found");
            return 0;
        }

        // Get L2 approver's EmployeeId for reporting manager
        int? l2ApproverEmployeeId = null;
        if (resourcePoolProject.L2approverEmployeeId.HasValue)
        {
            l2ApproverEmployeeId = await GetEmployeeIdByMasterIdAsync(resourcePoolProject.L2approverEmployeeId.Value);
        }

        var movedCount = 0;

        foreach (var empMasterId in employeeIds)
        {
            // Check if employee has ANY other project mappings (primary or secondary)
            var otherProjectMappings = await _context.Projectemployees
                .Where(pe => pe.EmployeeId == empMasterId)
                .ToListAsync();

            // If no other mappings exist, move to resource pool
            if (!otherProjectMappings.Any())
            {
                Console.WriteLine($"✅ Employee {empMasterId} has no project mappings. Moving to resource pool...");

                // Check if already in resource pool
                var existingResourcePoolMapping = await _context.Projectemployees
                    .FirstOrDefaultAsync(pe => pe.ProjectId == resourcePoolProject.ProjectId && 
                                              pe.EmployeeId == empMasterId);

                if (existingResourcePoolMapping == null)
                {
                    // Add to resource pool
                    var resourcePoolMapping = new Projectemployee
                    {
                        ProjectId = resourcePoolProject.ProjectId,
                        EmployeeId = empMasterId,
                        AssignedAt = DateTime.UtcNow,
                        IsPrimary = true // Resource pool is primary when no other projects
                    };

                    await _context.Projectemployees.AddAsync(resourcePoolMapping);

                    // ✅ Update reporting manager to L2 approver of resource pool
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
                                Console.WriteLine($"   Updated reporting manager to {l2ApproverEmployeeId.Value}");
                            }
                        }
                    }

                    movedCount++;
                }
                else
                {
                    Console.WriteLine($"   Employee {empMasterId} already in resource pool");
                }
            }
            else
            {
                Console.WriteLine($"ℹ️ Employee {empMasterId} still has {otherProjectMappings.Count} project mapping(s). Not moving to resource pool.");
            }
        }

        if (movedCount > 0)
        {
            await _context.SaveChangesAsync();
            Console.WriteLine($"✅ Successfully moved {movedCount} employee(s) to resource pool");
        }

        return movedCount;
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error in MoveUnmappedEmployeesToResourcePoolAsync: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        throw;
    }
}

    }
}
