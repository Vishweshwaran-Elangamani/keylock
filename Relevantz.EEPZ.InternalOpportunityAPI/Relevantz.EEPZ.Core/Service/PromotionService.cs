using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Enums;
using Relevantz.EEPZ.Common.ViewModels.Promotion.Request;
using Relevantz.EEPZ.Common.ViewModels.Promotion.Response;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.IRepository;

namespace Relevantz.EEPZ.Core.Service
{
    public class PromotionService : IPromotionService
    {
        private readonly IPromotionRepository _promotionRepository;
        private readonly INominationRepository _nominationRepository;
        private readonly IMapper _mapper;

        public PromotionService(
            IPromotionRepository promotionRepository,
            INominationRepository nominationRepository,
            IMapper mapper)
        {
            _promotionRepository = promotionRepository;
            _nominationRepository = nominationRepository;
            _mapper = mapper;
        }

        public async Task<PromotionResponseDto> CreatePromotionAsync(CreatePromotionRequestDto request, int createdByUserId)
        {
            try
            {
                Console.WriteLine($"Service: CreatePromotion - EmployeeUserId: {request.EmployeeUserId}, NominationId: {request.NominationId}");

                // ✅ VALIDATION 1: NominationId must be provided
                if (request.NominationId <= 0)
                {
                    throw new Exception("NominationId is required for promotion");
                }

                // ✅ VALIDATION 2: Get and validate nomination
                var nomination = await _nominationRepository.GetByIdAsync(request.NominationId);
                
                if (nomination == null)
                {
                    throw new Exception($"Nomination ID {request.NominationId} not found");
                }

                // ✅ VALIDATION 3: Nomination MUST be approved
                if (nomination.Status != NominationStatusConstants.Approved)
                {
                    throw new Exception($"Cannot create promotion. Nomination status is '{nomination.Status}'. Only APPROVED nominations can be promoted.");
                }

                // ✅ VALIDATION 4: Employee ID must match nominee
                if (nomination.NomineeUserId != request.EmployeeUserId)
                {
                    throw new Exception($"Employee ID {request.EmployeeUserId} does not match the nomination nominee ID {nomination.NomineeUserId}");
                }

                // ✅ VALIDATION 5: Check if promotion already exists for this nomination
                var existingPromotion = await _promotionRepository.GetByNominationIdAsync(request.NominationId);
                if (existingPromotion != null)
                {
                    throw new Exception($"Promotion already exists for Nomination ID {request.NominationId}");
                }

                Console.WriteLine($"✓ All validations passed for NominationId={request.NominationId}");

                // ✅ Create promotion
                var promotion = new Promotion
                {
                    NominationId = request.NominationId,
                    EmployeeUserId = request.EmployeeUserId,
                    DepartmentId = request.DepartmentId,
                    OldRole = request.OldRole,
                    NewRole = request.NewRole,
                    OldSalary = request.OldSalary,
                    NewSalary = request.NewSalary,
                    IncrementPercentage = request.IncrementPercentage,
                    PromotionDate = request.PromotionDate,
                    Justification = request.Justification,
                    Status = PromotionStatusConstants.PendingHrApproval,
                    CreatedAt = DateTime.UtcNow
                };

                var created = await _promotionRepository.CreateAsync(promotion);
                
                // ✅ Load related data for response
                var response = await GetPromotionByIdAsync(created.PromotionId);
                
                return response;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error in CreatePromotionAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<PromotionResponseDto> GetPromotionByIdAsync(int id)
        {
            try
            {
                var promotion = await _promotionRepository.GetByIdAsync(id);
                if (promotion == null)
                    throw new Exception("Promotion not found");

                var response = _mapper.Map<PromotionResponseDto>(promotion);
                response.EmployeeName = promotion.EmployeeUser?.Email;
                response.OpportunityName = promotion.Nomination?.Opportunity?.OpportunityName;
                response.NominationType = promotion.Nomination?.NominationType;

                return response;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error in GetPromotionByIdAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<List<PromotionResponseDto>> GetAllPromotionsAsync()
        {
            try
            {
                var promotions = await _promotionRepository.GetAllAsync();
                
                var responses = promotions.Select(p => new PromotionResponseDto
                {
                    PromotionId = p.PromotionId,
                    EmployeeUserId = p.EmployeeUserId,
                    EmployeeName = p.EmployeeUser?.Email,
                    NominationId = p.NominationId,
                    OpportunityName = p.Nomination?.Opportunity?.OpportunityName,
                    OldRole = p.OldRole,
                    NewRole = p.NewRole,
                    OldSalary = p.OldSalary,
                    NewSalary = p.NewSalary,
                    IncrementPercentage = p.IncrementPercentage,
                    PromotionDate = p.PromotionDate,
                    Justification = p.Justification,
                    Status = p.Status,
                    CreatedAt = p.CreatedAt,
                    ApprovedAt = p.ApprovedAt
                }).ToList();

                return responses;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error in GetAllPromotionsAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<List<PromotionResponseDto>> GetPromotionsByEmployeeAsync(int employeeUserId)
        {
            try
            {
                var promotions = await _promotionRepository.GetByEmployeeAsync(employeeUserId);
                
                var responses = promotions.Select(p => new PromotionResponseDto
                {
                    PromotionId = p.PromotionId,
                    EmployeeUserId = p.EmployeeUserId,
                    EmployeeName = p.EmployeeUser?.Email,
                    NominationId = p.NominationId,
                    OpportunityName = p.Nomination?.Opportunity?.OpportunityName,
                    OldRole = p.OldRole,
                    NewRole = p.NewRole,
                    Status = p.Status,
                    CreatedAt = p.CreatedAt
                }).ToList();

                return responses;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error in GetPromotionsByEmployeeAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<List<PromotionResponseDto>> GetPendingHrApprovalAsync()
        {
            try
            {
                var promotions = await _promotionRepository.GetPendingHrApprovalAsync();
                
                var responses = promotions.Select(p => new PromotionResponseDto
                {
                    PromotionId = p.PromotionId,
                    EmployeeUserId = p.EmployeeUserId,
                    EmployeeName = p.EmployeeUser?.Email,
                    NominationId = p.NominationId,
                    OpportunityName = p.Nomination?.Opportunity?.OpportunityName,
                    OldRole = p.OldRole,
                    NewRole = p.NewRole,
                    OldSalary = p.OldSalary,
                    NewSalary = p.NewSalary,
                    PromotionDate = p.PromotionDate,
                    Status = p.Status,
                    CreatedAt = p.CreatedAt
                }).ToList();

                return responses;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error in GetPendingHrApprovalAsync: {ex.Message}");
                throw;
            }
        }

        // ✅ UPDATE: HR Approve - moves to leadership
public async Task<PromotionResponseDto> ApprovePromotionAsync(int promotionId, int approvedByUserId, string remarks)
{
    try
    {
        var promotion = await _promotionRepository.GetByIdAsync(promotionId);
        if (promotion == null)
            throw new Exception("Promotion not found");

        // ✅ CHANGE: Set to "hr_approved" instead of "approved"
        promotion.Status = PromotionStatusConstants.HrApproved;
        promotion.ApprovedByUserId = approvedByUserId;
        promotion.ApprovedAt = DateTime.UtcNow;
        promotion.Justification = $"{promotion.Justification}\n[HR Approved: {remarks}]";

        var updated = await _promotionRepository.UpdateAsync(promotion);

        Console.WriteLine($"✓ Promotion HR approved: PromotionId={promotionId} → Pending Leadership");

        return await GetPromotionByIdAsync(updated.PromotionId);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error in ApprovePromotionAsync: {ex.Message}");
        throw;
    }
}

// ✅ NEW: Get promotions pending leadership approval
public async Task<List<PromotionResponseDto>> GetPendingLeadershipApprovalAsync()
{
    try
    {
        Console.WriteLine("Service: Getting promotions pending leadership approval");

        var promotions = await _promotionRepository.GetPendingLeadershipApprovalAsync();
        
        var responses = promotions.Select(p => new PromotionResponseDto
        {
            PromotionId = p.PromotionId,
            EmployeeUserId = p.EmployeeUserId,
            EmployeeName = p.EmployeeUser?.Email,
            NominationId = p.NominationId,
            OpportunityName = p.Nomination?.Opportunity?.OpportunityName,
            OldRole = p.OldRole,
            NewRole = p.NewRole,
            OldSalary = p.OldSalary,
            NewSalary = p.NewSalary,
            PromotionDate = p.PromotionDate,
            Status = p.Status,
            CreatedAt = p.CreatedAt
        }).ToList();

        return responses;
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error in GetPendingLeadershipApprovalAsync: {ex.Message}");
        throw;
    }
}

// ✅ NEW: Leadership approves promotion (FINAL)
public async Task<PromotionResponseDto> ApprovePromotionByLeadershipAsync(int promotionId, int approvedByUserId, string remarks)
{
    try
    {
        var promotion = await _promotionRepository.GetByIdAsync(promotionId);
        if (promotion == null)
            throw new Exception("Promotion not found");

        if (promotion.Status != PromotionStatusConstants.HrApproved)
        {
            throw new Exception($"Cannot approve. Promotion status is '{promotion.Status}'. Must be 'hr_approved'.");
        }

        // ✅ FINAL STATUS: approved
        promotion.Status = PromotionStatusConstants.Approved;
        promotion.ApprovedByUserId = approvedByUserId;
        promotion.ApprovedAt = DateTime.UtcNow;
        promotion.Justification = $"{promotion.Justification}\n[Leadership Final Approval: {remarks}]";

        var updated = await _promotionRepository.UpdateAsync(promotion);

                Console.WriteLine($"✓ Promotion FINAL approved by Leadership: PromotionId={promotionId} → APPROVED");
        // At the end of ApprovePromotionByLeadershipAsync:

var history = new Promotionhistory
{
    EmployeeUserId = promotion.EmployeeUserId,
    PromotionId = promotion.PromotionId,
    FromRole = promotion.OldRole,
    ToRole = promotion.NewRole,
    SalaryChange = promotion.NewSalary - (promotion.OldSalary ?? 0),
    PromotionDate = promotion.PromotionDate,
    RecordedAt = DateTime.UtcNow
};
await _promotionRepository.AddPromotionHistoryAsync(history);


        return await GetPromotionByIdAsync(updated.PromotionId);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error in ApprovePromotionByLeadershipAsync: {ex.Message}");
        throw;
    }
}

// ✅ NEW: Leadership rejects promotion
public async Task<PromotionResponseDto> RejectPromotionByLeadershipAsync(int promotionId, int rejectedByUserId, string remarks)
{
    try
    {
        var promotion = await _promotionRepository.GetByIdAsync(promotionId);
        if (promotion == null)
            throw new Exception("Promotion not found");

        if (promotion.Status != PromotionStatusConstants.HrApproved)
        {
            throw new Exception($"Cannot reject. Promotion status is '{promotion.Status}'. Must be 'hr_approved'.");
        }

        promotion.Status = PromotionStatusConstants.Rejected;
        promotion.ApprovedByUserId = rejectedByUserId;
        promotion.ApprovedAt = DateTime.UtcNow;
        promotion.Justification = $"{promotion.Justification}\n[Leadership Rejected: {remarks}]";

        var updated = await _promotionRepository.UpdateAsync(promotion);

        Console.WriteLine($"✓ Promotion rejected by Leadership: PromotionId={promotionId}");

        return await GetPromotionByIdAsync(updated.PromotionId);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error in RejectPromotionByLeadershipAsync: {ex.Message}");
        throw;
    }
}


        public async Task<PromotionResponseDto> RejectPromotionAsync(int promotionId, int rejectedByUserId)
        {
            try
            {
                var promotion = await _promotionRepository.GetByIdAsync(promotionId);
                if (promotion == null)
                    throw new Exception("Promotion not found");

                promotion.Status = PromotionStatusConstants.Rejected;
                promotion.ApprovedByUserId = rejectedByUserId;
                promotion.ApprovedAt = DateTime.UtcNow;

                var updated = await _promotionRepository.UpdateAsync(promotion);

                Console.WriteLine($"✓ Promotion rejected: PromotionId={promotionId}");

                return await GetPromotionByIdAsync(updated.PromotionId);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error in RejectPromotionAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<List<PromotionResponseDto>> GetPromotionHistoryByEmployeeAsync(int employeeUserId)
        {
            try
            {
                var history = await _promotionRepository.GetPromotionHistoryByEmployeeAsync(employeeUserId);
                
                var responses = history.Select(h => new PromotionResponseDto
                {
                    OldRole = h.FromRole,
                    NewRole = h.ToRole,
                    OldSalary = (decimal?)h.SalaryChange,
                    PromotionDate = h.PromotionDate,
                    CreatedAt = h.RecordedAt
                }).ToList();

                return responses;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error in GetPromotionHistoryByEmployeeAsync: {ex.Message}");
                throw;
            }
        }
    }
}
