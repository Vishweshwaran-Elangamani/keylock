using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Data.IRepository
{
    /// <summary>
    /// Repository interface for SME (Subject Matter Expert) operations.
    /// </summary>
    public interface ISmeRepository
    {
        /// <summary>
        /// Retrieves all active SMEs.
        /// </summary>
        Task<List<SmeResponseDto>> GetActiveSmesAsync();
    }
}
