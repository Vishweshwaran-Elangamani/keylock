using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.Services.Interfaces;

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
            _logger.LogInformation(
                "Employees requested -> isManager: {IsManager}, departmentId: {DepartmentId}, roleId: {RoleId}, searchTerm: {SearchTerm}",
                isManager, departmentId, roleId, searchTerm);

            var result = await _employeeService.GetEmployeesAsync(isManager, departmentId, roleId, searchTerm);

            if (!result.Success)
            {
                if (result.Code == EmployeeResponseMessages.Codes.EMPLOYEE_SEARCH_QUERY_REQUIRED)
                    return BadRequest(result);

                if (result.Code == EmployeeResponseMessages.Codes.EMPLOYEE_NOT_FOUND ||
                    result.Code == EmployeeResponseMessages.Codes.DEPARTMENT_NOT_FOUND)
                    return NotFound(result);
            }

            return Ok(result);
        }

        [HttpGet("{employeeId:int}")]
        public async Task<IActionResult> GetEmployeeById(int employeeId)
        {
            _logger.LogInformation("Employee details requested -> EmployeeId: {EmployeeId}", employeeId);

            var result = await _employeeService.GetEmployeeByIdAsync(employeeId);

            if (!result.Success && result.Code == EmployeeResponseMessages.Codes.EMPLOYEE_NOT_FOUND)
                return NotFound(result);

            return Ok(result);
        }

        [HttpGet("departments")]
        public async Task<IActionResult> GetAllDepartments()
        {
            _logger.LogInformation("Departments requested");

            var result = await _employeeService.GetAllDepartmentsAsync();

            if (!result.Success && result.Code == EmployeeResponseMessages.Codes.DEPARTMENT_NOT_FOUND)
                return NotFound(result);

            return Ok(result);
        }

        [HttpGet("departments/{departmentId:int}")]
        public async Task<IActionResult> GetDepartmentById(int departmentId)
        {
            _logger.LogInformation("Department details requested -> DepartmentId: {DepartmentId}", departmentId);

            var result = await _employeeService.GetDepartmentByIdAsync(departmentId);

            if (!result.Success && result.Code == EmployeeResponseMessages.Codes.DEPARTMENT_NOT_FOUND)
                return NotFound(result);

            return Ok(result);
        }

        [HttpGet("business-units")]
        public async Task<IActionResult> GetAllBusinessUnits()
        {
            _logger.LogInformation("Business units requested");

            var result = await _employeeService.GetAllBusinessUnitsAsync();

            if (!result.Success && result.Code == EmployeeResponseMessages.Codes.INVALID_REQUEST)
                return NotFound(result);

            return Ok(result);
        }

        [HttpGet("initial-stage")]
        public async Task<IActionResult> GetInitialStageEmployees()
        {
            _logger.LogInformation("Initial stage employees requested");

            var result = await _employeeService.GetInitialStageEmployeesAsync();

            if (!result.Success && result.Code == EmployeeResponseMessages.Codes.EMPLOYEE_NOT_FOUND)
                return NotFound(result);

            return Ok(result);
        }

        [HttpPost("map-to-resource-pool")]
        public async Task<IActionResult> MapToResourcePool([FromBody] MapToResourcePoolRequest request)
        {
            _logger.LogInformation(
                "Resource pool mapping requested -> Count: {Count}",
                request?.EmployeeMasterIds?.Count ?? 0);

            var result = await _employeeService.MapEmployeesToResourcePoolAsync(request?.EmployeeMasterIds ?? new List<int>());

            if (!result.Success && result.Code == EmployeeResponseMessages.Codes.INVALID_REQUEST)
                return BadRequest(result);

            return Ok(result);
        }
    }
}
