using Relevantz.EEPZ.Common.DTOs.Response;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.IService
{
    public interface ISlaEscalationService
    {
        Task<ApiResponseDto<List<SlaEscalationResponseDto>>> GetAllSlaEscalationsAsync();
        Task<ApiResponseDto<List<SlaEscalationResponseDto>>> GetSlaEscalationsByEmployeeAsync(int employeeUserId);
        Task<ApiResponseDto<SlaEscalationResponseDto>> GetSlaEscalationByIdAsync(int escalationId);
        Task<ApiResponseDto<object>> GetCombinedViolationsAndEscalationsAsync();
        Task<ApiResponseDto<object>> GetSlaEscalationStatsAsync();
    }
}
