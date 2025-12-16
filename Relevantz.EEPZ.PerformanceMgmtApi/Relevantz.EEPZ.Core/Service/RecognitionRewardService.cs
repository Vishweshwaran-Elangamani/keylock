using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class RecognitionRewardService : IRecognitionRewardService
    {
        private readonly IRecognitionRewardRepository _repository;

        public RecognitionRewardService(IRecognitionRewardRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<RecognitionRewardDto>> GetRecognitionRewardsAsync()
        {
            return await _repository.GetRecognitionRewardsAsync();
        }
    }
}
