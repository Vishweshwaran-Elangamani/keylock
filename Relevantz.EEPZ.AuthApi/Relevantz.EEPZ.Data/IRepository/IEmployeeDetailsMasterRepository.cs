using Relevantz.EEPZ.Common.Entities;
namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IEmployeeDetailsMasterRepository
    {
        Task<Employeedetailsmaster?> GetByIdAsync(int employeeMasterId);
        Task<Employeedetailsmaster?> GetByEmployeeIdAsync(int employeeId);
        Task<List<Employeedetailsmaster>> GetByRoleIdAsync(int roleId);
        Task<List<Employeedetailsmaster>> GetByDepartmentIdAsync(int departmentId);
        Task<List<Employeedetailsmaster>> GetAllAsync();
        Task<Employeedetailsmaster> CreateAsync(Employeedetailsmaster employeeDetails);
        Task<Employeedetailsmaster> UpdateAsync(Employeedetailsmaster employeeDetails);
        Task<bool> DeleteAsync(int employeeMasterId);
        Task<bool> DeleteByEmployeeIdAsync(int employeeId);
    }
}
