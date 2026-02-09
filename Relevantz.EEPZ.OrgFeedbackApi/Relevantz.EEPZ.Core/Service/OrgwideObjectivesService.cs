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
            var result = await _repository.GetAllOrgObjectivesAsync();
            return result ?? new List<OrgObjectiveResponseDto>();
        }

        public async Task<List<OrgObjectiveResponseDto>> GetAllObjectivesForDropdownAsync()
        {
            _logger.LogInformation("Retrieving organization objectives for dropdown");
            var result = await _repository.GetAllOrgObjectivesForDropdownAsync();
            return result ?? new List<OrgObjectiveResponseDto>();
        }

        public async Task<OrgObjectiveResponseDto?> GetObjectiveByIdAsync(int objectiveId)
        {
            if (objectiveId <= 0)
            {
                _logger.LogWarning("Invalid objective ID provided: {ObjectiveId}", objectiveId);
                return null;
            }

            _logger.LogInformation("Retrieving organization objective by ID: {ObjectiveId}", objectiveId);
            return await _repository.GetOrgObjectiveByIdAsync(objectiveId);
        }

        public async Task<List<OrgObjectiveResponseDto>> GetActiveObjectivesAsync()
        {
            _logger.LogInformation("Retrieving active organization objectives");
            var result = await _repository.GetActiveOrgObjectivesAsync();
            return result ?? new List<OrgObjectiveResponseDto>();
        }

        public async Task<List<OrgObjectiveResponseDto>> GetObjectivesByStatusAsync(string status)
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                _logger.LogWarning("Empty status provided for objective search");
                return new List<OrgObjectiveResponseDto>();
            }

            var normalizedStatus = status.Trim().ToLowerInvariant();

            if (!ValidStatuses.Contains(normalizedStatus))
            {
                _logger.LogWarning("Invalid status provided: {Status}", normalizedStatus);
                return new List<OrgObjectiveResponseDto>();
            }

            _logger.LogInformation("Retrieving organization objectives by status: {Status}", normalizedStatus);

            var result = await _repository.GetOrgObjectivesByStatusAsync(normalizedStatus);
            return result ?? new List<OrgObjectiveResponseDto>();
        }
    }
}
