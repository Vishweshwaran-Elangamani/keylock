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
    public class NominationReviewMetricRepository : INominationReviewMetricRepository
    {
        private readonly EEPZDbContext _context;

        public NominationReviewMetricRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Nominationreviewmetric> GetByIdAsync(int id)
        {
            return await _context.Nominationreviewmetrics
                .Include(x => x.Nomination)
                .Include(x => x.ReviewedByUser)
                .FirstOrDefaultAsync(x => x.MetricId == id);
        }

        public async Task<List<Nominationreviewmetric>> GetByNominationAsync(int nominationId)
        {
            return await _context.Nominationreviewmetrics
                .Where(x => x.NominationId == nominationId)
                .Include(x => x.ReviewedByUser)
                .OrderByDescending(x => x.ReviewedAt)
                .ToListAsync();
        }

        public async Task<Nominationreviewmetric> CreateAsync(Nominationreviewmetric metric)
        {
            metric.ReviewedAt = DateTime.UtcNow;
            _context.Nominationreviewmetrics.Add(metric);
            await _context.SaveChangesAsync();
            return metric;
        }

        public async Task<Nominationreviewmetric> UpdateAsync(Nominationreviewmetric metric)
        {
            metric.ReviewedAt = DateTime.UtcNow;
            _context.Nominationreviewmetrics.Update(metric);
            await _context.SaveChangesAsync();
            return metric;
        }
    }
}
