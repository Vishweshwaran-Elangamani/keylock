using Relevantz.EEPZ.Common.Entities;
namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IDepartmentRepository
    {
        Task<Department?> GetByIdAsync(int departmentId);
        Task<Department?> GetByNameAsync(string departmentName);
        Task<List<Department>> GetAllAsync();
        Task<Department> CreateAsync(Department department);
        Task<Department> UpdateAsync(Department department);
        Task<bool> DeleteAsync(int departmentId);
        Task<bool> DepartmentNameExistsAsync(string departmentName);
    }
}
