using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.IService;
using Microsoft.Extensions.Logging;
using System.Linq;

namespace Relevantz.EEPZ.Core.Service
{
    public class CareerProgressionService : ICareerProgressionService
    {
        private readonly ICareerProgressionRepository _repo;
        private readonly ILogger<CareerProgressionService> _logger;

        public CareerProgressionService(ICareerProgressionRepository repo, ILogger<CareerProgressionService> logger)
        {
            _repo = repo;
            _logger = logger;
        }

        public async Task<ApiResponseDto<PendingNominationCheckDto>> CheckPendingNominationAsync(int employeeUserId)
        {
            try
            {
                _logger.LogInformation($"Checking pending nomination for employee {employeeUserId}");

                var pendingPromotion = await _repo.GetPendingPromotionAsync(employeeUserId);
                if (pendingPromotion == null)
                {
                    return ApiResponseDto<PendingNominationCheckDto>.SuccessResponse(
                        new PendingNominationCheckDto { EmployeeUserId = employeeUserId, HasPendingNomination = false },
                        "No pending nominations");
                }

                var result = new PendingNominationCheckDto
                {
                    EmployeeUserId = employeeUserId,
                    HasPendingNomination = true,
                    PendingPromotionId = pendingPromotion.PromotionId,
                    PendingNewRole = pendingPromotion.NewRole,
                    PendingCreatedAt = pendingPromotion.CreatedAt,
                    PendingJustification = pendingPromotion.Justification,
                    PendingManagerId = null,
                    PendingManagerEmail = pendingPromotion.EmployeeUser?.Email ?? "N/A"
                };

                return ApiResponseDto<PendingNominationCheckDto>.SuccessResponse(result, "Employee has pending nomination");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in CheckPendingNominationAsync: {ex.Message}");
                return ApiResponseDto<PendingNominationCheckDto>.FailureResponse($"Error checking pending nomination: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<PromotionResponseDto>> CreatePromotionAsync(CreatePromotionRequestDto request, int managerId)
        {
            try
            {
                _logger.LogInformation($"Creating promotion for employee {request.EmployeeUserId}");

                if (await _repo.HasPendingPromotionAsync(request.EmployeeUserId))
                {
                    return ApiResponseDto<PromotionResponseDto>.FailureResponse("Employee already has a pending promotion");
                }

                if (string.IsNullOrEmpty(request.Justification))
                {
                    return ApiResponseDto<PromotionResponseDto>.FailureResponse("Justification is required");
                }

                var promotion = new Promotion
                {
                    EmployeeUserId = request.EmployeeUserId,
                    DepartmentId = request.DepartmentId,
                    OldRole = request.OldRole ?? "N/A",
                    NewRole = request.NewRole,
                    OldSalary = 0m,
                    NewSalary = 0m,
                    PromotionDate = request.PromotionDate,
                    Justification = request.Justification,
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow
                };

                var createdPromotion = await _repo.CreateAsync(promotion);
                await _repo.LoadPromotionRelations(createdPromotion);

                _logger.LogInformation($"Promotion created with ID {createdPromotion.PromotionId}");
                var promotionResponse = MapToPromotionResponseDto(createdPromotion);

                return ApiResponseDto<PromotionResponseDto>.SuccessResponse(promotionResponse, "Promotion created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in CreatePromotionAsync: {ex.Message}");
                return ApiResponseDto<PromotionResponseDto>.FailureResponse($"Error creating promotion: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<PromotionResponseDto>> UpdatePromotionAsync(UpdatePromotionRequestDto request)
        {
            try
            {
                _logger.LogInformation($"Updating promotion {request.PromotionId}");

                var promotion = await _repo.GetByIdAsync(request.PromotionId);
                if (promotion == null)
                {
                    return ApiResponseDto<PromotionResponseDto>.FailureResponse("Promotion not found");
                }

                promotion.NewRole = request.NewRole ?? promotion.NewRole;
                promotion.Justification = request.Justification ?? promotion.Justification;

                var updatedPromotion = await _repo.UpdateAsync(promotion);
                await _repo.LoadPromotionRelations(updatedPromotion);

                _logger.LogInformation($"Promotion {request.PromotionId} updated");
                var promotionResponse = MapToPromotionResponseDto(updatedPromotion);

                return ApiResponseDto<PromotionResponseDto>.SuccessResponse(promotionResponse, "Promotion updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in UpdatePromotionAsync: {ex.Message}");
                return ApiResponseDto<PromotionResponseDto>.FailureResponse($"Error updating promotion: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<FavoritismCheckDto>> CheckFavoritismHistoryAsync(int promotionId)
        {
            try
            {
                _logger.LogInformation($"Checking favoritism for promotion {promotionId}");

                var promotion = await _repo.GetByIdAsync(promotionId);
                if (promotion == null)
                {
                    return ApiResponseDto<FavoritismCheckDto>.FailureResponse("Promotion not found");
                }

                var previousPromotions = (await _repo.GetByEmployeeUserIdAsync(promotion.EmployeeUserId))
                    .Where(p => p.PromotionId != promotionId).ToList();
                bool isFavoritism = previousPromotions.Count >= 2;

                var previousNominationDtos = previousPromotions.Select(p => new PreviousNominationDto
                {
                    PreviousPromotionId = p.PromotionId,
                    NominationDate = p.CreatedAt,
                    Status = p.Status,
                    ApprovedByEmail = p.ApprovedByUser?.Email ?? "N/A",
                    RejectionReason = p.Status == "Rejected" ? "Rejected by Department Head" : null
                }).ToList();

                var favoritism = new FavoritismCheckDto
                {
                    PromotionId = promotionId,
                    ManagerId = 0,
                    ManagerName = "Manager",
                    ManagerEmail = "manager@company.com",
                    EmployeeId = promotion.EmployeeUserId,
                    EmployeeName = "Employee",
                    EmployeeEmail = promotion.EmployeeUser?.Email ?? "N/A",
                    IsFavoritism = isFavoritism,
                    PreviousNominationCount = previousPromotions.Count,
                    PreviousNominations = previousNominationDtos
                };

                return ApiResponseDto<FavoritismCheckDto>.SuccessResponse(favoritism, "Favoritism check completed");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in CheckFavoritismHistoryAsync: {ex.Message}");
                return ApiResponseDto<FavoritismCheckDto>.FailureResponse($"Error checking favoritism: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<PromotionResponseDto>> ApprovePromotionAsync(ApprovePromotionRequestDto request)
        {
            try
            {
                _logger.LogInformation($"Approving promotion {request.PromotionId}");

                var promotion = await _repo.GetByIdAsync(request.PromotionId);
                if (promotion == null)
                {
                    return ApiResponseDto<PromotionResponseDto>.FailureResponse("Promotion not found");
                }

                promotion.Status = "Approved";
                promotion.ApprovedByUserId = request.ApprovedByUserId;

                var updatedPromotion = await _repo.UpdateAsync(promotion);
                await _repo.LoadPromotionRelations(updatedPromotion);

                _logger.LogInformation($"Promotion {request.PromotionId} approved");
                var promotionResponse = MapToPromotionResponseDto(updatedPromotion);

                return ApiResponseDto<PromotionResponseDto>.SuccessResponse(promotionResponse, "Promotion approved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in ApprovePromotionAsync: {ex.Message}");
                return ApiResponseDto<PromotionResponseDto>.FailureResponse($"Error approving promotion: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<PromotionResponseDto>> RejectPromotionAsync(RejectPromotionRequestDto request)
        {
            try
            {
                _logger.LogInformation($"Rejecting promotion {request.PromotionId}");

                var promotion = await _repo.GetByIdAsync(request.PromotionId);
                if (promotion == null)
                {
                    return ApiResponseDto<PromotionResponseDto>.FailureResponse("Promotion not found");
                }

                promotion.Status = "Rejected";

                var updatedPromotion = await _repo.UpdateAsync(promotion);
                await _repo.LoadPromotionRelations(updatedPromotion);

                _logger.LogInformation($"Promotion {request.PromotionId} rejected");
                var promotionResponse = MapToPromotionResponseDto(updatedPromotion);

                return ApiResponseDto<PromotionResponseDto>.SuccessResponse(promotionResponse, "Promotion rejected successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in RejectPromotionAsync: {ex.Message}");
                return ApiResponseDto<PromotionResponseDto>.FailureResponse($"Error rejecting promotion: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<PayrollResponseDto>> UpdatePayrollForPromotionAsync(UpdatePayrollRequestDto request)
        {
            try
            {
                _logger.LogInformation($"Updating payroll for PayrollId {request.PayrollId}");

                var promotion = await _repo.GetByIdAsync(request.PayrollId);
                if (promotion == null)
                {
                    return ApiResponseDto<PayrollResponseDto>.FailureResponse("Promotion/Payroll not found");
                }

                decimal oldSalary = promotion.NewSalary;
                promotion.OldSalary = oldSalary;
                promotion.NewSalary = request.NewSalary;

                if (oldSalary > 0)
                {
                    promotion.IncrementPercentage = ((promotion.NewSalary - oldSalary) / oldSalary) * 100;
                }

                var updatedPromotion = await _repo.UpdateAsync(promotion);
                await _repo.LoadPromotionRelations(updatedPromotion);

                _logger.LogInformation($"Payroll updated for PayrollId {request.PayrollId}");

                var payrollResponse = new PayrollResponseDto
                {
                    PayrollId = promotion.PromotionId,
                    EmployeeUserId = promotion.EmployeeUserId,
                    EmployeeEmail = promotion.EmployeeUser?.Email ?? "N/A",
                    DepartmentId = promotion.DepartmentId,
                    DepartmentName = promotion.Department?.DepartmentName ?? "Unknown",
                    PayrollPeriod = DateTime.UtcNow.ToString("yyyy-MM"),
                    OldSalary = promotion.OldSalary,
                    NewSalary = promotion.NewSalary,
                    IncrementPercentage = promotion.IncrementPercentage,
                    EffectiveDate = request.EffectiveDate,
                    Status = "Processed",
                    Notes = request.Notes,
                    CreatedAt = DateTime.UtcNow
                };

                return ApiResponseDto<PayrollResponseDto>.SuccessResponse(payrollResponse, "Payroll updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in UpdatePayrollForPromotionAsync: {ex.Message}");
                return ApiResponseDto<PayrollResponseDto>.FailureResponse($"Error updating payroll: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<PromotionResponseDto>> SubmitToLeadershipAsync(int promotionId)
        {
            try
            {
                _logger.LogInformation($"Submitting promotion {promotionId} to leadership");

                var promotion = await _repo.GetByIdAsync(promotionId);
                if (promotion == null)
                {
                    return ApiResponseDto<PromotionResponseDto>.FailureResponse("Promotion not found");
                }

                if (promotion.Status != "Approved")
                {
                    return ApiResponseDto<PromotionResponseDto>.FailureResponse($"Only approved promotions can be submitted. Current status: {promotion.Status}");
                }

                if (promotion.NewSalary <= 0)
                {
                    return ApiResponseDto<PromotionResponseDto>.FailureResponse("Payroll must be updated before submitting to leadership");
                }

                if (promotion.ApprovedAt.HasValue)
                {
                    return ApiResponseDto<PromotionResponseDto>.FailureResponse("This promotion has already been submitted to leadership");
                }

                promotion.ApprovedAt = DateTime.UtcNow;
                var updatedPromotion = await _repo.UpdateAsync(promotion);
                await _repo.LoadPromotionRelations(updatedPromotion);

                _logger.LogInformation($"Promotion {promotionId} submitted to leadership successfully");
                var promotionResponse = MapToPromotionResponseDto(updatedPromotion);

                return ApiResponseDto<PromotionResponseDto>.SuccessResponse(promotionResponse, "Promotion submitted to leadership successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in SubmitToLeadershipAsync: {ex.Message}");
                return ApiResponseDto<PromotionResponseDto>.FailureResponse($"Error submitting to leadership: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<List<PromotionResponseDto>>> GetAllPromotionsAsync()
        {
            try
            {
                _logger.LogInformation("Fetching all promotions");

                var promotions = await _repo.GetAllAsync();
                var promotionResponseDtos = promotions.Select(MapToPromotionResponseDto).ToList();

                return ApiResponseDto<List<PromotionResponseDto>>.SuccessResponse(
                    promotionResponseDtos, $"Successfully retrieved {promotions.Count} promotions");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GetAllPromotionsAsync: {ex.Message}");
                return ApiResponseDto<List<PromotionResponseDto>>.FailureResponse($"Error fetching promotions: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<PromotionResponseDto>> GetPromotionByIdAsync(int promotionId)
        {
            try
            {
                _logger.LogInformation($"Fetching promotion {promotionId}");

                var promotion = await _repo.GetByIdAsync(promotionId);
                if (promotion == null)
                {
                    return ApiResponseDto<PromotionResponseDto>.FailureResponse("Promotion not found");
                }

                var promotionResponse = MapToPromotionResponseDto(promotion);
                return ApiResponseDto<PromotionResponseDto>.SuccessResponse(promotionResponse, "Promotion retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GetPromotionByIdAsync: {ex.Message}");
                return ApiResponseDto<PromotionResponseDto>.FailureResponse($"Error fetching promotion: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<List<PromotionResponseDto>>> GetPromotionsByEmployeeAsync(int employeeUserId)
        {
            try
            {
                _logger.LogInformation($"Fetching promotions for employee {employeeUserId}");

                var promotions = await _repo.GetByEmployeeUserIdAsync(employeeUserId);
                var promotionResponseDtos = promotions.Select(MapToPromotionResponseDto).ToList();

                return ApiResponseDto<List<PromotionResponseDto>>.SuccessResponse(promotionResponseDtos, "Employee promotions retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GetPromotionsByEmployeeAsync: {ex.Message}");
                return ApiResponseDto<List<PromotionResponseDto>>.FailureResponse($"Error fetching employee promotions: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<List<PromotionResponseDto>>> GetPromotionsByStatusAsync(string status)
        {
            try
            {
                _logger.LogInformation($"Fetching promotions by status: {status}");

                var promotions = await _repo.GetByStatusAsync(status);
                var promotionResponseDtos = promotions.Select(MapToPromotionResponseDto).ToList();

                return ApiResponseDto<List<PromotionResponseDto>>.SuccessResponse(
                    promotionResponseDtos, $"Retrieved {promotions.Count} promotions with status: {status}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GetPromotionsByStatusAsync: {ex.Message}");
                return ApiResponseDto<List<PromotionResponseDto>>.FailureResponse($"Error fetching promotions by status: {ex.Message}");
            }
        }

        private PromotionResponseDto MapToPromotionResponseDto(Promotion promotion)
        {
            var firstName = "Unknown";
            var lastName = "Unknown";

            if (promotion.EmployeeUser?.Employee?.Userprofile != null)
            {
                firstName = promotion.EmployeeUser.Employee.Userprofile.FirstName ?? "Unknown";
                lastName = promotion.EmployeeUser.Employee.Userprofile.LastName ?? "Unknown";
            }

            return new PromotionResponseDto
            {
                PromotionId = promotion.PromotionId,
                EmployeeUserId = promotion.EmployeeUserId,
                EmployeeEmail = promotion.EmployeeUser?.Email ?? "N/A",
                EmployeeFirstName = firstName,
                EmployeeLastName = lastName,
                DepartmentId = promotion.DepartmentId,
                DepartmentName = promotion.Department?.DepartmentName ?? "Unknown",
                OldRole = promotion.OldRole ?? "N/A",
                NewRole = promotion.NewRole ?? "N/A",
                OldSalary = promotion.OldSalary,
                NewSalary = promotion.NewSalary,
                IncrementPercentage = promotion.IncrementPercentage,
                PromotionDate = promotion.PromotionDate.ToDateTime(TimeOnly.MinValue),
                Justification = promotion.Justification ?? "N/A",
                Status = promotion.Status ?? "Pending",
                ApprovedByUserId = promotion.ApprovedByUserId,
                ApprovedByEmail = promotion.ApprovedByUser?.Email ?? "N/A",
                CreatedAt = promotion.CreatedAt,
                ApprovedAt = promotion.ApprovedAt
            };
        }

    }
}
