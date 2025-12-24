using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Relevantz.EEPZ.Common.Entities;
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

                var isDuplicate = await _nominationRepository.ExistsDuplicateAsync(request.OpportunityId, employeeId);
                if (isDuplicate)
                {
                    throw new Exception("You have already applied for this opportunity. You can reapply only if your previous application was rejected.");
                }

                var managerUserId = await _nominationRepository.GetManagerFromProjectAsync(employeeId);

                if (managerUserId == null)
                {
                    Console.WriteLine($"[Service] No manager from project, trying ReportingManagerEmployeeId");
                    managerUserId = await _nominationRepository.GetManagerFromReportingHierarchyAsync(employeeId);
                }

                if (managerUserId == null)
                {
                    Console.WriteLine($"[Service] No reporting manager, using default Manager");
                    managerUserId = await _nominationRepository.GetFirstAvailableManagerAsync();
                }

                if (managerUserId == null)
                {
                    throw new Exception("Cannot find Manager (L2) from your primary project. Please contact HR.");
                }

                var nomination = new Nomination
                {
                    OpportunityId = request.OpportunityId,
                    NomineeUserId = employeeId,
                    NominationType = "employee_self",
                    NominatedByUserId = employeeId,
                    Justification = request.Justification,
                    CurrentApprovalLevel = 1,
                    Status = "Pending_Manager_Review",
                    L2managerUserId = managerUserId.Value,
                    SubmittedAt = DateTime.UtcNow
                };

                var created = await _nominationRepository.CreateAsync(nomination);
                Console.WriteLine($"[Service] Self-nomination created with ID: {created.NominationId}");

                var nominationDetail = await _nominationRepository.GetByIdAsync(created.NominationId);
                if (nominationDetail != null)
                {
                    var nomineeProfile = nominationDetail.NomineeUser?.Employee?.Userprofile;
                    var l2Profile = nominationDetail.L2managerUser?.Employee?.Userprofile;
                    var opportunity = nominationDetail.Opportunity;

                    if (nomineeProfile != null && l2Profile != null && opportunity != null)
                    {
                        await _notificationService.SendNominationCreatedEmailAsync(
                            nominationDetail.NomineeUser.Email,
                            $"{nomineeProfile.FirstName} {nomineeProfile.LastName}",
                            opportunity.OpportunityName,
                            "Yourself (Self-nomination)"
                        );

                        await _notificationService.SendL2ReviewRequestEmailAsync(
                            nominationDetail.L2managerUser.Email,
                            $"{l2Profile.FirstName} {l2Profile.LastName}",
                            $"{nomineeProfile.FirstName} {nomineeProfile.LastName}",
                            opportunity.OpportunityName
                        );
                    }
                }

                return _mapper.Map<NominationResponseDto>(created);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Service] Error: {ex.Message}");
                throw;
            }
        }

        public async Task<NominationResponseDto> CreateManagerNominationAsync(int managerId, CreateManagerNominationRequestDto request)
        {
            try
            {
                Console.WriteLine($"[Service] CreateManagerNomination - ManagerId: {managerId}, NomineeId: {request.NomineeEmployeeId}");

                var isDuplicate = await _nominationRepository.ExistsDuplicateAsync(request.OpportunityId, request.NomineeEmployeeId);
                if (isDuplicate)
                {
                    throw new Exception("This employee has already been nominated for this opportunity.");
                }

                var nomineeL2ManagerUserId = await _nominationRepository.GetManagerFromProjectAsync(request.NomineeEmployeeId);

                if (nomineeL2ManagerUserId == null)
                {
                    nomineeL2ManagerUserId = await _nominationRepository.GetManagerFromReportingHierarchyAsync(request.NomineeEmployeeId);
                }
                if (nomineeL2ManagerUserId == null)
                {
                    nomineeL2ManagerUserId = await _nominationRepository.GetFirstAvailableManagerAsync();
                }

                var nomineeDeptHeadUserId = await _nominationRepository.GetDeptHeadFromProjectAsync(request.NomineeEmployeeId);

                if (nomineeDeptHeadUserId == null)
                {
                    nomineeDeptHeadUserId = await _nominationRepository.GetFirstAvailableDeptHeadAsync();
                }

                if (nomineeL2ManagerUserId == null)
                {
                    throw new Exception("Cannot find L2 Manager for nominee. Please contact HR.");
                }

                if (nomineeDeptHeadUserId == null)
                {
                    throw new Exception("Cannot find DeptHead for nominee. Please contact HR.");
                }

                Console.WriteLine($"[Service] Nominee's L2: {nomineeL2ManagerUserId}, DeptHead: {nomineeDeptHeadUserId}");

                if (managerId == nomineeL2ManagerUserId.Value)
                {
                    Console.WriteLine($"[Service] L2 Manager nominating - Auto-approve, go to DeptHead");

                    var nomination = new Nomination
                    {
                        OpportunityId = request.OpportunityId,
                        NomineeUserId = request.NomineeEmployeeId,
                        NominationType = "manager_nomination",
                        NominatedByUserId = managerId,
                        Justification = request.Justification,
                        CurrentApprovalLevel = 2,
                        Status = "Pending_DeptHead_Review",
                        L2managerUserId = managerId,
                        L2reviewRemarks = "L2 Manager nominated (auto-approved)",
                        L2reviewedAt = DateTime.UtcNow,
                        L2status = "Approved",
                        DeptHeadUserId = nomineeDeptHeadUserId.Value,
                        SubmittedAt = DateTime.UtcNow
                    };

                    var created = await _nominationRepository.CreateAsync(nomination);

                    var nominationDetail = await _nominationRepository.GetByIdAsync(created.NominationId);
                    if (nominationDetail != null)
                    {
                        var nomineeProfile = nominationDetail.NomineeUser?.Employee?.Userprofile;
                        var nominatorProfile = nominationDetail.NominatedByUser?.Employee?.Userprofile;
                        var deptHeadProfile = nominationDetail.DeptHeadUser?.Employee?.Userprofile;
                        var opportunity = nominationDetail.Opportunity;

                        if (nomineeProfile != null && nominatorProfile != null && deptHeadProfile != null && opportunity != null)
                        {
                            await _notificationService.SendNominationCreatedEmailAsync(
                                nominationDetail.NomineeUser.Email,
                                $"{nomineeProfile.FirstName} {nomineeProfile.LastName}",
                                opportunity.OpportunityName,
                                $"{nominatorProfile.FirstName} {nominatorProfile.LastName}"
                            );

                            await _notificationService.SendDeptHeadReviewRequestEmailAsync(
                                nominationDetail.DeptHeadUser.Email,
                                $"{deptHeadProfile.FirstName} {deptHeadProfile.LastName}",
                                $"{nomineeProfile.FirstName} {nomineeProfile.LastName}",
                                opportunity.OpportunityName
                            );
                        }
                    }

                    return _mapper.Map<NominationResponseDto>(created);
                }
                else
                {
                    Console.WriteLine($"[Service] L1 nominating - Goes to L2 first");

                    var nomination = new Nomination
                    {
                        OpportunityId = request.OpportunityId,
                        NomineeUserId = request.NomineeEmployeeId,
                        NominationType = "manager_nomination",
                        NominatedByUserId = managerId,
                        Justification = request.Justification,
                        CurrentApprovalLevel = 1,
                        Status = "Pending_Manager_Review",
                        L2managerUserId = nomineeL2ManagerUserId.Value,
                        SubmittedAt = DateTime.UtcNow
                    };

                    var created = await _nominationRepository.CreateAsync(nomination);

                    var nominationDetail = await _nominationRepository.GetByIdAsync(created.NominationId);
                    if (nominationDetail != null)
                    {
                        var nomineeProfile = nominationDetail.NomineeUser?.Employee?.Userprofile;
                        var nominatorProfile = nominationDetail.NominatedByUser?.Employee?.Userprofile;
                        var l2Profile = nominationDetail.L2managerUser?.Employee?.Userprofile;
                        var opportunity = nominationDetail.Opportunity;

                        if (nomineeProfile != null && nominatorProfile != null && l2Profile != null && opportunity != null)
                        {
                            await _notificationService.SendNominationCreatedEmailAsync(
                                nominationDetail.NomineeUser.Email,
                                $"{nomineeProfile.FirstName} {nomineeProfile.LastName}",
                                opportunity.OpportunityName,
                                $"{nominatorProfile.FirstName} {nominatorProfile.LastName}"
                            );

                            await _notificationService.SendL2ReviewRequestEmailAsync(
                                nominationDetail.L2managerUser.Email,
                                $"{l2Profile.FirstName} {l2Profile.LastName}",
                                $"{nomineeProfile.FirstName} {nomineeProfile.LastName}",
                                opportunity.OpportunityName
                            );
                        }
                    }

                    return _mapper.Map<NominationResponseDto>(created);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Service] Error: {ex.Message}");
                throw;
            }
        }

        public async Task<NominationDetailResponseDto> GetNominationByIdAsync(int id)
        {
            try
            {
                var nomination = await _nominationRepository.GetByIdAsync(id);
                if (nomination == null)
                {
                    throw new Exception("Nomination not found");
                }
                return _mapper.Map<NominationDetailResponseDto>(nomination);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Service] Error: {ex.Message}");
                throw;
            }
        }

        public async Task<List<NominationResponseDto>> GetMyNominationsAsync(int employeeId)
        {
            try
            {
                var nominations = await _nominationRepository.GetByEmployeeAsync(employeeId);
                if (nominations == null || !nominations.Any())
                    return new List<NominationResponseDto>();

                return _mapper.Map<List<NominationResponseDto>>(nominations);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Service] Error: {ex.Message}");
                throw;
            }
        }

        public async Task<NominationListResponseDto> GetPendingManagerReviewAsync(int managerId)
        {
            try
            {
                var nominations = await _nominationRepository.GetPendingManagerReviewByManagerIdAsync(managerId);

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
                Console.WriteLine($"[Service] Error: {ex.Message}");
                throw;
            }
        }

        public async Task<NominationListResponseDto> GetPendingDeptHeadReviewAsync(int deptHeadId)
        {
            try
            {
                var nominations = await _nominationRepository.GetPendingDeptHeadApprovalByDeptHeadIdAsync(deptHeadId);

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
                Console.WriteLine($"[Service] Error: {ex.Message}");
                throw;
            }
        }

        public async Task<NominationListResponseDto> GetAllNominationsAsync(string? status)
        {
            try
            {
                List<Nomination> nominations;

                if (!string.IsNullOrEmpty(status))
                {
                    nominations = await _nominationRepository.GetByStatusAsync(status);
                }
                else
                {
                    nominations = await _nominationRepository.GetAllAsync();
                }

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
                Console.WriteLine($"[Service] Error: {ex.Message}");
                throw;
            }
        }

        public async Task<List<NominationResponseDto>> GetManagerTeamNominationsAsync(int managerId, string? status = null)
        {
            try
            {
                var nominations = await _nominationRepository.GetManagerTeamNominationsAsync(managerId, status);
                return _mapper.Map<List<NominationResponseDto>>(nominations);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Service] Error: {ex.Message}");
                throw;
            }
        }

        public async Task<NominationResponseDto> ManagerReviewNominationAsync(int nominationId, int managerId, ManagerReviewRequestDto request)
        {
            try
            {
                Console.WriteLine($"[Service] ManagerReview - NominationId: {nominationId}, Action: {request.ActionTaken}");

                var nomination = await _nominationRepository.GetByIdAsync(nominationId);
                if (nomination == null)
                {
                    throw new Exception("Nomination not found");
                }

                if (nomination.CurrentApprovalLevel != 1 || nomination.L2managerUserId != managerId)
                {
                    throw new UnauthorizedAccessException("Not authorized to review this nomination");
                }

                bool isReReview = nomination.Status == "Pending_Manager_ReReview";

                if (request.ActionTaken == "Approved")
                {
                    nomination.L2reviewRemarks = request.Remarks ?? "Approved";
                    nomination.L2reviewedAt = DateTime.UtcNow;
                    nomination.L2status = "Approved";

                    var deptHeadUserId = await _nominationRepository.GetDeptHeadFromProjectAsync(nomination.NomineeUserId);
                    if (deptHeadUserId == null)
                    {
                        deptHeadUserId = await _nominationRepository.GetFirstAvailableDeptHeadAsync();
                    }
                    if (deptHeadUserId == null)
                    {
                        throw new Exception("Cannot find DeptHead");
                    }

                    nomination.DeptHeadUserId = deptHeadUserId.Value;
                    nomination.CurrentApprovalLevel = 2;
                    nomination.Status = "Pending_DeptHead_Review";

                    nomination.ReviewRemarks = request.Remarks ?? "Approved";
                    nomination.ReviewedByUserId = managerId;
                    nomination.ReviewedAt = DateTime.UtcNow;

                    var updated = await _nominationRepository.UpdateAsync(nomination);

                    var nomineeProfile = nomination.NomineeUser?.Employee?.Userprofile;
                    var l2Profile = nomination.L2managerUser?.Employee?.Userprofile;
                    var deptHeadProfile = nomination.DeptHeadUser?.Employee?.Userprofile;
                    var opportunity = nomination.Opportunity;

                    if (nomineeProfile != null && l2Profile != null && deptHeadProfile != null && opportunity != null)
                    {
                        if (isReReview)
                        {
                            await _notificationService.SendL2ReApprovedEmailAsync(
                                nomination.NomineeUser.Email,
                                $"{nomineeProfile.FirstName} {nomineeProfile.LastName}",
                                opportunity.OpportunityName,
                                $"{l2Profile.FirstName} {l2Profile.LastName}"
                            );

                            await _notificationService.SendL2ReApprovedNotificationToDeptHeadAsync(
                                nomination.DeptHeadUser.Email,
                                $"{deptHeadProfile.FirstName} {deptHeadProfile.LastName}",
                                $"{nomineeProfile.FirstName} {nomineeProfile.LastName}",
                                opportunity.OpportunityName
                            );
                        }
                        else
                        {
                            await _notificationService.SendL2ApprovedEmailAsync(
                                nomination.NomineeUser.Email,
                                $"{nomineeProfile.FirstName} {nomineeProfile.LastName}",
                                opportunity.OpportunityName,
                                $"{l2Profile.FirstName} {l2Profile.LastName}"
                            );

                            await _notificationService.SendDeptHeadReviewRequestEmailAsync(
                                nomination.DeptHeadUser.Email,
                                $"{deptHeadProfile.FirstName} {deptHeadProfile.LastName}",
                                $"{nomineeProfile.FirstName} {nomineeProfile.LastName}",
                                opportunity.OpportunityName
                            );
                        }
                    }

                    return _mapper.Map<NominationResponseDto>(updated);
                }
                else
                {
                    nomination.L2reviewRemarks = request.Remarks ?? "Rejected";
                    nomination.L2reviewedAt = DateTime.UtcNow;
                    nomination.L2status = "Rejected";
                    nomination.Status = "Rejected_By_Manager";
                    nomination.CurrentApprovalLevel = 0;

                    nomination.ReviewRemarks = request.Remarks ?? "Rejected";
                    nomination.ReviewedByUserId = managerId;
                    nomination.ReviewedAt = DateTime.UtcNow;

                    var updated = await _nominationRepository.UpdateAsync(nomination);

                    var nomineeProfile = nomination.NomineeUser?.Employee?.Userprofile;
                    var l2Profile = nomination.L2managerUser?.Employee?.Userprofile;
                    var opportunity = nomination.Opportunity;

                    if (nomineeProfile != null && l2Profile != null && opportunity != null)
                    {
                        if (isReReview)
                        {
                            await _notificationService.SendL2ReRejectedEmailAsync(
                                nomination.NomineeUser.Email,
                                $"{nomineeProfile.FirstName} {nomineeProfile.LastName}",
                                opportunity.OpportunityName,
                                $"{l2Profile.FirstName} {l2Profile.LastName}",
                                request.Remarks ?? "No reason provided"
                            );
                        }
                        else
                        {
                            await _notificationService.SendL2RejectedEmailAsync(
                                nomination.NomineeUser.Email,
                                $"{nomineeProfile.FirstName} {nomineeProfile.LastName}",
                                opportunity.OpportunityName,
                                $"{l2Profile.FirstName} {l2Profile.LastName}",
                                request.Remarks ?? "No reason provided"
                            );
                        }
                    }

                    return _mapper.Map<NominationResponseDto>(updated);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Service] Error: {ex.Message}");
                throw;
            }
        }

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

                if (nomination.CurrentApprovalLevel != 2 || nomination.DeptHeadUserId != deptHeadId)
                {
                    throw new UnauthorizedAccessException("Not authorized to review this nomination");
                }

                if (request.Action == "Approved")
                {
                    Console.WriteLine($"[Service] Processing Approval");

                    nomination.DeptHeadReviewRemarks = request.ReviewRemarks ?? "Approved";
                    nomination.DeptHeadReviewedAt = DateTime.UtcNow;
                    nomination.DeptHeadStatus = "Approved";
                    nomination.CurrentApprovalLevel = 3;
                    nomination.Status = "Approved_By_DeptHead";

                    if (request.MeritScore.HasValue || request.DiversityScore.HasValue || request.ConflictOfInterest.HasValue)
                    {
                        var metric = new Nominationreviewmetric
                        {
                            NominationId = nominationId,
                            ReviewedByUserId = deptHeadId,
                            MeritScore = request.MeritScore ?? 0,
                            DiversityScore = request.DiversityScore ?? 0,
                            ConflictOfInterest = request.ConflictOfInterest ?? false,
                            ReviewNotes = request.ReviewNotes ?? "",
                            ReviewedAt = DateTime.UtcNow
                        };
                        await _nominationRepository.AddReviewMetricAsync(metric);
                        Console.WriteLine($"[Service] Review metrics added");
                    }
                    else
                    {
                        Console.WriteLine($"[Service] No review metrics provided - skipping");
                    }

                    nomination.ReviewRemarks = request.ReviewRemarks ?? "Approved";
                    nomination.ReviewedByUserId = deptHeadId;
                    nomination.ReviewedAt = DateTime.UtcNow;

                    var updated = await _nominationRepository.UpdateAsync(nomination);
                    Console.WriteLine($"[Service] Approval saved successfully");

                    var nomineeProfile = nomination.NomineeUser?.Employee?.Userprofile;
                    var deptHeadProfile = nomination.DeptHeadUser?.Employee?.Userprofile;
                    var l2Profile = nomination.L2managerUser?.Employee?.Userprofile;
                    var opportunity = nomination.Opportunity;

                    if (nomineeProfile != null && deptHeadProfile != null && l2Profile != null && opportunity != null)
                    {
                        await _notificationService.SendDeptHeadApprovedEmailAsync(
                            nomination.NomineeUser.Email,
                            $"{nomineeProfile.FirstName} {nomineeProfile.LastName}",
                            opportunity.OpportunityName,
                            $"{deptHeadProfile.FirstName} {deptHeadProfile.LastName}"
                        );

                        await _notificationService.SendDeptHeadApprovedNotificationToL2Async(
                            nomination.L2managerUser.Email,
                            $"{l2Profile.FirstName} {l2Profile.LastName}",
                            $"{nomineeProfile.FirstName} {nomineeProfile.LastName}",
                            opportunity.OpportunityName
                        );
                    }

                    return _mapper.Map<NominationResponseDto>(updated);
                }
                else
                {
                    Console.WriteLine($"[Service] Processing Rejection");


                    string remarks = string.IsNullOrWhiteSpace(request.ReviewRemarks)
                        ? "Rejected by Department Head"
                        : request.ReviewRemarks;

                    nomination.DeptHeadReviewRemarks = remarks;
                    nomination.DeptHeadReviewedAt = DateTime.UtcNow;
                    nomination.DeptHeadStatus = "Rejected";
                    nomination.CurrentApprovalLevel = 1;
                    nomination.Status = "Pending_Manager_ReReview";
                    nomination.L2reviewRemarks = $"DeptHead rejected. Previous: {nomination.L2reviewRemarks}";
                    nomination.L2status = "Pending_ReReview";

                    nomination.ReviewRemarks = remarks;
                    nomination.ReviewedByUserId = deptHeadId;
                    nomination.ReviewedAt = DateTime.UtcNow;

                    var updated = await _nominationRepository.UpdateAsync(nomination);
                    Console.WriteLine($"[Service] Rejection saved successfully");

                    var nomineeProfile = nomination.NomineeUser?.Employee?.Userprofile;
                    var l2Profile = nomination.L2managerUser?.Employee?.Userprofile;
                    var opportunity = nomination.Opportunity;

                    if (nomineeProfile != null && l2Profile != null && opportunity != null)
                    {
                        await _notificationService.SendDeptHeadRejectedToL2EmailAsync(
                            nomination.L2managerUser.Email,
                            $"{l2Profile.FirstName} {l2Profile.LastName}",
                            $"{nomineeProfile.FirstName} {nomineeProfile.LastName}",
                            opportunity.OpportunityName,
                            remarks
                        );

                        await _notificationService.SendDeptHeadRejectedNotificationToNomineeAsync(
                            nomination.NomineeUser.Email,
                            $"{nomineeProfile.FirstName} {nomineeProfile.LastName}",
                            opportunity.OpportunityName,
                            remarks
                        );
                    }

                    return _mapper.Map<NominationResponseDto>(updated);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Service] Error: {ex.Message}");
                throw;
            }
        }

        public Task<EligibilityCheckResponseDto> CheckEligibilityAsync(int employeeId, int opportunityId)
        {
            try
            {
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
                Console.WriteLine($"[Service] Error: {ex.Message}");
                throw;
            }
        }

        public async Task<NominationHistoryResponseDto> GetMyNominationHistoryAsync(int userId, string? status = null)
        {
            try
            {
                Console.WriteLine($"[Service] GetMyNominationHistory - UserId: {userId}");

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

                var selfNominations = allHistoryNominations.Where(n => n.NominationType == "employee_self").ToList();
                var teamNominations = allHistoryNominations.Where(n => n.NominationType == "manager_nomination").ToList();

                var selfNominationDtos = selfNominations.Select(n => MapToHistoryDto(n)).ToList();
                var teamNominationDtos = teamNominations.Select(n => MapToHistoryDto(n)).ToList();

                var statistics = new HistoryStatistics
                {
                    TotalSelfNominations = selfNominations.Count,
                    TotalTeamNominations = teamNominations.Count,
                    ApprovedCount = allHistoryNominations.Count(n => n.Status.Contains("Approved")),
                    RejectedCount = allHistoryNominations.Count(n => n.Status.Contains("Rejected")),
                    PendingCount = allHistoryNominations.Count(n => n.Status.Contains("Pending")),
                    WithdrawnCount = allHistoryNominations.Count(n => n.Status == "Withdrawn")
                };

                return new NominationHistoryResponseDto
                {
                    SelfNominations = selfNominationDtos,
                    TeamNominations = teamNominationDtos,
                    TotalCount = selfNominationDtos.Count + teamNominationDtos.Count,
                    Statistics = statistics
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Service] Error: {ex.Message}");
                throw;
            }
        }

        private HistoryNominationDto MapToHistoryDto(Nomination nomination)
        {
            var nomineeProfile = nomination.NomineeUser?.Employee?.Userprofile;
            var nomineeEmployee = nomination.NomineeUser?.Employee;
            var l2ManagerProfile = nomination.L2managerUser?.Employee?.Userprofile;
            var deptHeadProfile = nomination.DeptHeadUser?.Employee?.Userprofile;

            DateTime? finalizedDate = nomination.DeptHeadReviewedAt ?? nomination.L2reviewedAt ?? nomination.L1reviewedAt;

            string workflowStage = nomination.CurrentApprovalLevel switch
            {
                0 => "Submitted",
                1 => nomination.Status == "Pending_Manager_ReReview" ? "Manager Re-Review" : "Manager Review",
                2 => "Department Head Review",
                3 => "Completed",
                _ => "Unknown"
            };

            string displayStatus = nomination.Status switch
            {
                "Approved_By_DeptHead" => "Approved",
                "Rejected_By_Manager" => "Rejected",
                "Rejected_By_DeptHead" => "Rejected",
                "Pending_Manager_Review" => "Pending Manager Review",
                "Pending_Manager_ReReview" => "Pending Manager Re-Review",
                "Pending_DeptHead_Review" => "Pending DeptHead Review",
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
                EmployeeName = nomineeProfile != null ? $"{nomineeProfile.FirstName} {nomineeProfile.LastName}" : "Unknown",
                EmployeeCompanyId = nomineeEmployee?.EmployeeCompanyId ?? "N/A",
                EmployeeEmail = nomination.NomineeUser?.Email ?? "N/A",
                NominationType = nomination.NominationType == "employee_self" ? "Self" : "Manager",
                CurrentStatus = displayStatus,
                WorkflowStage = workflowStage,
                NominatedDate = nomination.SubmittedAt,
                ManagerReviewedDate = nomination.L2reviewedAt,
                DeptHeadReviewedDate = nomination.DeptHeadReviewedAt,
                FinalizedDate = finalizedDate,
                ManagerReviewAction = nomination.L2status,
                ManagerReviewComments = nomination.L2reviewRemarks,
                ManagerName = l2ManagerProfile != null ? $"{l2ManagerProfile.FirstName} {l2ManagerProfile.LastName}" : null,
                DeptHeadReviewAction = nomination.DeptHeadStatus,
                DeptHeadReviewComments = nomination.DeptHeadReviewRemarks,
                DeptHeadName = deptHeadProfile != null ? $"{deptHeadProfile.FirstName} {deptHeadProfile.LastName}" : null,
                Justification = nomination.Justification,
                RelevantSkills = null,
                RelevantExperience = null
            };
        }
    }
}
