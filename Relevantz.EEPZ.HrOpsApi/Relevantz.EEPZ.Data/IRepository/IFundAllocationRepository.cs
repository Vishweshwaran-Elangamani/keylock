using Relevantz.EEPZ.Common.Entities;
 
namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IFundAllocationRepository
    {
        Task<Budgetallocation?> GetByIdAsync(int allocationId);
        Task<List<Budgetallocation>> GetAllAsync();
        Task<List<Budgetallocation>> GetByDepartmentIdAsync(int departmentId);
        Task<List<Budgetallocation>> GetByAllocationTypeAsync(string allocationType);
        Task<List<Budgetallocation>> GetByEmployeeUserIdAsync(int EmployeeUserId);
        Task<Budgetallocation> CreateAsync(Budgetallocation allocation);
        Task<Budgetallocation> UpdateAsync(Budgetallocation allocation);
        Task<bool> DeleteAsync(int allocationId);
    }
}
 
 