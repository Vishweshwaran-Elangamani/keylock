using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IBulkOperationService
    {
        Task<ApiResponseDto<BulkOperationResponseDto>> BulkCreateUsersAsync(List<CreateUserRequestDto> users, int performedByUserId);
        Task<ApiResponseDto<BulkOperationResponseDto>> BulkInactivateUsersAsync(BulkUserInactivateRequestDto request, int performedByUserId);
        Task<ApiResponseDto<BulkOperationResponseDto>> BulkCreateUsersFromExcelAsync(Stream fileStream, int performedByUserId);
        Task<byte[]> GenerateExcelTemplateAsync();
    }
}
