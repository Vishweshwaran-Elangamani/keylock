using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Common.Constants;
using Microsoft.EntityFrameworkCore;

namespace Relevantz.EEPZ.Data.Repository
{
    public class ChangeRequestRepository : IChangeRequestRepository
    {
        private readonly EEPZDbContext _context;

        public ChangeRequestRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Changerequest?> GetByIdAsync(int requestId)
        {
            return await _context.Changerequests
                .AsNoTracking()
                .Include(cr => cr.Employee)
                    .ThenInclude(e => e.Userprofile)
                .FirstOrDefaultAsync(cr => cr.RequestId == requestId);
        }

        public async Task<List<Changerequest>> GetByEmployeeIdAsync(int employeeId)
        {
            return await _context.Changerequests
                .AsNoTracking()
                .Where(cr => cr.EmployeeId == employeeId)
                .OrderByDescending(cr => cr.RequestedAt)
                .ToListAsync();
        }

        public async Task<List<Changerequest>> GetPendingRequestsAsync()
        {
            return await _context.Changerequests
                .AsNoTracking()
                .Include(cr => cr.Employee)
                    .ThenInclude(e => e.Userprofile)
                .Where(cr => cr.Status == ChangeRequestConstants.RequestStatus.Pending)
                .OrderBy(cr => cr.RequestedAt)
                .ToListAsync();
        }

        public async Task<List<Changerequest>> GetAllAsync()
        {
            return await _context.Changerequests
                .AsNoTracking()
                .Include(cr => cr.Employee)
                    .ThenInclude(e => e.Userprofile)
                .OrderByDescending(cr => cr.RequestedAt)
                .ToListAsync();
        }

        public async Task<Changerequest> CreateAsync(Changerequest changeRequest)
        {
            _context.Changerequests.Add(changeRequest);
            await _context.SaveChangesAsync();
            return changeRequest;
        }

        public async Task<Changerequest> UpdateAsync(Changerequest changeRequest)
        {
            _context.Changerequests.Update(changeRequest);
            await _context.SaveChangesAsync();
            return changeRequest;
        }

        public async Task<bool> DeleteAsync(int requestId)
        {
            var changeRequest = await _context.Changerequests.FindAsync(requestId);
            if (changeRequest == null)
                return false;

            _context.Changerequests.Remove(changeRequest);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<Changerequest>> GetByStatusAsync(string status)
        {
            return await _context.Changerequests
                .AsNoTracking()
                .Include(cr => cr.Employee)
                    .ThenInclude(e => e.Userprofile)
                .Where(cr => cr.Status == status)
                .OrderByDescending(cr => cr.RequestedAt)
                .ToListAsync();
        }

        public async Task<bool> IsEmailAlreadyExistsAsync(string email, int excludeUserId)
        {
            return await _context.Userauthentications
                .AsNoTracking()
                .AnyAsync(u => u.Email.ToLower() == email.ToLower() &&
                               u.UserId != excludeUserId);
        }

        public async Task<bool> IsUsernameAlreadyExistsAsync(string username, int excludeUserId)
        {
            return await Task.FromResult(false);
        }

        public async Task<bool> IsEmployeeCompanyIdExistsAsync(string employeeCompanyId, int excludeEmployeeId)
        {
            return await _context.Employees
                .AsNoTracking()
                .AnyAsync(e =>
                    e.EmployeeCompanyId == employeeCompanyId &&
                    e.EmployeeId != excludeEmployeeId &&
                    e.IsActive == true
                );
        }
    }
}