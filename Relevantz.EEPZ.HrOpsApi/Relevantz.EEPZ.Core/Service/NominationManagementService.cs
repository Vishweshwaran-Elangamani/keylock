using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Microsoft.EntityFrameworkCore;
 
namespace Relevantz.EEPZ.Core.Service
{
   public class NominationManagementService : INominationManagementService
    {
        private readonly INominationManagementRepository _nominationRepository;
        private readonly EEPZDbContext _context;
 
        public NominationManagementService(
            INominationManagementRepository nominationRepository,
            EEPZDbContext context)
        {
            _nominationRepository = nominationRepository;
            _context = context;
        }
 
        public async Task<ApiResponseDto<NominationResponseDto>> CreateNominationAsync(CreateNominationRequestDto request)
        {
            try
            {
                Console.WriteLine($"Creating nomination for OpportunityId: {request.OpportunityId}, NomineeUserId: {request.NomineeUserId}");
 
                var isDuplicate = await _nominationRepository.CheckDuplicateNominationAsync(
                    request.OpportunityId,
                    request.NomineeUserId);
 
                if (isDuplicate)
                {
                    Console.WriteLine($"Duplicate nomination detected for OpportunityId: {request.OpportunityId}, NomineeUserId: {request.NomineeUserId}");
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
 
                var response = await BuildNominationResponse(createdNomination.NominationId);
 
                Console.WriteLine($"Nomination created successfully with NominationId: {createdNomination.NominationId}");
                return ApiResponseDto<NominationResponseDto>.SuccessResponse(response, "Nomination submitted successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating nomination: {ex.Message}");
                return ApiResponseDto<NominationResponseDto>.FailureResponse("An error occurred while creating nomination");
            }
        }
 
        public async Task<ApiResponseDto<NominationResponseDto>> ReviewNominationAsync(ReviewNominationRequestDto request)
        {
            try
            {
                Console.WriteLine($"Reviewing nomination with NominationId: {request.NominationId}");
 
                var nomination = await _nominationRepository.GetByIdAsync(request.NominationId);
                if (nomination == null)
                {
                    Console.WriteLine($"Nomination not found: {request.NominationId}");
                    return ApiResponseDto<NominationResponseDto>.FailureResponse("Nomination not found");
                }
 
                if (nomination.Status == "Approved" || nomination.Status == "Rejected")
                {
                    Console.WriteLine($"Nomination already reviewed: {request.NominationId}");
                    return ApiResponseDto<NominationResponseDto>.FailureResponse("Nomination has already been reviewed");
                }
 
                nomination.Status = request.Status;
                nomination.ReviewedByUserId = request.ReviewedByUserId;
                nomination.ReviewRemarks = request.ReviewRemarks;
                nomination.ReviewedAt = DateTime.UtcNow;
 
                var updatedNomination = await _nominationRepository.UpdateAsync(nomination);
 
                var response = await BuildNominationResponse(updatedNomination.NominationId);
 
                Console.WriteLine($"Nomination reviewed successfully: {request.NominationId}, Status: {request.Status}");
                return ApiResponseDto<NominationResponseDto>.SuccessResponse(response, $"Nomination {request.Status.ToLower()} successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error reviewing nomination: {ex.Message}");
                return ApiResponseDto<NominationResponseDto>.FailureResponse("An error occurred while reviewing nomination");
            }
        }
 
        public async Task<ApiResponseDto<NominationResponseDto>> GetNominationByIdAsync(int nominationId)
        {
            try
            {
                Console.WriteLine($"Fetching nomination with NominationId: {nominationId}");
 
                var nomination = await _nominationRepository.GetByIdAsync(nominationId);
                if (nomination == null)
                {
                    Console.WriteLine($"Nomination not found: {nominationId}");
                    return ApiResponseDto<NominationResponseDto>.FailureResponse("Nomination not found");
                }
 
                var response = await BuildNominationResponse(nominationId);
                return ApiResponseDto<NominationResponseDto>.SuccessResponse(response, "Nomination retrieved successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching nomination: {ex.Message}");
                return ApiResponseDto<NominationResponseDto>.FailureResponse("An error occurred while fetching nomination");
            }
        }
 
        public async Task<ApiResponseDto<List<NominationResponseDto>>> GetAllNominationsAsync()
        {
            try
            {
                Console.WriteLine("Fetching all nominations");
 
                var nominations = await _nominationRepository.GetAllAsync();
                var response = new List<NominationResponseDto>();
 
                foreach (var nomination in nominations)
                {
                    response.Add(await BuildNominationResponse(nomination.NominationId));
                }
 
                return ApiResponseDto<List<NominationResponseDto>>.SuccessResponse(response, $"Retrieved {response.Count} nominations");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching all nominations: {ex.Message}");
                return ApiResponseDto<List<NominationResponseDto>>.FailureResponse("An error occurred while fetching nominations");
            }
        }
 
        public async Task<ApiResponseDto<List<NominationResponseDto>>> GetNominationsByStatusAsync(string status)
        {
            try
            {
                Console.WriteLine($"Fetching nominations with Status: {status}");
 
                var nominations = await _nominationRepository.GetByStatusAsync(status);
                var response = new List<NominationResponseDto>();
 
                foreach (var nomination in nominations)
                {
                    response.Add(await BuildNominationResponse(nomination.NominationId));
                }
 
                return ApiResponseDto<List<NominationResponseDto>>.SuccessResponse(response, $"Retrieved {response.Count} nominations with status: {status}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching nominations by status: {ex.Message}");
                return ApiResponseDto<List<NominationResponseDto>>.FailureResponse("An error occurred while fetching nominations");
            }
        }
 
        public async Task<ApiResponseDto<List<NominationResponseDto>>> GetNominationsByOpportunityAsync(int opportunityId)
        {
            try
            {
                Console.WriteLine($"Fetching nominations for OpportunityId: {opportunityId}");
 
                var nominations = await _nominationRepository.GetByOpportunityIdAsync(opportunityId);
                var response = new List<NominationResponseDto>();
 
                foreach (var nomination in nominations)
                {
                    response.Add(await BuildNominationResponse(nomination.NominationId));
                }
 
                return ApiResponseDto<List<NominationResponseDto>>.SuccessResponse(response, $"Retrieved {response.Count} nominations for opportunity");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching nominations by opportunity: {ex.Message}");
                return ApiResponseDto<List<NominationResponseDto>>.FailureResponse("An error occurred while fetching nominations");
            }
        }
 
        public async Task<ApiResponseDto<List<NominationResponseDto>>> GetPendingReviewNominationsAsync()
        {
            try
            {
                Console.WriteLine("Fetching pending review nominations");
 
                var nominations = await _nominationRepository.GetPendingReviewAsync();
                var response = new List<NominationResponseDto>();
 
                foreach (var nomination in nominations)
                {
                    response.Add(await BuildNominationResponse(nomination.NominationId));
                }
 
                return ApiResponseDto<List<NominationResponseDto>>.SuccessResponse(response, $"Retrieved {response.Count} pending nominations");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching pending nominations: {ex.Message}");
                return ApiResponseDto<List<NominationResponseDto>>.FailureResponse("An error occurred while fetching pending nominations");
            }
        }
 
        private async Task<NominationResponseDto> BuildNominationResponse(int nominationId)
        {
            var nomination = await _context.Nominations
                .Where(n => n.NominationId == nominationId)
                .Select(n => new
                {
                    n.NominationId,
                    n.OpportunityId,
                    OpportunityTitle = _context.Internalopportunities
                        .Where(o => o.OpportunityId == n.OpportunityId)
                        .Select(o => o.OpportunityName)
                        .FirstOrDefault() ?? "Unknown",
                    n.NomineeUserId,
                    NomineeEmail = _context.Userauthentications
                        .Where(u => u.UserId == n.NomineeUserId)
                        .Select(u => u.Email)
                        .FirstOrDefault() ?? "Unknown",
                    n.NominationType,
                    n.NominatedByUserId,
                    NominatedByEmail = _context.Userauthentications
                        .Where(u => u.UserId == n.NominatedByUserId)
                        .Select(u => u.Email)
                        .FirstOrDefault() ?? "Unknown",
                    n.Justification,
                    n.Status,
                    n.ReviewedByUserId,
                    ReviewedByEmail = n.ReviewedByUserId.HasValue
                        ? _context.Userauthentications
                            .Where(u => u.UserId == n.ReviewedByUserId)
                            .Select(u => u.Email)
                            .FirstOrDefault()
                        : null,
                    n.ReviewRemarks,
                    n.SubmittedAt,
                    n.ReviewedAt
                })
                .FirstOrDefaultAsync();
 
            return new NominationResponseDto
            {
                NominationId = nomination.NominationId,
                OpportunityId = nomination.OpportunityId,
                OpportunityTitle = nomination.OpportunityTitle,
                NomineeUserId = nomination.NomineeUserId,
                NomineeEmail = nomination.NomineeEmail,
                NominationType = nomination.NominationType,
                NominatedByUserId = nomination.NominatedByUserId,
                NominatedByEmail = nomination.NominatedByEmail,
                Justification = nomination.Justification,
                Status = nomination.Status,
                ReviewedByUserId = nomination.ReviewedByUserId,
                ReviewedByEmail = nomination.ReviewedByEmail,
                ReviewRemarks = nomination.ReviewRemarks,
                SubmittedAt = nomination.SubmittedAt,
                ReviewedAt = nomination.ReviewedAt
            };
        }
    }
 
 
}
 
 