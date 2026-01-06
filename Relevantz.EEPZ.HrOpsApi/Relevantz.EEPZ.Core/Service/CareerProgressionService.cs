using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.IService;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Relevantz.EEPZ.Core.Service
{
    public class CareerProgressionService : ICareerProgressionService
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<CareerProgressionService> _logger;

        public CareerProgressionService(EEPZDbContext context, ILogger<CareerProgressionService> logger)
        {
            _context = context;
            _logger = logger;
        }
        public async Task<ApiResponseDto<PendingNominationCheckDto>> CheckPendingNominationAsync(int employeeUserId)
        {
            try
            {
                _logger.LogInformation($" Checking pending nomination for employee {employeeUserId}");

                var employee = await _context.Employees
                    .Include(e => e.Userprofile)
                    .FirstOrDefaultAsync(e => e.EmployeeId == employeeUserId);

                if (employee == null)
                {
                    return ApiResponseDto<PendingNominationCheckDto>.FailureResponse("Employee not found");
                }

                var pendingPromotion = await _context.Promotions
                    .Include(p => p.EmployeeUser)
                    .FirstOrDefaultAsync(p => p.EmployeeUserId == employeeUserId && p.Status == "Pending");

                if (pendingPromotion != null)
                {
                    var result = new PendingNominationCheckDto
                    {
                        EmployeeUserId = employeeUserId,
                        EmployeeName = $"{employee.Userprofile?.FirstName} {employee.Userprofile?.LastName}" ?? "Unknown",
                        HasPendingNomination = true,
                        PendingPromotionId = pendingPromotion.PromotionId,
                        PendingNewRole = pendingPromotion.NewRole,
                        PendingCreatedAt = pendingPromotion.CreatedAt,
                        PendingJustification = pendingPromotion.Justification,
                        PendingManagerId = null,
                        PendingManagerEmail = pendingPromotion.EmployeeUser?.Email
                    };

                    return ApiResponseDto<PendingNominationCheckDto>.SuccessResponse(
                        result,
                        "Employee has pending nomination");
                }

                return ApiResponseDto<PendingNominationCheckDto>.SuccessResponse(
                    new PendingNominationCheckDto
                    {
                        EmployeeUserId = employeeUserId,
                        EmployeeName = $"{employee.Userprofile?.FirstName} {employee.Userprofile?.LastName}" ?? "Unknown",
                        HasPendingNomination = false
                    },
                    "No pending nominations");
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error in CheckPendingNominationAsync: {ex.Message}");
                return ApiResponseDto<PendingNominationCheckDto>.FailureResponse(
                    $"Error checking pending nomination: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<PromotionResponseDto>> CreatePromotionAsync(
            CreatePromotionRequestDto request,
            int managerId)
        {
            try
            {
                _logger.LogInformation($" Creating promotion for employee {request.EmployeeUserId}");

                var employee = await _context.Employees
                    .Include(e => e.Userprofile)
                    .FirstOrDefaultAsync(e => e.EmployeeId == request.EmployeeUserId);

                if (employee == null)
                {
                    return ApiResponseDto<PromotionResponseDto>.FailureResponse("Employee not found");
                }

                var existingPending = await _context.Promotions
                    .FirstOrDefaultAsync(p => p.EmployeeUserId == request.EmployeeUserId && p.Status == "Pending");

                if (existingPending != null)
                {
                    return ApiResponseDto<PromotionResponseDto>.FailureResponse(
                        "Employee already has a pending promotion");
                }

                if (string.IsNullOrEmpty(request.Justification))
                {
                    return ApiResponseDto<PromotionResponseDto>.FailureResponse(
                        "Justification is required");
                }

                var empDetails = await _context.Employeedetailsmasters
                    .Include(e => e.Role)
                    .FirstOrDefaultAsync(e => e.EmployeeId == request.EmployeeUserId);

                string currentRole = empDetails?.Role?.RoleName ?? request.OldRole ?? "N/A";

                var promotion = new Promotion
                {
                    EmployeeUserId = request.EmployeeUserId,
                    DepartmentId = request.DepartmentId,
                    OldRole = currentRole,
                    NewRole = request.NewRole,
                    OldSalary = 0m,
                    NewSalary = 0m,
                    PromotionDate = request.PromotionDate,
                    Justification = request.Justification,
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow
                };

                _context.Promotions.Add(promotion);
                await _context.SaveChangesAsync();

                _logger.LogInformation($" Promotion created with ID {promotion.PromotionId}");

                await _context.Entry(promotion).Reference(p => p.EmployeeUser).LoadAsync();
                await _context.Entry(promotion).Reference(p => p.Department).LoadAsync();

                var promotionResponse = MapToPromotionResponseDto(promotion);
                return ApiResponseDto<PromotionResponseDto>.SuccessResponse(
                    promotionResponse,
                    "Promotion created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error in CreatePromotionAsync: {ex.Message}");
                _logger.LogError($"Stack Trace: {ex.StackTrace}");
                return ApiResponseDto<PromotionResponseDto>.FailureResponse(
                    $"Error creating promotion: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<PromotionResponseDto>> UpdatePromotionAsync(UpdatePromotionRequestDto request)
        {
            try
            {
                _logger.LogInformation($" Updating promotion {request.PromotionId}");

                var promotion = await _context.Promotions
                    .Include(p => p.EmployeeUser)
                    .Include(p => p.Department)
                    .FirstOrDefaultAsync(p => p.PromotionId == request.PromotionId);

                if (promotion == null)
                {
                    return ApiResponseDto<PromotionResponseDto>.FailureResponse("Promotion not found");
                }

                promotion.NewRole = request.NewRole ?? promotion.NewRole;
                promotion.Justification = request.Justification ?? promotion.Justification;

                _context.Promotions.Update(promotion);
                await _context.SaveChangesAsync();

                _logger.LogInformation($" Promotion {request.PromotionId} updated");

                var promotionResponse = MapToPromotionResponseDto(promotion);
                return ApiResponseDto<PromotionResponseDto>.SuccessResponse(
                    promotionResponse,
                    "Promotion updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error in UpdatePromotionAsync: {ex.Message}");
                return ApiResponseDto<PromotionResponseDto>.FailureResponse(
                    $"Error updating promotion: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<FavoritismCheckDto>> CheckFavoritismHistoryAsync(int promotionId)
        {
            try
            {
                _logger.LogInformation($" Checking favoritism for promotion {promotionId}");

                var promotion = await _context.Promotions
                    .Include(p => p.EmployeeUser)
                    .FirstOrDefaultAsync(p => p.PromotionId == promotionId);

                if (promotion == null)
                {
                    return ApiResponseDto<FavoritismCheckDto>.FailureResponse("Promotion not found");
                }

                var previousPromotions = await _context.Promotions
                    .Include(p => p.ApprovedByUser)
                    .Where(p => p.EmployeeUserId == promotion.EmployeeUserId && p.PromotionId != promotionId)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                bool isFavoritism = previousPromotions.Count >= 2;

                var previousNominationDtos = previousPromotions
                    .Select(p => new PreviousNominationDto
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

                _logger.LogInformation($" Favoritism check complete - IsFavoritism: {isFavoritism}");

                return ApiResponseDto<FavoritismCheckDto>.SuccessResponse(
                    favoritism,
                    "Favoritism check completed");
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error in CheckFavoritismHistoryAsync: {ex.Message}");
                return ApiResponseDto<FavoritismCheckDto>.FailureResponse(
                    $"Error checking favoritism: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<PromotionResponseDto>> ApprovePromotionAsync(ApprovePromotionRequestDto request)
        {
            try
            {
                _logger.LogInformation($" Approving promotion {request.PromotionId}");

                var promotion = await _context.Promotions
                    .Include(p => p.EmployeeUser)
                    .Include(p => p.Department)
                    .Include(p => p.ApprovedByUser)
                    .FirstOrDefaultAsync(p => p.PromotionId == request.PromotionId);

                if (promotion == null)
                {
                    return ApiResponseDto<PromotionResponseDto>.FailureResponse("Promotion not found");
                }

                promotion.Status = "Approved";
                promotion.ApprovedByUserId = request.ApprovedByUserId;
                promotion.ApprovedAt = null;

                _context.Promotions.Update(promotion);
                await _context.SaveChangesAsync();

                _logger.LogInformation($" Promotion {request.PromotionId} approved");

                var promotionResponse = MapToPromotionResponseDto(promotion);
                return ApiResponseDto<PromotionResponseDto>.SuccessResponse(
                    promotionResponse,
                    "Promotion approved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error in ApprovePromotionAsync: {ex.Message}");
                return ApiResponseDto<PromotionResponseDto>.FailureResponse(
                    $"Error approving promotion: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<PromotionResponseDto>> RejectPromotionAsync(RejectPromotionRequestDto request)
        {
            try
            {
                _logger.LogInformation($" Rejecting promotion {request.PromotionId}");

                var promotion = await _context.Promotions
                    .Include(p => p.EmployeeUser)
                    .Include(p => p.Department)
                    .FirstOrDefaultAsync(p => p.PromotionId == request.PromotionId);

                if (promotion == null)
                {
                    return ApiResponseDto<PromotionResponseDto>.FailureResponse("Promotion not found");
                }

                promotion.Status = "Rejected";

                _context.Promotions.Update(promotion);
                await _context.SaveChangesAsync();

                _logger.LogInformation($" Promotion {request.PromotionId} rejected");

                var promotionResponse = MapToPromotionResponseDto(promotion);
                return ApiResponseDto<PromotionResponseDto>.SuccessResponse(
                    promotionResponse,
                    "Promotion rejected successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error in RejectPromotionAsync: {ex.Message}");
                return ApiResponseDto<PromotionResponseDto>.FailureResponse(
                    $"Error rejecting promotion: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<PayrollResponseDto>> UpdatePayrollForPromotionAsync(UpdatePayrollRequestDto request)
        {
            try
            {
                _logger.LogInformation($" Updating payroll for PayrollId {request.PayrollId}");

                var promotion = await _context.Promotions
                    .Include(p => p.EmployeeUser)
                    .Include(p => p.Department)
                    .FirstOrDefaultAsync(p => p.PromotionId == request.PayrollId);

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
                else
                {
                    promotion.IncrementPercentage = 0;
                }

                _context.Promotions.Update(promotion);
                await _context.SaveChangesAsync();

                _logger.LogInformation($" Payroll updated for PayrollId {request.PayrollId}");

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
                    ApprovedByUserId = null,
                    ApprovedByEmail = "N/A",
                    Notes = request.Notes,
                    CreatedAt = DateTime.UtcNow,
                    ApprovedAt = DateTime.UtcNow
                };

                return ApiResponseDto<PayrollResponseDto>.SuccessResponse(
                    payrollResponse,
                    "Payroll updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error in UpdatePayrollForPromotionAsync: {ex.Message}");
                return ApiResponseDto<PayrollResponseDto>.FailureResponse(
                    $"Error updating payroll: {ex.Message}");
            }
        }

        // SUBMIT TO LEADERSHIP
        public async Task<ApiResponseDto<PromotionResponseDto>> SubmitToLeadershipAsync(int promotionId)
        {
            try
            {
                _logger.LogInformation($" Submitting promotion {promotionId} to leadership");

                var promotion = await _context.Promotions
                    .Include(p => p.EmployeeUser)
                        .ThenInclude(u => u.Employee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(p => p.Department)
                    .FirstOrDefaultAsync(p => p.PromotionId == promotionId);

                if (promotion == null)
                {
                    _logger.LogWarning($" Promotion {promotionId} not found");
                    return ApiResponseDto<PromotionResponseDto>.FailureResponse("Promotion not found");
                }

                _logger.LogInformation($" Current promotion status: '{promotion.Status}'");

                if (string.IsNullOrEmpty(promotion.Status) ||
                    !promotion.Status.Equals("Approved", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning($" Cannot submit - Current status: '{promotion.Status}'. Must be 'Approved'");
                    return ApiResponseDto<PromotionResponseDto>.FailureResponse(
                        $"Only approved promotions can be submitted. Current status: {promotion.Status}");
                }

                if (promotion.NewSalary <= 0)
                {
                    _logger.LogWarning($" Cannot submit - Payroll not updated yet (NewSalary = {promotion.NewSalary})");
                    return ApiResponseDto<PromotionResponseDto>.FailureResponse(
                        "Payroll must be updated before submitting to leadership");
                }

                if (promotion.ApprovedAt.HasValue)
                {
                    _logger.LogWarning($" Promotion already submitted to leadership at {promotion.ApprovedAt}");
                    return ApiResponseDto<PromotionResponseDto>.FailureResponse(
                        "This promotion has already been submitted to leadership");
                }

                promotion.ApprovedAt = DateTime.UtcNow;
                _logger.LogInformation($" Setting ApprovedAt = {promotion.ApprovedAt} to mark submission to leadership");

                _context.Promotions.Update(promotion);
                await _context.SaveChangesAsync();

                _logger.LogInformation($" Promotion {promotionId} submitted to leadership successfully");

                var promotionResponse = MapToPromotionResponseDto(promotion);
                return ApiResponseDto<PromotionResponseDto>.SuccessResponse(
                    promotionResponse,
                    "Promotion submitted to leadership successfully");
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError($" Database error: {dbEx.Message}");
                _logger.LogError($"Inner Exception: {dbEx.InnerException?.Message}");
                return ApiResponseDto<PromotionResponseDto>.FailureResponse(
                    $"Database error: {dbEx.InnerException?.Message ?? dbEx.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error: {ex.Message}");
                _logger.LogError($"Stack Trace: {ex.StackTrace}");
                return ApiResponseDto<PromotionResponseDto>.FailureResponse(
                    $"Error submitting to leadership: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<List<PromotionResponseDto>>> GetAllPromotionsAsync()
        {
            try
            {
                _logger.LogInformation(" Fetching all promotions");

                var promotions = await _context.Promotions
                    .Include(p => p.EmployeeUser)
                        .ThenInclude(u => u.Employee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(p => p.Department)
                    .Include(p => p.ApprovedByUser)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                _logger.LogInformation($" Found {promotions.Count} promotions");

                var promotionResponseDtos = promotions
                    .Select(p => MapToPromotionResponseDto(p))
                    .ToList();

                return ApiResponseDto<List<PromotionResponseDto>>.SuccessResponse(
                    promotionResponseDtos,
                    $"Successfully retrieved {promotions.Count} promotions");
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error in GetAllPromotionsAsync: {ex.Message}");
                return ApiResponseDto<List<PromotionResponseDto>>.FailureResponse(
                    $"Error fetching promotions: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<PromotionResponseDto>> GetPromotionByIdAsync(int promotionId)
        {
            try
            {
                _logger.LogInformation($" Fetching promotion {promotionId}");

                var promotion = await _context.Promotions
                    .Include(p => p.EmployeeUser)
                        .ThenInclude(u => u.Employee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(p => p.Department)
                    .Include(p => p.ApprovedByUser)
                    .FirstOrDefaultAsync(p => p.PromotionId == promotionId);

                if (promotion == null)
                {
                    return ApiResponseDto<PromotionResponseDto>.FailureResponse("Promotion not found");
                }

                var promotionResponse = MapToPromotionResponseDto(promotion);
                return ApiResponseDto<PromotionResponseDto>.SuccessResponse(
                    promotionResponse,
                    "Promotion retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error in GetPromotionByIdAsync: {ex.Message}");
                return ApiResponseDto<PromotionResponseDto>.FailureResponse(
                    $"Error fetching promotion: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<List<PromotionResponseDto>>> GetPromotionsByEmployeeAsync(int employeeUserId)
        {
            try
            {
                _logger.LogInformation($" Fetching promotions for employee {employeeUserId}");

                var promotions = await _context.Promotions
                    .Include(p => p.EmployeeUser)
                        .ThenInclude(u => u.Employee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(p => p.Department)
                    .Include(p => p.ApprovedByUser)
                    .Where(p => p.EmployeeUserId == employeeUserId)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                var promotionResponseDtos = promotions
                    .Select(p => MapToPromotionResponseDto(p))
                    .ToList();

                return ApiResponseDto<List<PromotionResponseDto>>.SuccessResponse(
                    promotionResponseDtos,
                    "Employee promotions retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error in GetPromotionsByEmployeeAsync: {ex.Message}");
                return ApiResponseDto<List<PromotionResponseDto>>.FailureResponse(
                    $"Error fetching employee promotions: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<List<PromotionResponseDto>>> GetPromotionsByStatusAsync(string status)
        {
            try
            {
                _logger.LogInformation($" Fetching promotions by status: {status}");

                var promotions = await _context.Promotions
                    .Include(p => p.EmployeeUser)
                        .ThenInclude(u => u.Employee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(p => p.Department)
                    .Include(p => p.ApprovedByUser)
                    .Where(p => p.Status == status)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                var promotionResponseDtos = promotions
                    .Select(p => MapToPromotionResponseDto(p))
                    .ToList();

                return ApiResponseDto<List<PromotionResponseDto>>.SuccessResponse(
                    promotionResponseDtos,
                    $"Retrieved {promotions.Count} promotions with status: {status}");
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error in GetPromotionsByStatusAsync: {ex.Message}");
                return ApiResponseDto<List<PromotionResponseDto>>.FailureResponse(
                    $"Error fetching promotions by status: {ex.Message}");
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
                PromotionDate = promotion.PromotionDate.ToDateTime(new TimeOnly()),
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

