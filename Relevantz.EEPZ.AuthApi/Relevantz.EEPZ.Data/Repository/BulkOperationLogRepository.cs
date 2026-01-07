using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Microsoft.EntityFrameworkCore;
namespace Relevantz.EEPZ.Data.Repository
{
    public class BulkOperationLogRepository : IBulkOperationLogRepository
    {
        private readonly EEPZDbContext _context;
        public BulkOperationLogRepository(EEPZDbContext context)
        {
            _context = context;
        }
        public async Task<Bulkoperationlog?> GetByIdAsync(int logId)
        {
            return await _context.Bulkoperationlogs
                .Include(bol => bol.PerformedByUser)
                .FirstOrDefaultAsync(bol => bol.LogId == logId);
        }
        public async Task<List<Bulkoperationlog>> GetByPerformedByUserIdAsync(int userId)
        {
            return await _context.Bulkoperationlogs
                .Where(bol => bol.PerformedByUserId == userId)
                .OrderByDescending(bol => bol.PerformedAt)
                .ToListAsync();
        }
        public async Task<List<Bulkoperationlog>> GetByOperationTypeAsync(string operationType)
        {
            return await _context.Bulkoperationlogs
                .Where(bol => bol.OperationType == operationType)
                .OrderByDescending(bol => bol.PerformedAt)
                .ToListAsync();
        }
        public async Task<List<Bulkoperationlog>> GetAllAsync()
        {
            return await _context.Bulkoperationlogs
                .Include(bol => bol.PerformedByUser)
                .OrderByDescending(bol => bol.PerformedAt)
                .ToListAsync();
        }
        public async Task<Bulkoperationlog> CreateAsync(Bulkoperationlog bulkOperationLog)
        {
            _context.Bulkoperationlogs.Add(bulkOperationLog);
            await _context.SaveChangesAsync();
            return bulkOperationLog;
        }
        public async Task<List<Bulkoperationlog>> GetRecentLogsAsync(int limit = 50)
        {
            return await _context.Bulkoperationlogs
                .Include(bol => bol.PerformedByUser)
                .OrderByDescending(bol => bol.PerformedAt)
                .Take(limit)
                .ToListAsync();
        }
    }
}
