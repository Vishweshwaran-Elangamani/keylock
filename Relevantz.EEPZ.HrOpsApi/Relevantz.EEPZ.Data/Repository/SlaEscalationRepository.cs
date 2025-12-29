using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;
using Microsoft.EntityFrameworkCore;

namespace Relevantz.EEPZ.Data.Repository
{
    public class SlaEscalationRepository : ISlaEscalationRepository
    {
        private readonly EEPZDbContext _context;

        public SlaEscalationRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Slaescalation?> GetByIdAsync(int escalationId)
        {
            return await _context.Slaescalations
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
                    .ThenInclude(emp => emp.Userauthentication)   
                .FirstOrDefaultAsync(e => e.EscalationId == escalationId);
        }

        public async Task<List<Slaescalation>> GetAllAsync()
        {
            return await _context.Slaescalations
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
                    .ThenInclude(emp => emp.Userauthentication)   
                .OrderByDescending(e => e.SubmittedAt)
                .ToListAsync();
        }

        public async Task<List<Slaescalation>> GetByEmployeeUserIdAsync(int EmployeeUserId)
        {
            return await _context.Slaescalations
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
                .Where(e => e.Sla.EmployeeId == EmployeeUserId)
                .OrderByDescending(e => e.SubmittedAt)
                .ToListAsync();
        }

        public async Task<List<Slaescalation>> GetBySlaIdAsync(int slaId)
        {
            return await _context.Slaescalations
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
                    .ThenInclude(emp => emp.Userauthentication)   
                .Where(e => e.Slaid == slaId)
                .OrderByDescending(e => e.SubmittedAt)
                .ToListAsync();
        }

        public async Task<List<Slaescalation>> GetByEscalationLevelAsync(string escalationLevel)
        {
            return await _context.Slaescalations
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
                .Where(e => e.EscalationLevel == escalationLevel)
                .OrderByDescending(e => e.SubmittedAt)
                .ToListAsync();
        }

        public async Task<List<Slaescalation>> GetByEscalationStatusAsync(string escalationStatus)
        {
            return await _context.Slaescalations
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
                .Where(e => e.EscalationStatus == escalationStatus)
                .OrderByDescending(e => e.SubmittedAt)
                .ToListAsync();
        }
    }
}
