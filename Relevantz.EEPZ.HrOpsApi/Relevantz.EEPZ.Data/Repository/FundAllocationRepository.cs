using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;
using Microsoft.EntityFrameworkCore;
 
namespace Relevantz.EEPZ.Data.Repository
{
   public class FundAllocationRepository : IFundAllocationRepository
    {
        private readonly EEPZDbContext _context;
 
        public FundAllocationRepository(EEPZDbContext context)
        {
            _context = context;
        }
 
        public async Task<Budgetallocation?> GetByIdAsync(int allocationId)
        {
            return await _context.Budgetallocations
                .FirstOrDefaultAsync(b => b.AllocationId == allocationId);
        }
 
        public async Task<List<Budgetallocation>> GetAllAsync()
        {
            return await _context.Budgetallocations
                .OrderByDescending(b => b.AllocatedAt)
                .ToListAsync();
        }
 
        public async Task<List<Budgetallocation>> GetByDepartmentIdAsync(int departmentId)
        {
            return await _context.Budgetallocations
                .Where(b => b.DepartmentId == departmentId)
                .OrderByDescending(b => b.AllocatedAt)
                .ToListAsync();
        }
 
        public async Task<List<Budgetallocation>> GetByAllocationTypeAsync(string allocationType)
        {
            return await _context.Budgetallocations
                .Where(b => b.AllocationType == allocationType)
                .OrderByDescending(b => b.AllocatedAt)
                .ToListAsync();
        }
 
        public async Task<List<Budgetallocation>> GetByEmployeeUserIdAsync(int EmployeeUserId)
        {
            return await _context.Budgetallocations
                .Where(b => b.EmployeeUserId == EmployeeUserId)
                .OrderByDescending(b => b.AllocatedAt)
                .ToListAsync();
        }
 
        public async Task<Budgetallocation> CreateAsync(Budgetallocation allocation)
        {
            _context.Budgetallocations.Add(allocation);
            await _context.SaveChangesAsync();
            return allocation;
        }
 
        public async Task<Budgetallocation> UpdateAsync(Budgetallocation allocation)
        {
            _context.Budgetallocations.Update(allocation);
            await _context.SaveChangesAsync();
            return allocation;
        }
 
        public async Task<bool> DeleteAsync(int allocationId)
        {
            var allocation = await GetByIdAsync(allocationId);
            if (allocation == null)
                return false;
 
            _context.Budgetallocations.Remove(allocation);
            await _context.SaveChangesAsync();
            return true;
        }
    }
 
}
 
 