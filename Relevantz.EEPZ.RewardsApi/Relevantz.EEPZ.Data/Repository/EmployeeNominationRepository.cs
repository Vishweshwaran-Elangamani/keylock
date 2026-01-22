using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;
 
namespace Relevantz.EEPZ.Data.Repository
{
    public class EmployeeNominationRepository : IEmployeeNominationRepository
    {
        private readonly EEPZDbContext _context;
 
        public EmployeeNominationRepository(EEPZDbContext context)
        {
            _context = context;
        }
 
        public async Task<List<Recognitionstatus>> GetApprovedNominationsByEmployeeAsync(
            int employeeId,
            CancellationToken cancellationToken = default)
        {
            return await _context.Recognitionstatuses
                .AsNoTracking()
                .Where(n => n.NomineeEmployeeId == employeeId)
                .Where(n => n.Status == "Approved")
                .ToListAsync(cancellationToken);
        }
 
        public async Task<Recognitiondetail?> GetRecognitionDetailWithRewardTypeAsync(
            int opportunityId,
            CancellationToken cancellationToken = default)
        {
            return await _context.Recognitiondetails
                .AsNoTracking()
                .Include(o => o.RewardType)
                .FirstOrDefaultAsync(o => o.OpportunityId == opportunityId, cancellationToken);
        }
 
        public async Task<List<Recognitiondetail>> GetRecognitionDetailsWithRewardTypeByOppIdsAsync(
            IEnumerable<int> opportunityIds,
            CancellationToken cancellationToken = default)
        {
            var ids = (opportunityIds ?? Enumerable.Empty<int>()).Distinct().ToList();
            if (ids.Count == 0) return new List<Recognitiondetail>();
 
            return await _context.Recognitiondetails
                .AsNoTracking()
                .Where(o => ids.Contains(o.OpportunityId))
                .Include(o => o.RewardType)
                .ToListAsync(cancellationToken);
        }
    }
}
 
 