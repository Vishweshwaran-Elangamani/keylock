using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IOrgwideObjectivesRepository
    {
        Task<List<OrgObjectiveDto>> GetAllOrgObjectivesAsync();
        Task<List<OrgObjectiveDto>> GetAllOrgObjectivesForDropdownAsync();
        Task<OrgObjectiveDto> GetOrgObjectiveByIdAsync(int objectiveId);
        Task<List<OrgObjectiveDto>> GetActiveOrgObjectivesAsync();
        Task<List<OrgObjectiveDto>> GetOrgObjectivesByStatusAsync(string status);
    }
}
