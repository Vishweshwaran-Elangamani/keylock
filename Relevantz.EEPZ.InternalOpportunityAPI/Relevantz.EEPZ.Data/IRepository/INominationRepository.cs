using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.IRepository
{
    public interface INominationRepository
    {
        Task<Nomination> CreateAsync(Nomination nomination);
        Task<Nomination> UpdateAsync(Nomination nomination);
        Task<Nomination?> GetByIdAsync(int id);
        Task<List<Nomination>> GetByEmployeeAsync(int employeeId);
        Task<List<Nomination>> GetAllAsync();
        Task<List<Nomination>> GetByStatusAsync(string status);
        Task<List<Nomination>> GetPendingManagerReviewByManagerIdAsync(int managerId);
        Task<List<Nomination>> GetPendingDeptHeadApprovalByDeptHeadIdAsync(int deptHeadId);
        Task<List<Nomination>> GetNominationHistoryByUserIdAsync(int userId, string? status);

        Task<List<Nomination>> GetManagerTeamNominationsAsync(int managerId, string? status);

        Task<bool> ExistsDuplicateAsync(int opportunityId, int employeeId);
        Task<int?> GetManagerFromProjectAsync(int employeeId);
        Task<int?> GetDeptHeadFromProjectAsync(int employeeId);
        Task AddReviewMetricAsync(Nominationreviewmetric metric);
        Task<int?> GetManagerFromReportingHierarchyAsync(int employeeId);
        Task<int?> GetFirstAvailableManagerAsync();
        Task<int?> GetFirstAvailableDeptHeadAsync();

    }
}
