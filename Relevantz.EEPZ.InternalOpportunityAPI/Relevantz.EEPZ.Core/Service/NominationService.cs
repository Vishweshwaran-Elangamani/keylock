using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Enums;
using Relevantz.EEPZ.Common.ViewModels.Common;
using Relevantz.EEPZ.Common.ViewModels.Nomination.Request;
using Relevantz.EEPZ.Common.ViewModels.Nomination.Response;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.IRepository;

namespace Relevantz.EEPZ.Core.Service
{
    public class NominationService : INominationService
    {
        private readonly INominationRepository _nominationRepository;
        private readonly INotificationService _notificationService;
        private readonly IMapper _mapper;

        public NominationService(
            INominationRepository nominationRepository,
            INotificationService notificationService,
            IMapper mapper)
        {
            _nominationRepository = nominationRepository;
            _notificationService = notificationService;
            _mapper = mapper;
        }

        public async Task<NominationResponseDto> CreateSelfNominationAsync(int employeeId, CreateSelfNominationRequestDto request)
        {
            try
            {
                Console.WriteLine($"[Service] CreateSelfNomination - UserId: {employeeId}, OpportunityId: {request.OpportunityId}");

                // Check for duplicate
                var isDuplicate = await _nominationRepository.ExistsDuplicateAsync(request.OpportunityId, employeeId);
                if (isDuplicate)
                {
                    Console.WriteLine($"[Service] Duplicate nomination detected - User {employeeId} already applied for opportunity {request.OpportunityId}");
                    throw new Exception("You have already applied for this opportunity. You can reapply only if your previous application was rejected.");
                }

                // Get Manager (L2) from Project table
                var managerUserId = await _nominationRepository.GetManagerFromProjectAsync(employeeId);
                if (managerUserId == null)
                {
                    throw new Exception("Cannot find Manager (L2) from your primary project. Please contact HR.");
                }

                Console.WriteLine($"[Service] Self-nomination will go to Manager UserId: {managerUserId}");

                var nomination = new Nomination
                {
                    OpportunityId = request.OpportunityId,
                    NomineeUserId = employeeId,
                    NominationType = "employee_self",
                    NominatedByUserId = employeeId,
                    Justification = request.Justification,
                    
                    // Always start at Manager Review (Level 1)
                    CurrentApprovalLevel = 1,
                    Status = "Pending_Manager_Review",
                    
                    L2ManagerUserId = managerUserId.Value,
                    
                    SubmittedAt = DateTime.UtcNow
                };

                var created = await _nominationRepository.CreateAsync(nomination);
                Console.WriteLine($"[Service] Self-nomination created with ID: {created.NominationId}");

                // No email sent for self-nomination per your requirement

                return _mapper.Map<NominationResponseDto>(created);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Service] Error in CreateSelfNominationAsync: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Manager Nomination: 
        /// - If nominator is Manager (L2), skip to DeptHead
        /// - If nominator is lower level, goes to Manager first
        /// </summary>
        public async Task<NominationResponseDto> CreateManagerNominationAsync(int managerId, CreateManagerNominationRequestDto request)
        {
            try
            {
                Console.WriteLine($"[Service] CreateManagerNomination - ManagerId: {managerId}, NomineeId: {request.NomineeEmployeeId}");

                // Check for duplicate
                var isDuplicate = await _nominationRepository.ExistsDuplicateAsync(request.OpportunityId, request.NomineeEmployeeId);
                if (isDuplicate)
                {
                    Console.WriteLine($"[Service] Duplicate nomination detected - User {request.NomineeEmployeeId} already applied for opportunity {request.OpportunityId}");
                    throw new Exception("This employee has already been nominated for this opportunity. They can be re-nominated only if the previous nomination was rejected.");
                }

                // Get nominee's Manager and DeptHead from Project
                var nomineeManagerUserId = await _nominationRepository.GetManagerFromProjectAsync(request.NomineeEmployeeId);
                var nomineeDeptHeadUserId = await _nominationRepository.GetDeptHeadFromProjectAsync(request.NomineeEmployeeId);

                if (nomineeManagerUserId == null || nomineeDeptHeadUserId == null)
                {
                    throw new Exception("Cannot find Manager or DeptHead from nominee's primary project. Please contact HR.");
                }

                Console.WriteLine($"[Service] Nominee's Manager: {nomineeManagerUserId}, DeptHead: {nomineeDeptHeadUserId}");

                // Check if nominator IS the Manager (L2)
                if (managerId == nomineeManagerUserId.Value)
                {
                    Console.WriteLine($"[Service] Manager is nominating their own team member - Auto-approve Manager level, go to DeptHead");

                    var nomination = new Nomination
                    {
                        OpportunityId = request.OpportunityId,
                        NomineeUserId = request.NomineeEmployeeId,
                        NominationType = "manager_nomination",
                        NominatedByUserId = managerId,
                        Justification = request.Justification,
                        
                        // Auto-approve Manager level, go directly to DeptHead
                        CurrentApprovalLevel = 2,
                        Status = "Pending_DeptHead_Review",
                        
                        L2ManagerUserId = managerId,
                        L2ReviewRemarks = "Manager nominated (auto-approved)",
                        L2ReviewedAt = DateTime.UtcNow,
                        L2Status = "Approved",
                        
                        DeptHeadUserId = nomineeDeptHeadUserId.Value,
                        
                        SubmittedAt = DateTime.UtcNow
                    };

                    var created = await _nominationRepository.CreateAsync(nomination);
                    Console.WriteLine($"[Service] Manager nomination created with ID: {created.NominationId}, skipped to DeptHead: {nomineeDeptHeadUserId}");

                    // Send email to nominee - fetch details with navigation properties
                    var nominationDetail = await _nominationRepository.GetByIdAsync(created.NominationId);
                    if (nominationDetail != null && 
                        nominationDetail.NomineeUser != null && 
                        nominationDetail.NominatedByUser != null &&
                        nominationDetail.Opportunity != null)
                    {
                        var nomineeProfile = nominationDetail.NomineeUser.Employee?.Userprofile;
                        var nominatorProfile = nominationDetail.NominatedByUser.Employee?.Userprofile;
                        
                        if (nomineeProfile != null && nominatorProfile != null)
                        {
                            await _notificationService.SendNominationCreatedEmailAsync(
                                nominationDetail.NomineeUser.Email,
                                $"{nomineeProfile.FirstName} {nomineeProfile.LastName}",
                                nominationDetail.Opportunity .OpportunityName,
                                $"{nominatorProfile.FirstName} {nominatorProfile.LastName}"
                            );
                        }
                    }

                    return _mapper.Map<NominationResponseDto>(created);
                }
                else
                {
                    // Nominator is NOT the Manager - treat as regular flow (goes to Manager first)
                    Console.WriteLine($"[Service] Nominator {managerId} is not the nominee's Manager - going to Manager first");

                    var nomination = new Nomination
                    {
                        OpportunityId = request.OpportunityId,
                        NomineeUserId = request.NomineeEmployeeId,
                        NominationType = "manager_nomination",
                        NominatedByUserId = managerId,
                        Justification = request.Justification,
                        
                        CurrentApprovalLevel = 1,
                        Status = "Pending_Manager_Review",
                        
                        L2ManagerUserId = nomineeManagerUserId.Value,
                        
                        SubmittedAt = DateTime.UtcNow
                    };

                    var created = await _nominationRepository.CreateAsync(nomination);
                    Console.WriteLine($"[Service] Manager nomination created with ID: {created.NominationId}, going to Manager: {nomineeManagerUserId}");

                    // Send email to nominee - fetch details with navigation properties
                    var nominationDetail = await _nominationRepository.GetByIdAsync(created.NominationId);
                    if (nominationDetail != null && 
                        nominationDetail.NomineeUser != null && 
                        nominationDetail.NominatedByUser != null &&
                        nominationDetail.Opportunity != null)
                    {
                        var nomineeProfile = nominationDetail.NomineeUser.Employee?.Userprofile;
                        var nominatorProfile = nominationDetail.NominatedByUser.Employee?.Userprofile;
                        
                        if (nomineeProfile != null && nominatorProfile != null)
                        {
                            await _notificationService.SendNominationCreatedEmailAsync(
                                nominationDetail.NomineeUser.Email,
                                $"{nomineeProfile.FirstName} {nomineeProfile.LastName}",
                                nominationDetail.Opportunity .OpportunityName,
                                $"{nominatorProfile.FirstName} {nominatorProfile.LastName}"
                            );
                        }
                    }

                    return _mapper.Map<NominationResponseDto>(created);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Service] Error in CreateManagerNominationAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<NominationDetailResponseDto> GetNominationByIdAsync(int id)
        {
            try
            {
                Console.WriteLine($"[Service] GetNominationById - ID: {id}");

                var nomination = await _nominationRepository.GetByIdAsync(id);
                if (nomination == null)
                {
                    Console.WriteLine($"[Service] Nomination not found with ID: {id}");
                    throw new Exception("Nomination not found");
                }

                return _mapper.Map<NominationDetailResponseDto>(nomination);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Service] Error in GetNominationByIdAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<List<NominationResponseDto>> GetMyNominationsAsync(int employeeId)
        {
            try
            {
                Console.WriteLine($"[Service] GetMyNominationsAsync - UserId: {employeeId}");

                var nominations = await _nominationRepository.GetByEmployeeAsync(employeeId);

                Console.WriteLine($"[Service] Found {nominations?.Count ?? 0} nominations for user {employeeId}");

                if (nominations == null || !nominations.Any())
                    return new List<NominationResponseDto>();

                return _mapper.Map<List<NominationResponseDto>>(nominations);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Service] Error in GetMyNominationsAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<NominationListResponseDto> GetPendingManagerReviewAsync(int managerId)
        {
            try
            {
                Console.WriteLine($"[Service] GetPendingManagerReviewAsync - ManagerId: {managerId}");

                var nominations = await _nominationRepository.GetPendingManagerReviewByManagerIdAsync(managerId);

                Console.WriteLine($"[Service] Found {nominations?.Count ?? 0} pending manager reviews");

                if (nominations == null || !nominations.Any())
                {
                    return new NominationListResponseDto
                    {
                        Nominations = new List<NominationResponseDto>(),
                        TotalCount = 0,
                        PageNumber = 1,
                        PageSize = 10,
                        TotalPages = 0
                    };
                }

                var mapped = _mapper.Map<List<NominationResponseDto>>(nominations);

                return new NominationListResponseDto
                {
                    Nominations = mapped,
                    TotalCount = nominations.Count,
                    PageNumber = 1,
                    PageSize = 10,
                    TotalPages = 1
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Service] Error in GetPendingManagerReviewAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<NominationListResponseDto> GetPendingDeptHeadReviewAsync(int deptHeadId)
        {
            try
            {
                Console.WriteLine($"[Service] GetPendingDeptHeadReviewAsync - DeptHeadId: {deptHeadId}");

                var nominations = await _nominationRepository.GetPendingDeptHeadApprovalByDeptHeadIdAsync(deptHeadId);

                Console.WriteLine($"[Service] Found {nominations?.Count ?? 0} pending dept head reviews");

                if (nominations == null || !nominations.Any())
                {
                    return new NominationListResponseDto
                    {
                        Nominations = new List<NominationResponseDto>(),
                        TotalCount = 0,
                        PageNumber = 1,
                        PageSize = 10,
                        TotalPages = 0
                    };
                }

                var mapped = _mapper.Map<List<NominationResponseDto>>(nominations);

                return new NominationListResponseDto
                {
                    Nominations = mapped,
                    TotalCount = nominations.Count,
                    PageNumber = 1,
                    PageSize = 10,
                    TotalPages = 1
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Service] Error in GetPendingDeptHeadReviewAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<NominationListResponseDto> GetAllNominationsAsync(string? status)
        {
            try
            {
                Console.WriteLine($"[Service] GetAllNominationsAsync - Status Filter: {status ?? "All"}");

                List<Nomination> nominations;

                if (!string.IsNullOrEmpty(status))
                {
                    nominations = await _nominationRepository.GetByStatusAsync(status);
                }
                else
                {
                    nominations = await _nominationRepository.GetAllAsync();
                }

                Console.WriteLine($"[Service] Found {nominations?.Count ?? 0} total nominations");

                if (nominations == null || !nominations.Any())
                {
                    return new NominationListResponseDto
                    {
                        Nominations = new List<NominationResponseDto>(),
                        TotalCount = 0,
                        PageNumber = 1,
                        PageSize = 10,
                        TotalPages = 0
                    };
                }

                var mapped = _mapper.Map<List<NominationResponseDto>>(nominations);

                return new NominationListResponseDto
                {
                    Nominations = mapped,
                    TotalCount = nominations.Count,
                    PageNumber = 1,
                    PageSize = 10,
                    TotalPages = 1
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Service] Error in GetAllNominationsAsync: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Manager Review: Approve/Reject at Manager level
        /// If approved, moves to DeptHead
        /// </summary>
        public async Task<NominationResponseDto> ManagerReviewNominationAsync(int nominationId, int managerId, ManagerReviewRequestDto request)
        {
            try
            {
                Console.WriteLine($"[Service] ManagerReviewNomination - NominationId: {nominationId}, ManagerId: {managerId}, Action: {request.ActionTaken}");

                var nomination = await _nominationRepository.GetByIdAsync(nominationId);
                if (nomination == null)
                {
                    throw new Exception("Nomination not found");
                }

                Console.WriteLine($"[Service] Current status: {nomination.Status}, Level: {nomination.CurrentApprovalLevel}");

                // Verify this manager is authorized (L2ManagerUserId = Manager)
                if (nomination.CurrentApprovalLevel != 1 || nomination.L2ManagerUserId != managerId)
                {
                    throw new UnauthorizedAccessException("You are not authorized to review this nomination at this stage");
                }

                if (request.ActionTaken == "Approved")
                {
                    // Update Manager review fields
                    nomination.L2ReviewRemarks = request.Remarks;
                    nomination.L2ReviewedAt = DateTime.UtcNow;
                    nomination.L2Status = "Approved";

                    // Get DeptHead from Project
                    var deptHeadUserId = await _nominationRepository.GetDeptHeadFromProjectAsync(nomination.NomineeUserId);
                    
                    if (deptHeadUserId == null)
                    {
                        throw new Exception("Cannot find Department Head from nominee's primary project");
                    }

                    // Move to DeptHead review
                    nomination.DeptHeadUserId = deptHeadUserId.Value;
                    nomination.CurrentApprovalLevel = 2;
                    nomination.Status = "Pending_DeptHead_Review";

                    Console.WriteLine($"[Service] Manager Approved - Moving to DeptHead: {deptHeadUserId}");
                }
                else if (request.ActionTaken == "Rejected")
                {
                    nomination.L2ReviewRemarks = request.Remarks;
                    nomination.L2ReviewedAt = DateTime.UtcNow;
                    nomination.L2Status = "Rejected";
                    nomination.Status = "Rejected_By_Manager";

                    Console.WriteLine($"[Service] Manager Rejected");

                    // Send rejection email to nominee
                    if (nomination.NomineeUser != null && nomination.Opportunity != null)
                    {
                        var nomineeProfile = nomination.NomineeUser.Employee?.Userprofile;
                        if (nomineeProfile != null)
                        {
                            await _notificationService.SendNominationRejectedEmailAsync(
                                nomination.NomineeUser.Email,
                                $"{nomineeProfile.FirstName} {nomineeProfile.LastName}",
                                nomination.Opportunity .OpportunityName,
                                request.Remarks ?? "No reason provided"
                            );
                        }
                    }
                }

                // Update legacy fields
                nomination.ReviewRemarks = request.Remarks;
                nomination.ReviewedByUserId = managerId;
                nomination.ReviewedAt = DateTime.UtcNow;

                var updated = await _nominationRepository.UpdateAsync(nomination);
                Console.WriteLine($"[Service] Nomination {nominationId} reviewed successfully");

                return _mapper.Map<NominationResponseDto>(updated);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Service] Error in ManagerReviewNominationAsync: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// DeptHead Review: Final approval/rejection
        /// </summary>
        public async Task<NominationResponseDto> DepartmentHeadReviewAsync(int nominationId, int deptHeadId, DepartmentHeadReviewRequestDto request)
        {
            try
            {
                Console.WriteLine($"[Service] DepartmentHeadReview - NominationId: {nominationId}, Action: {request.Action}");

                var nomination = await _nominationRepository.GetByIdAsync(nominationId);
                if (nomination == null)
                {
                    throw new Exception("Nomination not found");
                }

                // Verify authorization
                if (nomination.CurrentApprovalLevel != 2 || nomination.DeptHeadUserId != deptHeadId)
                {
                    throw new UnauthorizedAccessException("You are not authorized to review this nomination");
                }

                Console.WriteLine($"[Service] Current status: {nomination.Status}");

                if (request.Action == "Approved")
                {
                    nomination.DeptHeadReviewRemarks = request.ReviewRemarks;
                    nomination.DeptHeadReviewedAt = DateTime.UtcNow;
                    nomination.DeptHeadStatus = "Approved";
                    nomination.CurrentApprovalLevel = 3; // Final level
                    nomination.Status = "Approved_By_DeptHead";

                    Console.WriteLine($"[Service] DeptHead Approved - Nomination completed");

                    // Add review metrics
                    var metric = new Nominationreviewmetric
                    {
                        NominationId = nominationId,
                        ReviewedByUserId = deptHeadId,
                        MeritScore = request.MeritScore,
                        DiversityScore = request.DiversityScore,
                        ConflictOfInterest = request.ConflictOfInterest,
                        ReviewNotes = request.ReviewNotes,
                        ReviewedAt = DateTime.UtcNow
                    };
                    await _nominationRepository.AddReviewMetricAsync(metric);

                    // Send approval email to nominee
                    if (nomination.NomineeUser != null && nomination.Opportunity != null)
                    {
                        var nomineeProfile = nomination.NomineeUser.Employee?.Userprofile;
                        if (nomineeProfile != null)
                        {
                            await _notificationService.SendNominationApprovedEmailAsync(
                                nomination.NomineeUser.Email,
                                $"{nomineeProfile.FirstName} {nomineeProfile.LastName}",
                                nomination.Opportunity .OpportunityName
                            );
                        }
                    }
                }
                else if (request.Action == "Rejected")
                {
                    nomination.DeptHeadReviewRemarks = request.ReviewRemarks;
                    nomination.DeptHeadReviewedAt = DateTime.UtcNow;
                    nomination.DeptHeadStatus = "Rejected";
                    nomination.Status = "Rejected_By_DeptHead";

                    Console.WriteLine($"[Service] DeptHead Rejected");

                    // Send rejection email to nominee
                    if (nomination.NomineeUser != null && nomination.Opportunity != null)
                    {
                        var nomineeProfile = nomination.NomineeUser.Employee?.Userprofile;
                        if (nomineeProfile != null)
                        {
                            await _notificationService.SendNominationRejectedEmailAsync(
                                nomination.NomineeUser.Email,
                                $"{nomineeProfile.FirstName} {nomineeProfile.LastName}",
                                nomination.Opportunity .OpportunityName,
                                request.ReviewRemarks ?? "No reason provided"
                            );
                        }
                    }
                }

                // Update legacy fields
                nomination.ReviewRemarks = request.ReviewRemarks;
                nomination.ReviewedByUserId = deptHeadId;
                nomination.ReviewedAt = DateTime.UtcNow;

                var updated = await _nominationRepository.UpdateAsync(nomination);
                Console.WriteLine($"[Service] Nomination {nominationId} reviewed successfully by dept head {deptHeadId}");

                return _mapper.Map<NominationResponseDto>(updated);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Service] Error in DepartmentHeadReviewAsync: {ex.Message}");
                throw;
            }
        }

        public Task<EligibilityCheckResponseDto> CheckEligibilityAsync(int employeeId, int opportunityId)
        {
            try
            {
                Console.WriteLine($"[Service] CheckEligibility - EmployeeId: {employeeId}, OpportunityId: {opportunityId}");

                // TODO: Implement actual eligibility check logic

                return Task.FromResult(new EligibilityCheckResponseDto
                {
                    OpportunityId = opportunityId,
                    OpportunityName = "Opportunity Name",
                    IsEligible = true,
                    Message = "Employee is eligible",
                    EligibilityCriteria = "Criteria"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Service] Error in CheckEligibilityAsync: {ex.Message}");
                throw;
            }
        }
        public async Task<NominationHistoryResponseDto> GetMyNominationHistoryAsync(int userId, string? status = null)
{
    try
    {
        Console.WriteLine($"✓ GetMyNominationHistoryAsync - UserId: {userId}, Status: {status ?? "All"}");

        // Get all historical nominations (self + team)
        var allHistoryNominations = await _nominationRepository.GetNominationHistoryByUserIdAsync(userId, status);

        if (allHistoryNominations == null || !allHistoryNominations.Any())
        {
            return new NominationHistoryResponseDto
            {
                SelfNominations = new List<HistoryNominationDto>(),
                TeamNominations = new List<HistoryNominationDto>(),
                TotalCount = 0,
                Statistics = new HistoryStatistics()
            };
        }

        // Separate self nominations from team nominations
        var selfNominations = allHistoryNominations
            .Where(n => n.NominationType == "employee_self")
            .ToList();

        var teamNominations = allHistoryNominations
            .Where(n => n.NominationType == "manager_nomination")
            .ToList();

        // Map to DTOs
        var selfNominationDtos = selfNominations.Select(n => MapToHistoryDto(n)).ToList();
        var teamNominationDtos = teamNominations.Select(n => MapToHistoryDto(n)).ToList();

        // Calculate statistics
        var statistics = new HistoryStatistics
        {
            TotalSelfNominations = selfNominations.Count,
            TotalTeamNominations = teamNominations.Count,
            ApprovedCount = allHistoryNominations.Count(n => n.Status.Contains("Approved")),
            RejectedCount = allHistoryNominations.Count(n => n.Status.Contains("Rejected")),
            PendingCount = 0, // History only shows finalized
            WithdrawnCount = allHistoryNominations.Count(n => n.Status == "Withdrawn")
        };

        var response = new NominationHistoryResponseDto
        {
            SelfNominations = selfNominationDtos,
            TeamNominations = teamNominationDtos,
            TotalCount = selfNominationDtos.Count + teamNominationDtos.Count,
            Statistics = statistics
        };

        Console.WriteLine($"✓ Found {response.TotalCount} historical nominations (Self: {selfNominationDtos.Count}, Team: {teamNominationDtos.Count})");

        return response;
    }
    catch (Exception ex)
    {
        Console.WriteLine($"✗ Error in GetMyNominationHistoryAsync: {ex.Message}");
        throw new Exception($"Failed to fetch nomination history: {ex.Message}", ex);
    }
}

// 🆕 HELPER METHOD: Map Nomination to History DTO
private HistoryNominationDto MapToHistoryDto(Nomination nomination)
{
    // Get nominee (employee) details
    var nomineeProfile = nomination.NomineeUser?.Employee?.Userprofile;
    var nomineeEmployee = nomination.NomineeUser?.Employee;
    
    // Get manager details (L2 is the main manager in your flow)
    var l2ManagerProfile = nomination.L2ManagerUser?.Employee?.Userprofile;
    
    // Get dept head details
    var deptHeadProfile = nomination.DeptHeadUser?.Employee?.Userprofile;

    // Determine the final review date (last approval level)
    DateTime? finalizedDate = nomination.DeptHeadReviewedAt 
                              ?? nomination.L2ReviewedAt 
                              ?? nomination.L1ReviewedAt;

    // Determine workflow stage based on current approval level
    string workflowStage = nomination.CurrentApprovalLevel switch
    {
        0 => "Submitted",
        1 => "Manager Review",
        2 => "Department Head Review",
        3 => "Completed",
        _ => "Unknown"
    };

    // Determine display status
    string displayStatus = nomination.Status switch
    {
        "Approved_By_DeptHead" => "Approved",
        "Rejected_By_Manager" => "Rejected",
        "Rejected_By_DeptHead" => "Rejected",
        "Withdrawn" => "Withdrawn",
        _ => nomination.Status
    };

    return new HistoryNominationDto
    {
        NominationId = nomination.NominationId,
        OpportunityId = nomination.OpportunityId,
        OpportunityTitle = nomination.Opportunity?.OpportunityName ?? "N/A",
        OpportunityType = "Internal Opportunity",
        
        EmployeeId = nomination.NomineeUserId,
        EmployeeName = nomineeProfile != null 
            ? $"{nomineeProfile.FirstName} {nomineeProfile.LastName}" 
            : "Unknown",
        EmployeeCompanyId = nomineeEmployee?.EmployeeCompanyId ?? "N/A",
        EmployeeEmail = nomination.NomineeUser?.Email ?? "N/A",
        
        NominationType = nomination.NominationType == "employee_self" ? "Self" : "Manager",
        CurrentStatus = displayStatus,
        WorkflowStage = workflowStage,
        
        NominatedDate = nomination.SubmittedAt,
        ManagerReviewedDate = nomination.L2ReviewedAt,
        DeptHeadReviewedDate = nomination.DeptHeadReviewedAt,
        FinalizedDate = finalizedDate,
        
        ManagerReviewAction = nomination.L2Status,
        ManagerReviewComments = nomination.L2ReviewRemarks,
        ManagerName = l2ManagerProfile != null 
            ? $"{l2ManagerProfile.FirstName} {l2ManagerProfile.LastName}" 
            : null,
        
        DeptHeadReviewAction = nomination.DeptHeadStatus,
        DeptHeadReviewComments = nomination.DeptHeadReviewRemarks,
        DeptHeadName = deptHeadProfile != null 
            ? $"{deptHeadProfile.FirstName} {deptHeadProfile.LastName}" 
            : null,
        
        Justification = nomination.Justification,
        RelevantSkills = null, // Not in your schema
        RelevantExperience = null // Not in your schema
    };
}

        
    }
}
