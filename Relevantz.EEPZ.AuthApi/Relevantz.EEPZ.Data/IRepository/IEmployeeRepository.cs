using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IEmployeeRepository
    {
        Task<Employee?> GetByIdAsync(int employeeId);
        Task<Employee?> GetByEmployeeCompanyIdAsync(string employeeCompanyId);
        Task<Employee?> GetByEmailAsync(string email);                    // ← NEW
        Task<Employee?> GetByKeycloakUserIdAsync(string keycloakUserId); // ← NEW
        Task<List<Employee>> GetAllAsync();
        Task<List<Employee>> GetActiveEmployeesAsync();
        Task<Employee> CreateAsync(Employee employee);
        Task<Employee> UpdateAsync(Employee employee);
        Task<bool> DeleteAsync(int employeeId);
        Task<bool> EmployeeCompanyIdExistsAsync(string employeeCompanyId);
        Task<List<Employee>> GetByReportingManagerAsync(int reportingManagerEmployeeId);
        Task<string> GetNextEmployeeCompanyIdAsync();
        Task<List<Employee>> GetByManagerIdAsync(int managerId);
    }
}