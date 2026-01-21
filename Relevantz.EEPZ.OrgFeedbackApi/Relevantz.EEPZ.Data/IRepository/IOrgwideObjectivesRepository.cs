using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IOrgwideObjectivesRepository
    {
        Task<List<OrgObjectiveResponseDto>> GetAllOrgObjectivesAsync();

        Task<List<OrgObjectiveResponseDto>> GetAllOrgObjectivesForDropdownAsync();

        Task<OrgObjectiveResponseDto?> GetOrgObjectiveByIdAsync(int objectiveId);

        Task<List<OrgObjectiveResponseDto>> GetActiveOrgObjectivesAsync();

        Task<List<OrgObjectiveResponseDto>> GetOrgObjectivesByStatusAsync(string status);
    }
}
