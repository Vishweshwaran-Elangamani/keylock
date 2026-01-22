using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IHRNominationService
    {

Task<object> GetAllManagerNominationsForHRAsync(
    int pageNumber,
    int pageSize,
    string? status,
    int? rewardTypeId,
    string? search,
    DateTimeOffset? fromDate,
    DateTimeOffset? toDate,
    string? sortBy,
    string? sortDir
);
     
        Task<object> GetAllRewardTypesAsync(bool activeOnly);
        Task<object> CreateRewardTypeAsync(CreateRewardTypeDto dto);
        Task<object> UpdateRewardTypeAsync(int rewardTypeId, UpdateRewardTypeDto dto);
        Task<object> GetParametersByRewardTypeAsync(int rewardTypeId);
        Task<object> CreateParameterAsync(CreateParameterDto dto);
        Task<object> UpdateParameterAsync(int parameterId, UpdateParameterDto dto);
        Task<object> DeleteParameterAsync(int parameterId);
        Task<object> GetApprovedProfilesAsync();
        Task<object> GetRejectedProfilesAsync();
        Task<object> GetStatisticsAsync();
        Task<ApiResponse<object>> GetNominationDetailsAsync(int nominationId);
Task<ApiResponse<object>> ApproveNominationsAsync(HRNominationApprovalDto dto);
Task<ApiResponse<object>> RejectNominationsAsync(HRNominationRejectDto dto);

    }
}
