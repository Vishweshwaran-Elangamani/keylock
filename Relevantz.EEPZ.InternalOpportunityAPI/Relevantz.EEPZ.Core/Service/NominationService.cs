// using System;
// using System.Collections.Generic;
// using System.Linq;
// using System.Threading.Tasks;
// using AutoMapper;
// using Relevantz.EEPZ.Common.Entities;
// using Relevantz.EEPZ.Common.Enums;
// using Relevantz.EEPZ.Common.ViewModels.Common;
// using Relevantz.EEPZ.Common.ViewModels.Nomination.Request;
// using Relevantz.EEPZ.Common.ViewModels.Nomination.Response;
// using Relevantz.EEPZ.Core.IService;
// using Relevantz.EEPZ.Data.IRepository;

// namespace Relevantz.EEPZ.Core.Service
// {
//     public class NominationService : INominationService
//     {
//         private readonly INominationRepository _nominationRepository;
//         private readonly IMapper _mapper;

//         public NominationService(INominationRepository nominationRepository, IMapper mapper)
//         {
//             _nominationRepository = nominationRepository;
//             _mapper = mapper;
//         }

//         public async Task<NominationResponseDto> CreateSelfNominationAsync(int employeeId, CreateSelfNominationRequestDto request)
//         {
//             try
//             {
//                 Console.WriteLine($"✓ Service: CreateSelfNomination - UserId: {employeeId}, OpportunityId: {request.OpportunityId}");

//                 var nomination = new Nomination
//                 {
//                     OpportunityId = request.OpportunityId,
//                     NomineeUserId = employeeId,
//                     NominationType = "employee_self",
//                     NominatedByUserId = employeeId,
//                     Justification = request.Justification,
//                     Status = NominationStatusConstants.PendingManagerReview,
//                     SubmittedAt = DateTime.UtcNow
//                 };

//                 var created = await _nominationRepository.CreateAsync(nomination);
//                 Console.WriteLine($"✓ Service: Self-nomination created successfully with ID: {created.NominationId}");
                
//                 return _mapper.Map<NominationResponseDto>(created);
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"❌ Error in CreateSelfNominationAsync: {ex.Message}");
//                 Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
//                 throw;
//             }
//         }

//         public async Task<NominationResponseDto> CreateManagerNominationAsync(int managerId, CreateManagerNominationRequestDto request)
//         {
//             try
//             {
//                 Console.WriteLine($"✓ Service: CreateManagerNomination - ManagerId: {managerId}, NomineeId: {request.NomineeEmployeeId}");

//                 var nomination = new Nomination
//                 {
//                     OpportunityId = request.OpportunityId,
//                     NomineeUserId = request.NomineeEmployeeId,
//                     NominationType = "manager_nomination",
//                     NominatedByUserId = managerId,
//                     Justification = request.Justification,
//                     Status = NominationStatusConstants.PendingManagerReview,
//                     SubmittedAt = DateTime.UtcNow
//                 };

//                 var created = await _nominationRepository.CreateAsync(nomination);
//                 Console.WriteLine($"✓ Service: Manager nomination created successfully with ID: {created.NominationId}");
                
//                 return _mapper.Map<NominationResponseDto>(created);
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"❌ Error in CreateManagerNominationAsync: {ex.Message}");
//                 Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
//                 throw;
//             }
//         }

//         public async Task<NominationDetailResponseDto> GetNominationByIdAsync(int id)
//         {
//             try
//             {
//                 Console.WriteLine($"✓ Service: GetNominationById - ID: {id}");
                
//                 var nomination = await _nominationRepository.GetByIdAsync(id);
//                 if (nomination == null)
//                 {
//                     Console.WriteLine($"❌ Nomination not found with ID: {id}");
//                     throw new Exception("Nomination not found");
//                 }

//                 return _mapper.Map<NominationDetailResponseDto>(nomination);
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"❌ Error in GetNominationByIdAsync: {ex.Message}");
//                 throw;
//             }
//         }

