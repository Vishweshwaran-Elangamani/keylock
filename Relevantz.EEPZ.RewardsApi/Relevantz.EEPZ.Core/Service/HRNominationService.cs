using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Services
{
    public class HRNominationService : IHRNominationService
    {
        private readonly IHRNominationRepository _repository;
        private readonly ILogger<HRNominationService> _logger;
        

        public HRNominationService(
            IHRNominationRepository repository,
            ILogger<HRNominationService> logger)
        {
            _repository = repository;
            _logger = logger;
        }

    

public async Task<object> GetAllManagerNominationsForHRAsync(
    int pageNumber,
    int pageSize,
    string? status,
    int? rewardTypeId,
    string? search,
    DateTimeOffset? fromDate,
    DateTimeOffset? toDate,
    string? sortBy,
    string? sortDir)
{
    try
    {
        const int DefaultPageNumber = 1;
        const int DefaultPageSize = 20;
        const int MaxPageSize = 100;

        pageNumber = pageNumber <= 0 ? DefaultPageNumber : pageNumber;
        pageSize = pageSize <= 0 ? DefaultPageSize : Math.Min(pageSize, MaxPageSize);

        var nominations = await _repository.GetPendingVisibleManagerNominationsAsync();

        var flatList = new List<dynamic>();

        foreach (var n in nominations)
        {
            var opportunity = await _repository.GetOpportunityByIdAsync(n.OpportunityId);
            var nomineeDept = await _repository.GetEmployeeDepartmentDetailsAsync(n.NomineeEmployeeId);
            var parameterValues = await _repository.GetNominationParameterValuesAsync(n.NominationId);

            flatList.Add(new
            {
                n.NominationId,
                n.OpportunityId,
                OpportunityName = opportunity?.OpportunityName ?? "Unknown",
                OpportunityDeadline = opportunity?.Deadline,
                RewardType = opportunity?.RewardType != null ? new
                {
                    opportunity.RewardType.RewardTypeId,
                    opportunity.RewardType.RewardName,
                    opportunity.RewardType.RewardCategory
                } : null,
                RewardTypeId = opportunity?.RewardType?.RewardTypeId, // explicit Id for filtering
                NomineeEmployeeId = n.NomineeEmployeeId,
                NomineeName = n.NomineeEmployee.Userprofile.FirstName + " " + n.NomineeEmployee.Userprofile.LastName,
                NomineeEmail = n.NomineeEmployee.Userprofile.PersonalEmail,
                NomineeDepartmentId = nomineeDept?.DepartmentId,
                NomineeDepartmentName = nomineeDept?.Department?.DepartmentName ?? "Unknown",
                ManagerEmployeeId = n.NominatedByEmployeeId,
                ManagerName = n.NominatedByEmployee.Userprofile.FirstName + " " + n.NominatedByEmployee.Userprofile.LastName,
                n.Justification,
                n.SubmittedAt,
                n.Status,
                ParameterValues = parameterValues
            });
        }

        IEnumerable<dynamic> filtered = flatList;

        if (!string.IsNullOrWhiteSpace(status))
        {
            var s = status.Trim();
            filtered = filtered.Where(x => string.Equals((string)x.Status, s, StringComparison.OrdinalIgnoreCase));
        }

        if (rewardTypeId.HasValue)
        {
            filtered = filtered.Where(x => (int?)x.RewardTypeId == rewardTypeId.Value);
        }

        if (fromDate.HasValue)
        {
            var from = fromDate.Value.UtcDateTime;
            filtered = filtered.Where(x => (DateTime)x.SubmittedAt >= from);
        }

        if (toDate.HasValue)
        {
            var to = toDate.Value.UtcDateTime;
            filtered = filtered.Where(x => (DateTime)x.SubmittedAt <= to);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLowerInvariant();
            filtered = filtered.Where(x =>
                (!string.IsNullOrEmpty((string)x.NomineeName) && ((string)x.NomineeName).ToLowerInvariant().Contains(s)) ||
                (!string.IsNullOrEmpty((string)x.NomineeEmail) && ((string)x.NomineeEmail).ToLowerInvariant().Contains(s)) ||
                ((int)x.NomineeEmployeeId).ToString().Contains(s) ||
                (!string.IsNullOrEmpty((string)x.OpportunityName) && ((string)x.OpportunityName).ToLowerInvariant().Contains(s))
            );
        }

        var sb = (sortBy ?? "SubmittedAt").Trim().ToLowerInvariant();
        var sd = (sortDir ?? "desc").Trim().ToLowerInvariant();

        filtered = (sb, sd) switch
        {
            ("submittedat", "asc")      => filtered.OrderBy(x => (DateTime)x.SubmittedAt),
            ("submittedat", "desc")     => filtered.OrderByDescending(x => (DateTime)x.SubmittedAt),
            ("employeename", "asc")     => filtered.OrderBy(x => (string)x.NomineeName),
            ("employeename", "desc")    => filtered.OrderByDescending(x => (string)x.NomineeName),
            ("status", "asc")           => filtered.OrderBy(x => (string)x.Status),
            ("status", "desc")          => filtered.OrderByDescending(x => (string)x.Status),
            ("opportunityname", "asc")  => filtered.OrderBy(x => (string)x.OpportunityName),
            ("opportunityname", "desc") => filtered.OrderByDescending(x => (string)x.OpportunityName),
            _                           => filtered.OrderByDescending(x => (DateTime)x.SubmittedAt)
        };

        var totalCount = filtered.Count();

        var paged = filtered
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var groupedPage = paged
            .GroupBy(n => new
            {
                OpportunityId = (int)n.OpportunityId,
                OpportunityName = (string)n.OpportunityName,
                OpportunityDeadline = (DateTime?)n.OpportunityDeadline,
                RewardType = n.RewardType
            })
            .Select(g => new
            {
                OpportunityId = g.Key.OpportunityId,
                OpportunityName = g.Key.OpportunityName,
                OpportunityDeadline = g.Key.OpportunityDeadline,
                RewardType = g.Key.RewardType,
                NominationCount = g.Count(),
                Nominations = g.ToList()
            })
            .ToList();

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return new
        {
            success = true,
            data = groupedPage,
            totalNominations = totalCount,              
            totalOpportunities = groupedPage.Count,    
            pageNumber,
            pageSize,
            totalPages,
            hasPrevious = pageNumber > 1,
            hasNext = pageNumber < totalPages,
            message = $"Found {totalCount} pending nominations (showing page {pageNumber} of {totalPages})"
        };
    }
    catch (Exception ex)
    {
        _logger.LogError($"[HR_ALL_NOMINATIONS] Error: {ex.Message}");
        return new
        {
            success = false,
            message = "Error retrieving nominations",
            details = ex.Message
        };
    }
}


        public async Task<ApiResponse<object>> GetNominationDetailsAsync(int nominationId)
        {
            try
            {
                var nomination = await _repository.GetNominationByIdAsync(nominationId);

                if (nomination == null)
                {
                    return ApiResponse<object>.ErrorResponse("Nomination not found");
                }

                var nomineeDept = await _repository.GetEmployeeDepartmentDetailsAsync(nomination.NomineeEmployeeId);
                var parameterValues = await _repository.GetNominationParameterValuesWithDetailsAsync(nominationId);

                var result = new
                {
                    nominationId = nomination.NominationId,
                    status = nomination.Status,
                    justification = nomination.Justification,
                    submittedAt = nomination.SubmittedAt,
                    reviewedAt = nomination.ReviewedAt,
                    reviewRemarks = nomination.ReviewRemarks,
                    nomineeEmployeeId = nomination.NomineeEmployeeId,
                    nomineeName = $"{nomination.NomineeEmployee.Userprofile.FirstName} {nomination.NomineeEmployee.Userprofile.LastName}",
                    nominee = new
                    {
                        employeeId = nomination.NomineeEmployee.EmployeeId,
                        firstName = nomination.NomineeEmployee.Userprofile.FirstName,
                        lastName = nomination.NomineeEmployee.Userprofile.LastName,
                        personalEmail = nomination.NomineeEmployee.Userprofile.PersonalEmail,
                        department = new
                        {
                            departmentId = nomineeDept?.DepartmentId,
                            departmentName = nomineeDept?.Department?.DepartmentName ?? "Unknown"
                        }
                    },
                    nominatedBy = new
                    {
                        firstName = nomination.NominatedByEmployee.Userprofile.FirstName,
                        lastName = nomination.NominatedByEmployee.Userprofile.LastName
                    },
                    opportunity = nomination.Opportunity != null ? new
                    {
                        opportunityName = nomination.Opportunity.OpportunityName,
                        description = nomination.Opportunity.Description,
                        deadline = nomination.Opportunity.Deadline,
                        rewardType = nomination.Opportunity.RewardType != null ? new
                        {
                            rewardName = nomination.Opportunity.RewardType.RewardName,
                            rewardCategory = nomination.Opportunity.RewardType.RewardCategory
                        } : null
                    } : null,
                    parameterValues = parameterValues
                };

                return ApiResponse<object>.SuccessResponse(result, "Nomination details retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"[NOMINATION_DETAILS] Error: {ex.Message}");
                return ApiResponse<object>.ErrorResponse("Error retrieving nomination details", new List<string> { ex.Message });
            }
        }

        public async Task<ApiResponse<object>> ApproveNominationsAsync(HRNominationApprovalDto dto)
        {
            try
            {
                if (dto.SelectedNominationIds == null || dto.SelectedNominationIds.Count == 0)
                {
                    return ApiResponse<object>.ErrorResponse("No nominations selected");
                }

                if (dto.SelectedNominationIds.Count > 3)
                {
                    return ApiResponse<object>.ErrorResponse("Maximum 3 nominees can be selected per opportunity");
                }

                var selectedNominations = await _repository.GetNominationsByIdsAsync(
                    dto.SelectedNominationIds.Select(x => (int)x).ToList()
                );

                if (selectedNominations.Count == 0)
                {
                    return ApiResponse<object>.ErrorResponse("No nominations found");
                }

                var now = DateTime.UtcNow;

                foreach (var nomination in selectedNominations)
                {
                    nomination.Status = "Approved";
                    nomination.ReviewedByEmployeeId = (int)dto.HrUserId;
                    nomination.ReviewedAt = now;
                    nomination.ReviewRemarks = dto.ApprovalRemarks ?? "Selected by HR";

                    var tracking = new Nominationvisibilitytracking
                    {
                        NominationId = nomination.NominationId,
                        ViewedByEmployeeId = (int)dto.HrUserId,
                        ActionTaken = "Approved",
                        ViewedAt = now
                    };
                    await _repository.AddNominationTrackingAsync(tracking);
                }

                await _repository.SaveChangesAsync();

                return ApiResponse<object>.SuccessResponse(
                    new { approvedCount = selectedNominations.Count },
                    $"{selectedNominations.Count} nomination(s) approved successfully"
                );
            }
            catch (Exception ex)
            {
                _logger.LogError($"[HR_APPROVE] Error: {ex.Message}");
                return ApiResponse<object>.ErrorResponse("Error approving nominations", new List<string> { ex.Message });
            }
        }

        public async Task<ApiResponse<object>> RejectNominationsAsync(HRNominationRejectDto dto)
        {
            try
            {
                if (dto.SelectedNominationIds == null || dto.SelectedNominationIds.Count == 0)
                {
                    return ApiResponse<object>.ErrorResponse("No nominations selected");
                }

                var nominationsToReject = await _repository.GetNominationsByIdsAsync(
                    dto.SelectedNominationIds.Select(x => (int)x).ToList()
                );

                if (nominationsToReject.Count == 0)
                {
                    return ApiResponse<object>.ErrorResponse("No nominations found");
                }

                var now = DateTime.UtcNow;

                foreach (var nomination in nominationsToReject)
                {
                    nomination.Status = "Rejected";
                    nomination.ReviewedByEmployeeId = (int)dto.HrUserId;
                    nomination.ReviewedAt = now;
                    nomination.ReviewRemarks = dto.RejectionRemarks ?? "Rejected by HR";

                    var tracking = new Nominationvisibilitytracking
                    {
                        NominationId = nomination.NominationId,
                        ViewedByEmployeeId = (int)dto.HrUserId,
                        ActionTaken = "Rejected",
                        ViewedAt = now
                    };
                    await _repository.AddNominationTrackingAsync(tracking);
                }

                await _repository.SaveChangesAsync();

                return ApiResponse<object>.SuccessResponse(
                    new { rejectedCount = nominationsToReject.Count },
                    $"{nominationsToReject.Count} nomination(s) rejected successfully"
                );
            }
            catch (Exception ex)
            {
                _logger.LogError($"[REJECT_NOMINATIONS] Error: {ex.Message}");
                return ApiResponse<object>.ErrorResponse("Error rejecting nominations", new List<string> { ex.Message });
            }
        }

        public async Task<object> GetAllRewardTypesAsync(bool activeOnly)
        {
            try
            {
                var rewardTypes = await _repository.GetRewardTypesAsync(activeOnly);

                var result = rewardTypes.Select(rt => new
                {
                    rt.RewardTypeId,
                    rt.RewardCategory,
                    rt.RewardName,
                    rt.Description,
                    rt.IsActive,
                    IsVisibleForManagerNomination = rt.IsVisibleForManagerNomination,
                    rt.CreatedAt,
                    ParameterCount = 0
                }).ToList();

                return new
                {
                    success = true,
                    data = result,
                    message = $"Found {result.Count} reward types"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"[GET_REWARD_TYPES] Error: {ex.Message}");
                throw;
            }
        }

        public async Task<object> CreateRewardTypeAsync(CreateRewardTypeDto dto)
        {
            try
            {
                var rewardType = new Rewardtype
                {
                    RewardCategory = dto.RewardCategory,
                    RewardName = dto.RewardName,
                    Description = dto.Description,
                    IsActive = true,
                    IsVisibleForManagerNomination = dto.IsVisibleForManagerNomination,
                    CreatedBy = dto.CreatedBy,
                    CreatedAt = DateTime.UtcNow
                };

                await _repository.AddRewardTypeAsync(rewardType);
                await _repository.SaveChangesAsync();

                return new
                {
                    success = true,
                    data = new { rewardTypeId = rewardType.RewardTypeId },
                    message = "Reward type created successfully"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"[CREATE_REWARD_TYPE] Error: {ex.Message}");
                throw;
            }
        }

        public async Task<object> UpdateRewardTypeAsync(int rewardTypeId, UpdateRewardTypeDto dto)
        {
            try
            {
                var rewardType = await _repository.GetRewardTypeByIdAsync(rewardTypeId);
                if (rewardType == null)
                {
                    return new { success = false, message = "Reward type not found" };
                }

                rewardType.RewardName = dto.RewardName;
                rewardType.Description = dto.Description;
                rewardType.IsActive = dto.IsActive;
                rewardType.IsVisibleForManagerNomination = dto.IsVisibleForManagerNomination;

                await _repository.SaveChangesAsync();

                return new
                {
                    success = true,
                    message = "Reward type updated successfully"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"[UPDATE_REWARD_TYPE] Error: {ex.Message}");
                throw;
            }
        }

        public async Task<object> GetParametersByRewardTypeAsync(int rewardTypeId)
        {
            try
            {
                var parameters = await _repository.GetParametersByRewardTypeAsync(rewardTypeId);

                var result = parameters.Select(p => new
                {
                    p.ParameterId,
                    p.ParameterName,
                    p.ParameterType,
                    p.IsRequired,
                    p.PlaceholderText,
                    p.MinimumValue,
                    p.MaximumValue,
                    p.SortOrder
                }).ToList();

                return new
                {
                    success = true,
                    data = result,
                    message = $"Found {result.Count} parameters"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"[GET_PARAMETERS] Error: {ex.Message}");
                throw;
            }
        }

        public async Task<object> CreateParameterAsync(CreateParameterDto dto)
        {
            try
            {
                var parameter = new Nominationparameter
                {
                    RewardTypeId = dto.RewardTypeId,
                    ParameterName = dto.ParameterName,
                    ParameterType = dto.ParameterType,
                    IsRequired = dto.IsRequired,
                    PlaceholderText = dto.PlaceholderText,
                    MinimumValue = dto.MinimumValue,
                    MaximumValue = dto.MaximumValue,
                    SortOrder = dto.SortOrder,
                    CreatedAt = DateTime.UtcNow
                };

                await _repository.AddParameterAsync(parameter);
                await _repository.SaveChangesAsync();

                return new
                {
                    success = true,
                    data = new { parameterId = parameter.ParameterId },
                    message = "Parameter created successfully"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"[CREATE_PARAMETER] Error: {ex.Message}");
                throw;
            }
        }

        public async Task<object> UpdateParameterAsync(int parameterId, UpdateParameterDto dto)
        {
            try
            {
                var parameter = await _repository.GetParameterByIdAsync(parameterId);
                if (parameter == null)
                {
                    return new { success = false, message = "Parameter not found" };
                }

                parameter.ParameterName = dto.ParameterName;
                parameter.ParameterType = dto.ParameterType;
                parameter.IsRequired = dto.IsRequired;
                parameter.PlaceholderText = dto.PlaceholderText;
                parameter.MinimumValue = dto.MinimumValue;
                parameter.MaximumValue = dto.MaximumValue;
                parameter.SortOrder = dto.SortOrder;

                await _repository.SaveChangesAsync();

                return new
                {
                    success = true,
                    message = "Parameter updated successfully"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"[UPDATE_PARAMETER] Error: {ex.Message}");
                throw;
            }
        }

        public async Task<object> DeleteParameterAsync(int parameterId)
        {
            try
            {
                var parameter = await _repository.GetParameterByIdAsync(parameterId);
                if (parameter == null)
                {
                    return new { success = false, message = "Parameter not found" };
                }

                await _repository.DeleteParameterAsync(parameter);
                await _repository.SaveChangesAsync();

                return new
                {
                    success = true,
                    message = "Parameter deleted successfully"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"[DELETE_PARAMETER] Error: {ex.Message}");
                throw;
            }
        }

        public async Task<object> GetApprovedProfilesAsync()
        {
            try
            {
                var approvedNominations = await _repository.GetApprovedNominationsAsync();

                var result = new List<object>();
                foreach (var n in approvedNominations)
                {
                    var opportunity = await _repository.GetOpportunityByIdAsync(n.OpportunityId);

                    var dept = await _repository.GetEmployeeDepartmentDetailsAsync(n.NomineeEmployeeId);

                    result.Add(new
                    {
                        n.NominationId,
                        n.Justification,
                        n.SubmittedAt,
                        n.ReviewedAt,
                        Nominee = new
                        {
                            n.NomineeEmployee.EmployeeId,
                            n.NomineeEmployee.Userprofile.FirstName,
                            n.NomineeEmployee.Userprofile.LastName,
                            DepartmentName = dept?.Department?.DepartmentName ?? "Unknown"
                        },
                        Opportunity = opportunity != null ? new
                        {
                            opportunity.OpportunityName,
                            RewardType = opportunity.RewardType?.RewardName ?? "Unknown",
                            RewardCategory = opportunity.RewardType?.RewardCategory ?? "Unknown"
                        } : null
                    });
                }

                return new
                {
                    success = true,
                    data = result,
                    message = $"Found {result.Count} approved profiles"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"[APPROVED_PROFILES] Error: {ex.Message}");
                throw;
            }
        }

        public async Task<object> GetRejectedProfilesAsync()
        {
            try
            {
                var rejectedNominations = await _repository.GetRejectedNominationsAsync();

                _logger.LogInformation($"[REJECTED_PROFILES] Found {rejectedNominations.Count} rejected nominations");

                var result = new List<object>();

                foreach (var n in rejectedNominations)
                {
                    var opportunity = await _repository.GetOpportunityByIdAsync(n.OpportunityId);

                    var dept = await _repository.GetEmployeeDepartmentDetailsAsync(n.NomineeEmployeeId);

                    result.Add(new
                    {
                        n.NominationId,
                        n.Justification,
                        n.SubmittedAt,
                        n.ReviewedAt,
                        n.ReviewRemarks,
                        Nominee = new
                        {
                            n.NomineeEmployee.EmployeeId,
                            n.NomineeEmployee.Userprofile.FirstName,
                            n.NomineeEmployee.Userprofile.LastName,
                            DepartmentName = dept?.Department?.DepartmentName ?? "Unknown"
                        },
                        Opportunity = opportunity != null ? new
                        {
                            opportunity.OpportunityName,
                            RewardType = opportunity.RewardType?.RewardName ?? "Unknown",
                            RewardCategory = opportunity.RewardType?.RewardCategory ?? "Unknown"
                        } : null
                    });
                }

                return new
                {
                    success = true,
                    data = result,
                    message = $"Found {result.Count} rejected profiles"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"[REJECTED_PROFILES] Error: {ex.Message}");
                throw;
            }
        }

        public async Task<object> GetStatisticsAsync()
        {
            try
            {
                var totalNominations = await _repository.GetTotalNominationsCountAsync();
                var pendingNominations = await _repository.GetPendingNominationsCountAsync();
                var approvedNominations = await _repository.GetApprovedNominationsCountAsync();
                var rejectedNominations = await _repository.GetRejectedNominationsCountAsync();
                var activeOpportunities = await _repository.GetActiveOpportunitiesCountAsync();

                var nominationsWithOpportunities = await _repository.GetAllNominationsWithOpportunitiesAsync();

                var recognitionCount = nominationsWithOpportunities
                    .Count(x => x.Opportunity?.RewardType?.RewardCategory == "Recognition");

                var promotionCount = nominationsWithOpportunities
                    .Count(x => x.Opportunity?.RewardType?.RewardCategory == "Promotion");

                return new
                {
                    success = true,
                    data = new
                    {
                        totalNominations,
                        pendingNominations,
                        approvedNominations,
                        rejectedNominations,
                        activeOpportunities,
                        recognitionCount,
                        promotionCount
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"[STATISTICS] Error: {ex.Message}");
                throw;
            }
        }
    }
}
