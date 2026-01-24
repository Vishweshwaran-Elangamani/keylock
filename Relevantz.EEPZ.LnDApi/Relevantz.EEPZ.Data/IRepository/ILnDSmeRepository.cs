using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Data.Repositories.Interface
{
    public interface ILnDSmeRepository
    {
        Task<bool> IsEmployeeSme(int employeeId);
        Task<Lndsme?> GetActiveSme(int employeeId, int skillId);
        Task<Lndsme> AddSme(Lndsme sme);
        Task UpdateSme(Lndsme sme);
        Task<(List<Lndsme> Items, int TotalCount)> GetAvailableSmesWithAssignmentCounts(
            AvailableSmesRequestModel request,
            int maxAssignments
        );

        Task<(List<SmeResponseModel> Items, int TotalCount)> GetAllActiveSmes(
            ActiveSmesRequestModel request
        );
        Task<int> GetSmeInProgressAssignmentCount(int smeId);

        Task<List<Lndsme>> GetAllActiveSmesForExport(ExportActiveSmesRequestModel request);
        Task<Lndsme?> GetSmeFromEmployeeId(Dictionary<string, object> assignmentDetails);
    }
}
