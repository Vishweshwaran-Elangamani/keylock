using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Serilog;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class EmployeeService : IEmployeeService
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly ILogger<EmployeeService> _logger;

        public EmployeeService(IEmployeeRepository employeeRepository, ILogger<EmployeeService> logger)
        {
            _employeeRepository = employeeRepository;
            _logger = logger;
        }

        public async Task<ApiResponse<List<EmployeeDto>>> GetAllEmployeesAsync()
        {
            try
            {
                _logger.LogInformation("Fetching all active employees");
                var employees = await _employeeRepository.GetAllEmployeesAsync();
                _logger.LogInformation("Successfully retrieved {EmployeeCount} active employees", employees.Count);
                return ApiResponse<List<EmployeeDto>>.SuccessResponse(employees, "Employees retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve all employees");
                Log.Error(ex, "EmployeeService: Failed to retrieve all employees");
                return ApiResponse<List<EmployeeDto>>.ErrorResponse("Failed to retrieve employees");
            }
        }

        public async Task<ApiResponse<List<EmployeeDto>>> GetManagersAsync()
        {
            try
            {
                _logger.LogInformation("Fetching manager employees for approver dropdowns");
                var managers = await _employeeRepository.GetManagersAsync();
                _logger.LogInformation("Successfully retrieved {ManagerCount} managers", managers.Count);
                return ApiResponse<List<EmployeeDto>>.SuccessResponse(managers, "Managers retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve managers");
                Log.Error(ex, "EmployeeService: Failed to retrieve managers");
                return ApiResponse<List<EmployeeDto>>.ErrorResponse("Failed to retrieve managers");
            }
        }

        public async Task<ApiResponse<EmployeeDto>> GetEmployeeByIdAsync(int employeeMasterId)
        {
            try
            {
                _logger.LogInformation("Fetching employee by ID: {EmployeeMasterId}", employeeMasterId);
                var employee = await _employeeRepository.GetEmployeeByIdAsync(employeeMasterId);
                
                if (employee == null)
                {
                    _logger.LogWarning("Employee not found with ID: {EmployeeMasterId}", employeeMasterId);
                    return ApiResponse<EmployeeDto>.ErrorResponse("Employee not found");
                }

                _logger.LogInformation("Successfully retrieved employee: {EmployeeCompanyId}", employee.EmployeeCompanyId);
                return ApiResponse<EmployeeDto>.SuccessResponse(employee, "Employee retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve employee {EmployeeMasterId}", employeeMasterId);
                Log.Error(ex, "EmployeeService: Failed to retrieve employee {EmployeeMasterId}", employeeMasterId);
                return ApiResponse<EmployeeDto>.ErrorResponse("Failed to retrieve employee");
            }
        }

        public async Task<ApiResponse<List<EmployeeDto>>> SearchEmployeesAsync(string query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query))
                {
                    _logger.LogWarning("Empty search query provided");
                    return ApiResponse<List<EmployeeDto>>.ErrorResponse("Search query is required");
                }

                _logger.LogInformation("Searching employees with query: {SearchQuery}", query);
                var employees = await _employeeRepository.SearchEmployeesAsync(query);
                _logger.LogInformation("Search returned {EmployeeCount} results for query: {SearchQuery}", employees.Count, query);
                return ApiResponse<List<EmployeeDto>>.SuccessResponse(employees, $"Employees search completed ({employees.Count} results)");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to search employees with query: {SearchQuery}", query);
                Log.Error(ex, "EmployeeService: Failed to search employees with query: {SearchQuery}", query);
                return ApiResponse<List<EmployeeDto>>.ErrorResponse("Failed to search employees");
            }
        }

        public async Task<ApiResponse<List<EmployeeDto>>> GetEmployeesByDepartmentAsync(int departmentId)
        {
            try
            {
                _logger.LogInformation("Fetching employees for department ID: {DepartmentId}", departmentId);
                var employees = await _employeeRepository.GetEmployeesByDepartmentAsync(departmentId);
                _logger.LogInformation("Retrieved {EmployeeCount} employees for department {DepartmentId}", employees.Count, departmentId);
                return ApiResponse<List<EmployeeDto>>.SuccessResponse(employees, $"Department employees retrieved successfully ({employees.Count} results)");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve employees for department {DepartmentId}", departmentId);
                Log.Error(ex, "EmployeeService: Failed to retrieve employees for department {DepartmentId}", departmentId);
                return ApiResponse<List<EmployeeDto>>.ErrorResponse("Failed to retrieve department employees");
            }
        }

        public async Task<ApiResponse<List<EmployeeDto>>> GetEmployeesByRoleAsync(int roleId)
        {
            try
            {
                _logger.LogInformation("Fetching employees for role ID: {RoleId}", roleId);
                var employees = await _employeeRepository.GetEmployeesByRoleAsync(roleId);
                _logger.LogInformation("Retrieved {EmployeeCount} employees for role {RoleId}", employees.Count, roleId);
                return ApiResponse<List<EmployeeDto>>.SuccessResponse(employees, $"Role employees retrieved successfully ({employees.Count} results)");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve employees for role {RoleId}", roleId);
                Log.Error(ex, "EmployeeService: Failed to retrieve employees for role {RoleId}", roleId);
                return ApiResponse<List<EmployeeDto>>.ErrorResponse("Failed to retrieve role employees");
            }
        }

        public async Task<ApiResponse<List<DepartmentDto>>> GetAllDepartmentsAsync()
        {
            try
            {
                _logger.LogInformation("Fetching all departments");
                var departments = await _employeeRepository.GetAllDepartmentsAsync();
                _logger.LogInformation("Successfully retrieved {DepartmentCount} departments", departments.Count);
                return ApiResponse<List<DepartmentDto>>.SuccessResponse(departments, "Departments retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve departments");
                Log.Error(ex, "EmployeeService: Failed to retrieve departments");
                return ApiResponse<List<DepartmentDto>>.ErrorResponse("Failed to retrieve departments");
            }
        }

        public async Task<ApiResponse<List<string>>> GetAllBusinessUnitsAsync()
        {
            try
            {
                _logger.LogInformation("Fetching all business units");
                var businessUnits = await _employeeRepository.GetAllBusinessUnitsAsync();
                _logger.LogInformation("Successfully retrieved {BusinessUnitCount} business units", businessUnits.Count);
                return ApiResponse<List<string>>.SuccessResponse(businessUnits, "Business units retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve business units");
                Log.Error(ex, "EmployeeService: Failed to retrieve business units");
                return ApiResponse<List<string>>.ErrorResponse("Failed to retrieve business units");
            }
        }

        public async Task<ApiResponse<List<EmployeeDto>>> GetInitialStageEmployeesAsync()
        {
            try
            {
                _logger.LogInformation("Fetching initial stage employees (no reporting manager, not in resource pool)");
                var employees = await _employeeRepository.GetInitialStageEmployeesAsync();
                _logger.LogInformation("Retrieved {EmployeeCount} initial stage employees", employees.Count);
                return ApiResponse<List<EmployeeDto>>.SuccessResponse(employees, $"Initial stage employees retrieved successfully ({employees.Count} results)");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve initial stage employees");
                Log.Error(ex, "EmployeeService: Failed to retrieve initial stage employees");
                return ApiResponse<List<EmployeeDto>>.ErrorResponse("Failed to retrieve initial stage employees");
            }
        }

        public async Task<ApiResponse<object>> MapEmployeesToResourcePoolAsync(List<int> employeeMasterIds)
        {
            try
            {
                if (employeeMasterIds == null || !employeeMasterIds.Any())
                {
                    _logger.LogWarning("No employees provided to map to resource pool");
                    return ApiResponse<object>.ErrorResponse("No employees provided to map");
                }

                _logger.LogInformation("Mapping {EmployeeCount} employees to resource pool", employeeMasterIds.Count);
                var (mappedCount, errors) = await _employeeRepository.MapEmployeesToResourcePoolAsync(employeeMasterIds);
                
                _logger.LogInformation("Successfully mapped {MappedCount} employees to resource pool. Errors: {ErrorCount}", mappedCount, errors.Count);
                
                var responseData = new
                {
                    mappedCount,
                    totalRequested = employeeMasterIds.Count,
                    errors
                };

                return ApiResponse<object>.SuccessResponse(responseData, $"Successfully mapped {mappedCount} employees to resource pool");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to map {EmployeeCount} employees to resource pool", employeeMasterIds?.Count ?? 0);
                Log.Error(ex, "EmployeeService: Failed to map employees to resource pool");
                return ApiResponse<object>.ErrorResponse("Failed to map employees to resource pool");
            }
        }

        public async Task<ApiResponse<DepartmentDetailDto>> GetDepartmentByIdAsync(int departmentId)
        {
            try
            {
                _logger.LogInformation("Fetching department by ID: {DepartmentId}", departmentId);
                var department = await _employeeRepository.GetDepartmentByIdAsync(departmentId);
                
                if (department == null)
                {
                    _logger.LogWarning("Department not found with ID: {DepartmentId}", departmentId);
                    return ApiResponse<DepartmentDetailDto>.ErrorResponse("Department not found");
                }

                _logger.LogInformation("Successfully retrieved department: {DepartmentName}", department.DepartmentName);
                return ApiResponse<DepartmentDetailDto>.SuccessResponse(department, "Department retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve department {DepartmentId}", departmentId);
                Log.Error(ex, "EmployeeService: Failed to retrieve department {DepartmentId}", departmentId);
                return ApiResponse<DepartmentDetailDto>.ErrorResponse("Failed to retrieve department");
            }
        }
    }
}
