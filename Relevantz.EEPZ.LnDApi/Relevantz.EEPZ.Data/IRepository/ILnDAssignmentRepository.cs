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
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        );
        Task<(List<Lndassignment> Items, int TotalCount)> GetTeamAssignmentsAsync(
            int managerId,
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        );
        Task<(List<Lndassignment> Items, int TotalCount)> GetSmeAssignmentsAsync(
            int smeEmployeeId,
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        );      
        Task<List<Lndassignment>> GetAllTeamAssignmentsForExportAsync(
            int managerId,
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder
        );
        
    }
}
