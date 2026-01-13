using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Microsoft.EntityFrameworkCore;
namespace Relevantz.EEPZ.Data.Repository
{
    public class UserProfileRepository : IUserProfileRepository
    {
        private readonly EEPZDbContext _context;
        public UserProfileRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<string?> GetFullNameByEmployeeIdAsync(int employeeId)
        {
            var userProfile = await _context.Userprofiles
                .FirstOrDefaultAsync(up => up.EmployeeId == employeeId);
            
            return userProfile != null 
                ? $"{userProfile.FirstName} {userProfile.LastName}" 
                : null;
        }
        public async Task<Userprofile?> GetByIdAsync(int profileId)
        {
            return await _context.Userprofiles
                .Include(p => p.Employee)
                    .ThenInclude(e => e.Userauthentication)
                .FirstOrDefaultAsync(p => p.ProfileId == profileId);
        }
        public async Task<Userprofile?> GetByEmployeeIdAsync(int employeeId)
        {
            return await _context.Userprofiles
                .Include(p => p.Employee)
                    .ThenInclude(e => e.Userauthentication)
                .FirstOrDefaultAsync(p => p.EmployeeId == employeeId);
        }
        public async Task<List<Userprofile>> GetAllAsync()
        {
            return await _context.Userprofiles
                .Include(p => p.Employee)
                .ToListAsync();
        }
        public async Task<Userprofile> CreateAsync(Userprofile profile)
        {
            _context.Userprofiles.Add(profile);
            await _context.SaveChangesAsync();
            return profile;
        }
        public async Task<Userprofile> UpdateAsync(Userprofile profile)
        {
            _context.Userprofiles.Update(profile);
            await _context.SaveChangesAsync();
            return profile;
        }
        public async Task<bool> DeleteAsync(int profileId)
        {
            var profile = await _context.Userprofiles.FindAsync(profileId);
            if (profile == null)
                return false;
            _context.Userprofiles.Remove(profile);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
