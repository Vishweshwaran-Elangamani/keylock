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
            try
            {
                _context.Policyviolations.Add(violation);
                await _context.SaveChangesAsync();

                EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.ViolationCreated, violation.ViolationId);

                return violation;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error creating violation", ex);
                throw;
            }
        }

        public async Task<Policyviolation?> GetViolationByIdAsync(int violationId)
        {
            try
            {
                if (violationId <= 0)
                    return null;

                return await BaseQuery()
                    .FirstOrDefaultAsync(v => v.ViolationId == violationId);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching violation {ViolationId}", ex, violationId);
                throw;
            }
        }

        public async Task<List<Policyviolation>> GetAllViolationsAsync()
        {
            try
            {
                return await BaseQuery()
                    .OrderByDescending(v => v.ReportedDate)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching all violations", ex);
                throw;
            }
        }

        public async Task<List<Policyviolation>> GetViolationsByEmployeeAsync(int employeeUserId)
        {
            try
            {
                if (employeeUserId <= 0)
                    return new List<Policyviolation>();

                return await BaseQuery()
                    .Where(v => v.EmployeeUserId == employeeUserId)
                    .OrderByDescending(v => v.ReportedDate)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching violations for employee {EmployeeUserId}", ex, employeeUserId);
                throw;
            }
        }

        public async Task<List<Policyviolation>> GetViolationsByPolicyAsync(int policyId)
        {
            try
            {
                if (policyId <= 0)
                    return new List<Policyviolation>();

                return await BaseQuery()
                    .Where(v => v.PolicyId == policyId)
                    .OrderByDescending(v => v.ReportedDate)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching violations for policy {PolicyId}", ex, policyId);
                throw;
            }
        }

        public async Task<List<Policyviolation>> GetViolationsBySeverityAsync(string severity)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(severity))
                    return new List<Policyviolation>();

                return await BaseQuery()
                    .Where(v => v.Severity == severity)
                    .OrderByDescending(v => v.ReportedDate)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching violations by severity {Severity}", ex, severity);
                throw;
            }
        }

        public async Task<List<Policyviolation>> GetViolationsByStatusAsync(string status)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(status))
                    return new List<Policyviolation>();

                return await BaseQuery()
                    .Where(v => v.Status == status)
                    .OrderByDescending(v => v.ReportedDate)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching violations by status {Status}", ex, status);
                throw;
            }
        }

        public async Task<Policyviolation> UpdateViolationAsync(Policyviolation violation)
        {
            try
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
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error updating violation {ViolationId}", ex, violation.ViolationId);
                throw;
            }
        }

        public async Task<bool> ResolveViolationAsync(int violationId, string resolutionNotes)
        {
            try
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
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error resolving violation {ViolationId}", ex, violationId);
                throw;
            }
        }

        public async Task<List<Policyviolation>> GetViolationsTrendsAsync(int months)
        {
            try
            {
                if (months <= 0)
                    months = 6;

                var startDate = DateOnly.FromDateTime(DateTime.Now.AddMonths(-months));

                return await BaseQuery()
                    .Where(v => v.ReportedDate >= startDate)
                    .OrderBy(v => v.ReportedDate)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching violations trends for {Months} months", ex, months);
                throw;
            }
        }

        public async Task<Dictionary<string, int>> GetViolationCountBySeverityAsync()
        {
            try
            {
                return await _context.Policyviolations
                    .GroupBy(v => v.Severity ?? "Unknown")
                    .Select(g => new { Severity = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.Severity, x => x.Count);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching violation count by severity", ex);
                throw;
            }
        }

        public async Task<Dictionary<string, int>> GetViolationCountByStatusAsync()
        {
            try
            {
                return await _context.Policyviolations
                    .GroupBy(v => v.Status ?? "Unknown")
                    .Select(g => new { Status = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.Status, x => x.Count);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching violation count by status", ex);
                throw;
            }
        }

        public async Task<int> GetTotalViolationsCountAsync()
        {
            try
            {
                return await _context.Policyviolations.CountAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching total violations count", ex);
                throw;
            }
        }

        public async Task<int> GetActiveViolationsCountAsync()
        {
            try
            {
                return await _context.Policyviolations
                    .CountAsync(v => v.Status == "Reported" || v.Status == "Under Investigation");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching active violations count", ex);
                throw;
            }
        }

        public async Task<int> GetResolvedViolationsCountAsync()
        {
            try
            {
                return await _context.Policyviolations
                    .CountAsync(v => v.Status == "Resolved");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching resolved violations count", ex);
                throw;
            }
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
