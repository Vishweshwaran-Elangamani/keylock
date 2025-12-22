using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IDepartmentHeadNominationRepository
    {
        Task<Employeedetailsmaster?> GetDepartmentHeadDetailsAsync(int deptHeadEmployeeId);
        Task<List<Recognitionstatus>> GetApprovedManagerNominationsAsync();
        Task<Recognitionstatus?> GetNominationByIdAsync(int nominationId);
        Task<Recognitiondetail?> GetOpportunityByIdAsync(int opportunityId);
        Task<Employeedetailsmaster?> GetEmployeeDepartmentDetailsAsync(int employeeId);
        Task<List<object>> GetNominationParameterValuesAsync(int nominationId);
        Task<List<Recognitionstatus>> GetApprovedNominationsAsync();
    }
}
