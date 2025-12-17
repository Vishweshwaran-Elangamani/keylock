using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repositories.Interface
{
    public interface ILnDHRRepository
    {
        Task<(List<Employee> Items, int TotalCount)> GetAllOrganizationEmployeesAsync(
            string? searchTerm,
            int pageNumber,
            int pageSize
        );
        Task<(List<Lndassignment> Items, int TotalCount)> GetAllOrganizationAssignmentsAsync(
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        );
        Task<List<Lndassignment>> GetAllOrganizationAssignmentsForExportAsync(
            string? statusFilter,
            string? searchTerm,
            string? sortField,
            string? sortOrder
        );
        Task<(List<Lndemployeeskillmapper> Items, int TotalCount)> GetEmployeeSkillsByIdAsync(
            int employeeId,
            string? searchTerm,
            string? sortBy,
            int pageNumber,
            int pageSize
        );
        Task<int> SaveChangesAsync();
    }
}
