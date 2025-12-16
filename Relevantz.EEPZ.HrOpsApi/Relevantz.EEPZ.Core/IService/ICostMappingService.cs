using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.DTOs.Request;
 
namespace Relevantz.EEPZ.Core.IService
{
    public interface ICostMappingService
    {
        Task<ApiResponseDto<HeadcountResponseDto>> GetDepartmentHeadcountAsync(int departmentId);
        Task<ApiResponseDto<CostMappingResponseDto>> CreateCostMappingAsync(CreateCostMappingRequestDto request);
        Task<ApiResponseDto<CostMappingResponseDto>> UpdateCostMappingAsync(UpdateCostMappingRequestDto request);
        Task<ApiResponseDto<CostMappingResponseDto>> GetCostMappingByIdAsync(int budgetId);
        Task<ApiResponseDto<List<CostMappingResponseDto>>> GetAllCostMappingsAsync();
        Task<ApiResponseDto<List<CostMappingResponseDto>>> GetCostMappingsByDepartmentAsync(int departmentId);
        Task<ApiResponseDto<List<CostMappingResponseDto>>> GetCostMappingsByFiscalYearAsync(int fiscalYear);
        Task<ApiResponseDto<bool>> DeleteCostMappingAsync(int budgetId);
    }
}
 
 