using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Common.Constants;

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

        public async Task<EmployeeApiResponse<List<EmployeeDto>>> GetAllEmployeesAsync()
        {
            _logger.LogInformation("Fetching all active employees");

            var employees = await _employeeRepository.GetAllEmployeesAsync();

            if (employees == null || !employees.Any())
            {
                var code = EmployeeResponseMessages.Codes.EMPLOYEE_NOT_FOUND;
                var msg = EmployeeResponseMessages.GetMessage(code).Message;
                return EmployeeApiResponse<List<EmployeeDto>>.ErrorResponse(code, msg);
            }

            var successCode = EmployeeResponseMessages.Codes.EMPLOYEES_RETRIEVED_SUCCESS;
            var successMsg = EmployeeResponseMessages.GetMessage(successCode).Message;
            return EmployeeApiResponse<List<EmployeeDto>>.SuccessResponse(employees, successCode, successMsg);
        }

        public async Task<EmployeeApiResponse<List<EmployeeDto>>> GetManagersAsync()
        {
            _logger.LogInformation("Fetching manager employees for approver dropdowns");

            var managers = await _employeeRepository.GetManagersAsync();

            if (managers == null || !managers.Any())
            {
                var code = EmployeeResponseMessages.Codes.EMPLOYEE_NOT_FOUND;
                var msg = EmployeeResponseMessages.GetMessage(code).Message;
                return EmployeeApiResponse<List<EmployeeDto>>.ErrorResponse(code, msg);
            }

            var successCode = EmployeeResponseMessages.Codes.MANAGERS_RETRIEVED_SUCCESS;
            var successMsg = EmployeeResponseMessages.GetMessage(successCode).Message;
            return EmployeeApiResponse<List<EmployeeDto>>.SuccessResponse(managers, successCode, successMsg);
        }

        public async Task<EmployeeApiResponse<EmployeeDto>> GetEmployeeByIdAsync(int employeeMasterId)
        {
            _logger.LogInformation("Fetching employee by ID: {EmployeeMasterId}", employeeMasterId);

            var employee = await _employeeRepository.GetEmployeeByIdAsync(employeeMasterId);

            if (employee == null)
            {
                var code = EmployeeResponseMessages.Codes.EMPLOYEE_NOT_FOUND;
                var msg = EmployeeResponseMessages.GetMessage(code).Message;
                return EmployeeApiResponse<EmployeeDto>.ErrorResponse(code, msg);
            }

            var successCode = EmployeeResponseMessages.Codes.EMPLOYEE_RETRIEVED_SUCCESS;
            var successMsg = EmployeeResponseMessages.GetMessage(successCode).Message;
            return EmployeeApiResponse<EmployeeDto>.SuccessResponse(employee, successCode, successMsg);
        }

        public async Task<EmployeeApiResponse<List<EmployeeDto>>> SearchEmployeesAsync(string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
            {
                var code = EmployeeResponseMessages.Codes.EMPLOYEE_SEARCH_QUERY_REQUIRED;
                var msg = EmployeeResponseMessages.GetMessage(code).Message;
                return EmployeeApiResponse<List<EmployeeDto>>.ErrorResponse(code, msg);
            }

            _logger.LogInformation("Searching employees with query: {SearchQuery}", searchTerm);

            var employees = await _employeeRepository.SearchEmployeesAsync(searchTerm);

            if (employees == null || !employees.Any())
            {
                var code = EmployeeResponseMessages.Codes.EMPLOYEE_NOT_FOUND;
                var msg = EmployeeResponseMessages.GetMessage(code).Message;
                return EmployeeApiResponse<List<EmployeeDto>>.ErrorResponse(code, msg);
            }

            var successCode = EmployeeResponseMessages.Codes.EMPLOYEES_RETRIEVED_SUCCESS;
            var successMsg = EmployeeResponseMessages.GetMessage(successCode).Message;
            return EmployeeApiResponse<List<EmployeeDto>>.SuccessResponse(employees, successCode, successMsg);
        }

        public async Task<EmployeeApiResponse<List<EmployeeDto>>> GetEmployeesByDepartmentAsync(int departmentId)
        {
            _logger.LogInformation("Fetching employees for department ID: {DepartmentId}", departmentId);

            var employees = await _employeeRepository.GetEmployeesByDepartmentAsync(departmentId);

            if (employees == null || !employees.Any())
            {
                var code = EmployeeResponseMessages.Codes.DEPARTMENT_NOT_FOUND;
                var msg = EmployeeResponseMessages.GetMessage(code).Message;
                return EmployeeApiResponse<List<EmployeeDto>>.ErrorResponse(code, msg);
            }

            var successCode = EmployeeResponseMessages.Codes.DEPARTMENTS_RETRIEVED_SUCCESS;
            var successMsg = EmployeeResponseMessages.GetMessage(successCode).Message;
            return EmployeeApiResponse<List<EmployeeDto>>.SuccessResponse(employees, successCode, successMsg);
        }

        public async Task<EmployeeApiResponse<List<EmployeeDto>>> GetEmployeesByRoleAsync(int roleId)
        {
            _logger.LogInformation("Fetching employees for role ID: {RoleId}", roleId);

            var employees = await _employeeRepository.GetEmployeesByRoleAsync(roleId);

            if (employees == null || !employees.Any())
            {
                var code = EmployeeResponseMessages.Codes.EMPLOYEE_NOT_FOUND;
                var msg = EmployeeResponseMessages.GetMessage(code).Message;
                return EmployeeApiResponse<List<EmployeeDto>>.ErrorResponse(code, msg);
            }

            var successCode = EmployeeResponseMessages.Codes.EMPLOYEES_RETRIEVED_SUCCESS;
            var successMsg = EmployeeResponseMessages.GetMessage(successCode).Message;
            return EmployeeApiResponse<List<EmployeeDto>>.SuccessResponse(employees, successCode, successMsg);
        }

        public async Task<EmployeeApiResponse<List<DepartmentDto>>> GetAllDepartmentsAsync()
        {
            _logger.LogInformation("Fetching all departments");

            var departments = await _employeeRepository.GetAllDepartmentsAsync();

            if (departments == null || !departments.Any())
            {
                var code = EmployeeResponseMessages.Codes.DEPARTMENT_NOT_FOUND;
                var msg = EmployeeResponseMessages.GetMessage(code).Message;
                return EmployeeApiResponse<List<DepartmentDto>>.ErrorResponse(code, msg);
            }

            var successCode = EmployeeResponseMessages.Codes.DEPARTMENTS_RETRIEVED_SUCCESS;
            var successMsg = EmployeeResponseMessages.GetMessage(successCode).Message;
            return EmployeeApiResponse<List<DepartmentDto>>.SuccessResponse(departments, successCode, successMsg);
        }

        public async Task<EmployeeApiResponse<List<string>>> GetAllBusinessUnitsAsync()
        {
            _logger.LogInformation("Fetching all business units");

            var businessUnits = await _employeeRepository.GetAllBusinessUnitsAsync();

            if (businessUnits == null || !businessUnits.Any())
            {
                var code = EmployeeResponseMessages.Codes.INVALID_REQUEST;
                var msg = EmployeeResponseMessages.GetMessage(code).Message;
                return EmployeeApiResponse<List<string>>.ErrorResponse(code, msg);
            }

            var successCode = EmployeeResponseMessages.Codes.BUSINESS_UNITS_RETRIEVED_SUCCESS;
            var successMsg = EmployeeResponseMessages.GetMessage(successCode).Message;
            return EmployeeApiResponse<List<string>>.SuccessResponse(businessUnits, successCode, successMsg);
        }

        public async Task<EmployeeApiResponse<List<EmployeeDto>>> GetInitialStageEmployeesAsync()
        {
            _logger.LogInformation("Fetching initial stage employees (no reporting manager, not in resource pool)");

            var employees = await _employeeRepository.GetInitialStageEmployeesAsync();

            if (employees == null || !employees.Any())
            {
                var code = EmployeeResponseMessages.Codes.EMPLOYEE_NOT_FOUND;
                var msg = EmployeeResponseMessages.GetMessage(code).Message;
                return EmployeeApiResponse<List<EmployeeDto>>.ErrorResponse(code, msg);
            }

            var successCode = EmployeeResponseMessages.Codes.EMPLOYEES_RETRIEVED_SUCCESS;
            var successMsg = EmployeeResponseMessages.GetMessage(successCode).Message;
            return EmployeeApiResponse<List<EmployeeDto>>.SuccessResponse(employees, successCode, successMsg);
        }

        public async Task<EmployeeApiResponse<object>> MapEmployeesToResourcePoolAsync(List<int> employeeMasterIds)
        {
            if (employeeMasterIds == null || !employeeMasterIds.Any())
            {
                var code = EmployeeResponseMessages.Codes.INVALID_REQUEST;
                var msg = EmployeeResponseMessages.GetMessage(code).Message;
                return EmployeeApiResponse<object>.ErrorResponse(code, msg);
            }

            _logger.LogInformation("Mapping {EmployeeCount} employees to resource pool", employeeMasterIds.Count);

            var (mappedCount, errors) = await _employeeRepository.MapEmployeesToResourcePoolAsync(employeeMasterIds);

            var responseData = new
            {
                mappedCount,
                totalRequested = employeeMasterIds.Count,
                errors
            };

            var successCode = EmployeeResponseMessages.Codes.RESOURCE_POOL_MAPPING_SUCCESS;
            var successMsg = EmployeeResponseMessages.GetMessage(successCode).Message;
            return EmployeeApiResponse<object>.SuccessResponse(responseData, successCode, successMsg);
        }

        public async Task<EmployeeApiResponse<DepartmentDetailDto>> GetDepartmentByIdAsync(int departmentId)
        {
            _logger.LogInformation("Fetching department by ID: {DepartmentId}", departmentId);

            var department = await _employeeRepository.GetDepartmentByIdAsync(departmentId);

            if (department == null)
            {
                var code = EmployeeResponseMessages.Codes.DEPARTMENT_NOT_FOUND;
                var msg = EmployeeResponseMessages.GetMessage(code).Message;
                return EmployeeApiResponse<DepartmentDetailDto>.ErrorResponse(code, msg);
            }

            var successCode = EmployeeResponseMessages.Codes.DEPARTMENTS_RETRIEVED_SUCCESS;
            var successMsg = EmployeeResponseMessages.GetMessage(successCode).Message;
            return EmployeeApiResponse<DepartmentDetailDto>.SuccessResponse(department, successCode, successMsg);
        }
    }
}
