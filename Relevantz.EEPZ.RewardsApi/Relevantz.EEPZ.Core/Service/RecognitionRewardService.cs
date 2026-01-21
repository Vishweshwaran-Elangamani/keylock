
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class RecognitionRewardService : IRecognitionRewardService
    {
        private readonly IRecognitionRewardRepository _repository;
        private readonly ILogger<RecognitionRewardService> _logger;

        public RecognitionRewardService(
            IRecognitionRewardRepository repository,
            ILogger<RecognitionRewardService> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        public async Task<List<RecognitionRewardDto>> GetRecognitionRewardsAsync()
        {
            _logger.LogInformation("[SERVICE] Fetching recognition rewards from repository");
            var rewards = await _repository.GetRecognitionRewardsAsync();
            _logger.LogInformation("[SERVICE] Retrieved {Count} rewards", rewards?.Count ?? 0);
            return rewards;
        }
    }
}
