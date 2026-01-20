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
            try
            {
                policy.CreatedAt = DateTime.Now;
                policy.UpdatedAt = DateTime.Now;
                
                await _context.Organizationalpolicies.AddAsync(policy);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation(RepositoryMessages.PolicyCreated, policy.PolicyId);
                
                return policy;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorCreatingPolicy);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorCreatingPolicy);
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingAllPolicies);
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingActivePolicies);
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingInactivePolicies);
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingPublishedPolicies);
                throw;
            }
        }

        public async Task<List<Organizationalpolicy>> GetDraftPoliciesAsync()
        {
            try
            {
                return await BaseQuery()
                    .Where(p => !p.IsPublished)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingDraftPolicies);
                throw;
            }
        }

        public async Task<Organizationalpolicy?> GetPolicyByIdAsync(int policyId)
        {
            try
            {
                if (policyId <= 0)
                    return null;

                return await _context.Organizationalpolicies
                    .Include(p => p.CreatedByUser)
                    .Include(p => p.Policyviolations)
                    .FirstOrDefaultAsync(p => p.PolicyId == policyId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingPolicy, policyId);
                throw;
            }
        }

        public async Task<Organizationalpolicy?> GetPolicyByNameAsync(string policyName)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(policyName))
                    return null;

                return await _context.Organizationalpolicies
                    .FirstOrDefaultAsync(p => p.PolicyName.ToLower() == policyName.ToLower());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingPolicyByName, policyName);
                throw;
            }
        }

        public async Task<bool> PolicyNameExistsAsync(string policyName, int? excludePolicyId = null)
        {
            try
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
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorCheckingPolicyNameExists, policyName);
                throw;
            }
        }

        public async Task<Organizationalpolicy> UpdatePolicyAsync(Organizationalpolicy policy)
        {
            try
            {
                // Check if entity exists before updating
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
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorUpdatingPolicy, policy.PolicyId);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorUpdatingPolicy, policy.PolicyId);
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

                // Soft delete - mark as inactive
                policy.Status = "Inactive";
                policy.UpdatedAt = DateTime.Now;
                await _context.SaveChangesAsync();
                
                _logger.LogInformation(RepositoryMessages.PolicyDeleted, policyId);
                
                return true;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorDeletingPolicy, policyId);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorDeletingPolicy, policyId);
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingPoliciesByCategory, category);
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
                _logger.LogError(ex, RepositoryMessages.ErrorGettingPoliciesCount);
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
                _logger.LogError(ex, RepositoryMessages.ErrorGettingActivePoliciesCount);
                throw;
            }
        }

        private IQueryable<Organizationalpolicy> BaseQuery()
        {
            return _context.Organizationalpolicies
                .Include(p => p.CreatedByUser);
        }
    }
}
