using Relevantz.EEPZ.Common.Entities;
namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IChangeRequestRepository
    {
        Task<Changerequest?> GetByIdAsync(int requestId);
        Task<List<Changerequest>> GetByEmployeeIdAsync(int employeeId);
        Task<List<Changerequest>> GetPendingRequestsAsync();
        Task<List<Changerequest>> GetAllAsync();
        Task<Changerequest> CreateAsync(Changerequest Changerequest);
        Task<Changerequest> UpdateAsync(Changerequest Changerequest);
        Task<bool> DeleteAsync(int requestId);
        Task<List<Changerequest>> GetByStatusAsync(string status);
        Task<bool> IsEmailAlreadyExistsAsync(string email, int excludeUserId);
        Task<bool> IsUsernameAlreadyExistsAsync(string username, int excludeUserId);
        Task<bool> IsEmployeeCompanyIdExistsAsync(string employeeCompanyId, int excludeEmployeeId);
    }
}
