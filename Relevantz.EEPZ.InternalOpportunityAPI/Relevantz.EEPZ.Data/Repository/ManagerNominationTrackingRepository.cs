using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;

namespace Relevantz.EEPZ.Data.Repository
{
    public class ManagerNominationTrackingRepository : IManagerNominationTrackingRepository
    {
        private readonly EEPZDbContext _context;

        public ManagerNominationTrackingRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Managernominationtracking> GetByIdAsync(int id)
        {
            return await _context.Managernominationtrackings
                .Include(x => x.Nomination)
                .Include(x => x.ViewedByUser)
                .FirstOrDefaultAsync(x => x.TrackingId == id);
        }

        public async Task<List<Managernominationtracking>> GetByNominationAsync(int nominationId)
        {
            return await _context.Managernominationtrackings
                .Where(x => x.NominationId == nominationId)
                .Include(x => x.ViewedByUser)
                .OrderByDescending(x => x.ViewedAt)
                .ToListAsync();
        }

        public async Task<Managernominationtracking> CreateAsync(Managernominationtracking tracking)
        {
            _context.Managernominationtrackings.Add(tracking);
            await _context.SaveChangesAsync();
            return tracking;
        }

        public async Task<bool> ExistsForNominationAsync(int nominationId)
        {
            return await _context.Managernominationtrackings
                .AnyAsync(x => x.NominationId == nominationId);
        }
    }
}
