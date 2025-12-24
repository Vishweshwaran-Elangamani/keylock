using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IEmployeeNominationRepository
    {
        Task<List<Recognitionstatus>> GetApprovedNominationsByEmployeeAsync(int employeeId);
        Task<Recognitiondetail?> GetRecognitionDetailWithRewardTypeAsync(int opportunityId);
    }
}
