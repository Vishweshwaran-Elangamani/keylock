using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;
using Microsoft.EntityFrameworkCore;
 
namespace Relevantz.EEPZ.Data.Repository
{
   public class PayrollManagementRepository : IPayrollManagementRepository
    {
        private readonly EEPZDbContext _context;
 
        public PayrollManagementRepository(EEPZDbContext context)
        {
            _context = context;
        }
 
        public async Task<Payroll?> GetByIdAsync(int payrollId)
        {
            return await _context.Payrolls
                .FirstOrDefaultAsync(p => p.PayrollId == payrollId);
        }
 
        public async Task<List<Payroll>> GetAllAsync()
        {
            return await _context.Payrolls
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }
 
        public async Task<List<Payroll>> GetByEmployeeUserIdAsync(int EmployeeUserId)
        {
            return await _context.Payrolls
                .Where(p => p.EmployeeUserId == EmployeeUserId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }
 
        public async Task<List<Payroll>> GetByStatusAsync(string status)
        {
            return await _context.Payrolls
                .Where(p => p.Status == status)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }
 
        public async Task<Payroll> CreateAsync(Payroll payroll)
        {
            _context.Payrolls.Add(payroll);
            await _context.SaveChangesAsync();
            return payroll;
        }
 
        public async Task<Payroll> UpdateAsync(Payroll payroll)
        {
            _context.Payrolls.Update(payroll);
            await _context.SaveChangesAsync();
            return payroll;
        }
 
        public async Task<bool> HasPendingPayrollAsync(int EmployeeUserId)
        {
            return await _context.Payrolls
                .AnyAsync(p => p.EmployeeUserId == EmployeeUserId && p.Status == "Pending");
        }
    }
 
}
 
 