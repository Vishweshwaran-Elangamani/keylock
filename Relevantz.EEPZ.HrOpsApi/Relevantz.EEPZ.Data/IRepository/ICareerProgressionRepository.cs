using Relevantz.EEPZ.Common.Entities;
namespace Relevantz.EEPZ.Data.IRepository
{
    public interface ICareerProgressionRepository
    {
        Task<Promotion?> GetByIdAsync(int promotionId);
        Task<List<Promotion>> GetAllAsync();
        Task<List<Promotion>> GetByEmployeeUserIdAsync(int EmployeeUserId);
        Task<List<Promotion>> GetByStatusAsync(string status);
        Task<Promotion> CreateAsync(Promotion promotion);
        Task<Promotion> UpdateAsync(Promotion promotion);
        Task<bool> HasPendingPromotionAsync(int EmployeeUserId);
    }
}
