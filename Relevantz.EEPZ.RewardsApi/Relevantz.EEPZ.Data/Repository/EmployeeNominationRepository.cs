using System.Collections.Generic;
using System.Linq;
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

        public async Task<List<Recognitionstatus>> GetApprovedNominationsByEmployeeAsync(int employeeId)
        {
            return await _context.Recognitionstatuses
                .Where(n => n.NomineeEmployeeId == employeeId)
                .Where(n => n.Status == "Approved")
                .ToListAsync();
        }

        public async Task<Recognitiondetail?> GetRecognitionDetailWithRewardTypeAsync(int opportunityId)
        {
            return await _context.Recognitiondetails
                .Where(o => o.OpportunityId == opportunityId)
                .Include(o => o.RewardType)
                .FirstOrDefaultAsync();
        }
    }
}
