using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repositories.Interface
{
    public interface ILnDAssignmentRepository
    {
        Task<List<Lndassignment>> GetOverdueAssignments();
        Task<int> MarkAssignmentsAsOverdue();
        Task<Lndassignment?> GetAssignmentById(int assignmentId);
        Task<Lndassignment> AddAssignment(Lndassignment assignment);
        Task UpdateAssignment(Lndassignment assignment);
         Task<(List<AssignmentResponseModel> Items, int TotalCount)> GetMyAssignments(
        int employeeId,
        AssignmentRequestModel request
    );
        Task<(List<AssignmentResponseModel> Items, int TotalCount)> GetTeamAssignments(
        int managerId,
        AssignmentRequestModel request
    );       
    Task<(List<AssignmentResponseModel> Items, int TotalCount)> GetSmeAssignments(
        int smeEmployeeId,
        AssignmentRequestModel request
    );
        Task<List<Lndassignment>> GetAllTeamAssignmentsForExport(
            int managerId,
            ExportAssignmentRequestModel request
        );
    }
}
