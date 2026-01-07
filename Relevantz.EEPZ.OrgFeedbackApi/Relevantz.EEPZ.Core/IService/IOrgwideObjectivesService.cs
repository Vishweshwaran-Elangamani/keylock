using Relevantz.EEPZ.Common.Models; 

namespace Relevantz.EEPZ.Core.IService
{
    public interface IOrgwideObjectivesService
    {
        Task<ApiResponse<List<OrgObjectiveDto>>> GetAllObjectivesAsync();
        Task<ApiResponse<List<OrgObjectiveDto>>> GetAllObjectivesForDropdownAsync();
        Task<ApiResponse<OrgObjectiveDto>> GetObjectiveByIdAsync(int objectiveId);
        Task<ApiResponse<List<OrgObjectiveDto>>> GetActiveObjectivesAsync();
        Task<ApiResponse<List<OrgObjectiveDto>>> GetObjectivesByStatusAsync(string status);
    }
}
