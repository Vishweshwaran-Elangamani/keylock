    // Controllers/ProjectManagementController.cs
    using Relevantz.EEPZ.Common.DTOs.Request;
    using Relevantz.EEPZ.Core.Services.Interfaces;
    using Relevantz.EEPZ.Data;
    using Relevantz.EEPZ.Common.Entities;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.EntityFrameworkCore;
    using Relevantz.EEPZ.Data.DBContexts;

    namespace eepzbackend.Controllers
    {
        // [Authorize(Roles = "HR")]
        [Route("api/[controller]")]
        [ApiController]
        
        public class ProjectManagementController : ControllerBase
        {
            private readonly IProjectService _projectService;
            private readonly EEPZDbContext _context;

            public ProjectManagementController(IProjectService projectService, EEPZDbContext context)
            {
                _projectService = projectService;
                _context = context;
            }

            /// <summary>
            /// Get all projects
            /// </summary>
            [HttpGet]
            [ProducesResponseType(StatusCodes.Status200OK)]
            [ProducesResponseType(StatusCodes.Status500InternalServerError)]
            public async Task<IActionResult> GetAllProjects()
            {
                var result = await _projectService.GetAllProjectsAsync();

                if (result.Success)
                    return Ok(result);

                return StatusCode(500, result);
            }

            /// <summary>
            /// Get project by ID
            /// </summary>
            [HttpGet("{projectId}")]
            [ProducesResponseType(StatusCodes.Status200OK)]
            [ProducesResponseType(StatusCodes.Status404NotFound)]
            [ProducesResponseType(StatusCodes.Status500InternalServerError)]
            public async Task<IActionResult> GetProjectById(int projectId)
            {
                var result = await _projectService.GetProjectByIdAsync(projectId);

                if (result.Success)
                    return Ok(result);

                if (result.Message.Contains("not found"))
                    return NotFound(result);

                return StatusCode(500, result);
            }

            /// <summary>
            /// Create a new project (US146)
            /// </summary>
            [HttpPost]
            [ProducesResponseType(StatusCodes.Status201Created)]
            [ProducesResponseType(StatusCodes.Status400BadRequest)]
            [ProducesResponseType(StatusCodes.Status500InternalServerError)]
            public async Task<IActionResult> CreateProject([FromBody] CreateProjectRequest request)
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _projectService.CreateProjectAsync(request);

                if (result.Success)
                    return CreatedAtAction(nameof(GetProjectById), new { projectId = result.Data!.ProjectId }, result);

                if (result.Errors != null && result.Errors.Any())
                    return BadRequest(result);

                return StatusCode(500, result);
            }

            /// <summary>
            /// Update project details (US148)
            /// </summary>
            [HttpPut("{projectId}")]
            [ProducesResponseType(StatusCodes.Status200OK)]
            [ProducesResponseType(StatusCodes.Status400BadRequest)]
            [ProducesResponseType(StatusCodes.Status404NotFound)]
            [ProducesResponseType(StatusCodes.Status500InternalServerError)]
            public async Task<IActionResult> UpdateProject(int projectId, [FromBody] UpdateProjectRequest request)
            {
                if (projectId != request.ProjectId)
                    return BadRequest("Project ID mismatch.");

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _projectService.UpdateProjectAsync(request);

                if (result.Success)
                    return Ok(result);

                if (result.Message.Contains("not found"))
                    return NotFound(result);

                if (result.Errors != null && result.Errors.Any())
                    return BadRequest(result);

                return StatusCode(500, result);
            }

            /// <summary>
            /// Delete a project
            /// </summary>
            [HttpDelete("{projectId}")]
            [ProducesResponseType(StatusCodes.Status200OK)]
            [ProducesResponseType(StatusCodes.Status400BadRequest)]
            [ProducesResponseType(StatusCodes.Status404NotFound)]
            [ProducesResponseType(StatusCodes.Status500InternalServerError)]
            public async Task<IActionResult> DeleteProject(int projectId)
            {
                var result = await _projectService.DeleteProjectAsync(projectId);

                if (result.Success)
                    return Ok(result);

                if (result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                    return NotFound(result);

                if (result.Message.Contains("employees are still mapped", StringComparison.OrdinalIgnoreCase))
                    return BadRequest(result);

                return StatusCode(500, result);
            }

            /// <summary>
            /// Update reporting managers of a project (US147)
            /// </summary>
            [HttpPut("{projectId}/reporting-managers")]
            [ProducesResponseType(StatusCodes.Status200OK)]
            [ProducesResponseType(StatusCodes.Status400BadRequest)]
            [ProducesResponseType(StatusCodes.Status404NotFound)]
            [ProducesResponseType(StatusCodes.Status500InternalServerError)]
            public async Task<IActionResult> UpdateReportingManagers(int projectId, [FromBody] UpdateReportingManagersRequest request)
            {
                if (projectId != request.ProjectId)
                    return BadRequest("Project ID mismatch.");

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _projectService.UpdateReportingManagersAsync(request);

                if (result.Success)
                    return Ok(result);

                if (result.Message.Contains("not found"))
                    return NotFound(result);

                if (result.Errors != null && result.Errors.Any())
                    return BadRequest(result);

                return StatusCode(500, result);
            }

            /// <summary>
            /// ✅ UPDATED: Map employees to a project (US149)
            /// ✅ ENHANCED LOGIC:
            ///   - Employee added to ANY PRIMARY PROJECT → Auto-unmap from Resource Pool
            ///   - Employee added to RESOURCE POOL → Remove from ALL other projects
            /// ✅ SINGLE PROJECT RULE: Employee can only be in ONE project at a time
            /// ✅ FIXED: Consistent ID usage (EmployeeMasterId throughout)
            /// </summary>
            [HttpPost("{projectId}/employees/map")]
            [ProducesResponseType(StatusCodes.Status200OK)]
            [ProducesResponseType(StatusCodes.Status400BadRequest)]
            [ProducesResponseType(StatusCodes.Status404NotFound)]
            [ProducesResponseType(StatusCodes.Status500InternalServerError)]
            public async Task<IActionResult> MapEmployeesToProject(int projectId, [FromBody] MapEmployeesToProjectRequest request)
            {
                try
                {
                    if (projectId != request.ProjectId)
                        return BadRequest(new { success = false, message = "Project ID mismatch." });

                    if (!ModelState.IsValid)
                        return BadRequest(ModelState);

                    var project = await _context.Projects.FindAsync(projectId);
                    if (project == null)
                        return NotFound(new { success = false, message = "Project not found." });

                    if (request.Employees == null || !request.Employees.Any())
                        return BadRequest(new { success = false, message = "No employees provided." });

                    // Get resource pool project
                    var resourcePoolProject = await _context.Projects
                        .FirstOrDefaultAsync(p => p.ProjectName.ToLower() == "org.rz.resourcepool");

                    // ✅ FIXED: Use EmployeeMasterId consistently (assuming request.Employees.EmployeeId == EmployeeMasterId)
                    var employeeMasterIds = request.Employees.Select(e => e.EmployeeId).ToList();  // EmployeeMasterIds

                    // ✅ LOGIC 1: Employee added to ANY PRIMARY PROJECT (NOT resource pool)
                    // → MUST be removed from resource pool (but AVOID removing from other non-primary if not needed; per user request, focus on resource pool only)
                    if (resourcePoolProject != null && projectId != resourcePoolProject.ProjectId)
                    {
                        // Get employees currently in resource pool
                        var resourcePoolMappings = await _context.Projectemployees
                            .Where(pe => pe.ProjectId == resourcePoolProject.ProjectId && 
                                    employeeMasterIds.Contains(pe.EmployeeId))
                            .ToListAsync();

                        if (resourcePoolMappings.Any())
                        {
                            // Remove from resource pool ONLY (avoid removing from other projects alone, per query)
                            _context.Projectemployees.RemoveRange(resourcePoolMappings);
                            await _context.SaveChangesAsync();
                        }
                    }

                    // ✅ LOGIC 2: Employee added to RESOURCE POOL
                    // → Remove from ALL other projects (primary or otherwise) - KEEP this as single project rule
                    if (resourcePoolProject != null && projectId == resourcePoolProject.ProjectId)
                    {
                        var allOtherProjectMappings = await _context.Projectemployees
                            .Where(pe => pe.ProjectId != resourcePoolProject.ProjectId && 
                                    employeeMasterIds.Contains(pe.EmployeeId))
                            .ToListAsync();

                        if (allOtherProjectMappings.Any())
                        {
                            _context.Projectemployees.RemoveRange(allOtherProjectMappings);
                            await _context.SaveChangesAsync();
                        }
                    }

                    // ✅ LOGIC 3: For NON-resource pool projects, enforce single project by removing from ALL other projects
                    // (But per query, avoid broad removal; only remove from resource pool as in Logic 1)
                    // Skip general removal for other projects to "avoid this alone" - let service handle only the mapping
                    // var allOtherMappings = await _context.Projectemployees
                    //     .Where(pe => pe.ProjectId != projectId && 
                    //                employeeMasterIds.Contains(pe.EmployeeId))
                    //     .ToListAsync();
                    // if (allOtherMappings.Any())
                    // {
                    //     _context.Projectemployees.RemoveRange(allOtherMappings);
                    //     await _context.SaveChangesAsync();
                    // }

                    // Now call the service to add the new mappings with proper reporting manager updates
                    var result = await _projectService.MapEmployeesToProjectAsync(request);

                    if (result.Success)
                        return Ok(new
                        {
                            success = true,
                            message = result.Message,
                            data = result.Data,
                            note = "Employee(s) have been handled per single project rule (resource pool exclusions applied)."
                        });

                    if (result.Message.Contains("not found"))
                        return NotFound(result);

                    if (result.Errors != null && result.Errors.Any())
                        return BadRequest(result);

                    return StatusCode(500, result);
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new
                    {
                        success = false,
                        message = "Failed to map employees to project",
                        error = ex.Message
                    });
                }
            }

            /// <summary>
            /// Unmap employees from a project (US149)
            /// </summary>
            [HttpPost("{projectId}/employees/unmap")]
            [ProducesResponseType(StatusCodes.Status200OK)]
            [ProducesResponseType(StatusCodes.Status400BadRequest)]
            [ProducesResponseType(StatusCodes.Status404NotFound)]
            [ProducesResponseType(StatusCodes.Status500InternalServerError)]
            public async Task<IActionResult> UnmapEmployeesFromProject(int projectId, [FromBody] UnmapEmployeesFromProjectRequest request)
            {
                if (projectId != request.ProjectId)
                    return BadRequest("Project ID mismatch.");

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _projectService.UnmapEmployeesFromProjectAsync(request);

                if (result.Success)
                    return Ok(result);

                if (result.Message.Contains("not found"))
                    return NotFound(result);

                if (result.Errors != null && result.Errors.Any())
                    return BadRequest(result);

                return StatusCode(500, result);
            }

            /// <summary>
            /// Get available employees for mapping
            /// </summary>
            [HttpGet("employees/available")]
            [ProducesResponseType(StatusCodes.Status200OK)]
            [ProducesResponseType(StatusCodes.Status500InternalServerError)]
            public async Task<IActionResult> GetAvailableEmployees()
            {
                var result = await _projectService.GetAvailableEmployeesAsync();

                if (result.Success)
                    return Ok(result);

                return StatusCode(500, result);
            }


            /// <summary>
/// ✅ NEW: Get all employees with their primary project information
/// Used by frontend to display primary project badges in the employee mapping modal
/// </summary>
[HttpGet("employees/primary-projects")]
[ProducesResponseType(StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status500InternalServerError)]
public async Task<IActionResult> GetAllEmployeesWithPrimaryProject()
{
    var result = await _projectService.GetAllEmployeesWithPrimaryProjectAsync();

    if (result.Success)
        return Ok(result);

    return StatusCode(500, result);
}

        }
    }
