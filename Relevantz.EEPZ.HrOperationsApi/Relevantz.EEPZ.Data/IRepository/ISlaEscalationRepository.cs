// File: Data/IRepository/ISlaEscalationRepository.cs
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.IRepository
{
    public interface ISlaEscalationRepository
    {
        Task<Slaescalation?> GetByIdAsync(int escalationId);
        Task<List<Slaescalation>> GetAllAsync();
        Task<List<Slaescalation>> GetByEmployeeUserIdAsync(int EmployeeUserId);
        Task<List<Slaescalation>> GetBySlaIdAsync(int slaId);
        Task<List<Slaescalation>> GetByEscalationLevelAsync(string escalationLevel);
        Task<List<Slaescalation>> GetByEscalationStatusAsync(string escalationStatus);
    }
}
