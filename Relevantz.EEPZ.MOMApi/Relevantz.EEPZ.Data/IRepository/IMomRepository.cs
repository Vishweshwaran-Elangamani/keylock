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

        Task<Meeting> CreateMeetingAsync(Meeting meeting);
        Task<List<Meetingparticipant>> AddMeetingParticipantsAsync(List<Meetingparticipant> participants);
        Task<List<Meeting>> GetMeetingsByManagerIdAsync(int managerId);
        Task<Meeting?> GetMeetingByIdAsync(int meetingId);
        Task<List<Meeting>> GetMeetingsByParticipantIdAsync(int participantId);

        Task<List<Meeting>> GetOneOnOneMeetingsByManagerAsync(
            int managerId,
            int? employeeId = null,
            DateTime? startDate = null,
            DateTime? endDate = null);

        Task<Employee?> GetEmployeeByIdAsync(int employeeId);
        Task<List<Employee>> GetTeamMembersByManagerIdAsync(int managerId);
        
        /// <summary>
        /// Get meeting participant record for RSVP update
        /// </summary>
        Task<Meetingparticipant?> GetMeetingParticipantAsync(int meetingId, int employeeId);
        
        /// <summary>
        /// Update RSVP status for a meeting participant
        /// </summary>
        Task<Meetingparticipant> UpdateRsvpStatusAsync(int participantId, string rsvpStatus, string? rsvpComments);
        
        /// <summary>
        /// Get all meeting invitations for an employee
        /// </summary>
        Task<List<Meetingparticipant>> GetMeetingInvitationsAsync(int employeeId);
        
        /// <summary>
        /// Get RSVP summary for a specific meeting (Manager view)
        /// </summary>
        Task<List<Meetingparticipant>> GetMeetingRsvpSummaryAsync(int meetingId);
        
        /// <summary>
        /// Get pending RSVP count for an employee
        /// </summary>
        Task<int> GetPendingRsvpCountAsync(int employeeId);
    
    }
}
