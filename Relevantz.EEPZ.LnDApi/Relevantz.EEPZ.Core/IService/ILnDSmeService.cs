using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface ILnDSmeService
    {
        Task<ApiResponse<bool>> CheckIfEmployeeIsSme(int employeeId);
        Task<ApiResponse<int>> ApplyToBecomeSme(int employeeId, BecomeSmeRequestModel request);
        Task<ApiResponse<PaginatedResponse<SmeResponseModel>>> GetAvailableSmes(
            AvailableSmesRequestModel request
        );
        Task<ApiResponse<PaginatedResponse<SmeResponseModel>>> GetAllActiveSmes(
            ActiveSmesRequestModel request
        );
        Task<ApiResponse<byte[]>> GetAllActiveSmesForExport(ExportActiveSmesRequestModel request);
    }
}
