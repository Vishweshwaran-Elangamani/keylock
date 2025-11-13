using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IViolationService
    {
        Task<ApiResponseDto<ViolationResponseDto>> ReportViolationAsync(ReportViolationRequestDto request, int reportedByUserId);
        Task<ApiResponseDto<List<ViolationResponseDto>>> GetAllViolationsAsync();
        Task<ApiResponseDto<ViolationResponseDto>> GetViolationByIdAsync(int violationId);
        Task<ApiResponseDto<List<ViolationResponseDto>>> GetViolationsByEmployeeAsync(int EmployeeUserId);
        Task<ApiResponseDto<List<ViolationResponseDto>>> GetViolationsByPolicyAsync(int policyId);
        Task<ApiResponseDto<ViolationResponseDto>> ResolveViolationAsync(int violationId, ResolveViolationRequestDto request);
        Task<ApiResponseDto<ViolationStatsDto>> GetViolationStatsAsync();
    }
}
