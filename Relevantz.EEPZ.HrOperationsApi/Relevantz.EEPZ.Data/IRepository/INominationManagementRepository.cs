using Relevantz.EEPZ.Common.Entities;
 
namespace Relevantz.EEPZ.Data.IRepository
{
    public interface INominationManagementRepository
    {
        Task<Nomination?> GetByIdAsync(int nominationId);
        Task<List<Nomination>> GetAllAsync();
        Task<List<Nomination>> GetByStatusAsync(string status);
        Task<List<Nomination>> GetByOpportunityIdAsync(int opportunityId);
        Task<List<Nomination>> GetPendingReviewAsync();
        Task<Nomination> CreateAsync(Nomination nomination);
        Task<Nomination> UpdateAsync(Nomination nomination);
        Task<bool> CheckDuplicateNominationAsync(int opportunityId, int nomineeUserId);
    }
}
 
 