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
            int skillId,
            string? searchTerm,
            int pageNumber,
            int pageSize,
            int maxAssignments
        );
        Task<int> GetSmeInProgressAssignmentCountAsync(int smeId);
        Task<(List<Lndsme> Items, int TotalCount)> GetAllActiveSmesAsync(
            string? searchTerm,
            int pageNumber,
            int pageSize
        );
        Task<List<Lndsme>> GetAllActiveSmesForExportAsync(string? searchTerm);
        Task<Lndsme?> GetSmeFromEmployeeId(Dictionary<string, object> assignmentDetails);
        
    }
} 