using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IPromotionRepository
    {
        Task<Promotion> CreateAsync(Promotion promotion);
        Task<Promotion?> GetByIdAsync(int id);
        Task<List<Promotion>> GetAllAsync();
        Task<List<Promotion>> GetByEmployeeAsync(int employeeUserId);
        Task<List<Promotion>> GetByStatusAsync(string status);
        Task<List<Promotion>> GetPendingHrApprovalAsync();
        Task<Promotion?> GetByNominationIdAsync(int nominationId);
        
        Task<Promotion> UpdateAsync(Promotion promotion);
        Task<bool> DeleteAsync(int id);
        Task<List<Promotionhistory>> GetPromotionHistoryByEmployeeAsync(int employeeUserId);
        Task<List<Promotion>> GetPendingLeadershipApprovalAsync();
        Task AddPromotionHistoryAsync(Promotionhistory history);

    }
}