//         public async Task<List<NominationResponseDto>> GetMyNominationsAsync(int employeeId)
//         {
//             try
//             {
//                 Console.WriteLine($"✓ Service: GetMyNominationsAsync - UserId: {employeeId}");
                
//                 var nominations = await _nominationRepository.GetByEmployeeAsync(employeeId);
                
//                 Console.WriteLine($"✓ Service: Found {nominations?.Count ?? 0} nominations for user {employeeId}");

//                 if (nominations == null || !nominations.Any())
//                     return new List<NominationResponseDto>();

//                 return _mapper.Map<List<NominationResponseDto>>(nominations);
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"❌ Error in GetMyNominationsAsync: {ex.Message}");
//                 Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
//                 throw;
//             }
//         }

//         public async Task<NominationListResponseDto> GetPendingManagerReviewAsync(int managerId)
//         {
//             try
//             {
//                 Console.WriteLine($"✓ Service: GetPendingManagerReviewAsync - ManagerId: {managerId}");
                
//                 var nominations = await _nominationRepository.GetPendingManagerReviewByManagerIdAsync(managerId);

//                 Console.WriteLine($"✓ Service: Found {nominations?.Count ?? 0} pending manager reviews");

//                 if (nominations == null || !nominations.Any())
//                 {
//                     Console.WriteLine($"⚠️ No pending manager reviews found");
                    
//                     return new NominationListResponseDto
//                     {
//                         Nominations = new List<NominationResponseDto>(),
//                         TotalCount = 0,
//                         PageNumber = 1,
//                         PageSize = 10,
//                         TotalPages = 0
//                     };
//                 }

//                 var mapped = _mapper.Map<List<NominationResponseDto>>(nominations);

//                 return new NominationListResponseDto
//                 {
//                     Nominations = mapped,
//                     TotalCount = nominations.Count,
//                     PageNumber = 1,
//                     PageSize = 10,
//                     TotalPages = 1
//                 };
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"❌ Error in GetPendingManagerReviewAsync: {ex.Message}");
//                 Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
//                 throw;
//             }
//         }

//         // ✅ UPDATED METHOD
//         public async Task<NominationListResponseDto> GetPendingDeptHeadReviewAsync(int deptHeadId)
//         {
//             try
//             {
//                 Console.WriteLine($"✓ Service: GetPendingDeptHeadReviewAsync - DeptHeadId: {deptHeadId}");
                
//                 // ✅ CHANGED: Now using the new method that filters by dept head ID and department
//                 var nominations = await _nominationRepository.GetPendingDeptHeadApprovalByDeptHeadIdAsync(deptHeadId);

//                 Console.WriteLine($"✓ Service: Found {nominations?.Count ?? 0} pending dept head reviews");

//                 if (nominations == null || !nominations.Any())
//                 {
//                     Console.WriteLine($"⚠️ No nominations found for dept head {deptHeadId}");
//                     Console.WriteLine($"⚠️ This means either:");
//                     Console.WriteLine($"   1. No nominations have been approved by managers yet");
//                     Console.WriteLine($"   2. No nominations exist for this department");
                    
//                     return new NominationListResponseDto
//                     {
//                         Nominations = new List<NominationResponseDto>(),
//                         TotalCount = 0,
//                         PageNumber = 1,
//                         PageSize = 10,
//                         TotalPages = 0
//                     };
//                 }

//                 // Log details of found nominations
//                 foreach (var nom in nominations)
//                 {
//                     Console.WriteLine($"  ✓ Found nomination {nom.NominationId}: Status={nom.Status}");
//                 }

//                 var mapped = _mapper.Map<List<NominationResponseDto>>(nominations);

//                 return new NominationListResponseDto
//                 {
//                     Nominations = mapped,
//                     TotalCount = nominations.Count,
//                     PageNumber = 1,
//                     PageSize = 10,
//                     TotalPages = 1
//                 };
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"❌ Error in GetPendingDeptHeadReviewAsync: {ex.Message}");
//                 Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
//                 throw;
//             }
//         }

