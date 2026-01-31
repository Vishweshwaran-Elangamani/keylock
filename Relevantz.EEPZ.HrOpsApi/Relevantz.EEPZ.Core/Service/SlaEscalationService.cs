using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;

namespace Relevantz.EEPZ.Core.Service
{
    public class SlaEscalationService : ISlaEscalationService
    {
        private readonly ISlaEscalationRepository _slaEscalationRepository;
        private readonly IViolationService _violationService;

        public SlaEscalationService(
            ISlaEscalationRepository slaEscalationRepository,
            IViolationService violationService)
        {
            _slaEscalationRepository = slaEscalationRepository;
            _violationService = violationService;
        }

        public async Task<ApiResponseDto<List<SlaEscalationResponseDto>>> GetAllSlaEscalationsAsync()
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Fetching all SLA escalations");

                var escalations = await _slaEscalationRepository.GetAllAsync();
                var response = escalations.Select(MapToEscalationResponse).ToList();

                EEPZBusinessLog.LogServiceInformation("Retrieved {Count} SLA escalations", response.Count);

                return ApiResponseDto<List<SlaEscalationResponseDto>>.SuccessResponse(
                    response,
                    $"Retrieved {response.Count} SLA escalations");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error fetching all SLA escalations", ex);
                throw;
            }
        }

        public async Task<ApiResponseDto<List<SlaEscalationResponseDto>>> GetSlaEscalationsByEmployeeAsync(int employeeUserId)
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Fetching SLA escalations for employee {EmployeeUserId}", employeeUserId);

                var escalations = await _slaEscalationRepository.GetByEmployeeUserIdAsync(employeeUserId);
                var response = escalations.Select(MapToEscalationResponse).ToList();

                EEPZBusinessLog.LogServiceInformation("Retrieved {Count} escalations for employee {EmployeeUserId}",
                    response.Count, employeeUserId);

                return ApiResponseDto<List<SlaEscalationResponseDto>>.SuccessResponse(
                    response,
                    $"Retrieved {response.Count} escalations for employee");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error fetching SLA escalations for employee {EmployeeUserId}", ex, employeeUserId);
                throw;
            }
        }

        public async Task<ApiResponseDto<SlaEscalationResponseDto>> GetSlaEscalationByIdAsync(int escalationId)
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Fetching SLA escalation {EscalationId}", escalationId);

                var escalation = await _slaEscalationRepository.GetByIdAsync(escalationId);

                if (escalation == null)
                {
                    EEPZBusinessLog.LogServiceWarning("SLA escalation {EscalationId} not found", escalationId);
                    return ApiResponseDto<SlaEscalationResponseDto>.ErrorResponse("Escalation not found");
                }

                var response = MapToEscalationResponse(escalation);

                EEPZBusinessLog.LogServiceInformation("SLA escalation {EscalationId} retrieved successfully", escalationId);

                return ApiResponseDto<SlaEscalationResponseDto>.SuccessResponse(
                    response,
                    "Escalation details retrieved");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error fetching SLA escalation {EscalationId}", ex, escalationId);
                throw;
            }
        }

        public async Task<ApiResponseDto<object>> GetCombinedViolationsAndEscalationsAsync()
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Fetching combined violations and SLA escalations");

                var violationsResult = await _violationService.GetAllViolationsAsync();

                var escalations = await _slaEscalationRepository.GetAllAsync();
                var escalationData = escalations.Select(e => new
                {
                    type = "SLA Escalation",
                    id = e.EscalationId,
                    employeeUserId = e.Sla?.EmployeeId,
                    employeeName = GetEmployeeName(e.Sla?.Employee?.Userprofile),
                    violation = e.Reason,
                    severity = GetSeverityLevel(CalculateDaysOverdue(e.Sla?.Deadline)),
                    status = e.EscalationStatus,
                    reportedDate = e.SubmittedAt,
                    details = new
                    {
                        slaType = e.Sla?.Slatype,
                        escalationLevel = e.EscalationLevel,
                        daysOverdue = CalculateDaysOverdue(e.Sla?.Deadline)
                    }
                }).ToList();

                var combinedData = new
                {
                    violations = violationsResult.Data,
                    slaEscalations = escalationData,
                    summary = new
                    {
                        totalViolations = violationsResult.Data?.Count() ?? 0,
                        totalEscalations = escalationData.Count,
                        totalCombined = (violationsResult.Data?.Count() ?? 0) + escalationData.Count
                    }
                };

                EEPZBusinessLog.LogServiceInformation("Combined data retrieved: {TotalViolations} violations, {TotalEscalations} escalations",
                    combinedData.summary.totalViolations, combinedData.summary.totalEscalations);

                return ApiResponseDto<object>.SuccessResponse(
                    combinedData,
                    "Combined violations and escalations retrieved");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error fetching combined violations and escalations", ex);
                throw;
            }
        }

        public async Task<ApiResponseDto<object>> GetSlaEscalationStatsAsync()
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Fetching SLA escalation statistics");

                var escalations = await _slaEscalationRepository.GetAllAsync();

                var stats = new
                {
                    totalEscalations = escalations.Count,
                    openEscalations = escalations.Count(e => e.EscalationStatus == "Open" || e.EscalationStatus == "Pending"),
                    resolvedEscalations = escalations.Count(e => e.EscalationStatus == "Resolved"),
                    byLevel = escalations.GroupBy(e => e.EscalationLevel)
                        .Select(g => new { level = g.Key, count = g.Count() })
                        .ToList(),
                    bySeverity = escalations.GroupBy(e => GetSeverityLevel(CalculateDaysOverdue(e.Sla?.Deadline)))
                        .Select(g => new { severity = g.Key, count = g.Count() })
                        .ToList(),
                    recent = escalations
                        .OrderByDescending(e => e.SubmittedAt)
                        .Take(5)
                        .Select(e => new
                        {
                            escalationId = e.EscalationId,
                            employeeName = GetEmployeeName(e.Sla?.Employee?.Userprofile),
                            slaType = e.Sla?.Slatype,
                            escalationLevel = e.EscalationLevel,
                            submittedAt = e.SubmittedAt
                        })
                        .ToList()
                };

                EEPZBusinessLog.LogServiceInformation("Escalation statistics retrieved: Total={Total}, Open={Open}, Resolved={Resolved}",
                    stats.totalEscalations, stats.openEscalations, stats.resolvedEscalations);

                return ApiResponseDto<object>.SuccessResponse(
                    stats,
                    "Escalation statistics retrieved");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error fetching SLA escalation statistics", ex);
                throw;
            }
        }

        // Helper methods
        private SlaEscalationResponseDto MapToEscalationResponse(Slaescalation escalation)
        {
            return new SlaEscalationResponseDto
            {
                EscalationId = escalation.EscalationId,
                SlaId = escalation.Slaid,
                SlaType = escalation.Sla?.Slatype,
                EmployeeCompanyId = escalation.Sla?.Employee?.EmployeeCompanyId,
                EmployeeName = GetEmployeeName(escalation.Sla?.Employee?.Userprofile),
                EmployeeEmail = escalation.Sla?.Employee?.Userauthentication?.Email,
                EscalatedToEmployeeId = escalation.EscalatedToEmployeeId,
                EscalatedToEmployeeCompanyId = escalation.EscalatedToEmployee?.EmployeeCompanyId,
                EscalatedToName = GetEmployeeName(escalation.EscalatedToEmployee?.Userprofile),
                EscalatedToEmail = escalation.EscalatedToEmployee?.Userauthentication?.Email,
                EscalationLevel = escalation.EscalationLevel,
                Reason = escalation.Reason,
                Description = escalation.Description,
                EscalationStatus = escalation.EscalationStatus,
                SubmittedByName = GetEmployeeName(escalation.SubmittedByEmployee?.Userprofile),
                SubmittedAt = escalation.SubmittedAt,
                EscalationDeadline = escalation.EscalationDeadline,
                ResolvedAt = escalation.ResolvedAt,
                ResolvedByName = GetEmployeeName(escalation.ResolvedByEmployee?.Userprofile),
                ResolutionComments = escalation.ResolutionComments,
                SlaDeadline = escalation.Sla?.Deadline,
                SlaStatus = escalation.Sla?.Status,
                DaysOverdue = CalculateDaysOverdue(escalation.Sla?.Deadline),
                Severity = GetSeverityLevel(CalculateDaysOverdue(escalation.Sla?.Deadline))
            };
        }

        private string GetEmployeeName(Userprofile? userprofile)
        {
            if (userprofile == null)
                return "Unknown";
            return $"{userprofile.FirstName} {userprofile.LastName}";
        }

        private int CalculateDaysOverdue(DateTime? deadline)
        {
            if (!deadline.HasValue || deadline.Value >= DateTime.Now)
                return 0;
            return (int)(DateTime.Now - deadline.Value).TotalDays;
        }

        private string GetSeverityLevel(int daysOverdue)
        {
            if (daysOverdue >= 7)
                return "Critical";
            if (daysOverdue >= 3)
                return "High";
            if (daysOverdue >= 1)
                return "Medium";
            return "Low";
        }
    }
}
