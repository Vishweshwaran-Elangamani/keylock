using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IEmployeeService
    {
        /// <summary>
        /// Get all active employees with their details. Used for Resource Owner dropdown
        /// </summary>
        Task<ApiResponse<List<EmployeeDto>>> GetAllEmployeesAsync();

        /// <summary>
        /// Get only managers/senior roles for approver dropdowns. Used for L1 and L2 Approver dropdowns
        /// </summary>
        Task<ApiResponse<List<EmployeeDto>>> GetManagersAsync();

        /// <summary>
        /// Get employee by ID with full details
        /// </summary>
        Task<ApiResponse<EmployeeDto>> GetEmployeeByIdAsync(int employeeMasterId);

        /// <summary>
        /// Search employees by name or employee company ID
        /// </summary>
        Task<ApiResponse<List<EmployeeDto>>> SearchEmployeesAsync(string query);

        /// <summary>
        /// Get employees by department
        /// </summary>
        Task<ApiResponse<List<EmployeeDto>>> GetEmployeesByDepartmentAsync(int departmentId);

        /// <summary>
        /// Get employees by role
        /// </summary>
        Task<ApiResponse<List<EmployeeDto>>> GetEmployeesByRoleAsync(int roleId);

        /// <summary>
        /// Get all departments. Used for Department dropdown in project forms
        /// </summary>
        Task<ApiResponse<List<DepartmentDto>>> GetAllDepartmentsAsync();

        /// <summary>
        /// Get all business units (distinct from existing projects). Used for Business Unit dropdown in project forms
        /// </summary>
        Task<ApiResponse<List<string>>> GetAllBusinessUnitsAsync();

        /// <summary>
        /// Get employees with null reporting manager (Initial Stage Employees). Excludes employees already mapped to resource pool
        /// </summary>
        Task<ApiResponse<List<EmployeeDto>>> GetInitialStageEmployeesAsync();

        /// <summary>
        /// Map initial stage employees to resource pool (org.rz.resourcepool)
        /// </summary>
        Task<ApiResponse<object>> MapEmployeesToResourcePoolAsync(List<int> employeeMasterIds);

        /// <summary>
        /// Get department by ID with details
        /// </summary>
        Task<ApiResponse<DepartmentDetailDto>> GetDepartmentByIdAsync(int departmentId);
    }
}