//         public async Task<NominationListResponseDto> GetAllNominationsAsync(string? status)
//         {
//             try
//             {
//                 Console.WriteLine($"✓ Service: GetAllNominationsAsync - Status Filter: {status ?? "All"}");
                
//                 List<Nomination> nominations;
                
//                 if (!string.IsNullOrEmpty(status))
//                 {
//                     nominations = await _nominationRepository.GetByStatusAsync(status);
//                 }
//                 else
//                 {
//                     nominations = await _nominationRepository.GetAllAsync();
//                 }

//                 Console.WriteLine($"✓ Service: Found {nominations?.Count ?? 0} total nominations");

//                 if (nominations == null || !nominations.Any())
//                 {
//                     return new NominationListResponseDto
//                     {
//                         Nominations = new List<NominationResponseDto>(),
//                         TotalCount = 0,
//                         PageNumber = 1,
//                         PageSize = 10,
//                         TotalPages = 0
//                     };
//                 }

//                 var mapped = _mapper.Map<List<NominationResponseDto>>(nominations);

//                 return new NominationListResponseDto
//                 {
//                     Nominations = mapped,
//                     TotalCount = nominations.Count,
//                     PageNumber = 1,
//                     PageSize = 10,
//                     TotalPages = 1
//                 };
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"❌ Error in GetAllNominationsAsync: {ex.Message}");
//                 Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
//                 throw;
//             }
//         }

//         public async Task<NominationResponseDto> ManagerReviewNominationAsync(int nominationId, int managerId, ManagerReviewRequestDto request)
//         {
//             try
//             {
//                 Console.WriteLine($"✓ Service: ManagerReviewNomination - NominationId: {nominationId}, Action: {request.ActionTaken}");
                
//                 var nomination = await _nominationRepository.GetByIdAsync(nominationId);
//                 if (nomination == null)
//                 {
//                     Console.WriteLine($"❌ Nomination not found with ID: {nominationId}");
//                     throw new Exception("Nomination not found");
//                 }

//                 Console.WriteLine($"✓ Current status: {nomination.Status}");

//                 if (request.ActionTaken == "Approved")
//                 {
//                     nomination.Status = NominationStatusConstants.PendingDeptHeadApproval;
//                     Console.WriteLine($"✓ Status changed to: {NominationStatusConstants.PendingDeptHeadApproval}");
//                 }
//                 else if (request.ActionTaken == "Rejected")
//                 {
//                     nomination.Status = "manager_rejected";
//                     Console.WriteLine($"✓ Status changed to: manager_rejected");
//                 }

//                 nomination.ReviewRemarks = request.Remarks;
//                 nomination.ReviewedByUserId = managerId;
//                 nomination.ReviewedAt = DateTime.UtcNow;

//                 var updated = await _nominationRepository.UpdateAsync(nomination);
//                 Console.WriteLine($"✓ Nomination {nominationId} reviewed successfully by manager {managerId}");
                
//                 return _mapper.Map<NominationResponseDto>(updated);
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"❌ Error in ManagerReviewNominationAsync: {ex.Message}");
//                 Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
//                 throw;
//             }
//         }

//         public async Task<NominationResponseDto> DepartmentHeadReviewAsync(int nominationId, int deptHeadId, DepartmentHeadReviewRequestDto request)
//         {
//             try
//             {
//                 Console.WriteLine($"✓ Service: DepartmentHeadReview - NominationId: {nominationId}, Action: {request.Action}");
                
//                 var nomination = await _nominationRepository.GetByIdAsync(nominationId);
//                 if (nomination == null)
//                 {
//                     Console.WriteLine($"❌ Nomination not found with ID: {nominationId}");
//                     throw new Exception("Nomination not found");
//                 }

//                 Console.WriteLine($"✓ Current status: {nomination.Status}");

