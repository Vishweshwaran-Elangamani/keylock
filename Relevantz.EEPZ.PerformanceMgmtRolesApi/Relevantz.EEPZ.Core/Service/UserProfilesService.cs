using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class UserProfilesService : IUserProfilesService
    {
        private readonly IUserProfilesRepository _repository;
        private readonly ILogger<UserProfilesService> _logger;

        public UserProfilesService(
            IUserProfilesRepository repository,
            ILogger<UserProfilesService> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        public async Task<ApiResponse<List<object>>> GetAllUserProfilesAsync()
        {
            try
            {
                var profiles = await _repository.GetAllUserProfilesAsync();
                return ApiResponse<List<object>>.SuccessResponse(profiles);
            }
            catch (System.Exception ex)
            {
                _logger.LogError($"Error in GetAllUserProfilesAsync: {ex.Message}");
                return ApiResponse<List<object>>.ErrorResponse($"Failed to fetch profiles: {ex.Message}");
            }
        }
    }
}
