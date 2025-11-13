using Relevantz.EEPZ.Common.Entities;
 
namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IPayrollManagementRepository
    {
        Task<Payroll?> GetByIdAsync(int payrollId);
        Task<List<Payroll>> GetAllAsync();
        Task<List<Payroll>> GetByEmployeeUserIdAsync(int EmployeeUserId);
        Task<List<Payroll>> GetByStatusAsync(string status);
        Task<Payroll> CreateAsync(Payroll payroll);
        Task<Payroll> UpdateAsync(Payroll payroll);
        Task<bool> HasPendingPayrollAsync(int EmployeeUserId);
    }
}
 
 