//                 if (request.Action == "Approved")
//                 {
//                     nomination.Status = NominationStatusConstants.Approved;
//                     Console.WriteLine($"✓ Status changed to: {NominationStatusConstants.Approved}");
                    
//                     // Add review metrics
//                     var metric = new Nominationreviewmetric
//                     {
//                         NominationId = nominationId,
//                         ReviewedByUserId = deptHeadId,
//                         MeritScore = request.MeritScore,
//                         DiversityScore = request.DiversityScore,
//                         ConflictOfInterest = request.ConflictOfInterest,
//                         ReviewNotes = request.ReviewNotes,
//                         ReviewedAt = DateTime.UtcNow
//                     };
//                     await _nominationRepository.AddReviewMetricAsync(metric);
//                     Console.WriteLine($"✓ Review metrics added");
//                 }
//                 else if (request.Action == "Rejected")
//                 {
//                     nomination.Status = "dept_head_rejected";
//                     Console.WriteLine($"✓ Status changed to: dept_head_rejected");
//                 }

//                 nomination.ReviewRemarks = request.ReviewRemarks;
//                 nomination.ReviewedByUserId = deptHeadId;
//                 nomination.ReviewedAt = DateTime.UtcNow;

//                 var updated = await _nominationRepository.UpdateAsync(nomination);
//                 Console.WriteLine($"✓ Nomination {nominationId} reviewed successfully by dept head {deptHeadId}");
                
//                 return _mapper.Map<NominationResponseDto>(updated);
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"❌ Error in DepartmentHeadReviewAsync: {ex.Message}");
//                 Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
//                 throw;
//             }
//         }

//         public async Task<EligibilityCheckResponseDto> CheckEligibilityAsync(int employeeId, int opportunityId)
//         {
//             try
//             {
//                 Console.WriteLine($"✓ Service: CheckEligibility - EmployeeId: {employeeId}, OpportunityId: {opportunityId}");
                
//                 // TODO: Implement actual eligibility check logic
//                 // For now, returning basic response
                
