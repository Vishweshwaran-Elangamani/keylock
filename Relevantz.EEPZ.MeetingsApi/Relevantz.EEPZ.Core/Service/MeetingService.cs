using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;

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
                { "User", "Employee" },
                { "Employee", "Employee" },
                { "Staff", "Employee" },
                { "Developer", "Employee" },
                { "Engineer", "Employee" },
                { "Analyst", "Employee" },
                { "Designer", "Employee" },
                { "Manager", "Manager" },
                { "Engineering Manager", "Manager" },
                { "Department Manager", "Manager" },
                { "Team Lead", "Manager" },
                { "Project Manager", "Manager" },
                { "Senior Manager", "Manager" },
                { "Director", "Manager" },
                { "VP", "Manager" },
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
            _meetingRepository = meetingRepository ?? 
                throw new ArgumentNullException(nameof(meetingRepository));
            _logger = logger ?? 
                throw new ArgumentNullException(nameof(logger));
            _dateTimeProvider = dateTimeProvider ?? 
                throw new ArgumentNullException(nameof(dateTimeProvider));
        }

        public async Task<MeetingResponseDto> ScheduleMeetingAsync(
            ScheduleMeetingDto scheduleMeetingDto,
            int scheduledByEmployeeId,
            string role,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation(
                    "Scheduling meeting: {MeetingTitle} by employee {EmployeeId}",
                    scheduleMeetingDto.MeetingTitle,
                    scheduledByEmployeeId);

                var mappedRole = MapRoleToEnum(role);
                if (mappedRole != "Manager")
                {
                    _logger.LogWarning(
                        "Unauthorized access attempt. Role: {Role}, Operation: schedule meetings",
                        role);
                    throw new UnauthorizedAccessException("Only managers can schedule meetings");
                }

                var employeeExists = await _meetingRepository.GetEmployeeByIdAsync(
                    scheduledByEmployeeId,
                    cancellationToken);
                    
                if (employeeExists == null)
                {
                    throw new InvalidOperationException(
                        $"Scheduling employee with ID {scheduledByEmployeeId} does not exist in the employee table.");
                }

                if (scheduleMeetingDto.ParticipantEmployeeIds == null || 
                    !scheduleMeetingDto.ParticipantEmployeeIds.Any())
                {
                    throw new ArgumentException("At least one participant is required.");
                }

                foreach (var empId in scheduleMeetingDto.ParticipantEmployeeIds)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    
                    var participantExists = await _meetingRepository.GetEmployeeByIdAsync(
                        empId,
                        cancellationToken);
                        
                    if (participantExists == null)
                    {
                        throw new ArgumentException($"Participant with employee ID {empId} does not exist.");
                    }
                }

                var meeting = new Meeting
                {
                    MeetingTitle = scheduleMeetingDto.MeetingTitle,
                    MeetingType = scheduleMeetingDto.MeetingType,
                    MeetingDate = scheduleMeetingDto.MeetingDate,
                    MeetingLink = scheduleMeetingDto.MeetingLink,
                    Agenda = scheduleMeetingDto.Agenda,
                    ScheduledByEmployeeId = scheduledByEmployeeId,
                    Status = "Scheduled",
                    CreatedAt = _dateTimeProvider.Now
                };

                var createdMeeting = await _meetingRepository.CreateMeetingAsync(
                    meeting,
                    cancellationToken);

                var participants = scheduleMeetingDto.ParticipantEmployeeIds
                    .Select(empId => new Meetingparticipant
                    {
                        MeetingId = createdMeeting.MeetingId,
                        EmployeeId = empId,
                        Rsvpstatus = "Pending",
                        CreatedAt = _dateTimeProvider.Now
                    }).ToList();

                await _meetingRepository.AddMeetingParticipantsAsync(
                    participants,
                    cancellationToken);

                _logger.LogInformation(
                    "Meeting scheduled successfully with ID: {MeetingId}",
                    createdMeeting.MeetingId);

                return await GetMeetingByIdAsync(createdMeeting.MeetingId, cancellationToken)
                    ?? throw new InvalidOperationException("Failed to retrieve created meeting");
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error scheduling meeting: {MeetingTitle}",
                    scheduleMeetingDto.MeetingTitle);
                throw;
            }
        }

        public async Task<List<MeetingResponseDto>> GetMeetingsByManagerIdAsync(
            int managerId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation(
                    "Fetching meetings for manager ID: {ManagerId}",
                    managerId);

                var meetings = await _meetingRepository.GetMeetingsByManagerIdAsync(
                    managerId,
                    cancellationToken);
                    
                return meetings.Select(MapToMeetingResponseDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error fetching meetings for manager ID: {ManagerId}",
                    managerId);
                throw;
            }
        }

        public async Task<MeetingResponseDto?> GetMeetingByIdAsync(
            int meetingId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Fetching meeting by ID: {MeetingId}", meetingId);

                var meeting = await _meetingRepository.GetMeetingByIdAsync(
                    meetingId,
                    cancellationToken);
                    
                if (meeting == null)
                {
                    _logger.LogWarning("Meeting not found: {MeetingId}", meetingId);
                    return null;
                }

                return MapToMeetingResponseDto(meeting);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching meeting by ID: {MeetingId}", meetingId);
                throw;
            }
        }

        public async Task<OneOnOneReportDto> GetOneOnOneReportsAsync(
            int managerId,
            string role,
            int? employeeId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation(
                    "Generating one-on-one report for manager ID: {ManagerId}",
                    managerId);

                var mappedRole = MapRoleToEnum(role);
                if (mappedRole != "Manager")
                {
                    _logger.LogWarning(
                        "Unauthorized access attempt. Role: {Role}, Operation: view reports",
                        role);
                    throw new UnauthorizedAccessException("Only managers can view reports");
                }

                var oneOnOneMeetings = await _meetingRepository.GetOneOnOneMeetingsByManagerAsync(
                    managerId,
                    employeeId,
                    startDate,
                    endDate,
                    cancellationToken);

                if (!oneOnOneMeetings.Any())
                {
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
                var completedMeetings = oneOnOneMeetings.Count(m => m.Status == "Completed");
                var scheduledMeetings = oneOnOneMeetings.Count(m => m.Status == "Scheduled");
                var cancelledMeetings = oneOnOneMeetings.Count(m => m.Status == "Cancelled");

                var meetingsWithMoms = oneOnOneMeetings
                    .Where(m => m.Moms != null && m.Moms.Any())
                    .ToList();
                    
                var allMoms = meetingsWithMoms.SelectMany(m => m.Moms).ToList();

                var totalActionItems = allMoms.Sum(m => m.Momactionitems?.Count ?? 0);
                var completedActionItems = allMoms.Sum(m =>
                    m.Momactionitems?.Count(ai => ai.Status == "Completed") ?? 0);
                var pendingActionItems = totalActionItems - completedActionItems;

                var today = _dateTimeProvider.Today;
                var overdueActionItems = allMoms.Sum(m =>
                    m.Momactionitems?.Count(ai => ai.Status != "Completed" && ai.DueDate < today) ?? 0);

                var avgActionItems = meetingsWithMoms.Count > 0
                    ? (double)totalActionItems / meetingsWithMoms.Count
                    : 0;

                var totalDiscussionPoints = allMoms.Sum(m => m.Momdiscussionpoints?.Count ?? 0);
                var avgDiscussionPoints = meetingsWithMoms.Count > 0
                    ? (double)totalDiscussionPoints / meetingsWithMoms.Count
                    : 0;

                var employeeStats = await GetEmployeeOneOnOneStatsAsync(
                    managerId,
                    oneOnOneMeetings,
                    cancellationToken);

                _logger.LogInformation(
                    "One-on-one report generated successfully for manager ID: {ManagerId}",
                    managerId);

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
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error generating one-on-one report for manager ID: {ManagerId}",
                    managerId);
                throw;
            }
        }

        public async Task<OneOnOneSummaryDto> GetOneOnOneSummaryAsync(
            int managerId,
            string role,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation(
                    "Generating one-on-one summary for manager ID: {ManagerId}",
                    managerId);

                var mappedRole = MapRoleToEnum(role);
                if (mappedRole != "Manager")
                {
                    _logger.LogWarning(
                        "Unauthorized access attempt. Role: {Role}, Operation: view summaries",
                        role);
                    throw new UnauthorizedAccessException("Only managers can view summaries");
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
                    
                var thisMonthMeetings = allMeetings.Count(m => m.MeetingDate >= startOfMonth);
                var thisQuarterMeetings = allMeetings.Count(m => m.MeetingDate >= startOfQuarter);
                var lastMonthMeetings = allMeetings.Count(m => 
                    m.MeetingDate >= startOfLastMonth && 
                    m.MeetingDate < startOfMonth);

                var teamMembers = await _meetingRepository.GetTeamMembersByManagerIdAsync(
                    managerId,
                    1,
                    1000,
                    cancellationToken);
                    
                var totalTeamMembers = teamMembers.Count;

                var avgMeetingsPerEmployee = totalTeamMembers > 0
                    ? (double)allMeetings.Count / totalTeamMembers
                    : 0;

                var upcomingMeetings = allMeetings
                    .Where(m => m.Status == "Scheduled" && m.MeetingDate >= now)
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
                    .Where(m => m.Status == "Completed" && m.Moms != null && m.Moms.Any())
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
                            EmployeeName = GetEmployeeName(
                                m.Meetingparticipants?.FirstOrDefault()?.Employee),
                            ActionItemsCount = mom?.Momactionitems?.Count ?? 0,
                            CompletedActionItemsCount = mom?.Momactionitems?
                                .Count(ai => ai.Status == "Completed") ?? 0,
                            DaysSinceCompletion = (int)(now - m.MeetingDate).TotalDays
                        };
                    }).ToList();

                var thirtyDaysAgo = now.AddDays(-30);
                var employeesWithNoRecentMeeting = teamMembers.Count(tm =>
                    !allMeetings.Any(m =>
                        m.Meetingparticipants != null &&
                        m.Meetingparticipants.Any(p => p.EmployeeId == tm.EmployeeId) &&
                        m.MeetingDate >= thirtyDaysAgo));

                var allMoms = allMeetings.Where(m => m.Moms != null).SelectMany(m => m.Moms).ToList();
                var today = _dateTimeProvider.Today;
                var overdueActionItems = allMoms.Sum(m =>
                    m.Momactionitems?.Count(ai => ai.Status != "Completed" && ai.DueDate < today) ?? 0);

                _logger.LogInformation(
                    "One-on-one summary generated successfully for manager ID: {ManagerId}",
                    managerId);

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
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error generating one-on-one summary for manager ID: {ManagerId}",
                    managerId);
                throw;
            }
        }

        public async Task<MeetingInvitationDto> SubmitRsvpAsync(
            RsvpResponseDto rsvpDto,
            int employeeId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation(
                    "Submitting RSVP for meeting {MeetingId} by employee {EmployeeId}",
                    rsvpDto.MeetingId,
                    employeeId);

                var validStatuses = new[] { "Accepted", "Declined", "Tentative" };
                if (!validStatuses.Contains(rsvpDto.RsvpStatus.ToString()))
                {
                    throw new ArgumentException(
                        "Invalid RSVP status. Must be: Accepted, Declined, or Tentative");
                }

                var participant = await _meetingRepository.GetMeetingParticipantAsync(
                    rsvpDto.MeetingId,
                    employeeId,
                    cancellationToken);
                    
                if (participant == null)
                {
                    throw new InvalidOperationException("Meeting invitation not found for this employee");
                }

                if (participant.Meeting.Status == "Cancelled")
                {
                    throw new InvalidOperationException("Cannot RSVP to a cancelled meeting");
                }

                if (participant.Meeting.Status == "Completed")
                {
                    throw new InvalidOperationException("Cannot RSVP to a completed meeting");
                }

                if (participant.Meeting.MeetingDate < _dateTimeProvider.Now)
                {
                    throw new InvalidOperationException("Cannot RSVP to a past meeting");
                }

                var updatedParticipant = await _meetingRepository.UpdateRsvpStatusAsync(
                    participant.ParticipantId,
                    rsvpDto.RsvpStatus.ToString(),
                    rsvpDto.RsvpComments,
                    cancellationToken);

                _logger.LogInformation(
                    "RSVP submitted successfully for meeting {MeetingId}",
                    rsvpDto.MeetingId);

                return MapToMeetingInvitationDto(updatedParticipant);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error submitting RSVP for meeting {MeetingId}",
                    rsvpDto.MeetingId);
                throw;
            }
        }

        public async Task<List<MeetingInvitationDto>> GetMyMeetingInvitationsAsync(
            int employeeId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation(
                    "Fetching meeting invitations for employee ID: {EmployeeId}",
                    employeeId);

                var invitations = await _meetingRepository.GetMeetingInvitationsAsync(
                    employeeId,
                    cancellationToken);
                    
                return invitations.Select(MapToMeetingInvitationDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error fetching meeting invitations for employee ID: {EmployeeId}",
                    employeeId);
                throw;
            }
        }

        public async Task<MeetingRsvpSummaryDto> GetMeetingRsvpSummaryAsync(
            int meetingId,
            int managerId,
            string role,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation(
                    "Fetching RSVP summary for meeting ID: {MeetingId}",
                    meetingId);

                var mappedRole = MapRoleToEnum(role);
                if (mappedRole != "Manager")
                {
                    _logger.LogWarning(
                        "Unauthorized access attempt. Role: {Role}, Operation: view RSVP summaries",
                        role);
                    throw new UnauthorizedAccessException("Only managers can view RSVP summaries");
                }

                var meeting = await _meetingRepository.GetMeetingByIdAsync(
                    meetingId,
                    cancellationToken);
                    
                if (meeting == null)
                {
                    throw new InvalidOperationException("Meeting not found");
                }

                if (meeting.ScheduledByEmployeeId != managerId)
                {
                    _logger.LogWarning(
                        "Unauthorized RSVP summary access attempt by manager {ManagerId} for meeting {MeetingId}",
                        managerId,
                        meetingId);
                    throw new UnauthorizedAccessException(
                        "You can only view RSVP summary for meetings you scheduled");
                }

                var participants = await _meetingRepository.GetMeetingRsvpSummaryAsync(
                    meetingId,
                    cancellationToken);

                var acceptedCount = participants.Count(p => p.Rsvpstatus == "Accepted");
                var declinedCount = participants.Count(p => p.Rsvpstatus == "Declined");
                var tentativeCount = participants.Count(p => p.Rsvpstatus == "Tentative");
                var pendingCount = participants.Count(p => p.Rsvpstatus == "Pending");

                _logger.LogInformation(
                    "RSVP summary retrieved successfully for meeting ID: {MeetingId}",
                    meetingId);

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
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error fetching RSVP summary for meeting ID: {MeetingId}",
                    meetingId);
                throw;
            }
        }

        public async Task<int> GetPendingRsvpCountAsync(
            int employeeId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                return await _meetingRepository.GetPendingRsvpCountAsync(
                    employeeId,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error getting pending RSVP count for employee ID: {EmployeeId}",
                    employeeId);
                throw;
            }
        }

        #region Private Helper Methods

        private string MapRoleToEnum(string role)
        {
            if (string.IsNullOrWhiteSpace(role))
                return "Employee";

            if (RoleMapping.TryGetValue(role, out string? mappedRole))
            {
                return mappedRole;
            }

            var roleLower = role.ToLower();
            if (roleLower.Contains("manager") || 
                roleLower.Contains("lead") || 
                roleLower.Contains("director"))
            {
                return "Manager";
            }

            if (roleLower.Contains("hr") || roleLower.Contains("human resource"))
            {
                return "HR";
            }

            return "Employee";
        }

        private async Task<List<EmployeeOneOnOneStatsDto>> GetEmployeeOneOnOneStatsAsync(
            int managerId,
            List<Meeting> meetings,
            CancellationToken cancellationToken)
        {
            var teamMembers = await _meetingRepository.GetTeamMembersByManagerIdAsync(
                managerId,
                1,
                1000,
                cancellationToken);
                
            var now = _dateTimeProvider.Now;
            var today = _dateTimeProvider.Today;

            var stats = new List<EmployeeOneOnOneStatsDto>();

            foreach (var employee in teamMembers)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var employeeMeetings = meetings.Where(m =>
                    m.Meetingparticipants != null &&
                    m.Meetingparticipants.Any(p => p.EmployeeId == employee.EmployeeId)).ToList();

                var completedMeetings = employeeMeetings.Count(m => m.Status == "Completed");
                var lastMeeting = employeeMeetings
                    .OrderByDescending(m => m.MeetingDate)
                    .FirstOrDefault();
                    
                var daysSinceLastMeeting = lastMeeting != null
                    ? (int)(now - lastMeeting.MeetingDate).TotalDays
                    : 999;

                var employeeMoms = employeeMeetings
                    .Where(m => m.Moms != null)
                    .SelectMany(m => m.Moms)
                    .ToList();

                var totalActionItems = employeeMoms.Sum(m => m.Momactionitems?.Count ?? 0);
                var completedActionItems = employeeMoms.Sum(m =>
                    m.Momactionitems?.Count(ai => ai.Status == "Completed") ?? 0);
                var overdueActionItems = employeeMoms.Sum(m =>
                    m.Momactionitems?.Count(ai => ai.Status != "Completed" && ai.DueDate < today) ?? 0);

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
                var daysDiff = (int)(orderedMeetings[i].MeetingDate -
                    orderedMeetings[i - 1].MeetingDate).TotalDays;
                daysDifferences.Add(daysDiff);
            }

            return daysDifferences.Any() ? daysDifferences.Average() : 0;
        }

        private RsvpStatus ParseRsvpStatus(string status)
        {
            if (Enum.TryParse<RsvpStatus>(status, true, out var rsvpStatus))
            {
                return rsvpStatus;
            }
            return RsvpStatus.Pending;
        }

        private MeetingStatus ParseMeetingStatus(string status)
        {
            if (Enum.TryParse<MeetingStatus>(status, true, out var meetingStatus))
            {
                return meetingStatus;
            }
            return MeetingStatus.Scheduled;
        }

        #endregion

        #region Mapping Methods

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

    #region External Interfaces

    public interface IDateTimeProvider
    {
        DateTime Now { get; }
        DateOnly Today { get; }
    }

    public class DateTimeProvider : IDateTimeProvider
    {
        public DateTime Now => DateTime.Now;
        public DateOnly Today => DateOnly.FromDateTime(DateTime.Now);
    }

    #endregion
}
