using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IBulkOperationService
    {
        Task<BulkOperationResponseDto> BulkCreateUsersAsync(List<CreateUserRequestDto> users, int performedByUserId);
        Task<BulkOperationResponseDto> BulkInactivateUsersAsync(BulkUserInactivateRequestDto request, int performedByUserId);
        Task<BulkOperationResponseDto> BulkCreateUsersFromExcelAsync(Stream fileStream, int performedByUserId);
        Task<byte[]> GenerateExcelTemplateAsync();
    }
}
