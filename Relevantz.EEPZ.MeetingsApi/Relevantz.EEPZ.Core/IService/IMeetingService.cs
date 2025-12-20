using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IMeetingService
    {
        Task<MeetingResponseDto> ScheduleMeetingAsync(
            ScheduleMeetingDto scheduleMeetingDto,
            int scheduledByEmployeeId,
            string role);

        Task<List<MeetingResponseDto>> GetMeetingsByManagerIdAsync(int managerId);

        Task<MeetingResponseDto?> GetMeetingByIdAsync(int meetingId);

        Task<OneOnOneReportDto> GetOneOnOneReportsAsync(
            int managerId,
            string role,
            int? employeeId = null,
            DateTime? startDate = null,
            DateTime? endDate = null);

        Task<OneOnOneSummaryDto> GetOneOnOneSummaryAsync(int managerId, string role);

        Task<MeetingInvitationDto> SubmitRsvpAsync(RsvpResponseDto rsvpDto, int employeeId);

        Task<List<MeetingInvitationDto>> GetMyMeetingInvitationsAsync(int employeeId);

        Task<MeetingRsvpSummaryDto> GetMeetingRsvpSummaryAsync(int meetingId, int managerId, string role);

        Task<int> GetPendingRsvpCountAsync(int employeeId);
    }
}
