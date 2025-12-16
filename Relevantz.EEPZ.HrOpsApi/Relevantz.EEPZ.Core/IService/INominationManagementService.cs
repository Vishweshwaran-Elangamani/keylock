using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
 
namespace Relevantz.EEPZ.Core.IService
{
    public interface INominationManagementService
    {
        Task<ApiResponseDto<NominationResponseDto>> CreateNominationAsync(CreateNominationRequestDto request);
        Task<ApiResponseDto<NominationResponseDto>> ReviewNominationAsync(ReviewNominationRequestDto request);
        Task<ApiResponseDto<NominationResponseDto>> GetNominationByIdAsync(int nominationId);
        Task<ApiResponseDto<List<NominationResponseDto>>> GetAllNominationsAsync();
        Task<ApiResponseDto<List<NominationResponseDto>>> GetNominationsByStatusAsync(string status);
        Task<ApiResponseDto<List<NominationResponseDto>>> GetNominationsByOpportunityAsync(int opportunityId);
        Task<ApiResponseDto<List<NominationResponseDto>>> GetPendingReviewNominationsAsync();
    }
}
 
 