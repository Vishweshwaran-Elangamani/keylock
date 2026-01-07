using Relevantz.EEPZ.Common.Entities;
namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IDepartmentRepository
    {
        Task<Department?> GetByIdAsync(int departmentId);
        Task<Department?> GetByNameAsync(string departmentName);
        Task<Department?> GetByCodeAsync(string departmentCode);
        Task<List<Department>> GetAllAsync();
        Task<Department> CreateAsync(Department department);
        Task<Department> UpdateAsync(Department department);
        Task<bool> DeleteAsync(int departmentId);
        Task<bool> DepartmentNameExistsAsync(string departmentName, int? excludeDepartmentId = null);
        Task<bool> DepartmentCodeExistsAsync(string departmentCode, int? excludeDepartmentId = null);
        Task<bool> HasChildDepartmentsAsync(int departmentId);
        Task<bool> HasEmployeesAsync(int departmentId);
        Task<List<Department>> GetChildDepartmentsAsync(int parentDepartmentId);
        Task<List<Department>> GetAllChildDepartmentsRecursiveAsync(int parentDepartmentId);
        Task<Department?> GetParentDepartmentAsync(int departmentId);
        Task<List<Department>> GetRootDepartmentsAsync();
        Task<List<Department>> GetDepartmentHierarchyAsync(int departmentId);
        Task<bool> IsCircularReferenceAsync(int departmentId, int? newParentDepartmentId);
        Task<int> GetDepartmentLevelAsync(int departmentId);
        Task<List<Department>> GetDepartmentsByHodAsync(int hodEmployeeId);
        Task<bool> IsEmployeeHodOfAnyDepartmentAsync(int employeeId);
        Task<List<Department>> GetActiveDepartmentsAsync();
        Task<List<Department>> GetInactiveDepartmentsAsync();
        Task<List<Department>> GetDepartmentsByStatusAsync(string status);
        Task<Department?> GetDepartmentWithDetailsAsync(int departmentId);
        Task<List<Department>> SearchDepartmentsAsync(string searchTerm);
        Task<int> GetTotalDepartmentCountAsync();
        Task<int> GetChildCountAsync(int departmentId);
    }
}
