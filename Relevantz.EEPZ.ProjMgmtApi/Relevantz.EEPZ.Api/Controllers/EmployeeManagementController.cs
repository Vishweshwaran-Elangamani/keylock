
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Serilog;

namespace eepzbackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // [Authorize(Roles = "HR")]
    public class EmployeeManagementController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;
        private readonly ILogger<EmployeeManagementController> _logger;

        public EmployeeManagementController(IEmployeeService employeeService, ILogger<EmployeeManagementController> logger)
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
            try
            {
                _logger.LogInformation("HR requested all active employees");
                var result = await _employeeService.GetAllEmployeesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Controller failed to retrieve all employees");
                Log.Error(ex, "EmployeeRetrievalController: Failed to retrieve all employees");
                return StatusCode(500, new { success = false, message = "Failed to retrieve employees", error = ex.Message });
            }
        }

        /// <summary>
        /// Get only managers/senior roles for approver dropdowns. Used for L1 and L2 Approver dropdowns
        /// </summary>
        [HttpGet("managers")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetManagers()
        {
            try
            {
                _logger.LogInformation("HR requested manager employees for approver dropdowns");
                var result = await _employeeService.GetManagersAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Controller failed to retrieve managers");
                Log.Error(ex, "EmployeeRetrievalController: Failed to retrieve managers");
                return StatusCode(500, new { success = false, message = "Failed to retrieve managers", error = ex.Message });
            }
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
            try
            {
                _logger.LogInformation("HR requested employee details for ID: {EmployeeMasterId}", employeeMasterId);
                var result = await _employeeService.GetEmployeeByIdAsync(employeeMasterId);
                
                if (!result.Success && result.Data == null)
                    return NotFound(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Controller failed to retrieve employee {EmployeeMasterId}", employeeMasterId);
                Log.Error(ex, "EmployeeRetrievalController: Failed to retrieve employee {EmployeeMasterId}", employeeMasterId);
                return StatusCode(500, new { success = false, message = "Failed to retrieve employee", error = ex.Message });
            }
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
            try
            {
                _logger.LogInformation("HR requested employee search with query: {SearchQuery}", query);
                var result = await _employeeService.SearchEmployeesAsync(query);
                
                if (!result.Success && result.Message == "Search query is required")
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Controller failed to search employees with query: {SearchQuery}", query);
                Log.Error(ex, "EmployeeRetrievalController: Failed to search employees");
                return StatusCode(500, new { success = false, message = "Failed to search employees", error = ex.Message });
            }
        }

        /// <summary>
        /// Get employees by department
        /// </summary>
        [HttpGet("department/{departmentId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetEmployeesByDepartment(int departmentId)
        {
            try
            {
                _logger.LogInformation("HR requested employees for department ID: {DepartmentId}", departmentId);
                var result = await _employeeService.GetEmployeesByDepartmentAsync(departmentId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Controller failed to retrieve employees for department {DepartmentId}", departmentId);
                Log.Error(ex, "EmployeeRetrievalController: Failed to retrieve department employees");
                return StatusCode(500, new { success = false, message = "Failed to retrieve employees by department", error = ex.Message });
            }
        }

        /// <summary>
        /// Get employees by role
        /// </summary>
        [HttpGet("role/{roleId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetEmployeesByRole(int roleId)
        {
            try
            {
                _logger.LogInformation("HR requested employees for role ID: {RoleId}", roleId);
                var result = await _employeeService.GetEmployeesByRoleAsync(roleId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Controller failed to retrieve employees for role {RoleId}", roleId);
                Log.Error(ex, "EmployeeRetrievalController: Failed to retrieve role employees");
                return StatusCode(500, new { success = false, message = "Failed to retrieve employees by role", error = ex.Message });
            }
        }

        /// <summary>
        /// Get all departments. Used for Department dropdown in project forms
        /// </summary>
        [HttpGet("departments")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllDepartments()
        {
            try
            {
                _logger.LogInformation("HR requested all departments");
                var result = await _employeeService.GetAllDepartmentsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Controller failed to retrieve departments");
                Log.Error(ex, "EmployeeRetrievalController: Failed to retrieve departments");
                return StatusCode(500, new { success = false, message = "Failed to retrieve departments", error = ex.Message });
            }
        }

        /// <summary>
        /// Get all business units (distinct from existing projects). Used for Business Unit dropdown in project forms
        /// </summary>
        [HttpGet("business-units")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllBusinessUnits()
        {
            try
            {
                _logger.LogInformation("HR requested all business units");
                var result = await _employeeService.GetAllBusinessUnitsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Controller failed to retrieve business units");
                Log.Error(ex, "EmployeeRetrievalController: Failed to retrieve business units");
                return StatusCode(500, new { success = false, message = "Failed to retrieve business units", error = ex.Message });
            }
        }

        /// <summary>
        /// Get employees with null reporting manager (Initial Stage Employees). Excludes employees already mapped to resource pool
        /// </summary>
        [HttpGet("initial-stage")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetInitialStageEmployees()
        {
            try
            {
                _logger.LogInformation("HR requested initial stage employees");
                var result = await _employeeService.GetInitialStageEmployeesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Controller failed to retrieve initial stage employees");
                Log.Error(ex, "EmployeeRetrievalController: Failed to retrieve initial stage employees");
                return StatusCode(500, new { success = false, message = "Failed to retrieve initial stage employees", error = ex.Message });
            }
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
            try
            {
                _logger.LogInformation("HR requested mapping {EmployeeCount} employees to resource pool", request.EmployeeMasterIds?.Count ?? 0);
                var result = await _employeeService.MapEmployeesToResourcePoolAsync(request.EmployeeMasterIds ?? new List<int>());
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Controller failed to map employees to resource pool");
                Log.Error(ex, "EmployeeRetrievalController: Failed to map employees to resource pool");
                return StatusCode(500, new { success = false, message = "Failed to map employees to resource pool", error = ex.Message });
            }
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
            try
            {
                _logger.LogInformation("HR requested department details for ID: {DepartmentId}", departmentId);
                var result = await _employeeService.GetDepartmentByIdAsync(departmentId);
                
                if (!result.Success && result.Data == null)
                    return NotFound(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Controller failed to retrieve department {DepartmentId}", departmentId);
                Log.Error(ex, "EmployeeRetrievalController: Failed to retrieve department {DepartmentId}", departmentId);
                return StatusCode(500, new { success = false, message = "Failed to retrieve department", error = ex.Message });
            }
        }
    }
}
