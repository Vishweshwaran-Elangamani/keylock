using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IMomRepository
    {
        Task<Mom> CreateMomAsync(Mom mom);
        Task<Mom?> GetMomByIdAsync(int momId);
        Task<List<Mom>> GetMomsByEmployeeIdAsync(int employeeId);
        Task<List<Mom>> GetMomsSubmittedByEmployeeAsync(int employeeId);
        Task<List<Mom>> GetMomsSharedWithEmployeeAsync(int employeeId);
        Task<Mom> UpdateMomAsync(Mom mom);
        Task<bool> DeleteMomAsync(int momId);
        Task<int> GetAllMomsCountAsync(
            string? searchTerm = null,
            string? meetingType = null,
            int? departmentId = null,
            DateTime? startDate = null,
            DateTime? endDate = null);

        Task<List<Mom>> GetAllMomsAsync(
            string? searchTerm = null,
            string? meetingType = null,
            int? departmentId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int pageNumber = 1,
            int pageSize = 20);

        Task<List<Momdiscussionpoint>> AddDiscussionPointsAsync(List<Momdiscussionpoint> points);
        Task<bool> DeleteDiscussionPointsByMomIdAsync(int momId);
        Task<List<Momactionitem>> AddActionItemsAsync(List<Momactionitem> actionItems);
        Task<bool> DeleteActionItemsByMomIdAsync(int momId);
        Task<Momactionitem?> GetActionItemByIdAsync(int actionItemId);
        Task<Momactionitem?> UpdateActionItemStatusAsync(int actionItemId, string status);
        Task<List<Momactionitem>> GetActionItemsByEmployeeIdAsync(int employeeId);
        Task<List<Momactionitem>> GetActionItemsAssignedByEmployeeAsync(int employeeId);
        Task<List<Momsharing>> ShareMomAsync(List<Momsharing> sharings);
        Task<List<Momsharing>> GetMomSharingsByEmployeeIdAsync(int employeeId);
    }
}
