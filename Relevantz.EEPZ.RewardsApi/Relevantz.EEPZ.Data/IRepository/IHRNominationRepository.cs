using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IHRNominationRepository
    {
        Task<List<Recognitionstatus>> GetPendingVisibleManagerNominationsAsync();
        Task<List<Recognitionstatus>> GetNominationsByIdsAsync(List<int> nominationIds);
        Task<Recognitiondetail?> GetOpportunityByIdAsync(int opportunityId);
        Task<Employeedetailsmaster?> GetEmployeeDepartmentDetailsAsync(int employeeId);
        Task<List<object>> GetNominationParameterValuesAsync(int nominationId);
        Task<List<object>> GetNominationParameterValuesWithDetailsAsync(int nominationId);
        Task AddNominationTrackingAsync(Nominationvisibilitytracking tracking);
        Task<Recognitionstatus?> GetNominationByIdAsync(int nominationId);
        Task<List<Recognitionstatus>> GetApprovedNominationsAsync();
        Task<List<Recognitionstatus>> GetRejectedNominationsAsync();
        Task<List<Rewardtype>> GetRewardTypesAsync(bool activeOnly);
        Task<Rewardtype?> GetRewardTypeByIdAsync(int rewardTypeId);
        Task AddRewardTypeAsync(Rewardtype rewardType);
        Task<List<Nominationparameter>> GetParametersByRewardTypeAsync(int rewardTypeId);
        Task AddParameterAsync(Nominationparameter parameter);
        Task<Nominationparameter?> GetParameterByIdAsync(int parameterId);
        Task DeleteParameterAsync(Nominationparameter parameter);
        Task<int> GetTotalNominationsCountAsync();
        Task<int> GetPendingNominationsCountAsync();
        Task<int> GetApprovedNominationsCountAsync();
        Task<int> GetRejectedNominationsCountAsync();
        Task<int> GetActiveOpportunitiesCountAsync();
        Task<List<Recognitionstatus>> GetAllNominationsWithOpportunitiesAsync();
        Task SaveChangesAsync();
    }
}
