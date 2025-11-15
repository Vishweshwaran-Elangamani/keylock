using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IPeriodAllocationService
    {
        Task<ApiResponseDto<PeriodAllocationResponseDto>> CreatePeriodAllocationAsync(CreatePeriodAllocationDto request);
        Task<ApiResponseDto<PeriodAllocationResponseDto>> UpdatePeriodAllocationAsync(UpdatePeriodAllocationDto request);
        Task<ApiResponseDto<bool>> DeletePeriodAllocationAsync(int periodAllocationId);
        Task<ApiResponseDto<PeriodAllocationResponseDto>> GetPeriodAllocationByIdAsync(int periodAllocationId);
        Task<ApiResponseDto<List<PeriodAllocationResponseDto>>> GetAllPeriodAllocationsAsync();
        Task<ApiResponseDto<List<PeriodAllocationResponseDto>>> GetPeriodAllocationsByBudgetAsync(int budgetId);
    }
}
