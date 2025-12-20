using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IMomService
    {
        Task<MomResponseDto> CreateMomAsync(CreateMomDto createMomDto, int submittedByEmployeeId, string role);

        Task<MomResponseDto?> GetMomByIdAsync(int momId);

        Task<List<MomResponseDto>> GetMomsSubmittedByEmployeeAsync(int employeeId);

        Task<MomResponseDto> UpdateMomAsync(UpdateMomDto updateMomDto, int employeeId, string role);

        Task<bool> DeleteMomAsync(int momId, int employeeId, string role);

        Task<PaginatedMomResponseDto> GetAllMomsForHRAsync(
            int hrEmployeeId,
            string role,
            string? searchTerm = null,
            string? meetingType = null,
            int? departmentId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int pageNumber = 1,
            int pageSize = 20);

        Task<List<MomSharingResponseDto>> ShareMomAsync(ShareMomDto shareMomDto, int sharedByEmployeeId);

        Task<List<MomSharingResponseDto>> GetMomsSharedByEmployeeAsync(int employeeId);

        Task<List<MomResponseDto>> GetMomsSharedWithEmployeeAsync(int employeeId);

        Task<bool> UpdateActionItemStatusAsync(int actionItemId, string status, int employeeId);

        Task<List<ActionItemResponseDto>> GetMyActionItemsAsync(int employeeId);

        Task<List<ActionItemResponseDto>> GetActionItemsAssignedByMeAsync(int employeeId);

        Task<List<ActionItemResponseDto>> GetOverdueActionItemsAsync(int employeeId);
    }
}
