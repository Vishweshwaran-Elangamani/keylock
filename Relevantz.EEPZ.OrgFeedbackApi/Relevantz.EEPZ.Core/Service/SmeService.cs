using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Models;
using Microsoft.Extensions.Logging;
namespace Relevantz.EEPZ.Core.Service
{
    public class SmeService : ISmeService
    {
        private readonly ISmeRepository _repository;
        private readonly ILogger<SmeService> _logger;

        public SmeService(ISmeRepository repository, ILogger<SmeService> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        public async Task<ApiResponse<List<SmeDto>>> GetActiveSmesAsync()
        {
            try
            {
                _logger.LogInformation("Service: Retrieving active SMEs");
                var smes = await _repository.GetActiveSmesAsync();

                return ApiResponse<List<SmeDto>>.SuccessResponse(
                    smes,
                    $"Retrieved {smes.Count} active SMEs successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Service error retrieving active SMEs");
                return ApiResponse<List<SmeDto>>.ErrorResponse($"Service error: {ex.Message}");
            }
        }
    }
}
