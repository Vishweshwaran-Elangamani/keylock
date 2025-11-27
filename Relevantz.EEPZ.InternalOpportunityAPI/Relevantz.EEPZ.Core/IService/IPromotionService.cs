using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.ViewModels.Promotion.Request;
using Relevantz.EEPZ.Common.ViewModels.Promotion.Response;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IPromotionService
    {
        Task<PromotionResponseDto> CreatePromotionAsync(CreatePromotionRequestDto request, int createdByUserId);
        Task<PromotionResponseDto> GetPromotionByIdAsync(int id);
        Task<List<PromotionResponseDto>> GetAllPromotionsAsync();
        Task<List<PromotionResponseDto>> GetPromotionsByEmployeeAsync(int employeeUserId);
        Task<List<PromotionResponseDto>> GetPendingHrApprovalAsync();
        Task<PromotionResponseDto> ApprovePromotionAsync(int promotionId, int approvedByUserId, string remarks);
        Task<PromotionResponseDto> RejectPromotionAsync(int promotionId, int rejectedByUserId);
        Task<List<PromotionResponseDto>> GetPromotionHistoryByEmployeeAsync(int employeeUserId);
        Task<List<PromotionResponseDto>> GetPendingLeadershipApprovalAsync();
        Task<PromotionResponseDto> ApprovePromotionByLeadershipAsync(int promotionId, int approvedByUserId, string remarks);
        Task<PromotionResponseDto> RejectPromotionByLeadershipAsync(int promotionId, int rejectedByUserId, string remarks);

    }
}
