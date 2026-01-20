using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Microsoft.EntityFrameworkCore;

namespace Relevantz.EEPZ.Core.Service
{
    public class ViolationService : IViolationService
    {
        private readonly IViolationRepository _violationRepository;
        private readonly ILogger<ViolationService> _logger;

        public ViolationService(IViolationRepository violationRepository, ILogger<ViolationService> logger)
        {
            _violationRepository = violationRepository;
            _logger = logger;
        }

        public async Task<ApiResponseDto<ViolationResponseDto>> ReportViolationAsync(ReportViolationRequestDto request, int reportedByUserId)
        {
            try
            {
                // Validate inputs
                if (request.EmployeeUserId <= 0)
                {
                    return ApiResponseDto<ViolationResponseDto>.ErrorResponse(ViolationMessages.InvalidEmployeeUserId);
                }

                if (request.PolicyId <= 0)
                {
                    return ApiResponseDto<ViolationResponseDto>.ErrorResponse(ViolationMessages.InvalidPolicyId);
                }

                if (string.IsNullOrWhiteSpace(request.ViolationType))
                {
                    return ApiResponseDto<ViolationResponseDto>.ErrorResponse(ViolationMessages.InvalidViolationType);
                }

                var violation = new Policyviolation
                {
                    EmployeeUserId = request.EmployeeUserId,
                    PolicyId = request.PolicyId,
                    ViolationType = request.ViolationType,
                    Description = request.Description,
                    Severity = request.Severity,
                    Status = "Reported",
                    ReportedByUserId = reportedByUserId,
                    ReportedDate = DateOnly.FromDateTime(DateTime.Now),
                    EscalatedToUserId = request.EscalatedToUserId
                };

                var createdViolation = await _violationRepository.CreateViolationAsync(violation);

                // Reload with includes
                var fullViolation = await _violationRepository.GetViolationByIdAsync(createdViolation.ViolationId);
                
                _logger.LogInformation(ViolationMessages.LogViolationReported, createdViolation.ViolationId, reportedByUserId, request.EmployeeUserId);
                
                var response = MapToResponseDto(fullViolation!);
                return ApiResponseDto<ViolationResponseDto>.SuccessResponse(response, ViolationMessages.ViolationReportedSuccess);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, ViolationMessages.LogErrorReportingViolation, request.EmployeeUserId);
                return ApiResponseDto<ViolationResponseDto>.ErrorResponse(ViolationMessages.FailedToReportViolation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, ViolationMessages.LogErrorReportingViolation, request.EmployeeUserId);
                return ApiResponseDto<ViolationResponseDto>.ErrorResponse(ViolationMessages.FailedToReportViolation);
            }
        }

