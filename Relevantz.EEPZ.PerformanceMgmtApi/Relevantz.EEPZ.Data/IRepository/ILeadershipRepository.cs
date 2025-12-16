using Relevantz.EEPZ.Common.DTOs.Response;
using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface ILeadershipRepository
    {
        Task<List<LeadershipPerformanceRatingDto>> GetLeadershipPerformanceRatingsAsync();
    }
}
