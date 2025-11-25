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
        private readonly IMapper _mapper;

        public NominationService(INominationRepository nominationRepository, IMapper mapper)
        {
            _nominationRepository = nominationRepository;
            _mapper = mapper;
        }

        // UPDATED: Handle optional L1 - if no L1, start at L2
        public async Task<NominationResponseDto> CreateSelfNominationAsync(int employeeId, CreateSelfNominationRequestDto request)
        {
            try
            {
                Console.WriteLine($"[Service] CreateSelfNomination - UserId: {employeeId}, OpportunityId: {request.OpportunityId}");
                var isDuplicate = await _nominationRepository.ExistsDuplicateAsync(request.OpportunityId, employeeId);
if (isDuplicate)
{
    Console.WriteLine($"[Service] Duplicate nomination detected - User {employeeId} already applied for opportunity {request.OpportunityId}");
    throw new Exception("You have already applied for this opportunity. You can reapply only if your previous application was rejected.");
}
                // Get L1 Manager UserId
                var l1ManagerUserId = await _nominationRepository.GetL1ManagerUserIdAsync(employeeId);

                int? l2ManagerUserId = null;
                int currentLevel;
                string status;

                if (l1ManagerUserId == null)
                {
                    // NO L1 MANAGER - Go directly to L2
                    Console.WriteLine($"[Service] No L1 Manager found for user {employeeId}, checking for L2...");

                    l2ManagerUserId = await _nominationRepository.GetL2ManagerUserIdAsync(employeeId);

                    if (l2ManagerUserId == null)
                        throw new Exception("Cannot find L1 or L2 manager for approval. Please contact HR.");

                    // Start at Level 2 (skip L1)
                    currentLevel = 2;
                    status = "Pending_L2_Review";

                    Console.WriteLine($"[Service] Starting at L2 Manager: {l2ManagerUserId}");
                }
                else
                {
                    // L1 EXISTS - Normal flow
                    currentLevel = 1;
                    status = "Pending_L1_Review";

                    Console.WriteLine($"[Service] Starting at L1 Manager: {l1ManagerUserId}");
                }

                var nomination = new Nomination
                {
                    OpportunityId = request.OpportunityId,
                    NomineeUserId = employeeId,
                    NominationType = "employee_self",
                    NominatedByUserId = employeeId,
                    Justification = request.Justification,
                    CurrentApprovalLevel = currentLevel,
                    Status = status,
                    L1ManagerUserId = l1ManagerUserId,
                    L2ManagerUserId = l2ManagerUserId,
                    SubmittedAt = DateTime.UtcNow
                };

                var created = await _nominationRepository.CreateAsync(nomination);
                Console.WriteLine($"[Service] Self-nomination created with ID: {created.NominationId}");

                return _mapper.Map<NominationResponseDto>(created);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Service] Error in CreateSelfNominationAsync: {ex.Message}");
                Console.WriteLine($"[Service] Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        // Auto-approves L1 and starts at L2
        public async Task<NominationResponseDto> CreateManagerNominationAsync(int managerId, CreateManagerNominationRequestDto request)
        {
            try
            {
                Console.WriteLine($"[Service] CreateManagerNomination - ManagerId: {managerId}, NomineeId: {request.NomineeEmployeeId}");
                var isDuplicate = await _nominationRepository.ExistsDuplicateAsync(request.OpportunityId, request.NomineeEmployeeId);
if (isDuplicate)
{
    Console.WriteLine($"[Service] Duplicate nomination detected - User {request.NomineeEmployeeId} already applied for opportunity {request.OpportunityId}");
    throw new Exception("This employee has already been nominated for this opportunity. They can be re-nominated only if the previous nomination was rejected.");
}
                var nomineeL1ManagerUserId = await _nominationRepository.GetL1ManagerUserIdAsync(request.NomineeEmployeeId);

                if (nomineeL1ManagerUserId != managerId)
                    throw new Exception("You can only nominate your direct reports");

                var l2ManagerUserId = await _nominationRepository.GetL2ManagerUserIdAsync(request.NomineeEmployeeId);

                if (l2ManagerUserId == null)
                    throw new Exception("Cannot find L2 manager for approval");

                var nomination = new Nomination
                {
                    OpportunityId = request.OpportunityId,
                    NomineeUserId = request.NomineeEmployeeId,
                    NominationType = "manager_nomination",
                    NominatedByUserId = managerId,
                    Justification = request.Justification,
                    CurrentApprovalLevel = 2,
                    Status = "Pending_L2_Review",
                    L1ManagerUserId = managerId,
                    L1ReviewRemarks = "Manager nominated",
                    L1ReviewedAt = DateTime.UtcNow,
                    L1Status = "Approved",
                    L2ManagerUserId = l2ManagerUserId.Value,
                    SubmittedAt = DateTime.UtcNow
                };

                var created = await _nominationRepository.CreateAsync(nomination);
                Console.WriteLine($"[Service] Manager nomination created with ID: {created.NominationId}, skipped to L2: {l2ManagerUserId}");

                return _mapper.Map<NominationResponseDto>(created);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Service] Error in CreateManagerNominationAsync: {ex.Message}");
                Console.WriteLine($"[Service] Stack trace: {ex.StackTrace}");
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
                Console.WriteLine($"[Service] Stack trace: {ex.StackTrace}");
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
                    Console.WriteLine($"[Service] No pending manager reviews found");

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
                Console.WriteLine($"[Service] Stack trace: {ex.StackTrace}");
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
                    Console.WriteLine($"[Service] No nominations found for dept head {deptHeadId}");

                    return new NominationListResponseDto
                    {
                        Nominations = new List<NominationResponseDto>(),
                        TotalCount = 0,
                        PageNumber = 1,
                        PageSize = 10,
                        TotalPages = 0
                    };
                }

                foreach (var nom in nominations)
                {
                    Console.WriteLine($"[Service] Found nomination {nom.NominationId}: Status={nom.Status}, Level={nom.CurrentApprovalLevel}");
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
                Console.WriteLine($"[Service] Stack trace: {ex.StackTrace}");
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
                Console.WriteLine($"[Service] Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        // UPDATED: Handle optional L1 in approval flow
        public async Task<NominationResponseDto> ManagerReviewNominationAsync(int nominationId, int managerId, ManagerReviewRequestDto request)
        {
            try
            {
                Console.WriteLine($"[Service] ManagerReviewNomination - NominationId: {nominationId}, ManagerId: {managerId}, Action: {request.ActionTaken}");

                var nomination = await _nominationRepository.GetByIdAsync(nominationId);
                if (nomination == null)
                {
                    Console.WriteLine($"[Service] Nomination not found with ID: {nominationId}");
                    throw new Exception("Nomination not found");
                }

                Console.WriteLine($"[Service] Current status: {nomination.Status}, Level: {nomination.CurrentApprovalLevel}");
                Console.WriteLine($"[Service] Nominee: {nomination.NomineeUserId}, L1: {nomination.L1ManagerUserId}, L2: {nomination.L2ManagerUserId}");

                // L1 MANAGER APPROVAL
                if (nomination.CurrentApprovalLevel == 1 && nomination.L1ManagerUserId == managerId)
                {
                    if (request.ActionTaken == "Approved")
                    {
                        nomination.L1ReviewRemarks = request.Remarks;
                        nomination.L1ReviewedAt = DateTime.UtcNow;
                        nomination.L1Status = "Approved";

                        // Get L2 Manager from nominee's hierarchy
                        var l2ManagerUserId = await _nominationRepository.GetL2ManagerUserIdAsync(nomination.NomineeUserId);

                        if (l2ManagerUserId == null)
                        {
                            Console.WriteLine($"[Service] No L2 manager found, moving directly to DeptHead");

                            // No L2, go directly to DeptHead
                            var deptHeadUserId = await _nominationRepository.GetDeptHeadUserIdAsync(managerId);

                            if (deptHeadUserId == null)
                                throw new Exception("Cannot find Department Head for approval");

                            nomination.DeptHeadUserId = deptHeadUserId.Value;
                            nomination.CurrentApprovalLevel = 3;
                            nomination.Status = "Pending_DeptHead_Review";

                            Console.WriteLine($"[Service] L1 Approved - Moving directly to DeptHead: {deptHeadUserId}");
                        }
                        else
                        {
                            // Move to L2
                            nomination.L2ManagerUserId = l2ManagerUserId.Value;
                            nomination.CurrentApprovalLevel = 2;
                            nomination.Status = "Pending_L2_Review";

                            Console.WriteLine($"[Service] L1 Approved - Moving to L2: {l2ManagerUserId}");
                        }
                    }
                    else if (request.ActionTaken == "Rejected")
                    {
                        nomination.L1ReviewRemarks = request.Remarks;
                        nomination.L1ReviewedAt = DateTime.UtcNow;
                        nomination.L1Status = "Rejected";
                        nomination.Status = "Rejected_By_L1";

                        Console.WriteLine($"[Service] L1 Rejected");
                    }
                }
                // L2 MANAGER APPROVAL
                else if (nomination.CurrentApprovalLevel == 2 && nomination.L2ManagerUserId == managerId)
                {
                    if (request.ActionTaken == "Approved")
                    {
                        nomination.L2ReviewRemarks = request.Remarks;
                        nomination.L2ReviewedAt = DateTime.UtcNow;
                        nomination.L2Status = "Approved";

                        // Get Department Head
                        var deptHeadUserId = await _nominationRepository.GetDeptHeadUserIdAsync(managerId);

                        if (deptHeadUserId == null)
                            throw new Exception("Cannot find Department Head for approval");

                        nomination.DeptHeadUserId = deptHeadUserId.Value;
                        nomination.CurrentApprovalLevel = 3;
                        nomination.Status = "Pending_DeptHead_Review";

                        Console.WriteLine($"[Service] L2 Approved - Moving to DeptHead: {deptHeadUserId}");
                    }
                    else if (request.ActionTaken == "Rejected")
                    {
                        nomination.L2ReviewRemarks = request.Remarks;
                        nomination.L2ReviewedAt = DateTime.UtcNow;
                        nomination.L2Status = "Rejected";
                        nomination.Status = "Rejected_By_L2";

                        Console.WriteLine($"[Service] L2 Rejected");
                    }
                }
                else
                {
                    throw new UnauthorizedAccessException("You are not authorized to review this nomination at this stage");
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
                Console.WriteLine($"[Service] Stack trace: {ex.StackTrace}");
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
                    Console.WriteLine($"[Service] Nomination not found with ID: {nominationId}");
                    throw new Exception("Nomination not found");
                }

                if (nomination.CurrentApprovalLevel != 3 || nomination.DeptHeadUserId != deptHeadId)
                {
                    throw new UnauthorizedAccessException("You are not authorized to review this nomination");
                }

                Console.WriteLine($"[Service] Current status: {nomination.Status}");

                if (request.Action == "Approved")
                {
                    nomination.DeptHeadReviewRemarks = request.ReviewRemarks;
                    nomination.DeptHeadReviewedAt = DateTime.UtcNow;
                    nomination.DeptHeadStatus = "Approved";
                    nomination.CurrentApprovalLevel = 4;
                    nomination.Status = "Approved_By_DeptHead";

                    Console.WriteLine($"[Service] DeptHead Approved - Nomination completed");

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
                    Console.WriteLine($"[Service] Review metrics added");
                }
                else if (request.Action == "Rejected")
                {
                    nomination.DeptHeadReviewRemarks = request.ReviewRemarks;
                    nomination.DeptHeadReviewedAt = DateTime.UtcNow;
                    nomination.DeptHeadStatus = "Rejected";
                    nomination.Status = "Rejected_By_DeptHead";

                    Console.WriteLine($"[Service] DeptHead Rejected");
                }

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
                Console.WriteLine($"[Service] Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        public async Task<EligibilityCheckResponseDto> CheckEligibilityAsync(int employeeId, int opportunityId)
        {
            try
            {
                Console.WriteLine($"[Service] CheckEligibility - EmployeeId: {employeeId}, OpportunityId: {opportunityId}");

                return new EligibilityCheckResponseDto
                {
                    OpportunityId = opportunityId,
                    OpportunityName = "Opportunity Name",
                    IsEligible = true,
                    Message = "Employee is eligible",
                    EligibilityCriteria = "Criteria"
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Service] Error in CheckEligibilityAsync: {ex.Message}");
                Console.WriteLine($"[Service] Stack trace: {ex.StackTrace}");
                throw;
            }
        }
    }
}
