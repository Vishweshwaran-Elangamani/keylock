using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Common.Constants;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

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

        public async Task<Slaescalation?> GetByIdAsync(int escalationId)
        {
            try
            {
                if (escalationId <= 0)
                    return null;

                return await BaseQuery()
                    .FirstOrDefaultAsync(e => e.EscalationId == escalationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingSlaEscalation, escalationId);
                throw;
            }
        }

        public async Task<List<Slaescalation>> GetAllAsync()
        {
            try
            {
                return await BaseQuery()
                    .OrderByDescending(e => e.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingAllSlaEscalations);
                throw;
            }
        }

        public async Task<List<Slaescalation>> GetByEmployeeUserIdAsync(int EmployeeUserId)
        {
            try
            {
                if (EmployeeUserId <= 0)
                    return new List<Slaescalation>();

                return await BaseQuery()
                    .Where(e => e.Sla.EmployeeId == EmployeeUserId)
                    .OrderByDescending(e => e.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingSlaEscalationsByEmployee, EmployeeUserId);
                throw;
            }
        }

        public async Task<List<Slaescalation>> GetBySlaIdAsync(int slaId)
        {
            try
            {
                if (slaId <= 0)
                    return new List<Slaescalation>();

                return await BaseSlaQuery()
                    .Where(e => e.Slaid == slaId)
                    .OrderByDescending(e => e.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingSlaEscalationsBySla, slaId);
                throw;
            }
        }

        public async Task<List<Slaescalation>> GetByEscalationLevelAsync(string escalationLevel)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(escalationLevel))
                    return new List<Slaescalation>();

                return await BaseQuery()
                    .Where(e => e.EscalationLevel == escalationLevel)
                    .OrderByDescending(e => e.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingSlaEscalationsByLevel, escalationLevel);
                throw;
            }
        }

        public async Task<List<Slaescalation>> GetByEscalationStatusAsync(string escalationStatus)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(escalationStatus))
                    return new List<Slaescalation>();

                return await BaseQuery()
                    .Where(e => e.EscalationStatus == escalationStatus)
                    .OrderByDescending(e => e.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingSlaEscalationsByStatus, escalationStatus);
                throw;
            }
        }

        private IQueryable<Slaescalation> BaseQuery()
        {
            return _context.Slaescalations
                .Include(e => e.Sla)
                    .ThenInclude(s => s.Employee)
                        .ThenInclude(emp => emp.Userprofile)
                .Include(e => e.Sla)
                    .ThenInclude(s => s.Employee)
                        .ThenInclude(emp => emp.Userauthentication)
                .Include(e => e.EscalatedToEmployee)
                    .ThenInclude(emp => emp.Userprofile)
                .Include(e => e.EscalatedToEmployee)
                    .ThenInclude(emp => emp.Userauthentication)
                .Include(e => e.SubmittedByEmployee)
                    .ThenInclude(emp => emp.Userprofile)
                .Include(e => e.SubmittedByEmployee)
                    .ThenInclude(emp => emp.Userauthentication)
                .Include(e => e.ResolvedByEmployee)
                    .ThenInclude(emp => emp.Userprofile)
                .Include(e => e.ResolvedByEmployee)
                    .ThenInclude(emp => emp.Userauthentication);
        }

        private IQueryable<Slaescalation> BaseSlaQuery()
        {
            // For GetBySlaIdAsync - excludes Sla includes to avoid redundant loading
            return _context.Slaescalations
                .Include(e => e.EscalatedToEmployee)
                    .ThenInclude(emp => emp.Userprofile)
                .Include(e => e.EscalatedToEmployee)
                    .ThenInclude(emp => emp.Userauthentication)
                .Include(e => e.SubmittedByEmployee)
                    .ThenInclude(emp => emp.Userprofile)
                .Include(e => e.SubmittedByEmployee)
                    .ThenInclude(emp => emp.Userauthentication)
                .Include(e => e.ResolvedByEmployee)
                    .ThenInclude(emp => emp.Userprofile)
                .Include(e => e.ResolvedByEmployee)
                    .ThenInclude(emp => emp.Userauthentication);
        }
    }
}
