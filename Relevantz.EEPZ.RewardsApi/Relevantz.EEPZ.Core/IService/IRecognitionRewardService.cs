
using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IRecognitionRewardService
    {
        Task<List<RecognitionRewardDto>> GetRecognitionRewardsAsync();
    }
}
