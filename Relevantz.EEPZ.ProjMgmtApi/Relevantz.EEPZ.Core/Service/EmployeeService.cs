using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;

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

        public async Task<EmployeeApiResponse<List<EmployeeBasicInfo>>> GetEmployeesAsync(
            bool isManager = false,
            int? departmentId = null,
            int? roleId = null,
            string? searchTerm = null)
        {
            if (!string.IsNullOrWhiteSpace(searchTerm) && searchTerm.Trim().Length < 2)
            {
                var code = EmployeeResponseMessages.Codes.EMPLOYEE_SEARCH_QUERY_REQUIRED;
                return EmployeeApiResponse<List<EmployeeBasicInfo>>.ErrorResponse(
                    code,
                    EmployeeResponseMessages.GetMessage(code));
            }

            _logger.LogInformation(
                "Fetching employees -> isManager: {IsManager}, departmentId: {DepartmentId}, roleId: {RoleId}, searchTerm: {SearchTerm}",
                isManager, departmentId, roleId, searchTerm);

            List<EmployeeBasicInfo> employees = isManager
                ? await _employeeRepository.GetEmployeesByRoleNamesAsync(AppConstants.RoleNames.ManagerRoles)
                : await _employeeRepository.GetEmployeesAsync(departmentId, roleId, searchTerm);

            if (employees == null || employees.Count == 0)
            {
                var code = EmployeeResponseMessages.Codes.EMPLOYEE_NOT_FOUND;
                return EmployeeApiResponse<List<EmployeeBasicInfo>>.ErrorResponse(
                    code,
                    EmployeeResponseMessages.GetMessage(code));
            }

            var successCode = EmployeeResponseMessages.Codes.EMPLOYEES_RETRIEVED_SUCCESS;
            return EmployeeApiResponse<List<EmployeeBasicInfo>>.SuccessResponse(
                employees,
                successCode,
                EmployeeResponseMessages.GetMessage(successCode));
        }

        public async Task<EmployeeApiResponse<EmployeeBasicInfo>> GetEmployeeByIdAsync(int employeeMasterId)
        {
            _logger.LogInformation("Fetching employee by id: {EmployeeMasterId}", employeeMasterId);

            var employee = await _employeeRepository.GetEmployeeByIdAsync(employeeMasterId);

            if (employee == null)
            {
                var code = EmployeeResponseMessages.Codes.EMPLOYEE_NOT_FOUND;
                return EmployeeApiResponse<EmployeeBasicInfo>.ErrorResponse(
                    code,
                    EmployeeResponseMessages.GetMessage(code));
            }

            var successCode = EmployeeResponseMessages.Codes.EMPLOYEE_RETRIEVED_SUCCESS;
            return EmployeeApiResponse<EmployeeBasicInfo>.SuccessResponse(
                employee,
                successCode,
                EmployeeResponseMessages.GetMessage(successCode));
        }

        public async Task<EmployeeApiResponse<List<DepartmentDto>>> GetAllDepartmentsAsync()
        {
            _logger.LogInformation("Fetching all departments");

            var departments = await _employeeRepository.GetAllDepartmentsAsync();

            if (departments == null || departments.Count == 0)
            {
                var code = EmployeeResponseMessages.Codes.DEPARTMENT_NOT_FOUND;
                return EmployeeApiResponse<List<DepartmentDto>>.ErrorResponse(
                    code,
                    EmployeeResponseMessages.GetMessage(code));
            }

            var successCode = EmployeeResponseMessages.Codes.DEPARTMENTS_RETRIEVED_SUCCESS;
            return EmployeeApiResponse<List<DepartmentDto>>.SuccessResponse(
                departments,
                successCode,
                EmployeeResponseMessages.GetMessage(successCode));
        }

        public async Task<EmployeeApiResponse<DepartmentDetailDto>> GetDepartmentByIdAsync(int departmentId)
        {
            _logger.LogInformation("Fetching department by id: {DepartmentId}", departmentId);

            var department = await _employeeRepository.GetDepartmentByIdAsync(departmentId);

            if (department == null)
            {
                var code = EmployeeResponseMessages.Codes.DEPARTMENT_NOT_FOUND;
                return EmployeeApiResponse<DepartmentDetailDto>.ErrorResponse(
                    code,
                    EmployeeResponseMessages.GetMessage(code));
            }

            var successCode = EmployeeResponseMessages.Codes.DEPARTMENTS_RETRIEVED_SUCCESS;
            return EmployeeApiResponse<DepartmentDetailDto>.SuccessResponse(
                department,
                successCode,
                EmployeeResponseMessages.GetMessage(successCode));
        }

        public async Task<EmployeeApiResponse<List<string>>> GetAllBusinessUnitsAsync()
        {
            _logger.LogInformation("Fetching business units");

            var businessUnits = await _employeeRepository.GetAllBusinessUnitsAsync();

            if (businessUnits == null || businessUnits.Count == 0)
            {
                var code = EmployeeResponseMessages.Codes.INVALID_REQUEST;
                return EmployeeApiResponse<List<string>>.ErrorResponse(
                    code,
                    EmployeeResponseMessages.GetMessage(code));
            }

            var successCode = EmployeeResponseMessages.Codes.BUSINESS_UNITS_RETRIEVED_SUCCESS;
            return EmployeeApiResponse<List<string>>.SuccessResponse(
                businessUnits,
                successCode,
                EmployeeResponseMessages.GetMessage(successCode));
        }

        public async Task<EmployeeApiResponse<List<EmployeeBasicInfo>>> GetInitialStageEmployeesAsync()
        {
            _logger.LogInformation("Fetching initial stage employees");

            var employees = await _employeeRepository.GetInitialStageEmployeesAsync();

            if (employees == null || employees.Count == 0)
            {
                var code = EmployeeResponseMessages.Codes.EMPLOYEE_NOT_FOUND;
                return EmployeeApiResponse<List<EmployeeBasicInfo>>.ErrorResponse(
                    code,
                    EmployeeResponseMessages.GetMessage(code));
            }

            var successCode = EmployeeResponseMessages.Codes.EMPLOYEES_RETRIEVED_SUCCESS;
            return EmployeeApiResponse<List<EmployeeBasicInfo>>.SuccessResponse(
                employees,
                successCode,
                EmployeeResponseMessages.GetMessage(successCode));
        }

        public async Task<EmployeeApiResponse<object>> MapEmployeesToResourcePoolAsync(List<int> employeeMasterIds)
        {
            if (employeeMasterIds == null || employeeMasterIds.Count == 0)
            {
                var code = EmployeeResponseMessages.Codes.INVALID_REQUEST;
                return EmployeeApiResponse<object>.ErrorResponse(
                    code,
                    EmployeeResponseMessages.GetMessage(code));
            }

            _logger.LogInformation(
                "Mapping employees to resource pool -> Count: {Count}",
                employeeMasterIds.Count);

            var (mappedCount, errors) = await _employeeRepository.MapEmployeesToResourcePoolAsync(employeeMasterIds);

            var responseData = new
            {
                mappedCount,
                totalRequested = employeeMasterIds.Count,
                errors
            };

            var successCode = EmployeeResponseMessages.Codes.RESOURCE_POOL_MAPPING_SUCCESS;
            return EmployeeApiResponse<object>.SuccessResponse(
                responseData,
                successCode,
                EmployeeResponseMessages.GetMessage(successCode));
        }
    }
}
