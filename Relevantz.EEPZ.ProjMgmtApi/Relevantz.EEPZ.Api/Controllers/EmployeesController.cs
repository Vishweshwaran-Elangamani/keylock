using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.Constants;

namespace eepzbackend.Controllers
{
    [Route("api/employees")]
    [ApiController]
    // [Authorize(Roles = "HR")]
   public class EmployeesController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;
        private readonly ILogger<EmployeesController> _logger;

        public EmployeesController(
            IEmployeeService employeeService,
            ILogger<EmployeesController> logger)
        {
            _employeeService = employeeService;
            _logger = logger;
        }

        /// <summary>
        /// Get all active employees with their details. Used for Resource Owner dropdown
        /// </summary>
        [HttpGet("allEmployees")]
        public async Task<IActionResult> GetAllEmployees()
        {
            _logger.LogInformation("HR requested all active employees");
            var result = await _employeeService.GetAllEmployeesAsync();

            if (!result.Success && result.Code == EmployeeResponseMessages.Codes.EMPLOYEE_NOT_FOUND)
                return NotFound(result);

            return Ok(result);
        }

        /// <summary>
        /// Get all managers/senior roles for approver dropdowns
        /// </summary>
        [HttpGet("managers")]
        public async Task<IActionResult> GetAllManagers()
        {
            _logger.LogInformation("HR requested all managers for approver dropdowns");
            var result = await _employeeService.GetManagersAsync();

            if (!result.Success && result.Code == EmployeeResponseMessages.Codes.EMPLOYEE_NOT_FOUND)
                return NotFound(result);

            return Ok(result);
        }

        /// <summary>
        /// Get employee by ID with full details
        /// </summary>
        [HttpGet("employeeId/{employeeId}")]
        public async Task<IActionResult> GetEmployeeById(int employeeId)
        {
            _logger.LogInformation("HR requested employee details for ID: {EmployeeId}", employeeId);
            var result = await _employeeService.GetEmployeeByIdAsync(employeeId);

            if (!result.Success && result.Code == EmployeeResponseMessages.Codes.EMPLOYEE_NOT_FOUND)
                return NotFound(result);

            return Ok(result);
        }

        /// <summary>
        /// Search employees by name or employee company ID
        /// </summary>
        [HttpGet("search")]
        public async Task<IActionResult> SearchEmployees([FromQuery] string searchTerm)
        {
            _logger.LogInformation("HR requested employee search with term: {SearchTerm}", searchTerm);
            var result = await _employeeService.SearchEmployeesAsync(searchTerm);

            if (!result.Success && result.Code == EmployeeResponseMessages.Codes.EMPLOYEE_SEARCH_QUERY_REQUIRED)
                return BadRequest(result);

            if (!result.Success && result.Code == EmployeeResponseMessages.Codes.EMPLOYEE_NOT_FOUND)
                return NotFound(result);

            return Ok(result);
        }

        /// <summary>
        /// Get employees by department
        /// </summary>
        [HttpGet("department/{departmentId}")]
        public async Task<IActionResult> GetEmployeesByDepartment(int departmentId)
        {
            _logger.LogInformation("HR requested employees for department ID: {DepartmentId}", departmentId);
            var result = await _employeeService.GetEmployeesByDepartmentAsync(departmentId);

            if (!result.Success && result.Code == EmployeeResponseMessages.Codes.DEPARTMENT_NOT_FOUND)
                return NotFound(result);

            return Ok(result);
        }

        /// <summary>
        /// Get employees by role
        /// </summary>
        [HttpGet("role/{roleId}")]
        public async Task<IActionResult> GetEmployeesByRole(int roleId)
        {
            _logger.LogInformation("HR requested employees for role ID: {RoleId}", roleId);
            var result = await _employeeService.GetEmployeesByRoleAsync(roleId);

            if (!result.Success && result.Code == EmployeeResponseMessages.Codes.EMPLOYEE_NOT_FOUND)
                return NotFound(result);

            return Ok(result);
        }

        /// <summary>
        /// Get all departments. Used for Department dropdown in project forms
        /// </summary>
        [HttpGet("departments")]
        public async Task<IActionResult> GetAllDepartments()
        {
            _logger.LogInformation("HR requested all departments");
            var result = await _employeeService.GetAllDepartmentsAsync();

            if (!result.Success && result.Code == EmployeeResponseMessages.Codes.DEPARTMENT_NOT_FOUND)
                return NotFound(result);

            return Ok(result);
        }

        /// <summary>
        /// Get all business units. Used for Business Unit dropdown in project forms
        /// </summary>
        [HttpGet("business-units")]
        public async Task<IActionResult> GetAllBusinessUnits()
        {
            _logger.LogInformation("HR requested all business units");
            var result = await _employeeService.GetAllBusinessUnitsAsync();

            if (!result.Success && result.Code == EmployeeResponseMessages.Codes.INVALID_REQUEST)
                return NotFound(result);

            return Ok(result);
        }

        /// <summary>
        /// Get employees with null reporting manager (Initial Stage Employees)
        /// </summary>
        [HttpGet("initial-stage")]
        public async Task<IActionResult> GetInitialStageEmployees()
        {
            _logger.LogInformation("HR requested initial stage employees");
            var result = await _employeeService.GetInitialStageEmployeesAsync();

            if (!result.Success && result.Code == EmployeeResponseMessages.Codes.EMPLOYEE_NOT_FOUND)
                return NotFound(result);

            return Ok(result);
        }

        /// <summary>
        /// Map initial stage employees to resource pool
        /// </summary>
        [HttpPost("map-to-resource-pool")]
        public async Task<IActionResult> MapToResourcePool([FromBody] MapToResourcePoolRequest request)
        {
            _logger.LogInformation("HR requested mapping {EmployeeCount} employees to resource pool", request.EmployeeMasterIds?.Count ?? 0);
            var result = await _employeeService.MapEmployeesToResourcePoolAsync(request.EmployeeMasterIds ?? new List<int>());

            if (!result.Success && result.Code == EmployeeResponseMessages.Codes.INVALID_REQUEST)
                return BadRequest(result);

            return Ok(result);
        }

        /// <summary>
        /// Get department by ID with details
        /// </summary>
        [HttpGet("departments/{departmentId}")]
        public async Task<IActionResult> GetDepartmentById(int departmentId)
        {
            _logger.LogInformation("HR requested department details for ID: {DepartmentId}", departmentId);
            var result = await _employeeService.GetDepartmentByIdAsync(departmentId);

            if (!result.Success && result.Code == EmployeeResponseMessages.Codes.DEPARTMENT_NOT_FOUND)
                return NotFound(result);

            return Ok(result);
        }
    }
}
