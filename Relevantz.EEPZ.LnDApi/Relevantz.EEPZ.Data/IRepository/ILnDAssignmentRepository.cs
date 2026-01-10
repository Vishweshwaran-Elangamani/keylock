using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repositories.Interface
{
    public interface ILnDAssignmentRepository
    {
        Task<List<Lndassignment>> GetOverdueAssignmentsAsync();
        Task<int> MarkAssignmentsAsOverdueAsync();
        Task<Lndassignment?> GetAssignmentByIdAsync(int assignmentId);
        Task<Lndassignment> AddAssignmentAsync(Lndassignment assignment);
        Task UpdateAssignmentAsync(Lndassignment assignment);
        Task<(List<Lndassignment> Items, int TotalCount)> GetMyAssignmentsAsync(
            int employeeId,
            AssignmentRequestModel request
        );
        Task<(List<Lndassignment> Items, int TotalCount)> GetTeamAssignmentsAsync(
            int managerId,
            AssignmentRequestModel request
        );
        Task<(List<Lndassignment> Items, int TotalCount)> GetSmeAssignmentsAsync(
            int smeEmployeeId,
            AssignmentRequestModel request
        );
        Task<List<Lndassignment>> GetAllTeamAssignmentsForExportAsync(
            int managerId,
            ExportAssignmentRequestModel request
        );
    }
}
