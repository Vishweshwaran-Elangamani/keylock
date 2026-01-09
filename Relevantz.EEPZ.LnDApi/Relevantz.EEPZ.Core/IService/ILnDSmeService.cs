using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface ILnDSmeService
    {
        Task<ApiResponse<bool>> CheckIfEmployeeIsSme(int employeeId);
        Task<ApiResponse<int>> ApplyToBecomeSme(int employeeId, BecomeSmeRequestModel request);
        Task<ApiResponse<PaginatedResponse<SmeResponseModel>>> GetAvailableSmes(
            int skillId,
            string searchTerm,
            int pageNumber,
            int pageSize
        );
        Task<ApiResponse<PaginatedResponse<SmeResponseModel>>> GetAllActiveSmes(
            string? searchTerm,
            int pageNumber,
            int pageSize
        );
        Task<ApiResponse<byte[]>> ExportAllActiveSmesToExcel(string? searchTerm);
    }
}
