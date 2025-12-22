using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IManagerNominationService
    {
        Task<object> GetRewardTypesAsync();
        Task<object> GetOpportunitiesAsync();
        Task<object> GetOpportunitiesByRewardTypeAsync(int rewardTypeId);
        Task<object> GetNominationParametersAsync(int rewardTypeId);
        Task<object> GetTeamMembersAsync(int managerId);
        Task<object> SubmitNominationAsync(NominationSubmitDto dto);
        Task<object> GetEmployeeNominationsAsync(int employeeId);
        Task<object> GetMyNominationsAsync(int managerId);
        Task<object> GetNominationDetailsAsync(int nominationId);
    }
}
