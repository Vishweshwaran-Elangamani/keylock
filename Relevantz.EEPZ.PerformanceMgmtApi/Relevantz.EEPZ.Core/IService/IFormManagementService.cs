using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IFormManagementService
    {
        Task<ApiResponse<FormResponseDto>> CreateFormAsync(CreateFormRequestDto request);
        Task<ApiResponse<FormResponseDto>> GetFormByIdAsync(int formId);
        Task<ApiResponse<List<FormResponseDto>>> GetAllFormsAsync();
        Task<ApiResponse<bool>> DeleteFormAsync(int formId);
        Task<ApiResponse<FormResponseDto>> UpdateFormAsync(int formId, CreateFormRequestDto request);
    }
}
