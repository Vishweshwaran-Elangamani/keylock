using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Core.IService
{
    public interface ICareerProgressionService
    {
        Task<ApiResponseDto<PendingNominationCheckDto>> CheckPendingNominationAsync(int employeeUserId);
        Task<ApiResponseDto<PromotionResponseDto>> CreatePromotionAsync(CreatePromotionRequestDto request, int managerId);
        Task<ApiResponseDto<PromotionResponseDto>> UpdatePromotionAsync(UpdatePromotionRequestDto request);
        Task<ApiResponseDto<FavoritismCheckDto>> CheckFavoritismHistoryAsync(int promotionId);
        Task<ApiResponseDto<PromotionResponseDto>> ApprovePromotionAsync(ApprovePromotionRequestDto request);
        Task<ApiResponseDto<PromotionResponseDto>> RejectPromotionAsync(RejectPromotionRequestDto request);
        Task<ApiResponseDto<PayrollResponseDto>> UpdatePayrollForPromotionAsync(UpdatePayrollRequestDto request);
        Task<ApiResponseDto<PromotionResponseDto>> SubmitToLeadershipAsync(int promotionId);
        Task<ApiResponseDto<List<PromotionResponseDto>>> GetAllPromotionsAsync();
        Task<ApiResponseDto<PromotionResponseDto>> GetPromotionByIdAsync(int promotionId);
        Task<ApiResponseDto<List<PromotionResponseDto>>> GetPromotionsByEmployeeAsync(int employeeUserId);
        Task<ApiResponseDto<List<PromotionResponseDto>>> GetPromotionsByStatusAsync(string status);
    }
}
