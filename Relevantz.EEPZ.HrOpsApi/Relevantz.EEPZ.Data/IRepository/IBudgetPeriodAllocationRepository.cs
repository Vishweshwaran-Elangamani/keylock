using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IBudgetPeriodAllocationRepository
    {
        Task<Budgetperiodallocation> CreateAsync(Budgetperiodallocation periodAllocation);
        Task<Budgetperiodallocation> UpdateAsync(Budgetperiodallocation periodAllocation);
        Task<bool> DeleteAsync(int periodAllocationId);
        Task<Budgetperiodallocation?> GetByIdAsync(int periodAllocationId);
        Task<List<Budgetperiodallocation>> GetAllAsync();
        Task<List<Budgetperiodallocation>> GetByBudgetIdAsync(int budgetId);
        Task<Budgetperiodallocation?> GetByBudgetPeriodYearAsync(int budgetId, string period, int periodYear);
    }
}
