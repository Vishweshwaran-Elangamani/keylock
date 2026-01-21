using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IOrgwideObjectivesService
    {
        Task<List<OrgObjectiveResponseDto>> GetAllObjectivesAsync();
        Task<List<OrgObjectiveResponseDto>> GetAllObjectivesForDropdownAsync();
        Task<OrgObjectiveResponseDto?> GetObjectiveByIdAsync(int objectiveId);
        Task<List<OrgObjectiveResponseDto>> GetActiveObjectivesAsync();
        Task<List<OrgObjectiveResponseDto>> GetObjectivesByStatusAsync(string status);
    }
}
