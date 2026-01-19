using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IEmployeeService
    {
        Task<EmployeeApiResponse<List<EmployeeBasicInfo>>> GetEmployeesAsync(
            bool isManager = false,
            int? departmentId = null,
            int? roleId = null,
            string? searchTerm = null);

        Task<EmployeeApiResponse<EmployeeBasicInfo>> GetEmployeeByIdAsync(int employeeMasterId);

        Task<EmployeeApiResponse<List<DepartmentDto>>> GetAllDepartmentsAsync();

        Task<EmployeeApiResponse<DepartmentDetailDto>> GetDepartmentByIdAsync(int departmentId);

        Task<EmployeeApiResponse<List<string>>> GetAllBusinessUnitsAsync();

        Task<EmployeeApiResponse<List<EmployeeBasicInfo>>> GetInitialStageEmployeesAsync();

        Task<EmployeeApiResponse<object>> MapEmployeesToResourcePoolAsync(List<int> employeeMasterIds);
    }
}
