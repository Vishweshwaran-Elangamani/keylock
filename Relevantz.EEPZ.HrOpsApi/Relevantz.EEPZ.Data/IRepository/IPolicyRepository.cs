using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.Entities;
namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IPolicyRepository
    {
        Task<Organizationalpolicy> CreatePolicyAsync(Organizationalpolicy policy);
        Task<List<Organizationalpolicy>> GetAllPoliciesAsync();
        Task<List<Organizationalpolicy>> GetActivePoliciesAsync();
        Task<List<Organizationalpolicy>> GetInactivePoliciesAsync();
        Task<List<Organizationalpolicy>> GetPublishedPoliciesAsync();   
        Task<List<Organizationalpolicy>> GetDraftPoliciesAsync();  
        Task<Organizationalpolicy?> GetPolicyByIdAsync(int policyId);
        Task<Organizationalpolicy?> GetPolicyByNameAsync(string policyName);
        Task<bool> PolicyNameExistsAsync(string policyName, int? excludePolicyId = null);
        Task<Organizationalpolicy> UpdatePolicyAsync(Organizationalpolicy policy);
        Task<bool> DeletePolicyAsync(int policyId);
        Task<List<Organizationalpolicy>> GetPoliciesByCategoryAsync(string category);
        Task<int> GetTotalPoliciesCountAsync();
        Task<int> GetActivePoliciesCountAsync();
    }
}
