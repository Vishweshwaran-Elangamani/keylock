using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;
using Microsoft.EntityFrameworkCore;

namespace Relevantz.EEPZ.Data.Repository
{
    public class NominationManagementRepository : INominationManagementRepository
    {
        private readonly EEPZDbContext _context;

        public NominationManagementRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Nomination?> GetByIdAsync(int nominationId)
        {
            return await _context.Nominations
                .FirstOrDefaultAsync(n => n.NominationId == nominationId);
        }

        public async Task<List<Nomination>> GetAllAsync()
        {
            return await _context.Nominations
                .OrderByDescending(n => n.SubmittedAt)
                .ToListAsync();
        }

        public async Task<List<Nomination>> GetByStatusAsync(string status)
        {
            return await _context.Nominations
                .Where(n => n.Status == status)
                .OrderByDescending(n => n.SubmittedAt)
                .ToListAsync();
        }

        public async Task<List<Nomination>> GetByOpportunityIdAsync(int opportunityId)
        {
            return await _context.Nominations
                .Where(n => n.OpportunityId == opportunityId)
                .OrderByDescending(n => n.SubmittedAt)
                .ToListAsync();
        }

        public async Task<List<Nomination>> GetPendingReviewAsync()
        {
            return await _context.Nominations
                .Where(n => n.Status == "Pending" || n.Status == "UnderReview")
                .OrderBy(n => n.SubmittedAt)
                .ToListAsync();
        }

        public async Task<Nomination> CreateAsync(Nomination nomination)
        {
            _context.Nominations.Add(nomination);
            await _context.SaveChangesAsync();
            return nomination;
        }

        public async Task<Nomination> UpdateAsync(Nomination nomination)
        {
            _context.Nominations.Update(nomination);
            await _context.SaveChangesAsync();
            return nomination;
        }

        public async Task<bool> CheckDuplicateNominationAsync(int opportunityId, int nomineeUserId)
        {
            return await _context.Nominations
                .AnyAsync(n => n.OpportunityId == opportunityId &&
                              n.NomineeUserId == nomineeUserId &&
                              (n.Status == "Pending" || n.Status == "UnderReview" || n.Status == "Approved"));
        }
    }


}

