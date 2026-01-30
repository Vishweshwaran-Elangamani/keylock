using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Enums;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Mapster;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class DateTimeProvider : IDateTimeProvider
    {
        public DateTime Now => DateTime.UtcNow;
        public DateOnly Today => DateOnly.FromDateTime(DateTime.UtcNow);
    }

    public class MeetingService : IMeetingService
    {
        private readonly IMeetingRepository _meetingRepository;
        private readonly ILogger<MeetingService> _logger;
        private readonly IDateTimeProvider _dateTimeProvider;

        public MeetingService(IMeetingRepository meetingRepository,
                              ILogger<MeetingService> logger,
                              IDateTimeProvider dateTimeProvider)
        {
            _meetingRepository = meetingRepository ?? throw new ArgumentNullException(nameof(meetingRepository));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _dateTimeProvider = dateTimeProvider ?? throw new ArgumentNullException(nameof(dateTimeProvider));
        }

        public async Task<MeetingResponseDto> ScheduleMeetingAsync(
            ScheduleMeetingDto dto,
            int managerId,
            string role,
            CancellationToken ct = default)
        {
            if (!string.Equals(role, AppConstants.Roles.Manager, StringComparison.OrdinalIgnoreCase))
                throw new UnauthorizedAccessException(AppConstants.ExceptionMessages.UnauthorizedAccess);

            var manager = await _meetingRepository.GetEmployeeByIdAsync(managerId, ct)
                          ?? throw new InvalidOperationException(AppConstants.ExceptionMessages.InvalidOperation);

            if (dto.ParticipantEmployeeIds == null || !dto.ParticipantEmployeeIds.Any())
                throw new ArgumentException(AppConstants.ExceptionMessages.ValidationFailed);


            var distinctIds = dto.ParticipantEmployeeIds.Distinct().ToList();
            var employees = await _meetingRepository.GetEmployeesByIdsAsync(distinctIds, ct);
            if (employees.Count != distinctIds.Count)
                throw new ArgumentException(AppConstants.ExceptionMessages.InvalidArgument);

            var meeting = dto.Adapt<Meeting>();
            meeting.ScheduledByEmployeeId = managerId;
            meeting.Status = AppConstants.MeetingStatusValues.Scheduled;
            meeting.CreatedAt = _dateTimeProvider.Now;

            var created = await _meetingRepository.CreateMeetingAsync(meeting, ct);

            var participants = distinctIds.Select(id => new Meetingparticipant
            {
                MeetingId = created.MeetingId,
                EmployeeId = id,
                Rsvpstatus = AppConstants.RsvpStatusValues.Pending,
                CreatedAt = _dateTimeProvider.Now,
                InvitedAt = _dateTimeProvider.Now
            }).ToList();

            await _meetingRepository.AddMeetingParticipantsAsync(participants, ct);

            return await GetMeetingByIdAsync(created.MeetingId, ct)
                   ?? throw new InvalidOperationException(AppConstants.ExceptionMessages.InvalidOperation);
        }

        public async Task<PaginatedMeetingResponseDto> GetMeetingsByManagerIdAsync(int managerId, int page, int size, CancellationToken ct = default)
        {
            var total = await _meetingRepository.GetMeetingsByManagerCountAsync(managerId, ct);
            var meetings = await _meetingRepository.GetMeetingsByManagerIdAsync(managerId, page, size, ct) ?? new List<Meeting>();

            return new PaginatedMeetingResponseDto
            {
                Meetings = meetings.Adapt<List<MeetingResponseDto>>(),
                TotalCount = total,
                PageNumber = page,
                PageSize = size,
                TotalPages = (int)Math.Ceiling((double)total / size),
                HasNextPage = page < (int)Math.Ceiling((double)total / size),
                HasPreviousPage = page > 1
            };
        }

        public async Task<MeetingResponseDto> GetMeetingByIdAsync(int meetingId, CancellationToken ct = default)
        {
            var meeting = await _meetingRepository.GetMeetingByIdAsync(meetingId, ct)
                          ?? throw new InvalidOperationException(AppConstants.ExceptionMessages.MeetingNotFound);

            return meeting.Adapt<MeetingResponseDto>();
        }

        public async Task<OneOnOneReportDto> GetOneOnOneReportsAsync(int managerId, string role, int? empId, DateTime? start, DateTime? end, CancellationToken ct = default)
        {
            if (!string.Equals(role, AppConstants.Roles.Manager, StringComparison.OrdinalIgnoreCase))
                throw new UnauthorizedAccessException(AppConstants.ExceptionMessages.UnauthorizedAccess);

            var meetings = await _meetingRepository.GetOneOnOneMeetingsByManagerAsync(managerId, empId, start, end, ct) ?? new List<Meeting>();

            return new OneOnOneReportDto
            {
                TotalMeetings = meetings.Count,
                CompletedMeetings = meetings.Count(m => m.Status == AppConstants.MeetingStatusValues.Completed),
                ScheduledMeetings = meetings.Count(m => m.Status == AppConstants.MeetingStatusValues.Scheduled),
                CancelledMeetings = meetings.Count(m => m.Status == AppConstants.MeetingStatusValues.Cancelled)
            };
        }

        public async Task<OneOnOneSummaryDto> GetOneOnOneSummaryAsync(
     int managerId,
     UserRole role,
     CancellationToken ct = default)
        {
            if (role != UserRole.Manager)
                throw new UnauthorizedAccessException(AppConstants.ExceptionMessages.UnauthorizedAccess);

            var meetings = await _meetingRepository
                .GetOneOnOneMeetingsByManagerAsync(managerId, null, null, null, ct)
                ?? new List<Meeting>();

            var team = await _meetingRepository
                .GetTeamMembersByManagerIdAsync(managerId, 1, 1000, ct)
                ?? new List<Employee>();

            return new OneOnOneSummaryDto
            {
                TotalTeamMembers = team.Count,
                TotalOneOnOnes = meetings.Count,
                ThisMonthOneOnOnes = meetings.Count(m => m.MeetingDate.Month == _dateTimeProvider.Now.Month),
                LastMonthOneOnOnes = meetings.Count(m => m.MeetingDate.Month == _dateTimeProvider.Now.AddMonths(-1).Month)
            };
        }


        public async Task<MeetingInvitationDto> SubmitRsvpAsync(RsvpResponseDto dto, int empId, CancellationToken ct = default)
        {
            var participant = await _meetingRepository.GetMeetingParticipantAsync(dto.MeetingId, empId, ct)
                             ?? throw new InvalidOperationException(AppConstants.ExceptionMessages.InvalidOperation);

            if (!Enum.TryParse<RsvpStatus>(dto.RsvpStatus, true, out var parsed))
                throw new ArgumentException(AppConstants.ExceptionMessages.InvalidRsvpStatus);

            var updated = await _meetingRepository.UpdateRsvpStatusAsync(participant.ParticipantId, parsed, dto.RsvpComments, ct);

            return updated.Adapt<MeetingInvitationDto>();
        }

        public async Task<List<MeetingInvitationDto>> GetMyMeetingInvitationsAsync(int empId, CancellationToken ct = default)
        {
            var invites = await _meetingRepository.GetMeetingInvitationsAsync(empId, ct) ?? new List<Meetingparticipant>();
            return invites.Adapt<List<MeetingInvitationDto>>();
        }

        public async Task<MeetingRsvpSummaryDto> GetMeetingRsvpSummaryAsync(int meetingId, int managerId, string role, CancellationToken ct = default)
        {
            if (!string.Equals(role, AppConstants.Roles.Manager, StringComparison.OrdinalIgnoreCase))
                throw new UnauthorizedAccessException(AppConstants.ExceptionMessages.UnauthorizedAccess);

            var participants = await _meetingRepository.GetMeetingRsvpSummaryAsync(meetingId, ct) ?? new List<Meetingparticipant>();

            return new MeetingRsvpSummaryDto
            {
                MeetingId = meetingId,
                TotalInvitations = participants.Count,
                AcceptedCount = participants.Count(p => p.Rsvpstatus == AppConstants.RsvpStatusValues.Accepted),
                DeclinedCount = participants.Count(p => p.Rsvpstatus == AppConstants.RsvpStatusValues.Declined),
                TentativeCount = participants.Count(p => p.Rsvpstatus == AppConstants.RsvpStatusValues.Tentative),
                PendingCount = participants.Count(p => p.Rsvpstatus == AppConstants.RsvpStatusValues.Pending)
            };
        }

        public Task<int> GetPendingRsvpCountAsync(int empId, CancellationToken ct = default)
            => _meetingRepository.GetPendingRsvpCountAsync(empId, ct);
    }
}
