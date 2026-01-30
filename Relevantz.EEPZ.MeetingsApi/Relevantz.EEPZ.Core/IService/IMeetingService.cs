using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Enums;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IMeetingService
    {
        Task<MeetingResponseDto> ScheduleMeetingAsync(
            ScheduleMeetingDto scheduleMeetingDto,
            int scheduledByEmployeeId,
            string role,
            CancellationToken cancellationToken = default);


        Task<PaginatedMeetingResponseDto> GetMeetingsByManagerIdAsync(
            int managerId,
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken = default);

        Task<MeetingResponseDto?> GetMeetingByIdAsync(
            int meetingId,
            CancellationToken cancellationToken = default);

        Task<OneOnOneReportDto> GetOneOnOneReportsAsync(
            int managerId,
            string role,
            int? employeeId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            CancellationToken cancellationToken = default);

        Task<OneOnOneSummaryDto> GetOneOnOneSummaryAsync( int managerId, UserRole role, CancellationToken ct = default);
        Task<MeetingInvitationDto> SubmitRsvpAsync(
            RsvpResponseDto rsvpDto,
            int employeeId,
            CancellationToken cancellationToken = default);

        Task<List<MeetingInvitationDto>> GetMyMeetingInvitationsAsync(
            int employeeId,
            CancellationToken cancellationToken = default);

        Task<MeetingRsvpSummaryDto> GetMeetingRsvpSummaryAsync(
            int meetingId,
            int managerId,
            string role,
            CancellationToken cancellationToken = default);

        Task<int> GetPendingRsvpCountAsync(
            int employeeId,
            CancellationToken cancellationToken = default);


        
    }

    public interface IDateTimeProvider { DateTime Now { get; } DateOnly Today { get; } }
}