        public async Task<ApiResponseDto<List<ViolationResponseDto>>> GetAllViolationsAsync()
        {
            try
            {
                var violations = await _violationRepository.GetAllViolationsAsync();
                var response = MapViolations(violations);
                return ApiResponseDto<List<ViolationResponseDto>>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, ViolationMessages.LogErrorFetchingAllViolations);
                return ApiResponseDto<List<ViolationResponseDto>>.ErrorResponse(ViolationMessages.FailedToFetchViolations);
            }
        }

        public async Task<ApiResponseDto<ViolationResponseDto>> GetViolationByIdAsync(int violationId)
        {
            try
            {
                if (violationId <= 0)
                {
                    return ApiResponseDto<ViolationResponseDto>.ErrorResponse(ViolationMessages.InvalidViolationId);
                }

                var violation = await _violationRepository.GetViolationByIdAsync(violationId);
                if (violation == null)
                {
                    return ApiResponseDto<ViolationResponseDto>.ErrorResponse(ViolationMessages.ViolationNotFound);
                }

                var response = MapToResponseDto(violation);
                return ApiResponseDto<ViolationResponseDto>.SuccessResponse(response);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, ViolationMessages.LogDatabaseErrorFetchingViolation, violationId);
                return ApiResponseDto<ViolationResponseDto>.ErrorResponse(ViolationMessages.DatabaseError);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, ViolationMessages.LogErrorFetchingViolation, violationId);
                return ApiResponseDto<ViolationResponseDto>.ErrorResponse(ViolationMessages.FailedToFetchViolation);
            }
        }

        public async Task<ApiResponseDto<List<ViolationResponseDto>>> GetViolationsByEmployeeAsync(int EmployeeUserId)
        {
            try
            {
                if (EmployeeUserId <= 0)
                {
                    return ApiResponseDto<List<ViolationResponseDto>>.ErrorResponse(ViolationMessages.InvalidEmployeeUserId);
                }

                var violations = await _violationRepository.GetViolationsByEmployeeAsync(EmployeeUserId);
                var response = MapViolations(violations);
                return ApiResponseDto<List<ViolationResponseDto>>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, ViolationMessages.LogErrorFetchingEmployeeViolations, EmployeeUserId);
                return ApiResponseDto<List<ViolationResponseDto>>.ErrorResponse(ViolationMessages.FailedToFetchViolations);
            }
        }

        public async Task<ApiResponseDto<List<ViolationResponseDto>>> GetViolationsByPolicyAsync(int policyId)
        {
            try
            {
                if (policyId <= 0)
                {
                    return ApiResponseDto<List<ViolationResponseDto>>.ErrorResponse(ViolationMessages.InvalidPolicyId);
                }

                var violations = await _violationRepository.GetViolationsByPolicyAsync(policyId);
                var response = MapViolations(violations);
                return ApiResponseDto<List<ViolationResponseDto>>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, ViolationMessages.LogErrorFetchingPolicyViolations, policyId);
                return ApiResponseDto<List<ViolationResponseDto>>.ErrorResponse(ViolationMessages.FailedToFetchViolations);
            }
        }

        public async Task<ApiResponseDto<ViolationResponseDto>> ResolveViolationAsync(int violationId, ResolveViolationRequestDto request)
        {
            try
            {
                if (violationId <= 0)
                {
                    return ApiResponseDto<ViolationResponseDto>.ErrorResponse(ViolationMessages.InvalidViolationId);
                }

                var result = await _violationRepository.ResolveViolationAsync(violationId, request.ResolutionNotes);
                if (!result)
                {
                    return ApiResponseDto<ViolationResponseDto>.ErrorResponse(ViolationMessages.ViolationNotFound);
                }

                _logger.LogInformation(ViolationMessages.LogViolationResolved, violationId, request.ResolutionNotes);

                var violation = await _violationRepository.GetViolationByIdAsync(violationId);
                var response = MapToResponseDto(violation!);
                return ApiResponseDto<ViolationResponseDto>.SuccessResponse(response, ViolationMessages.ViolationResolvedSuccess);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, ViolationMessages.LogErrorResolvingViolation, violationId);
                return ApiResponseDto<ViolationResponseDto>.ErrorResponse(ViolationMessages.FailedToResolveViolation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, ViolationMessages.LogErrorResolvingViolation, violationId);
                return ApiResponseDto<ViolationResponseDto>.ErrorResponse(ViolationMessages.FailedToResolveViolation);
            }
        }

        public async Task<ApiResponseDto<ViolationStatsDto>> GetViolationStatsAsync()
        {
            try
            {
                var bySeverity = await _violationRepository.GetViolationCountBySeverityAsync();
                var byStatus = await _violationRepository.GetViolationCountByStatusAsync();

                var stats = new ViolationStatsDto
                {
                    BySeverity = bySeverity,
                    ByStatus = byStatus
                };

                return ApiResponseDto<ViolationStatsDto>.SuccessResponse(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, ViolationMessages.LogErrorFetchingViolationStats);
                return ApiResponseDto<ViolationStatsDto>.ErrorResponse(ViolationMessages.FailedToFetchViolationStats);
            }
        }

        private List<ViolationResponseDto> MapViolations(IEnumerable<Policyviolation> violations)
        {
            return violations.Select(MapToResponseDto).ToList();
        }

        private ViolationResponseDto MapToResponseDto(Policyviolation violation)
        {
            return new ViolationResponseDto
            {
                ViolationId = violation.ViolationId,
                EmployeeUserId = violation.EmployeeUserId,
                EmployeeName = violation.EmployeeUser?.Employee?.Userprofile != null
                    ? $"{violation.EmployeeUser.Employee.Userprofile.FirstName} {violation.EmployeeUser.Employee.Userprofile.LastName}"
                    : null,
                EmployeeEmail = violation.EmployeeUser?.Email,
                PolicyId = violation.PolicyId,
                PolicyName = violation.Policy?.PolicyName,
                ViolationType = violation.ViolationType,
                Description = violation.Description,
                Severity = violation.Severity,
                Status = violation.Status,
                ReportedByUserId = violation.ReportedByUserId,
                ReportedByEmail = violation.ReportedByUser?.Email,
                ReportedDate = violation.ReportedDate,
                EscalatedToUserId = violation.EscalatedToUserId,
                EscalatedToEmail = violation.EscalatedToUser?.Email,
                ResolutionNotes = violation.ResolutionNotes,
                ResolvedAt = violation.ResolvedAt
            };
        }
    }
}
