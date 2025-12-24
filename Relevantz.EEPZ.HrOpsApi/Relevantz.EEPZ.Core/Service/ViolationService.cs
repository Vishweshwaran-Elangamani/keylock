using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;

namespace Relevantz.EEPZ.Core.Service
{
    public class ViolationService : IViolationService
    {
        private readonly IViolationRepository _violationRepository;

        public ViolationService(IViolationRepository violationRepository)
        {
            _violationRepository = violationRepository;
        }

        public async Task<ApiResponseDto<ViolationResponseDto>> ReportViolationAsync(ReportViolationRequestDto request, int reportedByUserId)
        {
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
            var response = MapToResponseDto(fullViolation!);

            return ApiResponseDto<ViolationResponseDto>.SuccessResponse(response, "Violation reported successfully");
        }

        public async Task<ApiResponseDto<List<ViolationResponseDto>>> GetAllViolationsAsync()
        {
            var violations = await _violationRepository.GetAllViolationsAsync();
            var response = violations.Select(MapToResponseDto).ToList();
            return ApiResponseDto<List<ViolationResponseDto>>.SuccessResponse(response);
        }

        public async Task<ApiResponseDto<ViolationResponseDto>> GetViolationByIdAsync(int violationId)
        {
            var violation = await _violationRepository.GetViolationByIdAsync(violationId);
            if (violation == null)
            {
                return ApiResponseDto<ViolationResponseDto>.ErrorResponse("Violation not found");
            }

            var response = MapToResponseDto(violation);
            return ApiResponseDto<ViolationResponseDto>.SuccessResponse(response);
        }

        public async Task<ApiResponseDto<List<ViolationResponseDto>>> GetViolationsByEmployeeAsync(int EmployeeUserId)
        {
            var violations = await _violationRepository.GetViolationsByEmployeeAsync(EmployeeUserId);
            var response = violations.Select(MapToResponseDto).ToList();
            return ApiResponseDto<List<ViolationResponseDto>>.SuccessResponse(response);
        }

        public async Task<ApiResponseDto<List<ViolationResponseDto>>> GetViolationsByPolicyAsync(int policyId)
        {
            var violations = await _violationRepository.GetViolationsByPolicyAsync(policyId);
            var response = violations.Select(MapToResponseDto).ToList();
            return ApiResponseDto<List<ViolationResponseDto>>.SuccessResponse(response);
        }

        public async Task<ApiResponseDto<ViolationResponseDto>> ResolveViolationAsync(int violationId, ResolveViolationRequestDto request)
        {
            var result = await _violationRepository.ResolveViolationAsync(violationId, request.ResolutionNotes);
            if (!result)
            {
                return ApiResponseDto<ViolationResponseDto>.ErrorResponse("Violation not found");
            }

            var violation = await _violationRepository.GetViolationByIdAsync(violationId);
            var response = MapToResponseDto(violation!);
            return ApiResponseDto<ViolationResponseDto>.SuccessResponse(response, "Violation resolved successfully");
        }

        public async Task<ApiResponseDto<ViolationStatsDto>> GetViolationStatsAsync()
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
