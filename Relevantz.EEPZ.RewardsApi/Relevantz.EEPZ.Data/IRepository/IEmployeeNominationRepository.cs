 
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.Entities;
 
namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IEmployeeNominationRepository
    {
        Task<List<Recognitionstatus>> GetApprovedNominationsByEmployeeAsync(
            int employeeId,
            CancellationToken cancellationToken = default);
 
        // Optional: keep if used elsewhere
        Task<Recognitiondetail?> GetRecognitionDetailWithRewardTypeAsync(
            int opportunityId,
            CancellationToken cancellationToken = default);
 
        // NEW: batch load
        Task<List<Recognitiondetail>> GetRecognitionDetailsWithRewardTypeByOppIdsAsync(
            IEnumerable<int> opportunityIds,
            CancellationToken cancellationToken = default);
    }
}
 
 