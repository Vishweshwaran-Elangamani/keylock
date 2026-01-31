using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using MapsterMapper;
using Mapster;

namespace Relevantz.EEPZ.Core.Service
{
    public class ViolationService : IViolationService
    {
        private readonly IViolationRepository _violationRepository;
        private readonly ILogger<ViolationService> _logger;
        private readonly IMapper _mapper;

        public ViolationService(
            IViolationRepository violationRepository,
            ILogger<ViolationService> logger,
            IMapper mapper)
        {
            _violationRepository = violationRepository;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<ApiResponseDto<ViolationResponseDto>> ReportViolationAsync(
            ReportViolationRequestDto request,
            int reportedByUserId)
        {
            try
            {
                if (request.EmployeeUserId <= 0)
                {
                    EEPZBusinessLog.LogServiceWarning("Invalid employee user ID in violation report: {EmployeeUserId}", request.EmployeeUserId);
                    return ApiResponseDto<ViolationResponseDto>
                        .ErrorResponse(ViolationMessages.InvalidEmployeeUserId);
                }

                if (request.PolicyId <= 0)
                {
                    EEPZBusinessLog.LogServiceWarning("Invalid policy ID in violation report: {PolicyId}", request.PolicyId);
                    return ApiResponseDto<ViolationResponseDto>
                        .ErrorResponse(ViolationMessages.InvalidPolicyId);
                }

                if (string.IsNullOrWhiteSpace(request.ViolationType))
                {
                    EEPZBusinessLog.LogServiceWarning("Invalid violation type in report");
                    return ApiResponseDto<ViolationResponseDto>
                        .ErrorResponse(ViolationMessages.InvalidViolationType);
                }

                EEPZBusinessLog.LogServiceInformation("Reporting violation: Employee={EmployeeUserId}, Policy={PolicyId}, Type={ViolationType}, ReportedBy={ReportedByUserId}",
                    request.EmployeeUserId, request.PolicyId, request.ViolationType, reportedByUserId);

                var violation = _mapper.Map<Policyviolation>(request);
                violation.ReportedByUserId = reportedByUserId;
                violation.Status = "Reported";
                violation.ReportedDate = DateOnly.FromDateTime(DateTime.Now);

                var createdViolation = await _violationRepository.CreateViolationAsync(violation);

                var fullViolation = await _violationRepository.GetViolationByIdAsync(
                    createdViolation.ViolationId);

                var response = _mapper.Map<ViolationResponseDto>(fullViolation!);

                EEPZBusinessLog.LogServiceInformation("Violation reported successfully: ViolationId={ViolationId}, Employee={EmployeeUserId}, ReportedBy={ReportedByUserId}",
                    createdViolation.ViolationId, request.EmployeeUserId, reportedByUserId);

                return ApiResponseDto<ViolationResponseDto>.SuccessResponse(
                    response,
                    ViolationMessages.ViolationReportedSuccess);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error reporting violation for employee {EmployeeUserId}", ex, request.EmployeeUserId);
                throw;
            }
        }

        public async Task<ApiResponseDto<List<ViolationResponseDto>>> GetAllViolationsAsync()
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Fetching all violations");

                var violations = await _violationRepository.GetAllViolationsAsync();
                var response = _mapper.Map<List<ViolationResponseDto>>(violations);

                EEPZBusinessLog.LogServiceInformation("Retrieved {Count} violations", response.Count);

                return ApiResponseDto<List<ViolationResponseDto>>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error fetching all violations", ex);
                throw;
            }
        }

        public async Task<ApiResponseDto<ViolationResponseDto>> GetViolationByIdAsync(int violationId)
        {
            try
            {
                if (violationId <= 0)
                {
                    EEPZBusinessLog.LogServiceWarning("Invalid violation ID: {ViolationId}", violationId);
                    return ApiResponseDto<ViolationResponseDto>
                        .ErrorResponse(ViolationMessages.InvalidViolationId);
                }

                EEPZBusinessLog.LogServiceInformation("Fetching violation {ViolationId}", violationId);

                var violation = await _violationRepository.GetViolationByIdAsync(violationId);

                if (violation == null)
                {
                    EEPZBusinessLog.LogServiceWarning("Violation {ViolationId} not found", violationId);
                    return ApiResponseDto<ViolationResponseDto>
                        .ErrorResponse(ViolationMessages.ViolationNotFound);
                }

                var response = _mapper.Map<ViolationResponseDto>(violation);

                EEPZBusinessLog.LogServiceInformation("Violation {ViolationId} retrieved successfully", violationId);

                return ApiResponseDto<ViolationResponseDto>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error fetching violation {ViolationId}", ex, violationId);
                throw;
            }
        }

