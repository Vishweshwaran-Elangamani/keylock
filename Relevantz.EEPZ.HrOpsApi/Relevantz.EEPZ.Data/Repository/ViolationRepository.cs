using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Constants;
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
                await _context.Policyviolations.AddAsync(violation);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation(RepositoryMessages.ViolationCreated, violation.ViolationId);
                
                return violation;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorCreatingViolation);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorCreatingViolation);
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingAllViolations);
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingViolation, violationId);
                throw;
            }
        }

        public async Task<List<Policyviolation>> GetViolationsByEmployeeAsync(int EmployeeUserId)
        {
            try
            {
                if (EmployeeUserId <= 0)
                    return new List<Policyviolation>();

                return await BaseQuery()
                    .Where(v => v.EmployeeUserId == EmployeeUserId)
                    .OrderByDescending(v => v.ReportedDate)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingViolationsByEmployee, EmployeeUserId);
                throw;
            }
        }

        public async Task<List<Policyviolation>> GetViolationsByPolicyAsync(int policyId)
        {
            try
            {
                if (policyId <= 0)
                    return new List<Policyviolation>();

                return await BasePolicyQuery()
                    .Where(v => v.PolicyId == policyId)
                    .OrderByDescending(v => v.ReportedDate)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingViolationsByPolicy, policyId);
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingViolationsBySeverity, severity);
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingViolationsByStatus, status);
                throw;
            }
        }

        public async Task<Policyviolation> UpdateViolationAsync(Policyviolation violation)
        {
            try
            {
                // Check if entity exists before updating
                var existingViolation = await _context.Policyviolations.FindAsync(violation.ViolationId);
                if (existingViolation == null)
                {
                    _logger.LogWarning(RepositoryMessages.ViolationNotFound, violation.ViolationId);
                    throw new InvalidOperationException($"Violation with ID {violation.ViolationId} not found");
                }

                _context.Policyviolations.Update(violation);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation(RepositoryMessages.ViolationUpdated, violation.ViolationId);
                
                return violation;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorUpdatingViolation, violation.ViolationId);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorUpdatingViolation, violation.ViolationId);
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
                violation.ResolvedAt = DateTime.Now;
                
                await _context.SaveChangesAsync();
                
                _logger.LogInformation(RepositoryMessages.ViolationResolved, violationId);
                
                return true;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorResolvingViolation, violationId);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorResolvingViolation, violationId);
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
                _logger.LogError(ex, RepositoryMessages.ErrorGettingTotalViolationsCount);
                throw;
            }
        }

        public async Task<int> GetActiveViolationsCountAsync()
        {
            try
            {
                return await _context.Policyviolations
                    .CountAsync(v => v.Status == "Reported" || v.Status == "UnderReview" || v.Status == "Escalated");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorGettingActiveViolationsCount);
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
                _logger.LogError(ex, RepositoryMessages.ErrorGettingResolvedViolationsCount);
                throw;
            }
        }

        public async Task<Dictionary<string, int>> GetViolationCountBySeverityAsync()
        {
            try
            {
                return await _context.Policyviolations
                    .GroupBy(v => v.Severity)
                    .Select(g => new { Severity = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.Severity, x => x.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorGettingViolationCountBySeverity);
                throw;
            }
        }

        public async Task<Dictionary<string, int>> GetViolationCountByStatusAsync()
        {
            try
            {
                return await _context.Policyviolations
                    .GroupBy(v => v.Status)
                    .Select(g => new { Status = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.Status, x => x.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorGettingViolationCountByStatus);
                throw;
            }
        }

        public async Task<List<Policyviolation>> GetViolationsTrendsAsync(int months)
        {
            try
            {
                if (months <= 0)
                    return new List<Policyviolation>();

                var startDate = DateOnly.FromDateTime(DateTime.Now.AddMonths(-months));
                
                return await _context.Policyviolations
                    .Where(v => v.ReportedDate >= startDate)
                    .OrderBy(v => v.ReportedDate)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorGettingViolationsTrends, months);
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
                .Include(v => v.EscalatedToUser);
        }

        private IQueryable<Policyviolation> BasePolicyQuery()
        {
            // For GetViolationsByPolicyAsync - excludes Policy include to avoid redundant loading
            return _context.Policyviolations
                .Include(v => v.EmployeeUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(v => v.ReportedByUser);
        }
    }
}
