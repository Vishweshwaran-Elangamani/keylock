using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class MeetingService : IMeetingService
    {
        private readonly IMeetingRepository _meetingRepository;
        private readonly ILogger<MeetingService> _logger;
        private readonly IDateTimeProvider _dateTimeProvider;

        private static readonly Dictionary<string, string> RoleMapping =
            new(StringComparer.OrdinalIgnoreCase)
            {
                { "User", AppConstants.Roles.Employee },
                { "Employee", AppConstants.Roles.Employee },
                { "Staff", AppConstants.Roles.Employee },
                { "Developer", AppConstants.Roles.Employee },
                { "Engineer", AppConstants.Roles.Employee },
                { "Analyst", AppConstants.Roles.Employee },
                { "Designer", AppConstants.Roles.Employee },

                { "Manager", AppConstants.Roles.Manager },
                { "Engineering Manager", AppConstants.Roles.Manager },
                { "Department Manager", AppConstants.Roles.Manager },
                { "Team Lead", AppConstants.Roles.Manager },
                { "Project Manager", AppConstants.Roles.Manager },
                { "Senior Manager", AppConstants.Roles.Manager },
                { "Director", AppConstants.Roles.Manager },
                { "VP", AppConstants.Roles.Manager },

                { "HR", "HR" },
                { "HR Manager", "HR" },
                { "Human Resources", "HR" },
                { "HR Admin", "HR" },
                { "HR Director", "HR" }
            };

        public MeetingService(
            IMeetingRepository meetingRepository,
            ILogger<MeetingService> logger,
            IDateTimeProvider dateTimeProvider)
        {
            _meetingRepository = meetingRepository ?? throw new ArgumentNullException(nameof(meetingRepository));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _dateTimeProvider = dateTimeProvider ?? throw new ArgumentNullException(nameof(dateTimeProvider));
        }

        public async Task<MeetingResponseDto> ScheduleMeetingAsync(
            ScheduleMeetingDto scheduleMeetingDto,
            int scheduledByEmployeeId,
            string role,
            CancellationToken cancellationToken = default)
        {
            var participantCount = scheduleMeetingDto.ParticipantEmployeeIds?.Count ?? 0;

            _logger.LogInformation(
                "ScheduleMeeting started. ScheduledByEmployeeId={ScheduledByEmployeeId} Role={Role} MeetingTitle={MeetingTitle} MeetingType={MeetingType} MeetingDate={MeetingDate} ParticipantCount={ParticipantCount}",
                scheduledByEmployeeId,
                role,
                scheduleMeetingDto.MeetingTitle,
                scheduleMeetingDto.MeetingType,
                scheduleMeetingDto.MeetingDate,
                participantCount);

            var mappedRole = MapRoleToEnum(role);

            _logger.LogDebug(
                "Role mapping completed. InputRole={InputRole} MappedRole={MappedRole} ScheduledByEmployeeId={ScheduledByEmployeeId}",
                role,
                mappedRole,
                scheduledByEmployeeId);

            if (!string.Equals(mappedRole, AppConstants.Roles.Manager, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning(
                    "Unauthorized schedule meeting attempt. ScheduledByEmployeeId={ScheduledByEmployeeId} Role={Role} MappedRole={MappedRole}",
                    scheduledByEmployeeId,
                    role,
                    mappedRole);

                throw new UnauthorizedAccessException(AppConstants.ExceptionMessages.UnauthorizedAccess);
            }

            var employeeExists = await _meetingRepository.GetEmployeeByIdAsync(scheduledByEmployeeId, cancellationToken);
            if (employeeExists == null)
            {
                _logger.LogWarning(
                    "ScheduleMeeting failed. Scheduling employee not found. ScheduledByEmployeeId={ScheduledByEmployeeId}",
                    scheduledByEmployeeId);

                throw new InvalidOperationException(AppConstants.ExceptionMessages.InvalidOperation);
            }

            if (scheduleMeetingDto.ParticipantEmployeeIds == null || !scheduleMeetingDto.ParticipantEmployeeIds.Any())
            {
                _logger.LogWarning(
                    "ScheduleMeeting failed. Participant list missing/empty. ScheduledByEmployeeId={ScheduledByEmployeeId} MeetingTitle={MeetingTitle}",
                    scheduledByEmployeeId,
                    scheduleMeetingDto.MeetingTitle);

                throw new ArgumentException(AppConstants.ExceptionMessages.ValidationFailed);
            }

            var distinctParticipants = scheduleMeetingDto.ParticipantEmployeeIds.Distinct().ToList();
            _logger.LogDebug(
                "Participant validation started. ScheduledByEmployeeId={ScheduledByEmployeeId} DistinctParticipantCount={DistinctParticipantCount}",
                scheduledByEmployeeId,
                distinctParticipants.Count);

            var missingParticipants = new List<int>();

            foreach (var empId in distinctParticipants)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var participantExists = await _meetingRepository.GetEmployeeByIdAsync(empId, cancellationToken);
                if (participantExists == null)
                {
                    missingParticipants.Add(empId);
                }
            }

            if (missingParticipants.Any())
            {
                _logger.LogWarning(
                    "ScheduleMeeting failed. Invalid participants found. ScheduledByEmployeeId={ScheduledByEmployeeId} MissingParticipants={MissingParticipants}",
                    scheduledByEmployeeId,
                    string.Join(",", missingParticipants));

                throw new ArgumentException(AppConstants.ExceptionMessages.InvalidArgument);
            }

            var meeting = new Meeting
            {
                MeetingTitle = scheduleMeetingDto.MeetingTitle,
                MeetingType = scheduleMeetingDto.MeetingType,
                MeetingDate = scheduleMeetingDto.MeetingDate,
                MeetingLink = scheduleMeetingDto.MeetingLink,
                Agenda = scheduleMeetingDto.Agenda,
                ScheduledByEmployeeId = scheduledByEmployeeId,
                Status = AppConstants.MeetingStatusValues.Scheduled,
                CreatedAt = _dateTimeProvider.Now
            };

            _logger.LogInformation(
                "Creating meeting record. ScheduledByEmployeeId={ScheduledByEmployeeId} MeetingTitle={MeetingTitle}",
                scheduledByEmployeeId,
                meeting.MeetingTitle);

            var createdMeeting = await _meetingRepository.CreateMeetingAsync(meeting, cancellationToken);

            _logger.LogInformation(
                "Meeting created successfully. MeetingId={MeetingId} ScheduledByEmployeeId={ScheduledByEmployeeId}",
                createdMeeting.MeetingId,
                scheduledByEmployeeId);

            var participants = distinctParticipants
                .Select(empId => new Meetingparticipant
                {
                    MeetingId = createdMeeting.MeetingId,
                    EmployeeId = empId,
                    Rsvpstatus = AppConstants.RsvpStatusValues.Pending,
                    CreatedAt = _dateTimeProvider.Now
                })
                .ToList();

            _logger.LogInformation(
                "Adding meeting participants. MeetingId={MeetingId} ParticipantCount={ParticipantCount}",
                createdMeeting.MeetingId,
                participants.Count);

            await _meetingRepository.AddMeetingParticipantsAsync(participants, cancellationToken);

            _logger.LogInformation(
                "Meeting participants added successfully. MeetingId={MeetingId}",
                createdMeeting.MeetingId);

            var response = await GetMeetingByIdAsync(createdMeeting.MeetingId, cancellationToken);
            if (response == null)
            {
                _logger.LogError(
                    "ScheduleMeeting failed. Meeting created but retrieval failed. MeetingId={MeetingId}",
                    createdMeeting.MeetingId);

                throw new InvalidOperationException(AppConstants.ExceptionMessages.InvalidOperation);
            }

            _logger.LogInformation(
                "ScheduleMeeting completed successfully. MeetingId={MeetingId} ScheduledByEmployeeId={ScheduledByEmployeeId}",
                createdMeeting.MeetingId,
                scheduledByEmployeeId);

            return response;
        }

        public async Task<PaginatedMeetingResponseDto> GetMeetingsByManagerIdAsync(
            int managerId,
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken = default)
        {
            if (pageNumber < 1 || pageSize < 1 || pageSize > 100)
            {
                _logger.LogWarning(
                    "GetMeetingsByManagerId failed. Invalid pagination values. ManagerId={ManagerId} PageNumber={PageNumber} PageSize={PageSize}",
                    managerId,
                    pageNumber,
                    pageSize);

                throw new ArgumentException(AppConstants.ExceptionMessages.InvalidPagination);
            }

            _logger.LogInformation(
                "GetMeetingsByManagerId started. ManagerId={ManagerId} PageNumber={PageNumber} PageSize={PageSize}",
                managerId,
                pageNumber,
                pageSize);

            var totalCount = await _meetingRepository.GetMeetingsByManagerCountAsync(managerId, cancellationToken);

            _logger.LogDebug(
                "Meetings count fetched. ManagerId={ManagerId} TotalCount={TotalCount}",
                managerId,
                totalCount);

            var meetings = await _meetingRepository.GetMeetingsByManagerIdAsync(
                managerId,
                pageNumber,
                pageSize,
                cancellationToken);

            _logger.LogDebug(
                "Meetings page fetched. ManagerId={ManagerId} ReturnedCount={ReturnedCount}",
                managerId,
                meetings.Count);

            var mapped = meetings.Select(MapToMeetingResponseDto).ToList();

            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            _logger.LogInformation(
                "GetMeetingsByManagerId completed successfully. ManagerId={ManagerId} TotalCount={TotalCount} ReturnedCount={ReturnedCount} PageNumber={PageNumber} PageSize={PageSize} TotalPages={TotalPages}",
                managerId,
                totalCount,
                mapped.Count,
                pageNumber,
                pageSize,
                totalPages);

            return new PaginatedMeetingResponseDto
            {
                Meetings = mapped,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalPages = totalPages,
                HasPreviousPage = pageNumber > 1,
                HasNextPage = pageNumber < totalPages
            };
        }

        public async Task<MeetingResponseDto?> GetMeetingByIdAsync(
            int meetingId,
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("GetMeetingById started. MeetingId={MeetingId}", meetingId);

            var meeting = await _meetingRepository.GetMeetingByIdAsync(meetingId, cancellationToken);
            if (meeting == null)
            {
                _logger.LogWarning("Meeting not found. MeetingId={MeetingId}", meetingId);
                return null;
            }

            _logger.LogInformation("GetMeetingById success. MeetingId={MeetingId}", meetingId);
            return MapToMeetingResponseDto(meeting);
        }

        public async Task<MeetingInvitationDto> SubmitRsvpAsync(
            RsvpResponseDto rsvpDto,
            int employeeId,
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation(
                "SubmitRsvp started. MeetingId={MeetingId} EmployeeId={EmployeeId} RsvpStatus={RsvpStatus}",
                rsvpDto.MeetingId,
                employeeId,
                rsvpDto.RsvpStatus);

            if (rsvpDto.RsvpStatus == RsvpStatus.Pending)
            {
                _logger.LogWarning(
                    "SubmitRsvp failed. Invalid RSVP status (Pending not allowed). MeetingId={MeetingId} EmployeeId={EmployeeId}",
                    rsvpDto.MeetingId,
                    employeeId);

                throw new ArgumentException(AppConstants.ExceptionMessages.InvalidRsvpStatus);
            }

            var participant = await _meetingRepository.GetMeetingParticipantAsync(
                rsvpDto.MeetingId,
                employeeId,
                cancellationToken);

            if (participant == null)
            {
                _logger.LogWarning(
                    "SubmitRsvp failed. Invitation not found. MeetingId={MeetingId} EmployeeId={EmployeeId}",
                    rsvpDto.MeetingId,
                    employeeId);

                throw new InvalidOperationException(AppConstants.ExceptionMessages.MeetingNotFound);
            }

            _logger.LogDebug(
                "SubmitRsvp invitation found. ParticipantId={ParticipantId} MeetingStatus={MeetingStatus} CurrentRsvp={CurrentRsvp}",
                participant.ParticipantId,
                participant.Meeting.Status,
                participant.Rsvpstatus);

            if (participant.Meeting.Status == AppConstants.MeetingStatusValues.Cancelled)
            {
                _logger.LogWarning(
                    "SubmitRsvp failed. Meeting already cancelled. MeetingId={MeetingId} EmployeeId={EmployeeId} ParticipantId={ParticipantId}",
                    rsvpDto.MeetingId,
                    employeeId,
                    participant.ParticipantId);

                throw new InvalidOperationException(AppConstants.ExceptionMessages.InvalidOperation);
            }

            if (participant.Meeting.Status == AppConstants.MeetingStatusValues.Completed)
            {
                _logger.LogWarning(
                    "SubmitRsvp failed. Meeting already completed. MeetingId={MeetingId} EmployeeId={EmployeeId} ParticipantId={ParticipantId}",
                    rsvpDto.MeetingId,
                    employeeId,
                    participant.ParticipantId);

                throw new InvalidOperationException(AppConstants.ExceptionMessages.InvalidOperation);
            }

            if (participant.Meeting.MeetingDate < _dateTimeProvider.Now)
            {
                _logger.LogWarning(
                    "SubmitRsvp failed. Meeting already in the past. MeetingId={MeetingId} MeetingDate={MeetingDate} Now={Now} EmployeeId={EmployeeId}",
                    rsvpDto.MeetingId,
                    participant.Meeting.MeetingDate,
                    _dateTimeProvider.Now,
                    employeeId);

                throw new InvalidOperationException(AppConstants.ExceptionMessages.InvalidOperation);
            }

            _logger.LogInformation(
                "Updating RSVP status. ParticipantId={ParticipantId} NewStatus={NewStatus}",
                participant.ParticipantId,
                rsvpDto.RsvpStatus);

            var updatedParticipant = await _meetingRepository.UpdateRsvpStatusAsync(
                participant.ParticipantId,
                rsvpDto.RsvpStatus,
                rsvpDto.RsvpComments,
                cancellationToken);

            _logger.LogInformation(
                "SubmitRsvp completed successfully. MeetingId={MeetingId} EmployeeId={EmployeeId} ParticipantId={ParticipantId} FinalStatus={FinalStatus}",
                rsvpDto.MeetingId,
                employeeId,
                updatedParticipant.ParticipantId,
                updatedParticipant.Rsvpstatus);

            return MapToMeetingInvitationDto(updatedParticipant);
        }

        public async Task<List<MeetingInvitationDto>> GetMyMeetingInvitationsAsync(
            int employeeId,
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("GetMyMeetingInvitations started. EmployeeId={EmployeeId}", employeeId);

            var invitations = await _meetingRepository.GetMeetingInvitationsAsync(employeeId, cancellationToken);

            _logger.LogInformation(
                "GetMyMeetingInvitations completed. EmployeeId={EmployeeId} InvitationCount={InvitationCount}",
                employeeId,
                invitations.Count);

            return invitations.Select(MapToMeetingInvitationDto).ToList();
        }

        public async Task<MeetingRsvpSummaryDto> GetMeetingRsvpSummaryAsync(
            int meetingId,
            int managerId,
            string role,
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation(
                "GetMeetingRsvpSummary started. MeetingId={MeetingId} ManagerId={ManagerId} Role={Role}",
                meetingId,
                managerId,
                role);

            var mappedRole = MapRoleToEnum(role);

            _logger.LogDebug(
                "Role mapping completed for RSVP summary. InputRole={InputRole} MappedRole={MappedRole}",
                role,
                mappedRole);

            if (!string.Equals(mappedRole, AppConstants.Roles.Manager, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning(
                    "Unauthorized RSVP summary request. MeetingId={MeetingId} ManagerId={ManagerId} Role={Role} MappedRole={MappedRole}",
                    meetingId,
                    managerId,
                    role,
                    mappedRole);

                throw new UnauthorizedAccessException(AppConstants.ExceptionMessages.UnauthorizedAccess);
            }

            var meeting = await _meetingRepository.GetMeetingByIdAsync(meetingId, cancellationToken);
            if (meeting == null)
            {
                _logger.LogWarning(
                    "GetMeetingRsvpSummary failed. Meeting not found. MeetingId={MeetingId}",
                    meetingId);

                throw new InvalidOperationException(AppConstants.ExceptionMessages.MeetingNotFound);
            }

            if (meeting.ScheduledByEmployeeId != managerId)
            {
                _logger.LogWarning(
                    "Unauthorized RSVP summary access attempt. MeetingId={MeetingId} MeetingOwnerManagerId={MeetingOwnerManagerId} RequestedByManagerId={RequestedByManagerId}",
                    meetingId,
                    meeting.ScheduledByEmployeeId,
                    managerId);

                throw new UnauthorizedAccessException(AppConstants.ExceptionMessages.UnauthorizedAccess);
            }

            var participants = await _meetingRepository.GetMeetingRsvpSummaryAsync(meetingId, cancellationToken);

            _logger.LogDebug(
                "RSVP summary participants fetched. MeetingId={MeetingId} ParticipantCount={ParticipantCount}",
                meetingId,
                participants.Count);

            var acceptedCount = participants.Count(p => p.Rsvpstatus == AppConstants.RsvpStatusValues.Accepted);
            var declinedCount = participants.Count(p => p.Rsvpstatus == AppConstants.RsvpStatusValues.Declined);
            var tentativeCount = participants.Count(p => p.Rsvpstatus == AppConstants.RsvpStatusValues.Tentative);
            var pendingCount = participants.Count(p => p.Rsvpstatus == AppConstants.RsvpStatusValues.Pending);

            _logger.LogInformation(
                "GetMeetingRsvpSummary completed. MeetingId={MeetingId} Total={Total} Accepted={Accepted} Declined={Declined} Tentative={Tentative} Pending={Pending}",
                meetingId,
                participants.Count,
                acceptedCount,
                declinedCount,
                tentativeCount,
                pendingCount);

            return new MeetingRsvpSummaryDto
            {
                MeetingId = meetingId,
                MeetingTitle = meeting.MeetingTitle,
                TotalInvitations = participants.Count,
                AcceptedCount = acceptedCount,
                DeclinedCount = declinedCount,
                TentativeCount = tentativeCount,
                PendingCount = pendingCount,
                Participants = participants.Select(p => new ParticipantRsvpDto
                {
                    ParticipantId = p.ParticipantId,
                    EmployeeId = p.EmployeeId,
                    EmployeeName = GetEmployeeName(p.Employee),
                    RsvpStatus = ParseRsvpStatus(p.Rsvpstatus),
                    RsvpResponseDate = p.RsvpresponseDate,
                    RsvpComments = p.Rsvpcomments
                }).ToList()
            };
        }

        public async Task<int> GetPendingRsvpCountAsync(int employeeId, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("GetPendingRsvpCount started. EmployeeId={EmployeeId}", employeeId);

            var count = await _meetingRepository.GetPendingRsvpCountAsync(employeeId, cancellationToken);

            _logger.LogInformation(
                "GetPendingRsvpCount completed. EmployeeId={EmployeeId} PendingCount={PendingCount}",
                employeeId,
                count);

            return count;
        }

        public async Task<OneOnOneReportDto> GetOneOnOneReportsAsync(
            int managerId,
            string role,
            int? employeeId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation(
                "GetOneOnOneReports started. ManagerId={ManagerId} Role={Role} EmployeeId={EmployeeId} StartDate={StartDate} EndDate={EndDate}",
                managerId,
                role,
                employeeId,
                startDate,
                endDate);

            var mappedRole = MapRoleToEnum(role);
            if (!string.Equals(mappedRole, AppConstants.Roles.Manager, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning(
                    "Unauthorized one-on-one report access attempt. ManagerId={ManagerId} Role={Role} MappedRole={MappedRole}",
                    managerId,
                    role,
                    mappedRole);

                throw new UnauthorizedAccessException(AppConstants.ExceptionMessages.UnauthorizedAccess);
            }

            var oneOnOneMeetings = await _meetingRepository.GetOneOnOneMeetingsByManagerAsync(
                managerId,
                employeeId,
                startDate,
                endDate,
                cancellationToken);

            _logger.LogDebug(
                "One-on-one meetings fetched. ManagerId={ManagerId} Count={Count}",
                managerId,
                oneOnOneMeetings.Count);

            if (!oneOnOneMeetings.Any())
            {
                _logger.LogInformation(
                    "No one-on-one meetings found for report. ManagerId={ManagerId}",
                    managerId);

                return new OneOnOneReportDto
                {
                    TotalMeetings = 0,
                    CompletedMeetings = 0,
                    ScheduledMeetings = 0,
                    CancelledMeetings = 0,
                    TotalActionItems = 0,
                    CompletedActionItems = 0,
                    PendingActionItems = 0,
                    OverdueActionItems = 0,
                    AverageActionItemsPerMeeting = 0,
                    AverageDiscussionPointsPerMeeting = 0,
                    Meetings = new List<MeetingResponseDto>(),
                    EmployeeStats = new List<EmployeeOneOnOneStatsDto>()
                };
            }

            var totalMeetings = oneOnOneMeetings.Count;
            var completedMeetings = oneOnOneMeetings.Count(m => m.Status == AppConstants.MeetingStatusValues.Completed);
            var scheduledMeetings = oneOnOneMeetings.Count(m => m.Status == AppConstants.MeetingStatusValues.Scheduled);
            var cancelledMeetings = oneOnOneMeetings.Count(m => m.Status == AppConstants.MeetingStatusValues.Cancelled);

            var meetingsWithMoms = oneOnOneMeetings
                .Where(m => m.Moms != null && m.Moms.Any())
                .ToList();

            var allMoms = meetingsWithMoms.SelectMany(m => m.Moms!).ToList();

            var totalActionItems = allMoms.Sum(m => m.Momactionitems?.Count ?? 0);
            var completedActionItems = allMoms.Sum(m => m.Momactionitems?.Count(ai => ai.Status == AppConstants.MeetingStatusValues.Completed) ?? 0);
            var pendingActionItems = totalActionItems - completedActionItems;

            var today = _dateTimeProvider.Today;
            var overdueActionItems = allMoms.Sum(m =>
                m.Momactionitems?.Count(ai => ai.Status != AppConstants.MeetingStatusValues.Completed && ai.DueDate < today) ?? 0);

            var avgActionItems = meetingsWithMoms.Count > 0 ? (double)totalActionItems / meetingsWithMoms.Count : 0;
            var totalDiscussionPoints = allMoms.Sum(m => m.Momdiscussionpoints?.Count ?? 0);
            var avgDiscussionPoints = meetingsWithMoms.Count > 0 ? (double)totalDiscussionPoints / meetingsWithMoms.Count : 0;

            var employeeStats = await GetEmployeeOneOnOneStatsAsync(managerId, oneOnOneMeetings, cancellationToken);

            _logger.LogInformation(
                "GetOneOnOneReports completed. ManagerId={ManagerId} TotalMeetings={TotalMeetings} Completed={Completed} Scheduled={Scheduled} Cancelled={Cancelled} TotalActionItems={TotalActionItems} Overdue={Overdue}",
                managerId,
                totalMeetings,
                completedMeetings,
                scheduledMeetings,
                cancelledMeetings,
                totalActionItems,
                overdueActionItems);

            return new OneOnOneReportDto
            {
                TotalMeetings = totalMeetings,
                CompletedMeetings = completedMeetings,
                ScheduledMeetings = scheduledMeetings,
                CancelledMeetings = cancelledMeetings,
                TotalActionItems = totalActionItems,
                CompletedActionItems = completedActionItems,
                PendingActionItems = pendingActionItems,
                OverdueActionItems = overdueActionItems,
                AverageActionItemsPerMeeting = avgActionItems,
                AverageDiscussionPointsPerMeeting = avgDiscussionPoints,
                Meetings = oneOnOneMeetings.Select(MapToMeetingResponseDto).ToList(),
                EmployeeStats = employeeStats
            };
        }

        public async Task<OneOnOneSummaryDto> GetOneOnOneSummaryAsync(
            int managerId,
            string role,
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation(
                "GetOneOnOneSummary started. ManagerId={ManagerId} Role={Role}",
                managerId,
                role);

            var mappedRole = MapRoleToEnum(role);
            if (!string.Equals(mappedRole, AppConstants.Roles.Manager, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning(
                    "Unauthorized one-on-one summary access attempt. ManagerId={ManagerId} Role={Role} MappedRole={MappedRole}",
                    managerId,
                    role,
                    mappedRole);

                throw new UnauthorizedAccessException(AppConstants.ExceptionMessages.UnauthorizedAccess);
            }

            var now = _dateTimeProvider.Now;
            var startOfMonth = new DateTime(now.Year, now.Month, 1);
            var startOfQuarter = new DateTime(now.Year, ((now.Month - 1) / 3) * 3 + 1, 1);
            var startOfLastMonth = startOfMonth.AddMonths(-1);

            var allMeetings = await _meetingRepository.GetOneOnOneMeetingsByManagerAsync(
                managerId,
                null,
                null,
                null,
                cancellationToken);

            _logger.LogDebug(
                "One-on-one meetings fetched for summary. ManagerId={ManagerId} TotalMeetings={TotalMeetings}",
                managerId,
                allMeetings.Count);

            var thisMonthMeetings = allMeetings.Count(m => m.MeetingDate >= startOfMonth);
            var thisQuarterMeetings = allMeetings.Count(m => m.MeetingDate >= startOfQuarter);
            var lastMonthMeetings = allMeetings.Count(m => m.MeetingDate >= startOfLastMonth && m.MeetingDate < startOfMonth);

            var teamMembers = await _meetingRepository.GetTeamMembersByManagerIdAsync(managerId, 1, 1000, cancellationToken);
            var totalTeamMembers = teamMembers.Count;

            var avgMeetingsPerEmployee = totalTeamMembers > 0
                ? (double)allMeetings.Count / totalTeamMembers
                : 0;

            var upcomingMeetings = allMeetings
                .Where(m => m.Status == AppConstants.MeetingStatusValues.Scheduled && m.MeetingDate >= now)
                .OrderBy(m => m.MeetingDate)
                .Take(5)
                .Select(m => new UpcomingMeetingDto
                {
                    MeetingId = m.MeetingId,
                    MeetingTitle = m.MeetingTitle,
                    MeetingDate = m.MeetingDate,
                    EmployeeId = m.Meetingparticipants?.FirstOrDefault()?.EmployeeId ?? 0,
                    EmployeeName = GetEmployeeName(m.Meetingparticipants?.FirstOrDefault()?.Employee),
                    DaysUntilMeeting = (int)(m.MeetingDate - now).TotalDays,
                    Agenda = m.Agenda
                }).ToList();

            var recentlyCompleted = allMeetings
                .Where(m => m.Status == AppConstants.MeetingStatusValues.Completed && m.Moms != null && m.Moms.Any())
                .OrderByDescending(m => m.MeetingDate)
                .Take(5)
                .Select(m =>
                {
                    var mom = m.Moms?.FirstOrDefault();
                    return new RecentMeetingDto
                    {
                        MeetingId = m.MeetingId,
                        MomId = mom?.Momid ?? 0,
                        MeetingTitle = m.MeetingTitle,
                        MeetingDate = m.MeetingDate,
                        EmployeeName = GetEmployeeName(m.Meetingparticipants?.FirstOrDefault()?.Employee),
                        ActionItemsCount = mom?.Momactionitems?.Count ?? 0,
                        CompletedActionItemsCount = mom?.Momactionitems?.Count(ai => ai.Status == AppConstants.MeetingStatusValues.Completed) ?? 0,
                        DaysSinceCompletion = (int)(now - m.MeetingDate).TotalDays
                    };
                }).ToList();

            var thirtyDaysAgo = now.AddDays(-30);
            var employeesWithNoRecentMeeting = teamMembers.Count(tm =>
                !allMeetings.Any(m =>
                    m.Meetingparticipants != null &&
                    m.Meetingparticipants.Any(p => p.EmployeeId == tm.EmployeeId) &&
                    m.MeetingDate >= thirtyDaysAgo));

            var allMoms = allMeetings.Where(m => m.Moms != null).SelectMany(m => m.Moms!).ToList();
            var today = _dateTimeProvider.Today;

            var overdueActionItems = allMoms.Sum(m =>
                m.Momactionitems?.Count(ai => ai.Status != AppConstants.MeetingStatusValues.Completed && ai.DueDate < today) ?? 0);

            _logger.LogInformation(
                "GetOneOnOneSummary completed. ManagerId={ManagerId} TeamMembers={TeamMembers} TotalMeetings={TotalMeetings} ThisMonth={ThisMonth} ThisQuarter={ThisQuarter} LastMonth={LastMonth} NoRecentMeeting={NoRecent} OverdueActions={Overdue}",
                managerId,
                totalTeamMembers,
                allMeetings.Count,
                thisMonthMeetings,
                thisQuarterMeetings,
                lastMonthMeetings,
                employeesWithNoRecentMeeting,
                overdueActionItems);

            return new OneOnOneSummaryDto
            {
                TotalTeamMembers = totalTeamMembers,
                TotalOneOnOnes = allMeetings.Count,
                ThisMonthOneOnOnes = thisMonthMeetings,
                ThisQuarterOneOnOnes = thisQuarterMeetings,
                LastMonthOneOnOnes = lastMonthMeetings,
                AverageMeetingsPerEmployee = avgMeetingsPerEmployee,
                AverageDaysBetweenMeetings = CalculateAvgDaysBetweenMeetings(allMeetings),
                EmployeesWithNoRecentMeeting = employeesWithNoRecentMeeting,
                OverdueActionItemsCount = overdueActionItems,
                UpcomingMeetings = upcomingMeetings,
                RecentlyCompleted = recentlyCompleted
            };
        }

        #region Helpers

        private string MapRoleToEnum(string role)
        {
            if (string.IsNullOrWhiteSpace(role))
                return AppConstants.Roles.Employee;

            if (RoleMapping.TryGetValue(role, out var mappedRole))
                return mappedRole;

            var roleLower = role.ToLower();
            if (roleLower.Contains("manager") || roleLower.Contains("lead") || roleLower.Contains("director"))
                return AppConstants.Roles.Manager;

            if (roleLower.Contains("hr") || roleLower.Contains("human resource"))
                return "HR";

            return AppConstants.Roles.Employee;
        }

        private async Task<List<EmployeeOneOnOneStatsDto>> GetEmployeeOneOnOneStatsAsync(
            int managerId,
            List<Meeting> meetings,
            CancellationToken cancellationToken)
        {
            _logger.LogInformation(
                "Calculating employee one-on-one stats started. ManagerId={ManagerId} MeetingsCount={MeetingsCount}",
                managerId,
                meetings.Count);

            var teamMembers = await _meetingRepository.GetTeamMembersByManagerIdAsync(managerId, 1, 1000, cancellationToken);

            var now = _dateTimeProvider.Now;
            var today = _dateTimeProvider.Today;

            var stats = new List<EmployeeOneOnOneStatsDto>();

            foreach (var employee in teamMembers)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var employeeMeetings = meetings
                    .Where(m => m.Meetingparticipants != null &&
                                m.Meetingparticipants.Any(p => p.EmployeeId == employee.EmployeeId))
                    .ToList();

                var completedMeetings = employeeMeetings.Count(m => m.Status == AppConstants.MeetingStatusValues.Completed);

                var lastMeeting = employeeMeetings
                    .OrderByDescending(m => m.MeetingDate)
                    .FirstOrDefault();

                var daysSinceLastMeeting = lastMeeting != null
                    ? (int)(now - lastMeeting.MeetingDate).TotalDays
                    : 999;

                var employeeMoms = employeeMeetings
                    .Where(m => m.Moms != null)
                    .SelectMany(m => m.Moms!)
                    .ToList();

                var totalActionItems = employeeMoms.Sum(m => m.Momactionitems?.Count ?? 0);
                var completedActionItems = employeeMoms.Sum(m =>
                    m.Momactionitems?.Count(ai => ai.Status == AppConstants.MeetingStatusValues.Completed) ?? 0);

                var overdueActionItems = employeeMoms.Sum(m =>
                    m.Momactionitems?.Count(ai =>
                        ai.Status != AppConstants.MeetingStatusValues.Completed &&
                        ai.DueDate < today) ?? 0);

                stats.Add(new EmployeeOneOnOneStatsDto
                {
                    EmployeeId = employee.EmployeeId,
                    EmployeeName = GetEmployeeName(employee),
                    TotalMeetings = employeeMeetings.Count,
                    CompletedMeetings = completedMeetings,
                    LastMeetingDate = lastMeeting?.MeetingDate,
                    DaysSinceLastMeeting = daysSinceLastMeeting,
                    TotalActionItems = totalActionItems,
                    CompletedActionItems = completedActionItems,
                    OverdueActionItems = overdueActionItems
                });
            }

            _logger.LogInformation(
                "Calculating employee one-on-one stats completed. ManagerId={ManagerId} EmployeesCount={EmployeesCount}",
                managerId,
                stats.Count);

            return stats;
        }

        private double CalculateAvgDaysBetweenMeetings(List<Meeting> meetings)
        {
            var orderedMeetings = meetings.OrderBy(m => m.MeetingDate).ToList();
            if (orderedMeetings.Count < 2)
                return 0;

            var daysDifferences = new List<int>();
            for (int i = 1; i < orderedMeetings.Count; i++)
            {
                var daysDiff = (int)(orderedMeetings[i].MeetingDate - orderedMeetings[i - 1].MeetingDate).TotalDays;
                daysDifferences.Add(daysDiff);
            }

            return daysDifferences.Any() ? daysDifferences.Average() : 0;
        }

        private RsvpStatus ParseRsvpStatus(string status)
        {
            if (Enum.TryParse(status, true, out RsvpStatus rsvpStatus))
                return rsvpStatus;

            return RsvpStatus.Pending;
        }

        private MeetingStatus ParseMeetingStatus(string status)
        {
            if (Enum.TryParse(status, true, out MeetingStatus meetingStatus))
                return meetingStatus;

            return MeetingStatus.Scheduled;
        }

        #endregion

        #region Mapping

        private MeetingResponseDto MapToMeetingResponseDto(Meeting meeting)
        {
            return new MeetingResponseDto
            {
                MeetingId = meeting.MeetingId,
                MeetingTitle = meeting.MeetingTitle,
                MeetingType = meeting.MeetingType,
                MeetingDate = meeting.MeetingDate,
                MeetingLink = meeting.MeetingLink,
                Agenda = meeting.Agenda,
                ScheduledByEmployeeId = meeting.ScheduledByEmployeeId,
                ScheduledByEmployeeName = GetEmployeeName(meeting.ScheduledByEmployee),
                Status = meeting.Status,
                CreatedAt = meeting.CreatedAt,
                Participants = meeting.Meetingparticipants?
                    .Select(mp => new MeetingParticipantDto
                    {
                        ParticipantId = mp.ParticipantId,
                        EmployeeId = mp.EmployeeId,
                        EmployeeName = GetEmployeeName(mp.Employee)
                    })
                    .ToList() ?? new List<MeetingParticipantDto>()
            };
        }

        private MeetingInvitationDto MapToMeetingInvitationDto(Meetingparticipant participant)
        {
            var daysUntilMeeting = (int)(participant.Meeting.MeetingDate - _dateTimeProvider.Now).TotalDays;

            return new MeetingInvitationDto
            {
                ParticipantId = participant.ParticipantId,
                MeetingId = participant.MeetingId,
                MeetingTitle = participant.Meeting.MeetingTitle,
                MeetingType = participant.Meeting.MeetingType,
                MeetingDate = participant.Meeting.MeetingDate,
                MeetingLink = participant.Meeting.MeetingLink,
                Agenda = participant.Meeting.Agenda,
                ScheduledByEmployeeId = participant.Meeting.ScheduledByEmployeeId,
                ScheduledByEmployeeName = GetEmployeeName(participant.Meeting.ScheduledByEmployee),
                MeetingStatus = ParseMeetingStatus(participant.Meeting.Status),
                RsvpStatus = ParseRsvpStatus(participant.Rsvpstatus),
                RsvpResponseDate = participant.RsvpresponseDate,
                RsvpComments = participant.Rsvpcomments,
                DaysUntilMeeting = daysUntilMeeting
            };
        }

        private string GetEmployeeName(Employee? employee)
        {
            if (employee?.Userprofile == null)
                return "Unknown";

            var firstName = employee.Userprofile.FirstName ?? string.Empty;
            var lastName = employee.Userprofile.LastName ?? string.Empty;
            var fullName = $"{firstName} {lastName}".Trim();

            return string.IsNullOrWhiteSpace(fullName) ? "Unknown" : fullName;
        }

        #endregion
    }

    #region DateTime Provider

    public interface IDateTimeProvider
    {
        DateTime Now { get; }
        DateOnly Today { get; }
    }

    public class DateTimeProvider : IDateTimeProvider
    {
        public DateTime Now => DateTime.UtcNow;
        public DateOnly Today => DateOnly.FromDateTime(DateTime.UtcNow);
    }

    #endregion
}
