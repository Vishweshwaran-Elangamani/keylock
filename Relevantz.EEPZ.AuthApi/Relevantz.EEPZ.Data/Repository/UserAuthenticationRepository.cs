using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Common.Constants;
using Microsoft.EntityFrameworkCore;


namespace Relevantz.EEPZ.Data.Repository
{
    public class UserAuthenticationRepository : IUserAuthenticationRepository
    {
        private readonly EEPZDbContext _context;


        public UserAuthenticationRepository(EEPZDbContext context)
        {
            _context = context;
        }


        public async Task<Userauthentication?> GetByIdAsync(int userId)
        {
            return await _context.Userauthentications
                .Include(u => u.Employee)
                    .ThenInclude(e => e.Userprofile)
                .Include(u => u.Employee)
                    .ThenInclude(e => e.Employeedetailsmasters)
                        .ThenInclude(edm => edm.Role)
                .Include(u => u.Employee)
                    .ThenInclude(e => e.Employeedetailsmasters)
                        .ThenInclude(edm => edm.Department)
                .FirstOrDefaultAsync(u => u.UserId == userId);
        }


        public async Task<Userauthentication?> GetByEmailAsync(string email)
        {
            return await _context.Userauthentications
                .Include(u => u.Employee)
                    .ThenInclude(e => e.Userprofile)
                .Include(u => u.Employee)
                    .ThenInclude(e => e.Employeedetailsmasters)
                        .ThenInclude(edm => edm.Role)
                .Include(u => u.Employee)
                    .ThenInclude(e => e.Employeedetailsmasters)
                        .ThenInclude(edm => edm.Department)
                .FirstOrDefaultAsync(u => u.Email == email);
        }


        public async Task<Userauthentication?> GetByEmployeeIdAsync(int employeeId)
        {
            return await _context.Userauthentications
                .Include(u => u.Employee)
                .FirstOrDefaultAsync(u => u.EmployeeId == employeeId);
        }


        public async Task<List<Userauthentication>> GetAllAsync()
        {
            return await _context.Userauthentications
                .Include(u => u.Employee)
                    .ThenInclude(e => e.Userprofile)
                .Include(u => u.Employee)
                    .ThenInclude(e => e.Employeedetailsmasters)
                        .ThenInclude(edm => edm.Role)
                .Include(u => u.Employee)
                    .ThenInclude(e => e.Employeedetailsmasters)
                        .ThenInclude(edm => edm.Department)
                .ToListAsync();
        }


        public async Task<Userauthentication> CreateAsync(Userauthentication userAuth)
        {
            _context.Userauthentications.Add(userAuth);
            await _context.SaveChangesAsync();
            return userAuth;
        }


        public async Task<Userauthentication> UpdateAsync(Userauthentication userAuth)
        {
            userAuth.UpdatedAt = DateTime.UtcNow;
            _context.Userauthentications.Update(userAuth);
            await _context.SaveChangesAsync();
            return userAuth;
        }


        public async Task<bool> DeleteAsync(int userId)
        {
            var userAuth = await _context.Userauthentications.FindAsync(userId);
            if (userAuth == null)
                return false;


            _context.Userauthentications.Remove(userAuth);
            await _context.SaveChangesAsync();
            return true;
        }


        public async Task<bool> EmailExistsAsync(string email)
        {
            return await _context.Userauthentications
                .AnyAsync(u => u.Email == email);
        }


        public async Task<List<Userauthentication>> GetLockedAccountsAsync()
        {
            return await _context.Userauthentications
                .Where(u => u.Status == UserAuthConstants.UserStatus.Locked)
                .ToListAsync();
        }


        public async Task UpdateLastLoginAsync(int userId)
        {
            var userAuth = await _context.Userauthentications.FindAsync(userId);
            if (userAuth != null)
            {
                userAuth.LastLoginAt = DateTime.UtcNow;
                userAuth.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<Userauthentication?> GetByEmployeeIdWithDetailsAsync(int employeeId)
        {
            return await _context.Userauthentications
                .Include(u => u.Employee)
                    .ThenInclude(e => e.Userprofile)
                .Include(u => u.Employee)
                    .ThenInclude(e => e.Employeedetailsmasters)
                        .ThenInclude(edm => edm.Role)
                .Include(u => u.Employee)
                    .ThenInclude(e => e.Employeedetailsmasters)
                        .ThenInclude(edm => edm.Department)
                .FirstOrDefaultAsync(u => u.EmployeeId == employeeId);
        }
    }
}
