using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IEmployeeRepository
    {
        Task<List<EmployeeBasicInfo>> GetEmployeesAsync(int? departmentId, int? roleId, string? searchTerm);

        Task<List<EmployeeBasicInfo>> GetEmployeesByRoleNamesAsync(List<string> roleNames);

        Task<EmployeeBasicInfo?> GetEmployeeByIdAsync(int employeeMasterId);

        Task<List<DepartmentDto>> GetAllDepartmentsAsync();

        Task<DepartmentDetailDto?> GetDepartmentByIdAsync(int departmentId);

        Task<List<string>> GetAllBusinessUnitsAsync();

        Task<List<EmployeeBasicInfo>> GetInitialStageEmployeesAsync();

        Task<(int mappedCount, List<string> errors)> MapEmployeesToResourcePoolAsync(List<int> employeeMasterIds);
    }
}
