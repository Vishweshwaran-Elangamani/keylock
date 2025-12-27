using Relevantz.EEPZ.Common.DTOs.Request;
using Microsoft.AspNetCore.Authorization;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace eepzbackend.Controllers
{
    // [Authorize(Roles = "HR")]
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
        /// Map employees to project with resource pool logic
        /// </summary>
        [HttpPost("{projectId}/employees/map")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> MapEmployeesToProject(int projectId, [FromBody] MapEmployeesToProjectRequest request)
        {
            if (projectId != request.ProjectId)
                return BadRequest("Project ID mismatch.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _projectService.MapEmployeesToProjectAsync(request);

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
        /// Get all employees with their primary project information
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
