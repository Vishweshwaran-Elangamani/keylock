using Relevantz.EEPZ.Common.Entities;
namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IUserProfileRepository
    {
        Task<Userprofile?> GetByIdAsync(int profileId);
        Task<Userprofile?> GetByEmployeeIdAsync(int employeeId);
        Task<List<Userprofile>> GetAllAsync();
        Task<Userprofile> CreateAsync(Userprofile profile);
        Task<Userprofile> UpdateAsync(Userprofile profile);
        Task<bool> DeleteAsync(int profileId);
        Task<string?> GetFullNameByEmployeeIdAsync(int employeeId);
    }
}
