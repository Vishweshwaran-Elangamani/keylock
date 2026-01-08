using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.Entities;
namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IViolationRepository
    {
        Task<Policyviolation> CreateViolationAsync(Policyviolation violation);
        Task<List<Policyviolation>> GetAllViolationsAsync();
        Task<Policyviolation?> GetViolationByIdAsync(int violationId);
        Task<List<Policyviolation>> GetViolationsByEmployeeAsync(int EmployeeUserId);
        Task<List<Policyviolation>> GetViolationsByPolicyAsync(int policyId);
        Task<List<Policyviolation>> GetViolationsBySeverityAsync(string severity);
        Task<List<Policyviolation>> GetViolationsByStatusAsync(string status);
        Task<Policyviolation> UpdateViolationAsync(Policyviolation violation);
        Task<bool> ResolveViolationAsync(int violationId, string resolutionNotes);
        Task<int> GetTotalViolationsCountAsync();
        Task<int> GetActiveViolationsCountAsync();
        Task<int> GetResolvedViolationsCountAsync();
        Task<Dictionary<string, int>> GetViolationCountBySeverityAsync();
        Task<Dictionary<string, int>> GetViolationCountByStatusAsync();
        Task<List<Policyviolation>> GetViolationsTrendsAsync(int months);
    }
}
