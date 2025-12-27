using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class EmployeeService : IEmployeeService
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly ILogger<EmployeeService> _logger;

        public EmployeeService(
            IEmployeeRepository employeeRepository,
            ILogger<EmployeeService> logger)
        {
            _employeeRepository = employeeRepository;
            _logger = logger;
        }

        public async Task<ApiResponse<List<EmployeeDto>>> GetAllEmployeesAsync()
        {
            _logger.LogInformation("Fetching all active employees");

            var employees = await _employeeRepository.GetAllEmployeesAsync();

            _logger.LogInformation(
                "Successfully retrieved {EmployeeCount} active employees",
                employees.Count);

            return ApiResponse<List<EmployeeDto>>.SuccessResponse(
                employees,
                "Employees retrieved successfully");
        }

        public async Task<ApiResponse<List<EmployeeDto>>> GetManagersAsync()
        {
            _logger.LogInformation("Fetching manager employees for approver dropdowns");

            var managers = await _employeeRepository.GetManagersAsync();

            _logger.LogInformation(
                "Successfully retrieved {ManagerCount} managers",
                managers.Count);

            return ApiResponse<List<EmployeeDto>>.SuccessResponse(
                managers,
                "Managers retrieved successfully");
        }

        public async Task<ApiResponse<EmployeeDto>> GetEmployeeByIdAsync(int employeeMasterId)
        {
            _logger.LogInformation(
                "Fetching employee by ID: {EmployeeMasterId}",
                employeeMasterId);

            var employee = await _employeeRepository.GetEmployeeByIdAsync(employeeMasterId);

            if (employee == null)
            {
                _logger.LogWarning(
                    "Employee not found with ID: {EmployeeMasterId}",
                    employeeMasterId);

                return ApiResponse<EmployeeDto>.ErrorResponse("Employee not found");
            }

            _logger.LogInformation(
                "Successfully retrieved employee: {EmployeeCompanyId}",
                employee.EmployeeCompanyId);

            return ApiResponse<EmployeeDto>.SuccessResponse(
                employee,
                "Employee retrieved successfully");
        }

        public async Task<ApiResponse<List<EmployeeDto>>> SearchEmployeesAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                _logger.LogWarning("Empty search query provided");
                return ApiResponse<List<EmployeeDto>>.ErrorResponse("Search query is required");
            }

            _logger.LogInformation(
                "Searching employees with query: {SearchQuery}",
                query);

            var employees = await _employeeRepository.SearchEmployeesAsync(query);

            _logger.LogInformation(
                "Search returned {EmployeeCount} results for query: {SearchQuery}",
                employees.Count,
                query);

            return ApiResponse<List<EmployeeDto>>.SuccessResponse(
                employees,
                $"Employees search completed ({employees.Count} results)");
        }

        public async Task<ApiResponse<List<EmployeeDto>>> GetEmployeesByDepartmentAsync(int departmentId)
        {
            _logger.LogInformation(
                "Fetching employees for department ID: {DepartmentId}",
                departmentId);

            var employees = await _employeeRepository.GetEmployeesByDepartmentAsync(departmentId);

            _logger.LogInformation(
                "Retrieved {EmployeeCount} employees for department {DepartmentId}",
                employees.Count,
                departmentId);

            return ApiResponse<List<EmployeeDto>>.SuccessResponse(
                employees,
                $"Department employees retrieved successfully ({employees.Count} results)");
        }

        public async Task<ApiResponse<List<EmployeeDto>>> GetEmployeesByRoleAsync(int roleId)
        {
            _logger.LogInformation(
                "Fetching employees for role ID: {RoleId}",
                roleId);

            var employees = await _employeeRepository.GetEmployeesByRoleAsync(roleId);

            _logger.LogInformation(
                "Retrieved {EmployeeCount} employees for role {RoleId}",
                employees.Count,
                roleId);

            return ApiResponse<List<EmployeeDto>>.SuccessResponse(
                employees,
                $"Role employees retrieved successfully ({employees.Count} results)");
        }

        public async Task<ApiResponse<List<DepartmentDto>>> GetAllDepartmentsAsync()
        {
            _logger.LogInformation("Fetching all departments");

            var departments = await _employeeRepository.GetAllDepartmentsAsync();

            _logger.LogInformation(
                "Successfully retrieved {DepartmentCount} departments",
                departments.Count);

            return ApiResponse<List<DepartmentDto>>.SuccessResponse(
                departments,
                "Departments retrieved successfully");
        }

        public async Task<ApiResponse<List<string>>> GetAllBusinessUnitsAsync()
        {
            _logger.LogInformation("Fetching all business units");

            var businessUnits = await _employeeRepository.GetAllBusinessUnitsAsync();

            _logger.LogInformation(
                "Successfully retrieved {BusinessUnitCount} business units",
                businessUnits.Count);

            return ApiResponse<List<string>>.SuccessResponse(
                businessUnits,
                "Business units retrieved successfully");
        }

        public async Task<ApiResponse<List<EmployeeDto>>> GetInitialStageEmployeesAsync()
        {
            _logger.LogInformation(
                "Fetching initial stage employees (no reporting manager, not in resource pool)");

            var employees = await _employeeRepository.GetInitialStageEmployeesAsync();

            _logger.LogInformation(
                "Retrieved {EmployeeCount} initial stage employees",
                employees.Count);

            return ApiResponse<List<EmployeeDto>>.SuccessResponse(
                employees,
                $"Initial stage employees retrieved successfully ({employees.Count} results)");
        }

        public async Task<ApiResponse<object>> MapEmployeesToResourcePoolAsync(List<int> employeeMasterIds)
        {
            if (employeeMasterIds == null || !employeeMasterIds.Any())
            {
                _logger.LogWarning("No employees provided to map to resource pool");
                return ApiResponse<object>.ErrorResponse("No employees provided to map");
            }

            _logger.LogInformation(
                "Mapping {EmployeeCount} employees to resource pool",
                employeeMasterIds.Count);

            var (mappedCount, errors) =
                await _employeeRepository.MapEmployeesToResourcePoolAsync(employeeMasterIds);

            _logger.LogInformation(
                "Successfully mapped {MappedCount} employees to resource pool. Errors: {ErrorCount}",
                mappedCount,
                errors.Count);

            var responseData = new
            {
                mappedCount,
                totalRequested = employeeMasterIds.Count,
                errors
            };

            return ApiResponse<object>.SuccessResponse(
                responseData,
                $"Successfully mapped {mappedCount} employees to resource pool");
        }

        public async Task<ApiResponse<DepartmentDetailDto>> GetDepartmentByIdAsync(int departmentId)
        {
            _logger.LogInformation(
                "Fetching department by ID: {DepartmentId}",
                departmentId);

            var department = await _employeeRepository.GetDepartmentByIdAsync(departmentId);

            if (department == null)
            {
                _logger.LogWarning(
                    "Department not found with ID: {DepartmentId}",
                    departmentId);

                return ApiResponse<DepartmentDetailDto>.ErrorResponse("Department not found");
            }

            _logger.LogInformation(
                "Successfully retrieved department: {DepartmentName}",
                department.DepartmentName);

            return ApiResponse<DepartmentDetailDto>.SuccessResponse(
                department,
                "Department retrieved successfully");
        }
    }
}
