using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IMeetingRepository
    {
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

        Task<Meetingparticipant?> GetMeetingParticipantAsync(int meetingId, int employeeId);
        Task<Meetingparticipant> UpdateRsvpStatusAsync(int participantId, string rsvpStatus, string? rsvpComments);
        Task<List<Meetingparticipant>> GetMeetingInvitationsAsync(int employeeId);
        Task<List<Meetingparticipant>> GetMeetingRsvpSummaryAsync(int meetingId);
        Task<int> GetPendingRsvpCountAsync(int employeeId);
    }
}
