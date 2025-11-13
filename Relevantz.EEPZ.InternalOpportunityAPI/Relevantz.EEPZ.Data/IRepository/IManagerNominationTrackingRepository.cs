using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IManagerNominationTrackingRepository
    {
        Task<Managernominationtracking> GetByIdAsync(int id);
        Task<List<Managernominationtracking>> GetByNominationAsync(int nominationId);
        Task<Managernominationtracking> CreateAsync(Managernominationtracking tracking);
        Task<bool> ExistsForNominationAsync(int nominationId);
    }
}
