using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IDepartmentBudgetRepository
    {
        Task<Departmentbudget?> GetByIdAsync(int budgetId);
        Task<Departmentbudget?> GetByDepartmentIdAsync(int departmentId);
        Task<List<Departmentbudget>> GetAllAsync();
        Task<List<Departmentbudget>> GetByFiscalYearAsync(int fiscalYear);
        Task<Departmentbudget?> GetByDepartmentAndFiscalYearAsync(int departmentId, int fiscalYear);
        Task<Departmentbudget> CreateAsync(Departmentbudget budget);
        Task<Departmentbudget> UpdateAsync(Departmentbudget budget);
        Task<bool> DeleteAsync(int budgetId);
        Task<int> DeleteAllocationsByDepartmentIdAsync(int departmentId);
        Task<Budgetallocation?> GetAllocationByIdAsync(int allocationId);
        Task<List<Budgetallocation>> GetAllocationsByBudgetIdAsync(int budgetId);
        Task<Budgetallocation> UpdateAllocationAsync(Budgetallocation allocation);
        Task<decimal> GetTotalUtilizedByDepartmentAsync(int departmentId);
    }
}
