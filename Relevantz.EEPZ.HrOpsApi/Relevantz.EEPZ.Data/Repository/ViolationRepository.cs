using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;


namespace Relevantz.EEPZ.Data.Repository
{
    public class ViolationRepository : IViolationRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<ViolationRepository> _logger;


        public ViolationRepository(EEPZDbContext context, ILogger<ViolationRepository> logger)
        {
            _context = context;
            _logger = logger;
        }


        public async Task<Policyviolation> CreateViolationAsync(Policyviolation violation)
        {
            _context.Policyviolations.Add(violation);
            await _context.SaveChangesAsync();


            EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.ViolationCreated, violation.ViolationId);


            return violation;
        }


        public async Task<Policyviolation?> GetViolationByIdAsync(int violationId)
        {
            if (violationId <= 0)
                return null;


            return await BaseQuery()
                .FirstOrDefaultAsync(v => v.ViolationId == violationId);
        }


        public async Task<List<Policyviolation>> GetAllViolationsAsync()
        {
            return await BaseQuery()
                .OrderByDescending(v => v.ReportedDate)
                .ToListAsync();
        }


        public async Task<List<Policyviolation>> GetViolationsByEmployeeAsync(int employeeUserId)
        {
            if (employeeUserId <= 0)
                return new List<Policyviolation>();


            return await BaseQuery()
                .Where(v => v.EmployeeUserId == employeeUserId)
                .OrderByDescending(v => v.ReportedDate)
                .ToListAsync();
        }


        public async Task<List<Policyviolation>> GetViolationsByPolicyAsync(int policyId)
        {
            if (policyId <= 0)
                return new List<Policyviolation>();


            return await BaseQuery()
                .Where(v => v.PolicyId == policyId)
                .OrderByDescending(v => v.ReportedDate)
                .ToListAsync();
        }


        public async Task<List<Policyviolation>> GetViolationsBySeverityAsync(string severity)
        {
            if (string.IsNullOrWhiteSpace(severity))
                return new List<Policyviolation>();


            return await BaseQuery()
                .Where(v => v.Severity == severity)
                .OrderByDescending(v => v.ReportedDate)
                .ToListAsync();
        }


        public async Task<List<Policyviolation>> GetViolationsByStatusAsync(string status)
        {
            if (string.IsNullOrWhiteSpace(status))
                return new List<Policyviolation>();


            return await BaseQuery()
                .Where(v => v.Status == status)
                .OrderByDescending(v => v.ReportedDate)
                .ToListAsync();
        }


        public async Task<Policyviolation> UpdateViolationAsync(Policyviolation violation)
        {
            var existingViolation = await _context.Policyviolations.FindAsync(violation.ViolationId);
            if (existingViolation == null)
            {
                EEPZBusinessLog.LogRepositoryWarning(RepositoryMessages.ViolationNotFound, violation.ViolationId);
                throw new InvalidOperationException($"Violation with ID {violation.ViolationId} not found");
            }


            _context.Policyviolations.Update(violation);
            await _context.SaveChangesAsync();


            EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.ViolationUpdated, violation.ViolationId);


            return violation;
        }


        public async Task<bool> ResolveViolationAsync(int violationId, string resolutionNotes)
        {
            if (violationId <= 0)
                return false;


            var violation = await _context.Policyviolations.FindAsync(violationId);
            if (violation == null)
                return false;


            violation.Status = "Resolved";
            violation.ResolutionNotes = resolutionNotes;


            await _context.SaveChangesAsync();


            EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.ViolationResolved, violationId);


            return true;
        }


        public async Task<List<Policyviolation>> GetViolationsTrendsAsync(int months)
        {
            if (months <= 0)
                months = 6;


            var startDate = DateOnly.FromDateTime(DateTime.Now.AddMonths(-months));


            return await BaseQuery()
                .Where(v => v.ReportedDate >= startDate)
                .OrderBy(v => v.ReportedDate)
                .ToListAsync();
        }


        public async Task<Dictionary<string, int>> GetViolationCountBySeverityAsync()
        {
            return await _context.Policyviolations
                .GroupBy(v => v.Severity ?? "Unknown")
                .Select(g => new { Severity = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Severity, x => x.Count);
        }


        public async Task<Dictionary<string, int>> GetViolationCountByStatusAsync()
        {
            return await _context.Policyviolations
                .GroupBy(v => v.Status ?? "Unknown")
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Status, x => x.Count);
        }


        public async Task<int> GetTotalViolationsCountAsync()
        {
            return await _context.Policyviolations.CountAsync();
        }


        public async Task<int> GetActiveViolationsCountAsync()
        {
            return await _context.Policyviolations
                .CountAsync(v => v.Status == "Reported" || v.Status == "Under Investigation");
        }


        public async Task<int> GetResolvedViolationsCountAsync()
        {
            return await _context.Policyviolations
                .CountAsync(v => v.Status == "Resolved");
        }


        private IQueryable<Policyviolation> BaseQuery()
        {
            return _context.Policyviolations
                .Include(v => v.EmployeeUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(v => v.Policy)
                .Include(v => v.ReportedByUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile);
        }
    }
}
