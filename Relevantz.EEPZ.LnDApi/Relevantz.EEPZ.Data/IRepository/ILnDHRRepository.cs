using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Data.Repositories.Interface
{
    public interface ILnDHRRepository
    {
        Task<(
            List<SubordinateEmployeeResponseModel> Items,
            int TotalCount
        )> GetAllOrganizationEmployees(OrganizationEmployeesRequestModel request);
        Task<(List<Lndassignment> Items, int TotalCount)> GetAllOrganizationAssignments(
            OrganizationAssignmentsRequestModel request
        );
        Task<List<Lndassignment>> GetAllOrganizationAssignmentsForExport(
            ExportOrganizationAssignmentsRequestModel request
        );
        Task<(List<Lndemployeeskillmapper> Items, int TotalCount)> GetEmployeeSkillsById(
            int employeeId,
            EmployeeSkillsByIdRequestModel request
        );
    }
}
