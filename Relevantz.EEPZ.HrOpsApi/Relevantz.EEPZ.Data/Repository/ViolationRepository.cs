using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;

namespace Relevantz.EEPZ.Data.Repository
{
    public class ViolationRepository : IViolationRepository
    {
        private readonly EEPZDbContext _context;

        public ViolationRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Policyviolation> CreateViolationAsync(Policyviolation violation)
        {
            await _context.Policyviolations.AddAsync(violation);
            await _context.SaveChangesAsync();
            return violation;
        }

        public async Task<List<Policyviolation>> GetAllViolationsAsync()
        {
            return await _context.Policyviolations
                .Include(v => v.EmployeeUser)
                .ThenInclude(u => u.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(v => v.Policy)
                .Include(v => v.ReportedByUser)
                .Include(v => v.EscalatedToUser)
                .OrderByDescending(v => v.ReportedDate)
                .ToListAsync();
        }

        public async Task<Policyviolation?> GetViolationByIdAsync(int violationId)
        {
            return await _context.Policyviolations
                .Include(v => v.EmployeeUser)
                .ThenInclude(u => u.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(v => v.Policy)
                .Include(v => v.ReportedByUser)
                .Include(v => v.EscalatedToUser)
                .FirstOrDefaultAsync(v => v.ViolationId == violationId);
        }

        public async Task<List<Policyviolation>> GetViolationsByEmployeeAsync(int EmployeeUserId)
        {
            return await _context.Policyviolations
                .Include(v => v.EmployeeUser)
                .ThenInclude(u => u.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(v => v.Policy)
                .Include(v => v.ReportedByUser)
                .Where(v => v.EmployeeUserId == EmployeeUserId)
                .OrderByDescending(v => v.ReportedDate)
                .ToListAsync();
        }

        public async Task<List<Policyviolation>> GetViolationsByPolicyAsync(int policyId)
        {
            return await _context.Policyviolations
                .Include(v => v.EmployeeUser)
                .ThenInclude(u => u.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(v => v.ReportedByUser)
                .Where(v => v.PolicyId == policyId)
                .OrderByDescending(v => v.ReportedDate)
                .ToListAsync();
        }

        public async Task<List<Policyviolation>> GetViolationsBySeverityAsync(string severity)
        {
            return await _context.Policyviolations
                .Include(v => v.EmployeeUser)
                .ThenInclude(u => u.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(v => v.Policy)
                .Where(v => v.Severity == severity)
                .OrderByDescending(v => v.ReportedDate)
                .ToListAsync();
        }

        public async Task<List<Policyviolation>> GetViolationsByStatusAsync(string status)
        {
            return await _context.Policyviolations
                .Include(v => v.EmployeeUser)
                .ThenInclude(u => u.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(v => v.Policy)
                .Where(v => v.Status == status)
                .OrderByDescending(v => v.ReportedDate)
                .ToListAsync();
        }

        public async Task<Policyviolation> UpdateViolationAsync(Policyviolation violation)
        {
            _context.Policyviolations.Update(violation);
            await _context.SaveChangesAsync();
            return violation;
        }

        public async Task<bool> ResolveViolationAsync(int violationId, string resolutionNotes)
        {
            var violation = await _context.Policyviolations.FindAsync(violationId);
            if (violation == null)
                return false;

            violation.Status = "Resolved";
            violation.ResolutionNotes = resolutionNotes;
            violation.ResolvedAt = DateTime.Now;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetTotalViolationsCountAsync()
        {
            return await _context.Policyviolations.CountAsync();
        }

        public async Task<int> GetActiveViolationsCountAsync()
        {
            return await _context.Policyviolations
                .CountAsync(v => v.Status == "Reported" || v.Status == "UnderReview" || v.Status == "Escalated");
        }

        public async Task<int> GetResolvedViolationsCountAsync()
        {
            return await _context.Policyviolations
                .CountAsync(v => v.Status == "Resolved");
        }

        public async Task<Dictionary<string, int>> GetViolationCountBySeverityAsync()
        {
            return await _context.Policyviolations
                .GroupBy(v => v.Severity)
                .Select(g => new { Severity = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Severity, x => x.Count);
        }

        public async Task<Dictionary<string, int>> GetViolationCountByStatusAsync()
        {
            return await _context.Policyviolations
                .GroupBy(v => v.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Status, x => x.Count);
        }

        public async Task<List<Policyviolation>> GetViolationsTrendsAsync(int months)
        {
            var startDate = DateOnly.FromDateTime(DateTime.Now.AddMonths(-months));

            return await _context.Policyviolations
                .Where(v => v.ReportedDate >= startDate)
                .OrderBy(v => v.ReportedDate)
                .ToListAsync();
        }
    }


}
