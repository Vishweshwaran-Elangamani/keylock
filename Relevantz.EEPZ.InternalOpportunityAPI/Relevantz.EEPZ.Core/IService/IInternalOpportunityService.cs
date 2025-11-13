using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.ViewModels.InternalOpportunity.Request;
using Relevantz.EEPZ.Common.ViewModels.InternalOpportunity.Response;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IInternalOpportunityService
    {
        // ✅ NEW: Simple methods without pagination
        Task<List<InternalOpportunityResponseDto>> GetAllOpportunitiesSimpleAsync();
        Task<List<InternalOpportunityResponseDto>> GetActiveOpportunitiesSimpleAsync();

        // Existing methods
        Task<InternalOpportunityResponseDto> CreateOpportunityAsync(CreateInternalOpportunityRequestDto request, int createdByUserId);
        Task<InternalOpportunityResponseDto> UpdateOpportunityAsync(int id, UpdateInternalOpportunityRequestDto request);
        Task<InternalOpportunityDetailResponseDto> GetOpportunityByIdAsync(int id);
        Task<InternalOpportunityListResponseDto> GetAllOpportunitiesAsync(InternalOpportunityFilterRequestDto filter);
        Task<InternalOpportunityListResponseDto> GetActiveOpportunitiesAsync(InternalOpportunityFilterRequestDto filter);
        Task<InternalOpportunityStatisticsResponseDto> GetStatisticsAsync();
        Task<bool> DeleteOpportunityAsync(int id);
    }
}
