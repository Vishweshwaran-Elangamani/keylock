using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IFundAllocationRepository
    {
        Task<Budgetallocation?> GetByIdAsync(int allocationId);
        Task<List<Budgetallocation>> GetAllAsync();
        Task<List<Budgetallocation>> GetByDepartmentIdAsync(int departmentId);
        Task<List<Budgetallocation>> GetByAllocationTypeAsync(string allocationType);
        Task<List<Budgetallocation>> GetByEmployeeUserIdAsync(int employeeUserId);
        Task<Budgetallocation> CreateAsync(Budgetallocation allocation);
        Task<Budgetallocation> UpdateAsync(Budgetallocation allocation);
        Task<bool> DeleteAsync(int allocationId);

        // New: validation helpers moved from service
        Task<bool> BudgetExistsAsync(int budgetId);
        Task<(bool Exists, decimal AvailableAmount)> ValidatePeriodAndGetAvailableAsync(
            int budgetId,
            string period,
            int periodYear);
        Task<FundAllocationResponseDto?> GetFundAllocationDetailsAsync(int allocationId);
    }
}
