using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.IRepository;

namespace Relevantz.EEPZ.Core.Service
{
    public class OrgwideObjectivesService : IOrgwideObjectivesService
    {
        private readonly IOrgwideObjectivesRepository _repository;
        private readonly ILogger<OrgwideObjectivesService> _logger;

        private static readonly HashSet<string> ValidStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "pending",
            "open",
            "inprogress",
            "completed",
            "closed",
            "expired",
            "reopened"
        };

        public OrgwideObjectivesService(
            IOrgwideObjectivesRepository repository,
            ILogger<OrgwideObjectivesService> logger)
        {
            _repository = repository ?? throw new ArgumentNullException(nameof(repository));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<List<OrgObjectiveResponseDto>> GetAllObjectivesAsync()
        {
            _logger.LogInformation("Retrieving all organization objectives");
            return await _repository.GetAllOrgObjectivesAsync();
        }

        public async Task<List<OrgObjectiveResponseDto>> GetAllObjectivesForDropdownAsync()
        {
            _logger.LogInformation("Retrieving all organization objectives for dropdown");
            return await _repository.GetAllOrgObjectivesForDropdownAsync();
        }

        public async Task<OrgObjectiveResponseDto?> GetObjectiveByIdAsync(int objectiveId)
        {
            if (objectiveId <= 0)
                return null;

            _logger.LogInformation("Retrieving organization objective by id: {ObjectiveId}", objectiveId);
            return await _repository.GetOrgObjectiveByIdAsync(objectiveId);
        }

        public async Task<List<OrgObjectiveResponseDto>> GetActiveObjectivesAsync()
        {
            _logger.LogInformation("Retrieving active organization objectives");
            return await _repository.GetActiveOrgObjectivesAsync();
        }

        public async Task<List<OrgObjectiveResponseDto>> GetObjectivesByStatusAsync(string status)
        {
            if (string.IsNullOrWhiteSpace(status))
                return new List<OrgObjectiveResponseDto>();

            var normalizedStatus = status.Trim().ToLowerInvariant();

            if (!ValidStatuses.Contains(normalizedStatus))
                return new List<OrgObjectiveResponseDto>();

            _logger.LogInformation("Retrieving organization objectives by status: {Status}", normalizedStatus);
            return await _repository.GetOrgObjectivesByStatusAsync(normalizedStatus);
        }
    }
}
