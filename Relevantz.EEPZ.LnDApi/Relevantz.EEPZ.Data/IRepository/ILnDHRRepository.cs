using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repositories.Interface
{
    public interface ILnDHRRepository
    {
        Task<(List<Employee> Items, int TotalCount)> GetAllOrganizationEmployeesAsync(
            OrganizationEmployeesRequestModel request
        );
        Task<(List<Lndassignment> Items, int TotalCount)> GetAllOrganizationAssignmentsAsync(
            OrganizationAssignmentsRequestModel request
        );
        Task<List<Lndassignment>> GetAllOrganizationAssignmentsForExportAsync(
            ExportOrganizationAssignmentsRequestModel request
        );
        Task<(List<Lndemployeeskillmapper> Items, int TotalCount)> GetEmployeeSkillsByIdAsync(
            int employeeId,
            EmployeeSkillsByIdRequestModel request
        );
    }
}
