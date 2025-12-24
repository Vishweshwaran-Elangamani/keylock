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
    public class PolicyRepository : IPolicyRepository
    {
        private readonly EEPZDbContext _context;

        public PolicyRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Organizationalpolicy> CreatePolicyAsync(Organizationalpolicy policy)
        {
            policy.CreatedAt = DateTime.Now;
            policy.UpdatedAt = DateTime.Now;

            await _context.Organizationalpolicies.AddAsync(policy);
            await _context.SaveChangesAsync();
            return policy;
        }

        public async Task<List<Organizationalpolicy>> GetAllPoliciesAsync()
        {
            return await _context.Organizationalpolicies
                .Include(p => p.CreatedByUser)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Organizationalpolicy>> GetActivePoliciesAsync()
        {
            return await _context.Organizationalpolicies
                .Include(p => p.CreatedByUser)
                .Where(p => p.Status == "Active")
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Organizationalpolicy>> GetInactivePoliciesAsync()
        {
            return await _context.Organizationalpolicies
                .Include(p => p.CreatedByUser)
                .Where(p => p.Status == "Inactive")
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Organizationalpolicy>> GetPublishedPoliciesAsync()
        {
            return await _context.Organizationalpolicies
                .Include(p => p.CreatedByUser)
                .Where(p => p.IsPublished)
                .OrderByDescending(p => p.PublishedAt)
                .ToListAsync();
        }

        public async Task<List<Organizationalpolicy>> GetDraftPoliciesAsync()
        {
            return await _context.Organizationalpolicies
                .Include(p => p.CreatedByUser)
                .Where(p => !p.IsPublished)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<Organizationalpolicy?> GetPolicyByIdAsync(int policyId)
        {
            return await _context.Organizationalpolicies
                .Include(p => p.CreatedByUser)
                .Include(p => p.Policyviolations)
                .FirstOrDefaultAsync(p => p.PolicyId == policyId);
        }

        public async Task<Organizationalpolicy?> GetPolicyByNameAsync(string policyName)
        {
            return await _context.Organizationalpolicies
                .FirstOrDefaultAsync(p => p.PolicyName.ToLower() == policyName.ToLower());
        }

        public async Task<bool> PolicyNameExistsAsync(string policyName, int? excludePolicyId = null)
        {
            if (excludePolicyId.HasValue)
            {
                return await _context.Organizationalpolicies
                    .AnyAsync(p => p.PolicyName.ToLower() == policyName.ToLower()
                                && p.PolicyId != excludePolicyId.Value);
            }

            return await _context.Organizationalpolicies
                .AnyAsync(p => p.PolicyName.ToLower() == policyName.ToLower());
        }

        public async Task<Organizationalpolicy> UpdatePolicyAsync(Organizationalpolicy policy)
        {
            policy.UpdatedAt = DateTime.Now;
            _context.Organizationalpolicies.Update(policy);
            await _context.SaveChangesAsync();
            return policy;
        }

        public async Task<bool> DeletePolicyAsync(int policyId)
        {
            var policy = await _context.Organizationalpolicies.FindAsync(policyId);
            if (policy == null)
                return false;

            // Soft delete - mark as inactive
            policy.Status = "Inactive";
            policy.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<Organizationalpolicy>> GetPoliciesByCategoryAsync(string category)
        {
            return await _context.Organizationalpolicies
                .Include(p => p.CreatedByUser)
                .Where(p => p.Category == category)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<int> GetTotalPoliciesCountAsync()
        {
            return await _context.Organizationalpolicies.CountAsync();
        }

        public async Task<int> GetActivePoliciesCountAsync()
        {
            return await _context.Organizationalpolicies
                .CountAsync(p => p.Status == "Active");
        }
    }

}
