using Relevantz.EEPZ.Common.DTOs.Request;
using Microsoft.AspNetCore.Authorization;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace eepzbackend.Controllers
{
    // Enforce authorization at controller level; adjust roles/policies as needed.
    [Authorize(Roles = "HR")]
    [Route("api/[controller]")]
    [ApiController]
    public class ProjectManagementController : ControllerBase
    {
        private readonly IProjectService _projectService;

        public ProjectManagementController(IProjectService projectService)
        {
            _projectService = projectService;
        }

        /// <summary>
        /// Get all projects
        /// </summary>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllProjects()
        {
            // Call service
            var result = await _projectService.GetAllProjectsAsync();

            // Map to HTTP response
            if (result.Success)
                return Ok(result);

            return StatusCode(500, result);
        }

        /// <summary>
        /// Get project by ID
        /// </summary>
        [HttpGet("{projectId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetProjectById([FromRoute] int projectId)
        {
            // Guard: projectId must be positive before querying
            if (projectId <= 0)
                return BadRequest("ProjectId must be greater than zero.");

            // Call service
            var result = await _projectService.GetProjectByIdAsync(projectId);

            // Map to HTTP response
            if (result.Success)
                return Ok(result);

            if (result.Message.Contains("not found"))
                return NotFound(result);

            return StatusCode(500, result);
        }

        /// <summary>
        /// Create a new project
        /// </summary>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> CreateProject([FromBody] CreateProjectRequest request)
        {
            // Model validation (handled by [ApiController] too, but explicit check retained)
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Call service
            var result = await _projectService.CreateProjectAsync(request);

            // Map to HTTP response
            if (result.Success)
                return CreatedAtAction(nameof(GetProjectById), new { projectId = result.Data!.ProjectId }, result);

            if (result.Errors != null && result.Errors.Any())
                return BadRequest(result);

            return StatusCode(500, result);
        }

        /// <summary>
        /// Update project details 
        /// </summary>
        [HttpPut("{projectId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UpdateProject([FromRoute] int projectId, [FromBody] UpdateProjectRequest request)
        {
            // Guard: route id must be positive
            if (projectId <= 0)
                return BadRequest("ProjectId must be greater than zero.");

            // Guard: route id must match body id
            if (projectId != request.ProjectId)
                return BadRequest("Project ID mismatch.");

            // Model validation
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Call service
            var result = await _projectService.UpdateProjectAsync(request);

            // Map to HTTP response
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
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteProject([FromRoute] int projectId)
        {
            // Guard: projectId must be positive
            if (projectId <= 0)
                return BadRequest("ProjectId must be greater than zero.");

            // Call service
            var result = await _projectService.DeleteProjectAsync(projectId);

            // Map to HTTP response
            if (result.Success)
                return NoContent(); // Per review: return 204 on success

            if (result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(result);

            if (result.Message.Contains("employees are still mapped", StringComparison.OrdinalIgnoreCase))
                return BadRequest(result);

            return StatusCode(500, result);
        }

        /// <summary>
        /// Update reporting managers of a project
        /// </summary>
        [HttpPut("{projectId}/reporting-managers")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UpdateReportingManagers([FromRoute] int projectId, [FromBody] UpdateReportingManagersRequest request)
        {
            // Guard: projectId must be positive
            if (projectId <= 0)
                return BadRequest("ProjectId must be greater than zero.");

            // Guard: route id must match body id
            if (projectId != request.ProjectId)
                return BadRequest("Project ID mismatch.");

            // Model validation
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Call service
            var result = await _projectService.UpdateReportingManagersAsync(request);

            // Map to HTTP response
            if (result.Success)
                return Ok(result);

            if (result.Message.Contains("not found"))
                return NotFound(result);

            if (result.Errors != null && result.Errors.Any())
                return BadRequest(result);

            return StatusCode(500, result);
        }

        /// <summary>
        /// Map employees to project with resource pool logic
        /// </summary>
        [HttpPost("{projectId}/employees/map")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> MapEmployeesToProject([FromRoute] int projectId, [FromBody] MapEmployeesToProjectRequest request)
        {
            // Guard: projectId must be positive
            if (projectId <= 0)
                return BadRequest("ProjectId must be greater than zero.");

            // Guard: route id must match body id
            if (projectId != request.ProjectId)
                return BadRequest("Project ID mismatch.");

            // Model validation
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Call service
            var result = await _projectService.MapEmployeesToProjectAsync(request);

            // Map to HTTP response
            if (result.Success)
                return Ok(result);

            if (result.Message.Contains("not found"))
                return NotFound(result);

            if (result.Errors != null && result.Errors.Any())
                return BadRequest(result);

            return StatusCode(500, result);
        }

        /// <summary>
        /// Unmap employees from project
        /// </summary>
        [HttpPost("{projectId}/employees/unmap")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UnmapEmployeesFromProject([FromRoute] int projectId, [FromBody] UnmapEmployeesFromProjectRequest request)
        {
            // Guard: projectId must be positive
            if (projectId <= 0)
                return BadRequest("ProjectId must be greater than zero.");

            // Guard: route id must match body id
            if (projectId != request.ProjectId)
                return BadRequest("Project ID mismatch.");

            // Model validation
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Call service
            var result = await _projectService.UnmapEmployeesFromProjectAsync(request);

            // Map to HTTP response
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
            // Call service
            var result = await _projectService.GetAvailableEmployeesAsync();

            // Map to HTTP response
            if (result.Success)
                return Ok(result);

            return StatusCode(500, result);
        }

        /// <summary>
        /// Get all employees with their primary project information
        /// </summary>
        [HttpGet("employees/primary-projects")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllEmployeesWithPrimaryProject()
        {
            // Call service
            var result = await _projectService.GetAllEmployeesWithPrimaryProjectAsync();

            // Map to HTTP response
            if (result.Success)
                return Ok(result);

            return StatusCode(500, result);
        }
    }
}