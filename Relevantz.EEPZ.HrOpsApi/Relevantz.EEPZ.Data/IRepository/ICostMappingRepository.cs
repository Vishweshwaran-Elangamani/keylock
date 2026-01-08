using Relevantz.EEPZ.Common.Entities;
namespace Relevantz.EEPZ.Data.IRepository
{
    public interface ICostMappingRepository
    {
        Task<Departmentbudget?> GetByIdAsync(int budgetId);
        Task<List<Departmentbudget>> GetAllAsync();
        Task<List<Departmentbudget>> GetByDepartmentIdAsync(int departmentId);
        Task<List<Departmentbudget>> GetByFiscalYearAsync(int fiscalYear);
        Task<Departmentbudget?> GetByDepartmentAndFiscalYearAsync(int departmentId, int fiscalYear);
        Task<Departmentbudget> CreateAsync(Departmentbudget budget);
        Task<Departmentbudget> UpdateAsync(Departmentbudget budget);
        Task<bool> DeleteAsync(int budgetId);
    }
}
