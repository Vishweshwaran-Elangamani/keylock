using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Data.DBContexts;
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
            try
            {
                _context.Organizationalpolicies.Add(policy);
                await _context.SaveChangesAsync();

                EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.PolicyCreated, policy.PolicyId);

                return policy;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error creating policy", ex);
                throw;
            }
        }

        public async Task<Organizationalpolicy?> GetPolicyByIdAsync(int policyId)
        {
            try
            {
                if (policyId <= 0)
                    return null;

                return await BaseQuery()
                    .FirstOrDefaultAsync(p => p.PolicyId == policyId);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching policy {PolicyId}", ex, policyId);
                throw;
            }
        }

        public async Task<Organizationalpolicy?> GetPolicyByNameAsync(string policyName)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(policyName))
                    return null;

                return await BaseQuery()
                    .FirstOrDefaultAsync(p => p.PolicyName == policyName);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching policy by name {PolicyName}", ex, policyName);
                throw;
            }
        }

        public async Task<List<Organizationalpolicy>> GetAllPoliciesAsync()
        {
            try
            {
                return await BaseQuery()
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching all policies", ex);
                throw;
            }
        }

        public async Task<List<Organizationalpolicy>> GetActivePoliciesAsync()
        {
            try
            {
                return await BaseQuery()
                    .Where(p => p.Status == "Active")
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching active policies", ex);
                throw;
            }
        }

        public async Task<List<Organizationalpolicy>> GetInactivePoliciesAsync()
        {
            try
            {
                return await BaseQuery()
                    .Where(p => p.Status == "Inactive")
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching inactive policies", ex);
                throw;
            }
        }

        public async Task<List<Organizationalpolicy>> GetPublishedPoliciesAsync()
        {
            try
            {
                return await BaseQuery()
                    .Where(p => p.IsPublished)
                    .OrderByDescending(p => p.PublishedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching published policies", ex);
                throw;
            }
        }

        public async Task<List<Organizationalpolicy>> GetDraftPoliciesAsync()
        {
            try
            {
                return await BaseQuery()
                    .Where(p => !p.IsPublished || p.Status == "Draft")
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching draft policies", ex);
                throw;
            }
        }

        public async Task<List<Organizationalpolicy>> GetPoliciesByCategoryAsync(string category)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(category))
                    return new List<Organizationalpolicy>();

                return await BaseQuery()
                    .Where(p => p.Category == category)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching policies by category {Category}", ex, category);
                throw;
            }
        }

        public async Task<Organizationalpolicy> UpdatePolicyAsync(Organizationalpolicy policy)
        {
            try
            {
                var existingPolicy = await _context.Organizationalpolicies.FindAsync(policy.PolicyId);
                if (existingPolicy == null)
                {
                    EEPZBusinessLog.LogRepositoryWarning(RepositoryMessages.PolicyNotFound, policy.PolicyId);
                    throw new InvalidOperationException($"Policy with ID {policy.PolicyId} not found");
                }

                _context.Organizationalpolicies.Update(policy);
                await _context.SaveChangesAsync();

                EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.PolicyUpdated, policy.PolicyId);

                return policy;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error updating policy {PolicyId}", ex, policy.PolicyId);
                throw;
            }
        }

        public async Task<bool> DeletePolicyAsync(int policyId)
        {
            try
            {
                if (policyId <= 0)
                    return false;

                var policy = await _context.Organizationalpolicies.FindAsync(policyId);
                if (policy == null)
                    return false;

                _context.Organizationalpolicies.Remove(policy);
                await _context.SaveChangesAsync();

                EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.PolicyDeleted, policyId);

                return true;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error deleting policy {PolicyId}", ex, policyId);
                throw;
            }
        }

        public async Task<bool> PolicyNameExistsAsync(string policyName, int? excludePolicyId = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(policyName))
                    return false;

                var query = _context.Organizationalpolicies
                    .Where(p => p.PolicyName == policyName);

                if (excludePolicyId.HasValue)
                {
                    query = query.Where(p => p.PolicyId != excludePolicyId.Value);
                }

                return await query.AnyAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error checking policy name existence {PolicyName}", ex, policyName);
                throw;
            }
        }

        public async Task<int> GetTotalPoliciesCountAsync()
        {
            try
            {
                return await _context.Organizationalpolicies.CountAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching total policies count", ex);
                throw;
            }
        }

        public async Task<int> GetActivePoliciesCountAsync()
        {
            try
            {
                return await _context.Organizationalpolicies
                    .CountAsync(p => p.Status == "Active");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching active policies count", ex);
                throw;
            }
        }

        private IQueryable<Organizationalpolicy> BaseQuery()
        {
            return _context.Organizationalpolicies
                .Include(p => p.CreatedByUser)
                .Include(p => p.PublishedByNavigation);
        }
    }
}
