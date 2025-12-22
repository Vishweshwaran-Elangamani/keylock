using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IManagerNominationRepository
    {
        Task<List<Rewardtype>> GetVisibleRewardTypesAsync();
        Task<List<Recognitiondetail>> GetActiveOpportunitiesAsync();
        Task<Recognitiondetail?> GetOpportunityByIdAsync(int opportunityId);  
        Task<Rewardtype?> GetRewardTypeByIdAsync(int rewardTypeId);
        Task<Rewardtype?> GetVisibleRewardTypeByIdAsync(int rewardTypeId);
        Task<Department?> GetDepartmentByIdAsync(int departmentId);
        Task<List<Recognitiondetail>> GetActiveOpportunitiesByRewardTypeAsync(int rewardTypeId);
        Task<List<Nominationparameter>> GetParametersByRewardTypeAsync(int rewardTypeId);
        Task<List<int>> GetManagerL1ProjectIdsAsync(int managerId);
        Task<List<int>> GetAllManagerEmployeeIdsAsync();
        Task<List<object>> GetTeamMembersByProjectIdsAsync(List<int> projectIds, List<int> managerIds);
        Task<bool> IsL1ManagerAsync(int employeeId);
        Task<bool> IsNomineeInManagerProjectsAsync(int nomineeId, List<int> projectIds);
        Task<Recognitionstatus?> GetExistingNominationAsync(int nomineeId, int rewardTypeId);
        Task<Recognitiondetail?> GetDefaultOpportunityAsync(int rewardTypeId);
        Task<Recognitiondetail> CreateDefaultOpportunityAsync(int rewardTypeId, string rewardName);
        Task AddRecognitionStatusAsync(Recognitionstatus status);
        Task<bool> ParameterExistsAsync(int parameterId, int rewardTypeId);
        Task<Nominationparametervalue?> GetExistingParameterValueAsync(int nominationId, int parameterId);
        Task AddParameterValueAsync(Nominationparametervalue paramValue);
        Task UpdateParameterValueAsync(Nominationparametervalue paramValue);
        Task AddNominationTrackingAsync(Nominationvisibilitytracking tracking);
        Task<List<Recognitionstatus>> GetNominationsByEmployeeIdAsync(int employeeId);
        Task<List<Recognitionstatus>> GetNominationsByManagerIdAsync(int managerId);
        Task<Recognitionstatus?> GetNominationByIdAsync(int nominationId);
        Task<List<Nominationparametervalue>> GetParameterValuesByNominationIdAsync(int nominationId);
        Task<Nominationparameter?> GetParameterByIdAsync(int parameterId);
        Task<Employee?> GetEmployeeByIdAsync(int employeeId);
        Task<Userprofile?> GetUserProfileByEmployeeIdAsync(int employeeId);
        Task<Employeedetailsmaster?> GetEmployeeDetailsAsync(int employeeId);
        Task SaveChangesAsync();
    }
}
