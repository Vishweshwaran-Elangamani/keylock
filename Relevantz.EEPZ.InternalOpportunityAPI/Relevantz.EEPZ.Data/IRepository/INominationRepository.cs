using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.IRepository
{
    public interface INominationRepository
    {
        Task<Nomination> CreateAsync(Nomination nomination);
        Task<Nomination?> GetByIdAsync(int id);
        Task<List<Nomination>> GetAllAsync();
        Task<List<Nomination>> GetByOpportunityAsync(int opportunityId);
        Task<List<Nomination>> GetByEmployeeAsync(int employeeUserId);
        Task<List<Nomination>> GetByStatusAsync(string status);
        Task<List<Nomination>> GetPendingManagerReviewAsync();
        Task<List<Nomination>> GetPendingDeptHeadApprovalAsync();
        Task<List<Nomination>> GetPendingDeptHeadApprovalByDeptHeadIdAsync(int deptHeadId);
        Task<List<Nomination>> GetPendingManagerReviewByManagerIdAsync(int managerId);
        Task<Nomination> UpdateAsync(Nomination nomination);
        Task<bool> DeleteAsync(int id);
        Task<bool> ExistsDuplicateAsync(int opportunityId, int employeeId);
        Task AddReviewMetricAsync(Nominationreviewmetric metric);
        
        // NEW: Project-based hierarchy methods
        Task<int?> GetManagerFromProjectAsync(int employeeUserId);
        Task<int?> GetDeptHeadFromProjectAsync(int employeeUserId);
        Task<string?> GetUserRoleNameAsync(int userId);
    }
}
