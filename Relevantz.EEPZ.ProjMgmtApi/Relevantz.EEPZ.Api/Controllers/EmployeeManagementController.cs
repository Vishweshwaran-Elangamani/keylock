using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace eepzbackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // [Authorize(Roles = "HR")]
    public class EmployeeManagementController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;
        private readonly ILogger<EmployeeManagementController> _logger;

        public EmployeeManagementController(
            IEmployeeService employeeService, 
            ILogger<EmployeeManagementController> logger)
        {
            _employeeService = employeeService;
            _logger = logger;
        }

        /// <summary>
        /// Get all active employees with their details. Used for Resource Owner dropdown
        /// </summary>
        [HttpGet("all")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllEmployees()
        {
            _logger.LogInformation("HR requested all active employees");
            var result = await _employeeService.GetAllEmployeesAsync();
            return Ok(result);
        }

        /// <summary>
        /// Get only managers/senior roles for approver dropdowns. Used for L1 and L2 Approver dropdowns
        /// </summary>
        [HttpGet("managers")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetManagers()
        {
            _logger.LogInformation("HR requested manager employees for approver dropdowns");
            var result = await _employeeService.GetManagersAsync();
            return Ok(result);
        }

        /// <summary>
        /// Get employee by ID with full details
        /// </summary>
        [HttpGet("{employeeMasterId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetEmployeeById(int employeeMasterId)
        {
            _logger.LogInformation("HR requested employee details for ID: {EmployeeMasterId}", employeeMasterId);
            var result = await _employeeService.GetEmployeeByIdAsync(employeeMasterId);
            
            if (!result.Success && result.Data == null)
                return NotFound(result);

            return Ok(result);
        }

        /// <summary>
        /// Search employees by name or employee company ID
        /// </summary>
        [HttpGet("search")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> SearchEmployees([FromQuery] string query)
        {
            _logger.LogInformation("HR requested employee search with query: {SearchQuery}", query);
            var result = await _employeeService.SearchEmployeesAsync(query);
            
            if (!result.Success && result.Message == "Search query is required")
                return BadRequest(result);

            return Ok(result);
        }

        /// <summary>
        /// Get employees by department
        /// </summary>
        [HttpGet("department/{departmentId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetEmployeesByDepartment(int departmentId)
        {
            _logger.LogInformation("HR requested employees for department ID: {DepartmentId}", departmentId);
            var result = await _employeeService.GetEmployeesByDepartmentAsync(departmentId);
            return Ok(result);
        }

        /// <summary>
        /// Get employees by role
        /// </summary>
        [HttpGet("role/{roleId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetEmployeesByRole(int roleId)
        {
            _logger.LogInformation("HR requested employees for role ID: {RoleId}", roleId);
            var result = await _employeeService.GetEmployeesByRoleAsync(roleId);
            return Ok(result);
        }

        /// <summary>
        /// Get all departments. Used for Department dropdown in project forms
        /// </summary>
        [HttpGet("departments")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllDepartments()
        {
            _logger.LogInformation("HR requested all departments");
            var result = await _employeeService.GetAllDepartmentsAsync();
            return Ok(result);
        }

        /// <summary>
        /// Get all business units (distinct from existing projects). Used for Business Unit dropdown in project forms
        /// </summary>
        [HttpGet("business-units")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllBusinessUnits()
        {
            _logger.LogInformation("HR requested all business units");
            var result = await _employeeService.GetAllBusinessUnitsAsync();
            return Ok(result);
        }

        /// <summary>
        /// Get employees with null reporting manager (Initial Stage Employees). Excludes employees already mapped to resource pool
        /// </summary>
        [HttpGet("initial-stage")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetInitialStageEmployees()
        {
            _logger.LogInformation("HR requested initial stage employees");
            var result = await _employeeService.GetInitialStageEmployeesAsync();
            return Ok(result);
        }

        /// <summary>
        /// Map initial stage employees to resource pool (org.rz.resourcepool)
        /// </summary>
        [HttpPost("map-to-resource-pool")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> MapToResourcePool([FromBody] MapToResourcePoolRequest request)
        {
            _logger.LogInformation("HR requested mapping {EmployeeCount} employees to resource pool", request.EmployeeMasterIds?.Count ?? 0);
            var result = await _employeeService.MapEmployeesToResourcePoolAsync(request.EmployeeMasterIds ?? new List<int>());
            return Ok(result);
        }

        /// <summary>
        /// Get department by ID with details
        /// </summary>
        [HttpGet("departments/{departmentId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetDepartmentById(int departmentId)
        {
            _logger.LogInformation("HR requested department details for ID: {DepartmentId}", departmentId);
            var result = await _employeeService.GetDepartmentByIdAsync(departmentId);
            
            if (!result.Success && result.Data == null)
                return NotFound(result);

            return Ok(result);
        }
    }
}
