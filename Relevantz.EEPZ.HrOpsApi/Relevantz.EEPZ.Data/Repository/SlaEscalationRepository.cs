using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;


namespace Relevantz.EEPZ.Data.Repository
{
    public class SlaEscalationRepository : ISlaEscalationRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<SlaEscalationRepository> _logger;


        public SlaEscalationRepository(EEPZDbContext context, ILogger<SlaEscalationRepository> logger)
        {
            _context = context;
            _logger = logger;
        }


        public async Task<List<Slaescalation>> GetAllAsync()
        {
            return await BaseQuery()
                .OrderByDescending(e => e.SubmittedAt)
                .ToListAsync();
        }


        public async Task<Slaescalation?> GetByIdAsync(int escalationId)
        {
            if (escalationId <= 0)
                return null;


            return await BaseQuery()
                .FirstOrDefaultAsync(e => e.EscalationId == escalationId);
        }


        public async Task<List<Slaescalation>> GetByEmployeeUserIdAsync(int employeeUserId)
        {
            if (employeeUserId <= 0)
                return new List<Slaescalation>();


            return await BaseQuery()
                .Where(e => e.Sla != null && e.Sla.EmployeeId == employeeUserId)
                .OrderByDescending(e => e.SubmittedAt)
                .ToListAsync();
        }


        public async Task<List<Slaescalation>> GetBySlaIdAsync(int slaId)
        {
            if (slaId <= 0)
                return new List<Slaescalation>();


            return await BaseQuery()
                .Where(e => e.Slaid == slaId)
                .OrderByDescending(e => e.SubmittedAt)
                .ToListAsync();
        }


        public async Task<List<Slaescalation>> GetByEscalationLevelAsync(string escalationLevel)
        {
            if (string.IsNullOrWhiteSpace(escalationLevel))
                return new List<Slaescalation>();


            return await BaseQuery()
                .Where(e => e.EscalationLevel == escalationLevel)
                .OrderByDescending(e => e.SubmittedAt)
                .ToListAsync();
        }


        public async Task<List<Slaescalation>> GetByEscalationStatusAsync(string escalationStatus)
        {
            if (string.IsNullOrWhiteSpace(escalationStatus))
                return new List<Slaescalation>();


            return await BaseQuery()
                .Where(e => e.EscalationStatus == escalationStatus)
                .OrderByDescending(e => e.SubmittedAt)
                .ToListAsync();
        }


        private IQueryable<Slaescalation> BaseQuery()
        {
            return _context.Slaescalations
                .Include(e => e.Sla)
                    .ThenInclude(s => s!.Employee)
                        .ThenInclude(emp => emp.Userprofile)
                .Include(e => e.Sla)
                    .ThenInclude(s => s!.Employee)
                        .ThenInclude(emp => emp.Userauthentication)
                .Include(e => e.EscalatedToEmployee)
                    .ThenInclude(emp => emp!.Userprofile)
                .Include(e => e.EscalatedToEmployee)
                    .ThenInclude(emp => emp!.Userauthentication)
                .Include(e => e.SubmittedByEmployee)
                    .ThenInclude(emp => emp!.Userprofile)
                .Include(e => e.ResolvedByEmployee)
                    .ThenInclude(emp => emp!.Userprofile);
        }
    }
}
