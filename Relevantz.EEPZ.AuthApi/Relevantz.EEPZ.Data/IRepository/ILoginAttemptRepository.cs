using Relevantz.EEPZ.Common.Entities;
namespace Relevantz.EEPZ.Data.IRepository
{
    public interface ILoginAttemptRepository
    {
        Task<Loginattempt?> GetByIdAsync(int attemptId);
        Task<List<Loginattempt>> GetByEmailAsync(string email, int limit = 10);
        Task<List<Loginattempt>> GetByUserIdAsync(int userId, int limit = 10);
        Task<Loginattempt> CreateAsync(Loginattempt loginAttempt);
        Task<int> GetFailedAttemptsCountAsync(string email, DateTime fromTime);
        Task<List<Loginattempt>> GetRecentFailedAttemptsAsync(string email, int minutes = 30);
    }
}
