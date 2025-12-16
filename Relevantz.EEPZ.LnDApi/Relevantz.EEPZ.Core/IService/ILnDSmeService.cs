using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface ILnDSmeService
    {
        Task<ApiResponse<bool>> CheckIfEmployeeIsSme(int employeeId);

        Task<ApiResponse<int>> ApplyToBecomeSme(int employeeId, BecomeSmeRequest request);

        Task<ApiResponse<PaginatedResponse<SmeDto>>> GetAvailableSmes(
            int skillId,
            string searchTerm,
            int pageNumber,
            int pageSize
        );

        Task<ApiResponse<PaginatedResponse<SmeDto>>> GetAllActiveSmes(
            string? searchTerm,
            int pageNumber,
            int pageSize
        );

        Task<ApiResponse<byte[]>> ExportAllActiveSmesToExcel(string? searchTerm);
    }
}
