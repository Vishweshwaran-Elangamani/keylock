using Relevantz.EEPZ.Common.Entities;

using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IFormProgressTrackerService
    {
        Task<object> GetAllAsync();
        Task<object> GetByIdAsync(int id);
        Task<object> GetByAssignmentAsync(int assignmentId);
        Task<object> UpsertAsync(FormProgressTrackerUpdateDto dto);
    }
}
