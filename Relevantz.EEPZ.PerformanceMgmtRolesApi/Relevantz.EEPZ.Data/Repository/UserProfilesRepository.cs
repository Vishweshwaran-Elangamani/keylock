using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class UserProfilesRepository : IUserProfilesRepository
    {
        private readonly EEPZDbContext _context;

        public UserProfilesRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<List<object>> GetAllUserProfilesAsync()
        {
            return await _context.Userprofiles
                .Select(u => new
                {
                    u.ProfileId,
                    u.EmployeeId,
                    u.FirstName,
                    u.LastName,
                    u.PersonalEmail,
                    u.Gender,
                    u.MobileNumber
                })
                .ToListAsync<object>();
        }
    }
}
