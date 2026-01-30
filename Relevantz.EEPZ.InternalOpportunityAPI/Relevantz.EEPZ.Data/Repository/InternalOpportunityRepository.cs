using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Data.Constants;

namespace Relevantz.EEPZ.Data.Repository
{
    public class InternalOpportunityRepository : IInternalOpportunityRepository
    {
        private readonly EEPZDbContext _context;

        public InternalOpportunityRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Internalopportunity> GetByIdAsync(int id)
        {
            return await _context.Internalopportunities
                .Include(x => x.Department)
                .Include(x => x.PostedByUser)
                .FirstOrDefaultAsync(x => x.OpportunityId == id);
        }

        public async Task<List<Internalopportunity>> GetAllAsync()
        {
            return await _context.Internalopportunities
                .Include(x => x.Department)
                .Include(x => x.PostedByUser)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Internalopportunity>> GetActiveAsync()
        {
            return await _context.Internalopportunities
                .Where(x => x.Status == RepositoryConstants.StatusActive)
                .Include(x => x.Department)
                .Include(x => x.PostedByUser)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Internalopportunity>> GetByDepartmentAsync(int departmentId)
        {
            return await _context.Internalopportunities
                .Where(x => x.DepartmentId == departmentId)
                .Include(x => x.Department)
                .Include(x => x.PostedByUser)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Internalopportunity>> GetByStatusAsync(string status)
        {
            return await _context.Internalopportunities
                .Where(x => x.Status == status)
                .Include(x => x.Department)
                .Include(x => x.PostedByUser)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<Internalopportunity> CreateAsync(Internalopportunity opportunity)
        {
            opportunity.CreatedAt = DateTime.UtcNow;
            opportunity.UpdatedAt = DateTime.UtcNow;
            _context.Internalopportunities.Add(opportunity);
            await _context.SaveChangesAsync();
            return opportunity;
        }

        public async Task<Internalopportunity> UpdateAsync(Internalopportunity opportunity)
        {
            opportunity.UpdatedAt = DateTime.UtcNow;
            _context.Internalopportunities.Update(opportunity);
            await _context.SaveChangesAsync();
            return opportunity;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var opportunity = await _context.Internalopportunities.FindAsync(id);
            if (opportunity == null)
                return false;

            _context.Internalopportunities.Remove(opportunity);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> CountAsync()
        {
            return await _context.Internalopportunities.CountAsync();
        }

        public async Task<int> CountByStatusAsync(string status)
        {
            return await _context.Internalopportunities.CountAsync(x => x.Status == status);
        }
    }
}
