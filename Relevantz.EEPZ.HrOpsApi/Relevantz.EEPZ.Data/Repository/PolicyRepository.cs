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
    public class PolicyRepository : IPolicyRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<PolicyRepository> _logger;

        public PolicyRepository(EEPZDbContext context, ILogger<PolicyRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Organizationalpolicy> CreatePolicyAsync(Organizationalpolicy policy)
        {
            policy.CreatedAt = DateTime.Now;
            policy.UpdatedAt = DateTime.Now;

            await _context.Organizationalpolicies.AddAsync(policy);
            await _context.SaveChangesAsync();

            _logger.LogInformation(RepositoryMessages.PolicyCreated, policy.PolicyId);

            return policy;
        }

        public async Task<List<Organizationalpolicy>> GetAllPoliciesAsync()
        {
            return await BaseQuery()
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Organizationalpolicy>> GetActivePoliciesAsync()
        {
            return await BaseQuery()
                .Where(p => p.Status == "Active")
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Organizationalpolicy>> GetInactivePoliciesAsync()
        {
            return await BaseQuery()
                .Where(p => p.Status == "Inactive")
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Organizationalpolicy>> GetPublishedPoliciesAsync()
        {
            return await BaseQuery()
                .Where(p => p.IsPublished)
                .OrderByDescending(p => p.PublishedAt)
                .ToListAsync();
        }

        public async Task<List<Organizationalpolicy>> GetDraftPoliciesAsync()
        {
            return await BaseQuery()
                .Where(p => !p.IsPublished)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<Organizationalpolicy?> GetPolicyByIdAsync(int policyId)
        {
            if (policyId <= 0)
                return null;

            return await _context.Organizationalpolicies
                .Include(p => p.CreatedByUser)
                .Include(p => p.Policyviolations)
                .FirstOrDefaultAsync(p => p.PolicyId == policyId);
        }

        public async Task<Organizationalpolicy?> GetPolicyByNameAsync(string policyName)
        {
            if (string.IsNullOrWhiteSpace(policyName))
                return null;

            return await _context.Organizationalpolicies
                .FirstOrDefaultAsync(p => p.PolicyName.ToLower() == policyName.ToLower());
        }

        public async Task<bool> PolicyNameExistsAsync(string policyName, int? excludePolicyId = null)
        {
            if (string.IsNullOrWhiteSpace(policyName))
                return false;

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
            var existingPolicy = await _context.Organizationalpolicies.FindAsync(policy.PolicyId);
            if (existingPolicy == null)
            {
                _logger.LogWarning(RepositoryMessages.PolicyNotFound, policy.PolicyId);
                throw new InvalidOperationException($"Policy with ID {policy.PolicyId} not found");
            }

            policy.UpdatedAt = DateTime.Now;
            _context.Organizationalpolicies.Update(policy);
            await _context.SaveChangesAsync();

            _logger.LogInformation(RepositoryMessages.PolicyUpdated, policy.PolicyId);

            return policy;
        }

        public async Task<bool> DeletePolicyAsync(int policyId)
        {
            if (policyId <= 0)
                return false;

            var policy = await _context.Organizationalpolicies.FindAsync(policyId);
            if (policy == null)
                return false;

            // Soft delete
            policy.Status = "Inactive";
            policy.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            _logger.LogInformation(RepositoryMessages.PolicyDeleted, policyId);

            return true;
        }

        public async Task<List<Organizationalpolicy>> GetPoliciesByCategoryAsync(string category)
        {
            if (string.IsNullOrWhiteSpace(category))
                return new List<Organizationalpolicy>();

            return await BaseQuery()
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

        private IQueryable<Organizationalpolicy> BaseQuery()
        {
            return _context.Organizationalpolicies
                .Include(p => p.CreatedByUser);
        }
    }
}
