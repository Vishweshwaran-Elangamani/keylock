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
    public class LeadershipService : ILeadershipService
    {
        private readonly ILeadershipRepository _repository;

        public LeadershipService(ILeadershipRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<LeadershipPerformanceRatingDto>> GetLeadershipPerformanceRatingsAsync()
        {
            return await _repository.GetLeadershipPerformanceRatingsAsync();
        }
    }
}
