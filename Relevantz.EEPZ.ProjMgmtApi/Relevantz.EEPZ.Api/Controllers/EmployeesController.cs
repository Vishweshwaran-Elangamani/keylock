using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using System.Linq;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace eepzbackend.Controllers
{
    [Route("api/employees")]
    [ApiController]
    public class EmployeesController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;
        private readonly ILogger<EmployeesController> _logger;

        public EmployeesController(IEmployeeService employeeService, ILogger<EmployeesController> logger)
        {
            _employeeService = employeeService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetEmployees(
            [FromQuery] bool isManager = false,
            [FromQuery] int? departmentId = null,
            [FromQuery] int? roleId = null,
            [FromQuery] string? searchTerm = null)
        {
            // Guard: reject very short search terms to improve reliability
            if (!string.IsNullOrWhiteSpace(searchTerm) && searchTerm.Trim().Length < 3)
            {
                _logger.LogInformation("Employees requested with too short searchTerm: {SearchTerm}", searchTerm);
                return BadRequest(new
                {
                    message = "Search term must be at least 3 characters long.",
                    minLength = 3
                });
            }

            _logger.LogInformation(
                "Employees requested -> isManager: {IsManager}, departmentId: {DepartmentId}, roleId: {RoleId}, searchTerm: {SearchTerm}",
                isManager, departmentId, roleId, searchTerm);

            var result = await _employeeService.GetEmployeesAsync(isManager, departmentId, roleId, searchTerm);

            if (!result.Success)
                return StatusCode(result.Code == EmployeeResponseMessages.Codes.EMPLOYEE_SEARCH_QUERY_REQUIRED ? 400 : 404, result);

            return Ok(result);
        }

        [HttpGet("{employeeId:int}")]
        public async Task<IActionResult> GetEmployeeById(int employeeId)
        {
            // Guard: employeeId must be positive
            if (employeeId <= 0)
            {
                _logger.LogInformation("Invalid employeeId received: {EmployeeId}", employeeId);
                return BadRequest(new { message = "EmployeeId must be greater than zero." });
            }

            _logger.LogInformation("Employee details requested -> EmployeeId: {EmployeeId}", employeeId);

            var result = await _employeeService.GetEmployeeByIdAsync(employeeId);

            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpGet("departments")]
        public async Task<IActionResult> GetAllDepartments()
        {
            _logger.LogInformation("Departments requested");

            var result = await _employeeService.GetAllDepartmentsAsync();

            if (!result.Success)
                return NotFound(result);

            // Handle empty list explicitly
            var data = (result as dynamic)?.Data;
            if (data is System.Collections.IEnumerable enumerable && !enumerable.Cast<object>().Any())
                return NoContent();

            return Ok(result);
        }

        [HttpGet("departments/{departmentId:int}")]
        public async Task<IActionResult> GetDepartmentById(int departmentId)
        {
            // Guard: departmentId must be positive
            if (departmentId <= 0)
            {
                _logger.LogInformation("Invalid departmentId received: {DepartmentId}", departmentId);
                return BadRequest(new { message = "DepartmentId must be greater than zero." });
            }

            _logger.LogInformation("Department details requested -> DepartmentId: {DepartmentId}", departmentId);

            var result = await _employeeService.GetDepartmentByIdAsync(departmentId);

            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpGet("business-units")]
        public async Task<IActionResult> GetAllBusinessUnits()
        {
            _logger.LogInformation("Business units requested");

            var result = await _employeeService.GetAllBusinessUnitsAsync();

            if (!result.Success)
                return NotFound(result);

            // Return 204 when no units are found
            var data = (result as dynamic)?.Data;
            if (data is System.Collections.IEnumerable enumerable && !enumerable.Cast<object>().Any())
                return NoContent();

            return Ok(result);
        }

        [HttpGet("initial-stage")]
        public async Task<IActionResult> GetInitialStageEmployees()
        {
            _logger.LogInformation("Initial stage employees requested");

            var result = await _employeeService.GetInitialStageEmployeesAsync();

            if (!result.Success)
                return NotFound(result);

            // Check for empty results with a clear message
            var data = (result as dynamic)?.Data;
            if (data is System.Collections.IEnumerable enumerable && !enumerable.Cast<object>().Any())
                return NotFound(new { message = "No initial-stage employees found." });

            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPost("map-to-resource-pool")]
        public async Task<IActionResult> MapToResourcePool([FromBody] MapToResourcePoolRequest request)
        {
            // Guard: null/empty body check before processing
            if (request == null || request.EmployeeMasterIds == null || request.EmployeeMasterIds.Count == 0)
            {
                _logger.LogInformation("Resource pool mapping requested with empty/null body.");
                return BadRequest(new { message = "EmployeeMasterIds must contain at least one id." });
            }

            _logger.LogInformation("Resource pool mapping requested -> Count: {Count}", request.EmployeeMasterIds.Count);

            var result = await _employeeService.MapEmployeesToResourcePoolAsync(request.EmployeeMasterIds);

            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}