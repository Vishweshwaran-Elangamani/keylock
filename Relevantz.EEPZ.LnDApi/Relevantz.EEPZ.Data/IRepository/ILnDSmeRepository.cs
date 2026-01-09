using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repositories.Interface
{
    public interface ILnDSmeRepository
    {
        Task<bool> IsEmployeeSmeAsync(int employeeId);
        Task<Lndsme?> GetActiveSmeAsync(int employeeId, int skillId);
        Task<Lndsme> AddSmeAsync(Lndsme sme);
        Task UpdateSmeAsync(Lndsme sme);
        Task<(List<Lndsme> Items, int TotalCount)> GetAvailableSmesWithAssignmentCountsAsync(
            AvailableSmesRequestModel request,
            int maxAssignments
        );
        Task<int> GetSmeInProgressAssignmentCountAsync(int smeId);
        Task<(List<Lndsme> Items, int TotalCount)> GetAllActiveSmesAsync(ActiveSmesRequestModel request);
        Task<List<Lndsme>> GetAllActiveSmesForExportAsync(ExportActiveSmesRequestModel request);
        Task<Lndsme?> GetSmeFromEmployeeId(Dictionary<string, object> assignmentDetails);
    }
}
