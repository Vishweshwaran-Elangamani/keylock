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
            if (request.EmployeeUserId <= 0)
                return ApiResponseDto<ViolationResponseDto>
                    .ErrorResponse(ViolationMessages.InvalidEmployeeUserId);

            if (request.PolicyId <= 0)
                return ApiResponseDto<ViolationResponseDto>
                    .ErrorResponse(ViolationMessages.InvalidPolicyId);

            if (string.IsNullOrWhiteSpace(request.ViolationType))
                return ApiResponseDto<ViolationResponseDto>
                    .ErrorResponse(ViolationMessages.InvalidViolationType);

            // Map using Mapster
            var violation = _mapper.Map<Policyviolation>(request);
            violation.ReportedByUserId = reportedByUserId;
            violation.Status = "Reported";
            violation.ReportedDate = DateOnly.FromDateTime(DateTime.Now);

            var createdViolation = await _violationRepository.CreateViolationAsync(violation);

            var fullViolation = await _violationRepository.GetViolationByIdAsync(
                createdViolation.ViolationId);

            _logger.LogInformation(
                ViolationMessages.LogViolationReported,
                createdViolation.ViolationId,
                reportedByUserId,
                request.EmployeeUserId);

            // Map to response using Mapster
            var response = _mapper.Map<ViolationResponseDto>(fullViolation!);

            return ApiResponseDto<ViolationResponseDto>.SuccessResponse(
                response,
                ViolationMessages.ViolationReportedSuccess);
        }

        public async Task<ApiResponseDto<List<ViolationResponseDto>>> GetAllViolationsAsync()
        {
            var violations = await _violationRepository.GetAllViolationsAsync();
            
            // Map list using Mapster
            var response = _mapper.Map<List<ViolationResponseDto>>(violations);

            return ApiResponseDto<List<ViolationResponseDto>>
                .SuccessResponse(response);
        }

        public async Task<ApiResponseDto<ViolationResponseDto>> GetViolationByIdAsync(int violationId)
        {
            if (violationId <= 0)
                return ApiResponseDto<ViolationResponseDto>
                    .ErrorResponse(ViolationMessages.InvalidViolationId);

            var violation = await _violationRepository.GetViolationByIdAsync(violationId);

            if (violation == null)
                return ApiResponseDto<ViolationResponseDto>
                    .ErrorResponse(ViolationMessages.ViolationNotFound);

            // Map using Mapster
            var response = _mapper.Map<ViolationResponseDto>(violation);

            return ApiResponseDto<ViolationResponseDto>
                .SuccessResponse(response);
        }

        public async Task<ApiResponseDto<List<ViolationResponseDto>>> GetViolationsByEmployeeAsync(
            int employeeUserId)
        {
            if (employeeUserId <= 0)
                return ApiResponseDto<List<ViolationResponseDto>>
                    .ErrorResponse(ViolationMessages.InvalidEmployeeUserId);

            var violations = await _violationRepository.GetViolationsByEmployeeAsync(employeeUserId);
            
            // Map using Mapster
            var response = _mapper.Map<List<ViolationResponseDto>>(violations);

            return ApiResponseDto<List<ViolationResponseDto>>
                .SuccessResponse(response);
        }

        public async Task<ApiResponseDto<List<ViolationResponseDto>>> GetViolationsByPolicyAsync(
            int policyId)
        {
            if (policyId <= 0)
                return ApiResponseDto<List<ViolationResponseDto>>
                    .ErrorResponse(ViolationMessages.InvalidPolicyId);

            var violations = await _violationRepository.GetViolationsByPolicyAsync(policyId);
            
            // Map using Mapster
            var response = _mapper.Map<List<ViolationResponseDto>>(violations);

            return ApiResponseDto<List<ViolationResponseDto>>
                .SuccessResponse(response);
        }

        public async Task<ApiResponseDto<ViolationResponseDto>> ResolveViolationAsync(
            int violationId,
            ResolveViolationRequestDto request)
        {
            if (violationId <= 0)
                return ApiResponseDto<ViolationResponseDto>
                    .ErrorResponse(ViolationMessages.InvalidViolationId);

            var resolved = await _violationRepository.ResolveViolationAsync(
                violationId,
                request.ResolutionNotes);

            if (!resolved)
                return ApiResponseDto<ViolationResponseDto>
                    .ErrorResponse(ViolationMessages.ViolationNotFound);

            _logger.LogInformation(
                ViolationMessages.LogViolationResolved,
                violationId,
                request.ResolutionNotes);

            var violation = await _violationRepository.GetViolationByIdAsync(violationId);

            // Map using Mapster
            var response = _mapper.Map<ViolationResponseDto>(violation!);

            return ApiResponseDto<ViolationResponseDto>.SuccessResponse(
                response,
                ViolationMessages.ViolationResolvedSuccess);
        }

        public async Task<ApiResponseDto<ViolationStatsDto>> GetViolationStatsAsync()
{
    var bySeverity = await _violationRepository.GetViolationCountBySeverityAsync();
    var byStatus = await _violationRepository.GetViolationCountByStatusAsync();
    // Remove the following line since the method doesn't exist:
    // var byType = await _violationRepository.GetViolationCountByTypeAsync();

    return ApiResponseDto<ViolationStatsDto>.SuccessResponse(
        new ViolationStatsDto
        {
            BySeverity = bySeverity,
            ByStatus = byStatus
            // Remove: ByType = byType
        });
}

    }
}
