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

        /// <summary>
        /// Retrieves all organization-wide objectives.
        /// Returns an empty list when the repository returns null or no records.
        /// </summary>
        public async Task<List<OrgObjectiveResponseDto>> GetAllObjectivesAsync()
        {
            _logger.LogInformation("Retrieving all organization objectives");
            var result = await _repository.GetAllOrgObjectivesAsync();
            return result ?? new List<OrgObjectiveResponseDto>();
        }

        /// <summary>
        /// Retrieves organization-wide objectives formatted for dropdown controls.
        /// Returns an empty list when the repository returns null or no records.
        /// Callers should display an appropriate empty state message in the UI
        /// when the returned list is empty.
        /// </summary>
        public async Task<List<OrgObjectiveResponseDto>> GetAllObjectivesForDropdownAsync()
        {
            _logger.LogInformation("Retrieving organization objectives for dropdown");
            var result = await _repository.GetAllOrgObjectivesForDropdownAsync();
            return result ?? new List<OrgObjectiveResponseDto>();
        }

        /// <summary>
        /// Retrieves a specific organization-wide objective by its unique identifier.
        /// Invalid IDs (zero or negative) are now handled at the controller layer
        /// with a 400 BadRequest; this method returns null only when the ID is
        /// valid but no matching record exists.
        /// </summary>
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

        /// <summary>
        /// Retrieves all active organization-wide objectives.
        /// Returns an empty list when the repository returns null or no records.
        /// </summary>
        public async Task<List<OrgObjectiveResponseDto>> GetActiveObjectivesAsync()
        {
            _logger.LogInformation("Retrieving active organization objectives");
            var result = await _repository.GetActiveOrgObjectivesAsync();
            return result ?? new List<OrgObjectiveResponseDto>();
        }

        /// <summary>
        /// Retrieves organization-wide objectives filtered by their status.
        /// Status is trimmed and normalized to lowercase before validation.
        /// Throws <see cref="ArgumentException"/> for null, empty, or unrecognized
        /// status values so the controller can return a 400 BadRequest response.
        /// </summary>
        public async Task<List<OrgObjectiveResponseDto>> GetObjectivesByStatusAsync(string status)
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                _logger.LogWarning("Empty status provided for objective search");
                throw new ArgumentException("Status cannot be empty", nameof(status));
            }

            // Normalize before validation so "Pending", "PENDING", and "pending"
            // are all treated as the same valid value.
            var normalizedStatus = status.Trim().ToLowerInvariant();

            if (!ValidStatuses.Contains(normalizedStatus))
            {
                _logger.LogWarning(
                    "Invalid status provided: {Status}. Valid statuses: [{ValidStatuses}]",
                    normalizedStatus,
                    string.Join(", ", ValidStatuses));

                throw new ArgumentException(
                    $"Invalid status: {normalizedStatus}. Valid statuses: [{string.Join(", ", ValidStatuses)}]",
                    nameof(status));
            }

            _logger.LogInformation("Retrieving organization objectives by status: {Status}", normalizedStatus);

            var result = await _repository.GetOrgObjectivesByStatusAsync(normalizedStatus);
            return result ?? new List<OrgObjectiveResponseDto>();
        }
    }
}
