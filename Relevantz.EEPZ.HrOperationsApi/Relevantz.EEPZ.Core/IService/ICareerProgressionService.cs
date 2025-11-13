using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Core.IService
{
    public interface ICareerProgressionService
    {
        //    Check pending nomination
        Task<ApiResponseDto<PendingNominationCheckDto>> CheckPendingNominationAsync(int employeeUserId);

        //    Create promotion
        Task<ApiResponseDto<PromotionResponseDto>> CreatePromotionAsync(CreatePromotionRequestDto request, int managerId);

        //    Update promotion
        Task<ApiResponseDto<PromotionResponseDto>> UpdatePromotionAsync(UpdatePromotionRequestDto request);

        //    Check favoritism
        Task<ApiResponseDto<FavoritismCheckDto>> CheckFavoritismHistoryAsync(int promotionId);

        //    Approve promotion
        Task<ApiResponseDto<PromotionResponseDto>> ApprovePromotionAsync(ApprovePromotionRequestDto request);

        //    Reject promotion
        Task<ApiResponseDto<PromotionResponseDto>> RejectPromotionAsync(RejectPromotionRequestDto request);

        //    Update payroll
        Task<ApiResponseDto<PayrollResponseDto>> UpdatePayrollForPromotionAsync(UpdatePayrollRequestDto request);

        //    Submit to leadership
        Task<ApiResponseDto<PromotionResponseDto>> SubmitToLeadershipAsync(int promotionId);

        //    Get all promotions
        Task<ApiResponseDto<List<PromotionResponseDto>>> GetAllPromotionsAsync();

        //    Get promotion by ID
        Task<ApiResponseDto<PromotionResponseDto>> GetPromotionByIdAsync(int promotionId);

        //    Get promotions by employee
        Task<ApiResponseDto<List<PromotionResponseDto>>> GetPromotionsByEmployeeAsync(int employeeUserId);

        //    Get promotions by status
        Task<ApiResponseDto<List<PromotionResponseDto>>> GetPromotionsByStatusAsync(string status);
    }
}
