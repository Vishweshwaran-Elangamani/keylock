using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.IRepository;


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

        public async Task<ApiResponseDto<List<SmeResponseDto>>> GetActiveSmesAsync()
        {
            _logger.LogInformation("Retrieving active SMEs");

            var smes = await _repository.GetActiveSmesAsync();

            return ApiResponseDto<List<SmeResponseDto>>.SuccessResponse(
                smes,
                MessageConstants.OperationSuccessful
            );
        }
    }
}
