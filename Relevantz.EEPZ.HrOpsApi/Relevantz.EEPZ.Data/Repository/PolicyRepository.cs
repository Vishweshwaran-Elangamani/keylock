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
            _context.Organizationalpolicies.Add(policy);
            await _context.SaveChangesAsync();


            EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.PolicyCreated, policy.PolicyId);


            return policy;
        }


        public async Task<Organizationalpolicy?> GetPolicyByIdAsync(int policyId)
        {
            if (policyId <= 0)
                return null;


            return await BaseQuery()
                .FirstOrDefaultAsync(p => p.PolicyId == policyId);
        }


        public async Task<Organizationalpolicy?> GetPolicyByNameAsync(string policyName)
        {
            if (string.IsNullOrWhiteSpace(policyName))
                return null;


            return await BaseQuery()
                .FirstOrDefaultAsync(p => p.PolicyName == policyName);
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
                .Where(p => !p.IsPublished || p.Status == "Draft")
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
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


        public async Task<Organizationalpolicy> UpdatePolicyAsync(Organizationalpolicy policy)
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


        public async Task<bool> DeletePolicyAsync(int policyId)
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


        public async Task<bool> PolicyNameExistsAsync(string policyName, int? excludePolicyId = null)
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
                .Include(p => p.CreatedByUser)
                .Include(p => p.PublishedByNavigation);
        }
    }
}
