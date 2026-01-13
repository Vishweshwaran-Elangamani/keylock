using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Microsoft.Extensions.Logging;

namespace Relevantz.EEPZ.Core.Service
{
    public class NominationManagementService : INominationManagementService
    {
        private readonly INominationManagementRepository _nominationRepository;
        private readonly ILogger<NominationManagementService> _logger;

        public NominationManagementService(
            INominationManagementRepository nominationRepository,
            ILogger<NominationManagementService> logger)
        {
            _nominationRepository = nominationRepository;
            _logger = logger;
        }

        public async Task<ApiResponseDto<NominationResponseDto>> CreateNominationAsync(CreateNominationRequestDto request)
        {
            try
            {
                _logger.LogInformation("Creating nomination for OpportunityId: {OpportunityId}, NomineeUserId: {NomineeUserId}",
                    request.OpportunityId, request.NomineeUserId);

                var isDuplicate = await _nominationRepository.CheckDuplicateNominationAsync(
                    request.OpportunityId,
                    request.NomineeUserId);

                if (isDuplicate)
                {
                    _logger.LogInformation(
                        "Duplicate nomination detected for OpportunityId: {OpportunityId}, NomineeUserId: {NomineeUserId}",
                        request.OpportunityId, request.NomineeUserId);

                    return ApiResponseDto<NominationResponseDto>.FailureResponse(
                        "This employee has already been nominated for this opportunity");
                }

                var nomination = new Nomination
                {
                    OpportunityId = request.OpportunityId,
                    NomineeUserId = request.NomineeUserId,
                    NominationType = request.NominationType,
                    NominatedByUserId = request.NominatedByUserId,
                    Justification = request.Justification,
                    Status = "Pending",
                    SubmittedAt = DateTime.UtcNow
                };

                var createdNomination = await _nominationRepository.CreateAsync(nomination);

                var response = await _nominationRepository.GetNominationWithDetailsAsync(createdNomination.NominationId);
                // Assuming repository always returns a DTO for a just-created entity.

                _logger.LogInformation("Nomination created successfully with NominationId: {NominationId}",
                    createdNomination.NominationId);

                return ApiResponseDto<NominationResponseDto>.SuccessResponse(response!, "Nomination submitted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating nomination");
                return ApiResponseDto<NominationResponseDto>.FailureResponse("An error occurred while creating nomination");
            }
        }

        public async Task<ApiResponseDto<NominationResponseDto>> ReviewNominationAsync(ReviewNominationRequestDto request)
        {
            try
            {
                _logger.LogInformation("Reviewing nomination with NominationId: {NominationId}",
                    request.NominationId);

                var nomination = await _nominationRepository.GetByIdAsync(request.NominationId);
                if (nomination == null)
                {
                    _logger.LogInformation("Nomination not found: {NominationId}", request.NominationId);
                    return ApiResponseDto<NominationResponseDto>.FailureResponse("Nomination not found");
                }

                if (nomination.Status == "Approved" || nomination.Status == "Rejected")
                {
                    _logger.LogInformation("Nomination already reviewed: {NominationId}", request.NominationId);
                    return ApiResponseDto<NominationResponseDto>.FailureResponse("Nomination has already been reviewed");
                }

                nomination.Status = request.Status;
                nomination.ReviewedByUserId = request.ReviewedByUserId;
                nomination.ReviewRemarks = request.ReviewRemarks;
                nomination.ReviewedAt = DateTime.UtcNow;

                var updatedNomination = await _nominationRepository.UpdateAsync(nomination);

                var response = await _nominationRepository.GetNominationWithDetailsAsync(updatedNomination.NominationId);

                _logger.LogInformation(
                    "Nomination reviewed successfully: {NominationId}, Status: {Status}",
                    request.NominationId, request.Status);

                return ApiResponseDto<NominationResponseDto>.SuccessResponse(
                    response!, $"Nomination {request.Status.ToLower()} successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reviewing nomination");
                return ApiResponseDto<NominationResponseDto>.FailureResponse("An error occurred while reviewing nomination");
            }
        }

