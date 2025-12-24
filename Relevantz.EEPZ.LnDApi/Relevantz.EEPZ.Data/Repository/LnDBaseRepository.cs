using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repositories.Interface;

namespace Relevantz.EEPZ.Data.Repositories.Implementations
{
    public class LnDBaseRepository : ILnDBaseRepository
    {

        private readonly EEPZDbContext _context;

        public LnDBaseRepository(EEPZDbContext context)
        {
            _context = context;
        }
        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

    }
}