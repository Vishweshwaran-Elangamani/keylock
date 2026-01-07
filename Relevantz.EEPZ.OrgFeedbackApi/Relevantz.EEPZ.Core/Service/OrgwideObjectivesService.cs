using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Models;
using Microsoft.Extensions.Logging;
namespace Relevantz.EEPZ.Core.Service
{
    public class OrgwideObjectivesService : IOrgwideObjectivesService
    {
        private readonly IOrgwideObjectivesRepository _repository;
        private readonly ILogger<OrgwideObjectivesService> _logger;
        private const string ORG_GOAL_TYPE = "org";

        public OrgwideObjectivesService(
            IOrgwideObjectivesRepository repository,
            ILogger<OrgwideObjectivesService> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        public async Task<ApiResponse<List<OrgObjectiveDto>>> GetAllObjectivesAsync()
        {
            try
            {
                _logger.LogInformation("Service: Retrieving all organization-wide objectives");

                var objectives = await _repository.GetAllOrgObjectivesAsync();
                return ApiResponse<List<OrgObjectiveDto>>.SuccessResponse(
                    objectives,
                    $"Retrieved {objectives.Count} organization objectives successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Service error retrieving organization objectives");
                return ApiResponse<List<OrgObjectiveDto>>.ErrorResponse($"Service error: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<OrgObjectiveDto>>> GetAllObjectivesForDropdownAsync()
        {
            try
            {
                _logger.LogInformation("Service: Retrieving all organization objectives for dropdown");

                var objectives = await _repository.GetAllOrgObjectivesForDropdownAsync();
                return ApiResponse<List<OrgObjectiveDto>>.SuccessResponse(
                    objectives,
                    "Organization objectives retrieved successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Service error retrieving objectives for dropdown");
                return ApiResponse<List<OrgObjectiveDto>>.ErrorResponse($"Service error: {ex.Message}");
            }
        }

        public async Task<ApiResponse<OrgObjectiveDto>> GetObjectiveByIdAsync(int objectiveId)
        {
            try
            {
                _logger.LogInformation("Service: Retrieving organization objective with ID: {ObjectiveId}", objectiveId);

                var objective = await _repository.GetOrgObjectiveByIdAsync(objectiveId);
                if (objective == null)
                {
                    return ApiResponse<OrgObjectiveDto>.ErrorResponse(
                        $"Organization objective with ID {objectiveId} not found.");
                }

                return ApiResponse<OrgObjectiveDto>.SuccessResponse(
                    objective,
                    "Objective retrieved successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Service error retrieving objective by ID");
                return ApiResponse<OrgObjectiveDto>.ErrorResponse($"Service error: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<OrgObjectiveDto>>> GetActiveObjectivesAsync()
        {
            try
            {
                _logger.LogInformation("Service: Retrieving active organization objectives");

                var objectives = await _repository.GetActiveOrgObjectivesAsync();
                return ApiResponse<List<OrgObjectiveDto>>.SuccessResponse(
                    objectives,
                    $"Retrieved {objectives.Count} active objectives.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Service error retrieving active objectives");
                return ApiResponse<List<OrgObjectiveDto>>.ErrorResponse($"Service error: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<OrgObjectiveDto>>> GetObjectivesByStatusAsync(string status)
        {
            try
            {
                _logger.LogInformation("Service: Retrieving objectives with status: {Status}", status);

                var validStatuses = new[] { "pending", "open", "inprogress", "completed", "closed", "expired", "reopened" };
                if (!validStatuses.Contains(status.ToLower()))
                {
                    return ApiResponse<List<OrgObjectiveDto>>.ErrorResponse(
                        $"Invalid status. Valid values: {string.Join(", ", validStatuses)}");
                }

                var objectives = await _repository.GetOrgObjectivesByStatusAsync(status.ToLower());
                return ApiResponse<List<OrgObjectiveDto>>.SuccessResponse(
                    objectives,
                    $"Retrieved {objectives.Count} {status} objectives.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Service error retrieving objectives by status");
                return ApiResponse<List<OrgObjectiveDto>>.ErrorResponse($"Service error: {ex.Message}");
            }
        }
    }
}