        public async Task<ApiResponseDto<NominationResponseDto>> GetNominationByIdAsync(int nominationId)
        {
            try
            {
                _logger.LogInformation("Fetching nomination with NominationId: {NominationId}", nominationId);

                var response = await _nominationRepository.GetNominationWithDetailsAsync(nominationId);
                if (response == null)
                {
                    _logger.LogInformation("Nomination not found: {NominationId}", nominationId);
                    return ApiResponseDto<NominationResponseDto>.FailureResponse("Nomination not found");
                }

                return ApiResponseDto<NominationResponseDto>.SuccessResponse(response, "Nomination retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching nomination");
                return ApiResponseDto<NominationResponseDto>.FailureResponse("An error occurred while fetching nomination");
            }
        }

        public async Task<ApiResponseDto<List<NominationResponseDto>>> GetAllNominationsAsync()
        {
            try
            {
                _logger.LogInformation("Fetching all nominations");

                var nominations = await _nominationRepository.GetAllAsync();
                var response = new List<NominationResponseDto>();

                foreach (var nomination in nominations)
                {
                    var dto = await _nominationRepository.GetNominationWithDetailsAsync(nomination.NominationId);
                    if (dto != null)
                    {
                        response.Add(dto);
                    }
                }

                return ApiResponseDto<List<NominationResponseDto>>.SuccessResponse(
                    response, $"Retrieved {response.Count} nominations");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching all nominations");
                return ApiResponseDto<List<NominationResponseDto>>.FailureResponse("An error occurred while fetching nominations");
            }
        }

        public async Task<ApiResponseDto<List<NominationResponseDto>>> GetNominationsByStatusAsync(string status)
        {
            try
            {
                _logger.LogInformation("Fetching nominations with Status: {Status}", status);

                var nominations = await _nominationRepository.GetByStatusAsync(status);
                var response = new List<NominationResponseDto>();

                foreach (var nomination in nominations)
                {
                    var dto = await _nominationRepository.GetNominationWithDetailsAsync(nomination.NominationId);
                    if (dto != null)
                    {
                        response.Add(dto);
                    }
                }

                return ApiResponseDto<List<NominationResponseDto>>.SuccessResponse(
                    response, $"Retrieved {response.Count} nominations with status: {status}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching nominations by status");
                return ApiResponseDto<List<NominationResponseDto>>.FailureResponse("An error occurred while fetching nominations");
            }
        }

        public async Task<ApiResponseDto<List<NominationResponseDto>>> GetNominationsByOpportunityAsync(int opportunityId)
        {
            try
            {
                _logger.LogInformation("Fetching nominations for OpportunityId: {OpportunityId}", opportunityId);

                var nominations = await _nominationRepository.GetByOpportunityIdAsync(opportunityId);
                var response = new List<NominationResponseDto>();

                foreach (var nomination in nominations)
                {
                    var dto = await _nominationRepository.GetNominationWithDetailsAsync(nomination.NominationId);
                    if (dto != null)
                    {
                        response.Add(dto);
                    }
                }

                return ApiResponseDto<List<NominationResponseDto>>.SuccessResponse(
                    response, $"Retrieved {response.Count} nominations for opportunity");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching nominations by opportunity");
                return ApiResponseDto<List<NominationResponseDto>>.FailureResponse("An error occurred while fetching nominations");
            }
        }

        public async Task<ApiResponseDto<List<NominationResponseDto>>> GetPendingReviewNominationsAsync()
        {
            try
            {
                _logger.LogInformation("Fetching pending review nominations");

                var nominations = await _nominationRepository.GetPendingReviewAsync();
                var response = new List<NominationResponseDto>();

                foreach (var nomination in nominations)
                {
                    var dto = await _nominationRepository.GetNominationWithDetailsAsync(nomination.NominationId);
                    if (dto != null)
                    {
                        response.Add(dto);
                    }
                }

                return ApiResponseDto<List<NominationResponseDto>>.SuccessResponse(
                    response, $"Retrieved {response.Count} pending nominations");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching pending nominations");
                return ApiResponseDto<List<NominationResponseDto>>.FailureResponse("An error occurred while fetching pending nominations");
            }
        }
    }
}
