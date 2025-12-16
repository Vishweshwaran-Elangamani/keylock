using Relevantz.EEPZ.Common.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IRecognitionRewardRepository
    {
        Task<List<RecognitionRewardDto>> GetRecognitionRewardsAsync();
    }
}