//                 return new EligibilityCheckResponseDto
//                 {
//                     OpportunityId = opportunityId,
//                     OpportunityName = "Opportunity Name",
//                     IsEligible = true,
//                     Message = "Employee is eligible",
//                     EligibilityCriteria = "Criteria"
//                 };
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"❌ Error in CheckEligibilityAsync: {ex.Message}");
//                 Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
//                 throw;
//             }
//         }
//     }
// }

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

        // ✅ UPDATED: Sets L1 manager and starts at Level 1
        public async Task<NominationResponseDto> CreateSelfNominationAsync(int employeeId, CreateSelfNominationRequestDto request)
        {
            try
            {
                Console.WriteLine($"✓ Service: CreateSelfNomination - UserId: {employeeId}, OpportunityId: {request.OpportunityId}");

                // Get L1 Manager UserId
                var l1ManagerUserId = await _nominationRepository.GetL1ManagerUserIdAsync(employeeId);
                
                if (l1ManagerUserId == null)
                    throw new Exception("Employee does not have a reporting manager (L1) assigned");

                var nomination = new Nomination
                {
                    OpportunityId = request.OpportunityId,
                    NomineeUserId = employeeId,
                    NominationType = "employee_self",
                    NominatedByUserId = employeeId,
                    Justification = request.Justification,
                    
                    // ✅ NEW: Start at L1 approval
                    CurrentApprovalLevel = 1,
                    Status = "Pending_L1_Review",
                    L1ManagerUserId = l1ManagerUserId.Value,
                    
                    SubmittedAt = DateTime.UtcNow
                };

                var created = await _nominationRepository.CreateAsync(nomination);
                Console.WriteLine($"✓ Service: Self-nomination created with ID: {created.NominationId}, L1 Manager: {l1ManagerUserId}");
                
                return _mapper.Map<NominationResponseDto>(created);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error in CreateSelfNominationAsync: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        // ✅ UPDATED: Auto-approves L1 and starts at L2
        public async Task<NominationResponseDto> CreateManagerNominationAsync(int managerId, CreateManagerNominationRequestDto request)
        {
            try
            {
                Console.WriteLine($"✓ Service: CreateManagerNomination - ManagerId: {managerId}, NomineeId: {request.NomineeEmployeeId}");

                // Get nominee's L1 manager to verify this manager can nominate them
                var nomineeL1ManagerUserId = await _nominationRepository.GetL1ManagerUserIdAsync(request.NomineeEmployeeId);
                
                if (nomineeL1ManagerUserId != managerId)
                    throw new Exception("You can only nominate your direct reports");

                // Get L2 Manager (manager's manager)
                var l2ManagerUserId = await _nominationRepository.GetL2ManagerUserIdAsync(managerId);
                
                if (l2ManagerUserId == null)
                    throw new Exception("L1 Manager does not have a reporting manager (L2)");

                var nomination = new Nomination
                {
                    OpportunityId = request.OpportunityId,
                    NomineeUserId = request.NomineeEmployeeId,
                    NominationType = "manager_nomination",
                    NominatedByUserId = managerId,
                    Justification = request.Justification,
                    
                    // ✅ NEW: L1 auto-approved, start at L2
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
                Console.WriteLine($"✓ Service: Manager nomination created with ID: {created.NominationId}, skipped to L2: {l2ManagerUserId}");
                
                return _mapper.Map<NominationResponseDto>(created);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error in CreateManagerNominationAsync: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        public async Task<NominationDetailResponseDto> GetNominationByIdAsync(int id)
        {
            try
            {
                Console.WriteLine($"✓ Service: GetNominationById - ID: {id}");
                
                var nomination = await _nominationRepository.GetByIdAsync(id);
                if (nomination == null)
                {
                    Console.WriteLine($"❌ Nomination not found with ID: {id}");
                    throw new Exception("Nomination not found");
                }

                return _mapper.Map<NominationDetailResponseDto>(nomination);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error in GetNominationByIdAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<List<NominationResponseDto>> GetMyNominationsAsync(int employeeId)
        {
            try
            {
                Console.WriteLine($"✓ Service: GetMyNominationsAsync - UserId: {employeeId}");
                
                var nominations = await _nominationRepository.GetByEmployeeAsync(employeeId);
                
                Console.WriteLine($"✓ Service: Found {nominations?.Count ?? 0} nominations for user {employeeId}");

                if (nominations == null || !nominations.Any())
                    return new List<NominationResponseDto>();

                return _mapper.Map<List<NominationResponseDto>>(nominations);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error in GetMyNominationsAsync: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        // ✅ UPDATED: Uses new repository method that checks L1 and L2
        public async Task<NominationListResponseDto> GetPendingManagerReviewAsync(int managerId)
        {
            try
            {
                Console.WriteLine($"✓ Service: GetPendingManagerReviewAsync - ManagerId: {managerId}");
                
                var nominations = await _nominationRepository.GetPendingManagerReviewByManagerIdAsync(managerId);

                Console.WriteLine($"✓ Service: Found {nominations?.Count ?? 0} pending manager reviews");

                if (nominations == null || !nominations.Any())
                {
                    Console.WriteLine($"⚠️ No pending manager reviews found");
                    
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
                Console.WriteLine($"❌ Error in GetPendingManagerReviewAsync: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        // ✅ UPDATED: Uses new repository method with level check
        public async Task<NominationListResponseDto> GetPendingDeptHeadReviewAsync(int deptHeadId)
        {
            try
            {
                Console.WriteLine($"✓ Service: GetPendingDeptHeadReviewAsync - DeptHeadId: {deptHeadId}");
                
                var nominations = await _nominationRepository.GetPendingDeptHeadApprovalByDeptHeadIdAsync(deptHeadId);

                Console.WriteLine($"✓ Service: Found {nominations?.Count ?? 0} pending dept head reviews");

                if (nominations == null || !nominations.Any())
                {
                    Console.WriteLine($"⚠️ No nominations found for dept head {deptHeadId}");
                    
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
                    Console.WriteLine($"  ✓ Found nomination {nom.NominationId}: Status={nom.Status}, Level={nom.CurrentApprovalLevel}");
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
                Console.WriteLine($"❌ Error in GetPendingDeptHeadReviewAsync: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        public async Task<NominationListResponseDto> GetAllNominationsAsync(string? status)
        {
            try
            {
                Console.WriteLine($"✓ Service: GetAllNominationsAsync - Status Filter: {status ?? "All"}");
                
                List<Nomination> nominations;
                
                if (!string.IsNullOrEmpty(status))
                {
                    nominations = await _nominationRepository.GetByStatusAsync(status);
                }
                else
                {
                    nominations = await _nominationRepository.GetAllAsync();
                }

                Console.WriteLine($"✓ Service: Found {nominations?.Count ?? 0} total nominations");

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
                Console.WriteLine($"❌ Error in GetAllNominationsAsync: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        // ✅ COMPLETELY REWRITTEN: Handles L1 and L2 approvals dynamically
        public async Task<NominationResponseDto> ManagerReviewNominationAsync(int nominationId, int managerId, ManagerReviewRequestDto request)
        {
            try
            {
                Console.WriteLine($"✓ Service: ManagerReviewNomination - NominationId: {nominationId}, ManagerId: {managerId}, Action: {request.ActionTaken}");
                
                var nomination = await _nominationRepository.GetByIdAsync(nominationId);
                if (nomination == null)
                {
                    Console.WriteLine($"❌ Nomination not found with ID: {nominationId}");
                    throw new Exception("Nomination not found");
                }

                Console.WriteLine($"✓ Current status: {nomination.Status}, Level: {nomination.CurrentApprovalLevel}");

                // ✅ L1 MANAGER APPROVAL
                if (nomination.CurrentApprovalLevel == 1 && nomination.L1ManagerUserId == managerId)
                {
                    if (request.ActionTaken == "Approved")
                    {
                        // Update L1 fields
                        nomination.L1ReviewRemarks = request.Remarks;
                        nomination.L1ReviewedAt = DateTime.UtcNow;
                        nomination.L1Status = "Approved";

                        // Get L2 Manager
                        var l2ManagerUserId = await _nominationRepository.GetL2ManagerUserIdAsync(managerId);
                        
                        if (l2ManagerUserId == null)
                            throw new Exception("L1 Manager does not have a reporting manager (L2)");

                        // Move to L2
                        nomination.L2ManagerUserId = l2ManagerUserId.Value;
                        nomination.CurrentApprovalLevel = 2;
                        nomination.Status = "Pending_L2_Review";

                        Console.WriteLine($"✓ L1 Approved - Moving to L2: {l2ManagerUserId}");
                    }
                    else if (request.ActionTaken == "Rejected")
                    {
                        nomination.L1ReviewRemarks = request.Remarks;
                        nomination.L1ReviewedAt = DateTime.UtcNow;
                        nomination.L1Status = "Rejected";
                        nomination.Status = "Rejected_By_L1";

                        Console.WriteLine($"✓ L1 Rejected");
                    }
                }
                // ✅ L2 MANAGER APPROVAL
                else if (nomination.CurrentApprovalLevel == 2 && nomination.L2ManagerUserId == managerId)
                {
                    if (request.ActionTaken == "Approved")
                    {
                        // Update L2 fields
                        nomination.L2ReviewRemarks = request.Remarks;
                        nomination.L2ReviewedAt = DateTime.UtcNow;
                        nomination.L2Status = "Approved";

                        // Get Department Head
                        var deptHeadUserId = await _nominationRepository.GetDeptHeadUserIdAsync(managerId);
                        
                        if (deptHeadUserId == null)
                            throw new Exception("L2 Manager does not have a reporting manager (DeptHead)");

                        // Move to DeptHead
                        nomination.DeptHeadUserId = deptHeadUserId.Value;
                        nomination.CurrentApprovalLevel = 3;
                        nomination.Status = "Pending_DeptHead_Review";

                        Console.WriteLine($"✓ L2 Approved - Moving to DeptHead: {deptHeadUserId}");
                    }
                    else if (request.ActionTaken == "Rejected")
                    {
                        nomination.L2ReviewRemarks = request.Remarks;
                        nomination.L2ReviewedAt = DateTime.UtcNow;
                        nomination.L2Status = "Rejected";
                        nomination.Status = "Rejected_By_L2";

                        Console.WriteLine($"✓ L2 Rejected");
                    }
                }
                else
                {
                    throw new UnauthorizedAccessException("You are not authorized to review this nomination at this stage");
                }

                // Keep legacy fields updated
                nomination.ReviewRemarks = request.Remarks;
                nomination.ReviewedByUserId = managerId;
                nomination.ReviewedAt = DateTime.UtcNow;

                var updated = await _nominationRepository.UpdateAsync(nomination);
                Console.WriteLine($"✓ Nomination {nominationId} reviewed successfully");
                
                return _mapper.Map<NominationResponseDto>(updated);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error in ManagerReviewNominationAsync: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        // ✅ UPDATED: DeptHead is final approval
        public async Task<NominationResponseDto> DepartmentHeadReviewAsync(int nominationId, int deptHeadId, DepartmentHeadReviewRequestDto request)
        {
            try
            {
                Console.WriteLine($"✓ Service: DepartmentHeadReview - NominationId: {nominationId}, Action: {request.Action}");
                
                var nomination = await _nominationRepository.GetByIdAsync(nominationId);
                if (nomination == null)
                {
                    Console.WriteLine($"❌ Nomination not found with ID: {nominationId}");
                    throw new Exception("Nomination not found");
                }

                // Verify this is at DeptHead stage
                if (nomination.CurrentApprovalLevel != 3 || nomination.DeptHeadUserId != deptHeadId)
                {
                    throw new UnauthorizedAccessException("You are not authorized to review this nomination");
                }

                Console.WriteLine($"✓ Current status: {nomination.Status}");

                if (request.Action == "Approved")
                {
                    nomination.DeptHeadReviewRemarks = request.ReviewRemarks;
                    nomination.DeptHeadReviewedAt = DateTime.UtcNow;
                    nomination.DeptHeadStatus = "Approved";
                    nomination.CurrentApprovalLevel = 4;
                    nomination.Status = "Approved_By_DeptHead";

                    Console.WriteLine($"✓ DeptHead Approved - Nomination completed");
                    
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
                    Console.WriteLine($"✓ Review metrics added");
                }
                else if (request.Action == "Rejected")
                {
                    nomination.DeptHeadReviewRemarks = request.ReviewRemarks;
                    nomination.DeptHeadReviewedAt = DateTime.UtcNow;
                    nomination.DeptHeadStatus = "Rejected";
                    nomination.Status = "Rejected_By_DeptHead";

                    Console.WriteLine($"✓ DeptHead Rejected");
                }

                // Keep legacy fields updated
                nomination.ReviewRemarks = request.ReviewRemarks;
                nomination.ReviewedByUserId = deptHeadId;
                nomination.ReviewedAt = DateTime.UtcNow;

                var updated = await _nominationRepository.UpdateAsync(nomination);
                Console.WriteLine($"✓ Nomination {nominationId} reviewed successfully by dept head {deptHeadId}");
                
                return _mapper.Map<NominationResponseDto>(updated);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error in DepartmentHeadReviewAsync: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        public async Task<EligibilityCheckResponseDto> CheckEligibilityAsync(int employeeId, int opportunityId)
        {
            try
            {
                Console.WriteLine($"✓ Service: CheckEligibility - EmployeeId: {employeeId}, OpportunityId: {opportunityId}");
                
                // TODO: Implement actual eligibility check logic
                
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
                Console.WriteLine($"❌ Error in CheckEligibilityAsync: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
                throw;
            }
        }
    }
}
