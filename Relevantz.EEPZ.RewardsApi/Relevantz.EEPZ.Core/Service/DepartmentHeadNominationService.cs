using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Core.Models;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.Service
{
    public class DepartmentHeadNominationService : IDepartmentHeadNominationService
    {
        private readonly IDepartmentHeadNominationRepository _repository;
        private readonly ILogger<DepartmentHeadNominationService> _logger;

        public DepartmentHeadNominationService(
            IDepartmentHeadNominationRepository repository,
            ILogger<DepartmentHeadNominationService> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        // ✅ Typed internal row to avoid dynamic GroupBy binder issues
        private sealed class NominationRow
        {
            public int NominationId { get; set; }
            public int OpportunityId { get; set; }
            public string OpportunityName { get; set; } = "Unknown";
            public string? OpportunityDescription { get; set; }
            public DateTime? OpportunityDeadline { get; set; }
            public object? RewardType { get; set; }
            public object? Nominee { get; set; }
            public object? NominatedBy { get; set; }
            public object? ReviewedBy { get; set; }
            public string? Justification { get; set; }
            public DateTime? SubmittedAt { get; set; }
            public DateTime? ReviewedAt { get; set; }
            public string? ReviewRemarks { get; set; }
            public string? Status { get; set; }
            public object? ParameterValues { get; set; }
        }

        public async Task<ApiResponse<object>> GetApprovedNominationsByDeptHeadAsync(int deptHeadEmployeeId)
        {
            try
            {
                var deptHeadDetails = await _repository.GetDepartmentHeadDetailsAsync(deptHeadEmployeeId);

                if (deptHeadDetails == null || deptHeadDetails.Department == null)
                    return ApiResponse<object>.Fail($"No department found for Department Head Employee ID {deptHeadEmployeeId}");

                var departmentId = deptHeadDetails.DepartmentId;
                var departmentName = deptHeadDetails.Department.DepartmentName;

                var nominations = await _repository.GetApprovedManagerNominationsAsync();

                var rows = new List<NominationRow>();

                foreach (var n in nominations)
                {
                    var nomineeDept = await _repository.GetEmployeeDepartmentDetailsAsync(n.NomineeEmployeeId);
                    if (nomineeDept?.DepartmentId != departmentId) continue;

                    var opportunity = await _repository.GetOpportunityByIdAsync(n.OpportunityId);
                    var parameterValues = await _repository.GetNominationParameterValuesAsync(n.NominationId);

                    rows.Add(new NominationRow
                    {
                        NominationId = n.NominationId,
                        OpportunityId = n.OpportunityId,
                        OpportunityName = opportunity?.OpportunityName ?? "Unknown",
                        OpportunityDescription = opportunity?.Description,
                        OpportunityDeadline = opportunity?.Deadline.ToDateTime(TimeOnly.MinValue),

                      RewardType = opportunity?.RewardType != null ? new
                        {
                            opportunity.RewardType.RewardTypeId,
                            opportunity.RewardType.RewardName,
                            opportunity.RewardType.RewardCategory
                        } : null,
                        Nominee = new
                        {
                            EmployeeId = n.NomineeEmployeeId,
                            FullName = $"{n.NomineeEmployee?.Userprofile?.FirstName} {n.NomineeEmployee?.Userprofile?.LastName}".Trim(),
                            FirstName = n.NomineeEmployee?.Userprofile?.FirstName,
                            LastName = n.NomineeEmployee?.Userprofile?.LastName,
                            Email = n.NomineeEmployee?.Userprofile?.PersonalEmail,
                            DepartmentId = nomineeDept?.DepartmentId,
                            DepartmentName = nomineeDept?.Department?.DepartmentName ?? "Unknown"
                        },
                        NominatedBy = new
                        {
                            EmployeeId = n.NominatedByEmployeeId,
                            FullName = $"{n.NominatedByEmployee?.Userprofile?.FirstName} {n.NominatedByEmployee?.Userprofile?.LastName}".Trim(),
                            FirstName = n.NominatedByEmployee?.Userprofile?.FirstName,
                            LastName = n.NominatedByEmployee?.Userprofile?.LastName
                        },
                        ReviewedBy = n.ReviewedByEmployee != null ? new
                        {
                            EmployeeId = n.ReviewedByEmployeeId,
                            FullName = $"{n.ReviewedByEmployee?.Userprofile?.FirstName} {n.ReviewedByEmployee?.Userprofile?.LastName}".Trim()
                        } : null,
                        Justification = n.Justification,
                        SubmittedAt = n.SubmittedAt,
                        ReviewedAt = n.ReviewedAt,
                        ReviewRemarks = n.ReviewRemarks,
                        Status = n.Status,
                        ParameterValues = parameterValues
                    });
                }

                // ✅ Group WITHOUT dynamic binder
                var grouped = rows
                    .GroupBy(x => new
                    {
                        x.OpportunityId,
                        x.OpportunityName,
                        x.OpportunityDeadline,
                        RewardTypeKey = x.RewardType // okay as object; if needed use RewardTypeId
                    })
                    .Select(g => new
                    {
                        OpportunityId = g.Key.OpportunityId,
                        OpportunityName = g.Key.OpportunityName,
                        OpportunityDeadline = g.Key.OpportunityDeadline,
                        RewardType = g.First().RewardType,
                        NominationCount = g.Count(),
                        Nominations = g.ToList()
                    })
                    .ToList();

                var payload = new
                {
                    deptHeadEmployeeId,
                    departmentId,
                    departmentName,
                    data = grouped,
                    totalNominations = rows.Count,
                    totalOpportunities = grouped.Count
                };

                return ApiResponse<object>.Ok(payload,
                    $"Found {rows.Count} approved nominations in {departmentName} department");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error in GetApprovedNominationsByDeptHeadAsync for DeptHeadEmployeeId {DeptHeadEmployeeId}",
                    deptHeadEmployeeId);

                return ApiResponse<object>.Fail("Internal error occurred while fetching approved nominations.");
            }
        }

        public async Task<ApiResponse<object>> GetNominationDetailsAsync(int nominationId)
        {
            try
            {
                var nomination = await _repository.GetNominationByIdAsync(nominationId);
                if (nomination == null)
                    return ApiResponse<object>.Fail("Approved nomination not found");

                var opportunity = await _repository.GetOpportunityByIdAsync(nomination.OpportunityId);
                var nomineeDept = await _repository.GetEmployeeDepartmentDetailsAsync(nomination.NomineeEmployeeId);
                var parameterValues = await _repository.GetNominationParameterValuesAsync(nominationId);

                var result = new
                {
                    nomination.NominationId,
                    nomination.Status,
                    Opportunity = opportunity != null ? new
                    {
                        opportunity.OpportunityId,
                        opportunity.OpportunityName,
                        opportunity.Description,
                        opportunity.Deadline,
                        RewardType = opportunity.RewardType != null ? new
                        {
                            opportunity.RewardType.RewardTypeId,
                            opportunity.RewardType.RewardName,
                            opportunity.RewardType.RewardCategory,
                            opportunity.RewardType.Description
                        } : null
                    } : null,
                    Nominee = new
                    {
                        EmployeeId = nomination.NomineeEmployeeId,
                        FirstName = nomination.NomineeEmployee?.Userprofile?.FirstName,
                        LastName = nomination.NomineeEmployee?.Userprofile?.LastName,
                        FullName = $"{nomination.NomineeEmployee?.Userprofile?.FirstName} {nomination.NomineeEmployee?.Userprofile?.LastName}".Trim(),
                        Email = nomination.NomineeEmployee?.Userprofile?.PersonalEmail,
                        Department = new
                        {
                            DepartmentId = nomineeDept?.DepartmentId,
                            DepartmentName = nomineeDept?.Department?.DepartmentName ?? "Unknown"
                        }
                    },
                    NominatedBy = new
                    {
                        EmployeeId = nomination.NominatedByEmployeeId,
                        FirstName = nomination.NominatedByEmployee?.Userprofile?.FirstName,
                        LastName = nomination.NominatedByEmployee?.Userprofile?.LastName,
                        FullName = $"{nomination.NominatedByEmployee?.Userprofile?.FirstName} {nomination.NominatedByEmployee?.Userprofile?.LastName}".Trim()
                    },
                    ReviewedBy = nomination.ReviewedByEmployee != null ? new
                    {
                        EmployeeId = nomination.ReviewedByEmployeeId,
                        FirstName = nomination.ReviewedByEmployee?.Userprofile?.FirstName,
                        LastName = nomination.ReviewedByEmployee?.Userprofile?.LastName,
                        FullName = $"{nomination.ReviewedByEmployee?.Userprofile?.FirstName} {nomination.ReviewedByEmployee?.Userprofile?.LastName}".Trim()
                    } : null,
                    nomination.Justification,
                    nomination.SubmittedAt,
                    nomination.ReviewedAt,
                    nomination.ReviewRemarks,
                    ParameterValues = parameterValues
                };

                return ApiResponse<object>.Ok(result, "Nomination details fetched successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetNominationDetailsAsync for nominationId {NominationId}", nominationId);
                return ApiResponse<object>.Fail("Internal error occurred while fetching nomination details.");
            }
        }

        public async Task<ApiResponse<object>> GetDepartmentStatisticsAsync(int deptHeadEmployeeId)
        {
            try
            {
                var deptHeadDetails = await _repository.GetDepartmentHeadDetailsAsync(deptHeadEmployeeId);

                if (deptHeadDetails == null || deptHeadDetails.Department == null)
                    return ApiResponse<object>.Fail("Department not found");

                var departmentId = deptHeadDetails.DepartmentId;
                var departmentName = deptHeadDetails.Department.DepartmentName;

                var allNominations = await _repository.GetApprovedNominationsAsync();

                var nominationsWithDetails =
                    new List<(Recognitionstatus nomination, Recognitiondetail opportunity)>();

                foreach (var n in allNominations)
                {
                    var dept = await _repository.GetEmployeeDepartmentDetailsAsync(n.NomineeEmployeeId);
                    if (dept?.DepartmentId != departmentId) continue;

                    var opp = await _repository.GetOpportunityByIdAsync(n.OpportunityId);
                    if (opp != null) nominationsWithDetails.Add((n, opp));
                }

                var totalApproved = nominationsWithDetails.Count;
                var recognitionCount = nominationsWithDetails.Count(x => x.opportunity.RewardType?.RewardCategory == "Recognition");
                var promotionCount = nominationsWithDetails.Count(x => x.opportunity.RewardType?.RewardCategory == "Promotion");

                var byOpportunity = nominationsWithDetails
                    .GroupBy(x => x.opportunity.OpportunityName)
                    .Select(g => new { OpportunityName = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .ToList();

                var payload = new
                {
                    deptHeadEmployeeId,
                    departmentId,
                    departmentName,
                    totalApproved,
                    recognitionCount,
                    promotionCount,
                    byOpportunity
                };

                return ApiResponse<object>.Ok(payload, "Department statistics fetched successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error in GetDepartmentStatisticsAsync for deptHeadEmployeeId {DeptHeadEmployeeId}",
                    deptHeadEmployeeId);

                return ApiResponse<object>.Fail("Internal error occurred while fetching department statistics.");
            }
        }
    }
}