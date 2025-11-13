using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.IRepository
{
    public interface INominationReviewMetricRepository
    {
        Task<Nominationreviewmetric> GetByIdAsync(int id);
        Task<List<Nominationreviewmetric>> GetByNominationAsync(int nominationId);
        Task<Nominationreviewmetric> CreateAsync(Nominationreviewmetric metric);
        Task<Nominationreviewmetric> UpdateAsync(Nominationreviewmetric metric);
    }
}
