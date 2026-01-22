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

namespace Relevantz.EEPZ.Core.Service
{
    public class ViolationService : IViolationService
    {
        private readonly IViolationRepository _violationRepository;
        private readonly ILogger<ViolationService> _logger;

        public ViolationService(
            IViolationRepository violationRepository,
            ILogger<ViolationService> logger)
        {
            _violationRepository = violationRepository;
            _logger = logger;
        }

        public async Task<ApiResponseDto<ViolationResponseDto>> ReportViolationAsync(
            ReportViolationRequestDto request, int reportedByUserId)
        {
            if (request.EmployeeUserId <= 0)
                return ApiResponseDto<ViolationResponseDto>
                    .ErrorResponse(ViolationMessages.InvalidEmployeeUserId);

            if (request.PolicyId <= 0)
                return ApiResponseDto<ViolationResponseDto>
                    .ErrorResponse(ViolationMessages.InvalidPolicyId);

            if (string.IsNullOrWhiteSpace(request.ViolationType))
                return ApiResponseDto<ViolationResponseDto>
                    .ErrorResponse(ViolationMessages.InvalidViolationType);

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

            var createdViolation =
                await _violationRepository.CreateViolationAsync(violation);

            var fullViolation =
                await _violationRepository.GetViolationByIdAsync(
                    createdViolation.ViolationId);

            _logger.LogInformation(
                ViolationMessages.LogViolationReported,
                createdViolation.ViolationId,
                reportedByUserId,
                request.EmployeeUserId);

            return ApiResponseDto<ViolationResponseDto>.SuccessResponse(
                MapToResponseDto(fullViolation!),
                ViolationMessages.ViolationReportedSuccess);
        }

        public async Task<ApiResponseDto<List<ViolationResponseDto>>> GetAllViolationsAsync()
        {
            var violations =
                await _violationRepository.GetAllViolationsAsync();

            return ApiResponseDto<List<ViolationResponseDto>>
                .SuccessResponse(MapViolations(violations));
        }

        public async Task<ApiResponseDto<ViolationResponseDto>> GetViolationByIdAsync(int violationId)
        {
            if (violationId <= 0)
                return ApiResponseDto<ViolationResponseDto>
                    .ErrorResponse(ViolationMessages.InvalidViolationId);

            var violation =
                await _violationRepository.GetViolationByIdAsync(violationId);

            if (violation == null)
                return ApiResponseDto<ViolationResponseDto>
                    .ErrorResponse(ViolationMessages.ViolationNotFound);

            return ApiResponseDto<ViolationResponseDto>
                .SuccessResponse(MapToResponseDto(violation));
        }

        public async Task<ApiResponseDto<List<ViolationResponseDto>>> GetViolationsByEmployeeAsync(
            int employeeUserId)
        {
            if (employeeUserId <= 0)
                return ApiResponseDto<List<ViolationResponseDto>>
                    .ErrorResponse(ViolationMessages.InvalidEmployeeUserId);

            var violations =
                await _violationRepository.GetViolationsByEmployeeAsync(employeeUserId);

            return ApiResponseDto<List<ViolationResponseDto>>
                .SuccessResponse(MapViolations(violations));
        }

        public async Task<ApiResponseDto<List<ViolationResponseDto>>> GetViolationsByPolicyAsync(
            int policyId)
        {
            if (policyId <= 0)
                return ApiResponseDto<List<ViolationResponseDto>>
                    .ErrorResponse(ViolationMessages.InvalidPolicyId);

            var violations =
                await _violationRepository.GetViolationsByPolicyAsync(policyId);

            return ApiResponseDto<List<ViolationResponseDto>>
                .SuccessResponse(MapViolations(violations));
        }

        public async Task<ApiResponseDto<ViolationResponseDto>> ResolveViolationAsync(
            int violationId, ResolveViolationRequestDto request)
        {
            if (violationId <= 0)
                return ApiResponseDto<ViolationResponseDto>
                    .ErrorResponse(ViolationMessages.InvalidViolationId);

            var resolved =
                await _violationRepository.ResolveViolationAsync(
                    violationId, request.ResolutionNotes);

            if (!resolved)
                return ApiResponseDto<ViolationResponseDto>
                    .ErrorResponse(ViolationMessages.ViolationNotFound);

            _logger.LogInformation(
                ViolationMessages.LogViolationResolved,
                violationId,
                request.ResolutionNotes);

            var violation =
                await _violationRepository.GetViolationByIdAsync(violationId);

            return ApiResponseDto<ViolationResponseDto>.SuccessResponse(
                MapToResponseDto(violation!),
                ViolationMessages.ViolationResolvedSuccess);
        }

        public async Task<ApiResponseDto<ViolationStatsDto>> GetViolationStatsAsync()
        {
            var bySeverity =
                await _violationRepository.GetViolationCountBySeverityAsync();

            var byStatus =
                await _violationRepository.GetViolationCountByStatusAsync();

            return ApiResponseDto<ViolationStatsDto>.SuccessResponse(
                new ViolationStatsDto
                {
                    BySeverity = bySeverity,
                    ByStatus = byStatus
                });
        }

        private List<ViolationResponseDto> MapViolations(
            IEnumerable<Policyviolation> violations)
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
