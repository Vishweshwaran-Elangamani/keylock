using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IEmployeeRepository
    {
        /// <summary>
        /// Get all active employees with their details. Used for Resource Owner dropdown
        /// </summary>
        Task<List<EmployeeDto>> GetAllEmployeesAsync();

        /// <summary>
        /// Get only managers/senior roles for approver dropdowns. Used for L1 and L2 Approver dropdowns
        /// </summary>
        Task<List<EmployeeDto>> GetManagersAsync();

        /// <summary>
        /// Get employee by ID with full details
        /// </summary>
        Task<EmployeeDto?> GetEmployeeByIdAsync(int employeeMasterId);

        /// <summary>
        /// Search employees by name or employee company ID
        /// </summary>
        Task<List<EmployeeDto>> SearchEmployeesAsync(string query);

        /// <summary>
        /// Get employees by department
        /// </summary>
        Task<List<EmployeeDto>> GetEmployeesByDepartmentAsync(int departmentId);

        /// <summary>
        /// Get employees by role
        /// </summary>
        Task<List<EmployeeDto>> GetEmployeesByRoleAsync(int roleId);

        /// <summary>
        /// Get all departments. Used for Department dropdown in project forms
        /// </summary>
        Task<List<DepartmentDto>> GetAllDepartmentsAsync();

        /// <summary>
        /// Get all business units (distinct from existing projects). Used for Business Unit dropdown in project forms
        /// </summary>
        Task<List<string>> GetAllBusinessUnitsAsync();

        /// <summary>
        /// Get employees with null reporting manager (Initial Stage Employees). Excludes employees already mapped to resource pool
        /// </summary>
        Task<List<EmployeeDto>> GetInitialStageEmployeesAsync();

        /// <summary>
        /// Map initial stage employees to resource pool (org.rz.resourcepool)
        /// </summary>
        Task<(int mappedCount, List<string> errors)> MapEmployeesToResourcePoolAsync(List<int> employeeMasterIds);

        /// <summary>
        /// Get department by ID with details
        /// </summary>
        Task<DepartmentDetailDto?> GetDepartmentByIdAsync(int departmentId);
    }

    public class EmployeeDto
    {
        public int EmployeeMasterId { get; set; }
        public int EmployeeId { get; set; }
        public string? EmployeeCompanyId { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? RoleName { get; set; }
        public string? DepartmentName { get; set; }
        public bool? IsActive { get; set; }
    }

    public class DepartmentDto
    {
        public int DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public decimal? BudgetAllocated { get; set; }
        public string? CostCenter { get; set; }
    }

    public class DepartmentDetailDto
    {
        public int DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public decimal? BudgetAllocated { get; set; }
        public string? CostCenter { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