        public async Task<ApiResponseDto<List<ViolationResponseDto>>> GetViolationsByEmployeeAsync(
            int employeeUserId)
        {
            try
            {
                if (employeeUserId <= 0)
                {
                    EEPZBusinessLog.LogServiceWarning("Invalid employee user ID: {EmployeeUserId}", employeeUserId);
                    return ApiResponseDto<List<ViolationResponseDto>>
                        .ErrorResponse(ViolationMessages.InvalidEmployeeUserId);
                }

                EEPZBusinessLog.LogServiceInformation("Fetching violations for employee {EmployeeUserId}", employeeUserId);

                var violations = await _violationRepository.GetViolationsByEmployeeAsync(employeeUserId);
                var response = _mapper.Map<List<ViolationResponseDto>>(violations);

                EEPZBusinessLog.LogServiceInformation("Retrieved {Count} violations for employee {EmployeeUserId}",
                    response.Count, employeeUserId);

                return ApiResponseDto<List<ViolationResponseDto>>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error fetching violations for employee {EmployeeUserId}", ex, employeeUserId);
                throw;
            }
        }

        public async Task<ApiResponseDto<List<ViolationResponseDto>>> GetViolationsByPolicyAsync(
            int policyId)
        {
            try
            {
                if (policyId <= 0)
                {
                    EEPZBusinessLog.LogServiceWarning("Invalid policy ID: {PolicyId}", policyId);
                    return ApiResponseDto<List<ViolationResponseDto>>
                        .ErrorResponse(ViolationMessages.InvalidPolicyId);
                }

                EEPZBusinessLog.LogServiceInformation("Fetching violations for policy {PolicyId}", policyId);

                var violations = await _violationRepository.GetViolationsByPolicyAsync(policyId);
                var response = _mapper.Map<List<ViolationResponseDto>>(violations);

                EEPZBusinessLog.LogServiceInformation("Retrieved {Count} violations for policy {PolicyId}",
                    response.Count, policyId);

                return ApiResponseDto<List<ViolationResponseDto>>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error fetching violations for policy {PolicyId}", ex, policyId);
                throw;
            }
        }

        public async Task<ApiResponseDto<ViolationResponseDto>> ResolveViolationAsync(
            int violationId,
            ResolveViolationRequestDto request)
        {
            try
            {
                if (violationId <= 0)
                {
                    EEPZBusinessLog.LogServiceWarning("Invalid violation ID for resolution: {ViolationId}", violationId);
                    return ApiResponseDto<ViolationResponseDto>
                        .ErrorResponse(ViolationMessages.InvalidViolationId);
                }

                EEPZBusinessLog.LogServiceInformation("Resolving violation {ViolationId}", violationId);

                var resolved = await _violationRepository.ResolveViolationAsync(
                    violationId,
                    request.ResolutionNotes);

                if (!resolved)
                {
                    EEPZBusinessLog.LogServiceWarning("Violation {ViolationId} not found for resolution", violationId);
                    return ApiResponseDto<ViolationResponseDto>
                        .ErrorResponse(ViolationMessages.ViolationNotFound);
                }

                var violation = await _violationRepository.GetViolationByIdAsync(violationId);
                var response = _mapper.Map<ViolationResponseDto>(violation!);

                EEPZBusinessLog.LogServiceInformation("Violation {ViolationId} resolved successfully: {ResolutionNotes}",
                    violationId, request.ResolutionNotes);

                return ApiResponseDto<ViolationResponseDto>.SuccessResponse(
                    response,
                    ViolationMessages.ViolationResolvedSuccess);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error resolving violation {ViolationId}", ex, violationId);
                throw;
            }
        }

        public async Task<ApiResponseDto<ViolationStatsDto>> GetViolationStatsAsync()
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Fetching violation statistics");

                var bySeverity = await _violationRepository.GetViolationCountBySeverityAsync();
                var byStatus = await _violationRepository.GetViolationCountByStatusAsync();

                var stats = new ViolationStatsDto
                {
                    BySeverity = bySeverity,
                    ByStatus = byStatus
                };

                EEPZBusinessLog.LogServiceInformation("Violation statistics retrieved: Severity groups={SeverityCount}, Status groups={StatusCount}",
                    bySeverity.Count, byStatus.Count);

                return ApiResponseDto<ViolationStatsDto>.SuccessResponse(stats);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error fetching violation statistics", ex);
                throw;
            }
        }
    }
}
