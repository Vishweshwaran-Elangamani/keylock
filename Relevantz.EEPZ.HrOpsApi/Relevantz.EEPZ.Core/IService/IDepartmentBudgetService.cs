using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IDepartmentBudgetService
    {
        Task<ApiResponseDto<List<object>>> GetAllDepartmentBudgetsAsync();
        Task<ApiResponseDto<object>> GetDepartmentBudgetAsync(int departmentId);
        Task<ApiResponseDto<List<object>>> GetDepartmentBudgetsByYearAsync(int fiscalYear);
        Task<ApiResponseDto<object>> CreateDepartmentBudgetAsync(CreateDepartmentBudgetDto request);
        Task<ApiResponseDto<object>> UpdateDepartmentBudgetAsync(UpdateDepartmentBudgetDto request);
        Task<ApiResponseDto<object>> DeleteDepartmentBudgetAsync(int budgetId);
        Task<ApiResponseDto<object>> UpdateUtilizedAmountAsync(UpdateUtilizedAmountDto request);
        Task<ApiResponseDto<object>> UpdateUtilizationAsync(UpdateUtilizationDto request);
        Task<ApiResponseDto<List<object>>> GetAllocationsByBudgetAsync(int budgetId);
    }
}
