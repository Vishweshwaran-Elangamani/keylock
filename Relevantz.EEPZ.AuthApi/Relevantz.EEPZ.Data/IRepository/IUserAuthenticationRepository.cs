using Relevantz.EEPZ.Common.Entities;
namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IUserAuthenticationRepository
    {
        Task<Userauthentication?> GetByIdAsync(int userId);
        Task<Userauthentication?> GetByEmailAsync(string email);
        Task<Userauthentication?> GetByEmployeeIdAsync(int employeeId);
        Task<List<Userauthentication>> GetAllAsync();
        Task<Userauthentication> CreateAsync(Userauthentication userAuth);
        Task<Userauthentication> UpdateAsync(Userauthentication userAuth);
        Task<bool> DeleteAsync(int userId);
        Task<bool> EmailExistsAsync(string email);
        Task<List<Userauthentication>> GetLockedAccountsAsync();
        Task UpdateLastLoginAsync(int userId);
        Task<Userauthentication?> GetByEmployeeIdWithDetailsAsync(int employeeId);
    }
}
