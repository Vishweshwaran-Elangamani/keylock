using Relevantz.EEPZ.Common.DTOs.Response;



namespace Relevantz.EEPZ.Core.IService
{
    public interface ISmeService
    {
        Task<ApiResponseDto<List<SmeResponseDto>>> GetActiveSmesAsync();
    }
}
