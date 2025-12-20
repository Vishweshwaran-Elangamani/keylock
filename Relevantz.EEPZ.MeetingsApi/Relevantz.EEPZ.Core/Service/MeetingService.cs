using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class MeetingService : IMeetingService
    {
        private readonly IMeetingRepository _meetingRepository;

        public MeetingService(IMeetingRepository meetingRepository)
        {
            _meetingRepository = meetingRepository;
        }



        public async Task<MeetingResponseDto> ScheduleMeetingAsync(
            ScheduleMeetingDto scheduleMeetingDto,
            int scheduledByEmployeeId,
            string role)
        {
            var mappedRole = MapRoleToEnum(role);
            if (mappedRole != "Manager")
                throw new UnauthorizedAccessException("Only managers can schedule meetings");

            var employeeExists = await _meetingRepository.GetEmployeeByIdAsync(scheduledByEmployeeId);
            if (employeeExists == null)
            {
                throw new Exception($"Scheduling employee with ID {scheduledByEmployeeId} does not exist in the employee table.");
            }

            if (scheduleMeetingDto.ParticipantEmployeeIds == null || !scheduleMeetingDto.ParticipantEmployeeIds.Any())
                throw new Exception("At least one participant is required.");

            foreach (var empId in scheduleMeetingDto.ParticipantEmployeeIds)
            {
                var participantExists = await _meetingRepository.GetEmployeeByIdAsync(empId);
                if (participantExists == null)
                {
                    throw new Exception($"Participant with employee ID {empId} does not exist.");
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
                CreatedAt = DateTime.Now
            };

            var createdMeeting = await _meetingRepository.CreateMeetingAsync(meeting);

            var participants = scheduleMeetingDto.ParticipantEmployeeIds.Select(empId => new Meetingparticipant
            {
                MeetingId = createdMeeting.MeetingId,
                EmployeeId = empId,
                CreatedAt = DateTime.Now
            }).ToList();

            await _meetingRepository.AddMeetingParticipantsAsync(participants);

            return await GetMeetingByIdAsync(createdMeeting.MeetingId)
                ?? throw new Exception("Failed to retrieve created meeting");
        }

        public async Task<List<MeetingResponseDto>> GetMeetingsByManagerIdAsync(int managerId)
        {
            var meetings = await _meetingRepository.GetMeetingsByManagerIdAsync(managerId);
            return meetings.Select(MapToMeetingResponseDto).ToList();
        }

        public async Task<MeetingResponseDto?> GetMeetingByIdAsync(int meetingId)
        {
            var meeting = await _meetingRepository.GetMeetingByIdAsync(meetingId);
            if (meeting == null) return null;

            return MapToMeetingResponseDto(meeting);
        }

        public async Task<OneOnOneReportDto> GetOneOnOneReportsAsync(
            int managerId,
            string role,
            int? employeeId = null,
            DateTime? startDate = null,
            DateTime? endDate = null)
        {
            var mappedRole = MapRoleToEnum(role);
            if (mappedRole != "Manager")
                throw new UnauthorizedAccessException("Only managers can view reports");

            var oneOnOneMeetings = await _meetingRepository.GetOneOnOneMeetingsByManagerAsync(
                managerId, employeeId, startDate, endDate);

            if (!oneOnOneMeetings.Any())
            {
                return new OneOnOneReportDto
                {
                    TotalMeetings = 0,
                    CompletedMeetings = 0,
                    ScheduledMeetings = 0,
                    CancelledMeetings = 0,
                    CompletionRate = 0,
                    TotalActionItems = 0,
                    CompletedActionItems = 0,
                    PendingActionItems = 0,
                    OverdueActionItems = 0,
                    ActionItemCompletionRate = 0,
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
            var completionRate = totalMeetings > 0 ? (double)completedMeetings / totalMeetings * 100 : 0;

            var meetingsWithMoms = oneOnOneMeetings.Where(m => m.Moms != null && m.Moms.Any()).ToList();
            var allMoms = meetingsWithMoms.SelectMany(m => m.Moms).ToList();

            var totalActionItems = allMoms.Sum(m => m.Momactionitems?.Count ?? 0);
            var completedActionItems = allMoms.Sum(m =>
                m.Momactionitems?.Count(ai => ai.Status == "Completed") ?? 0);
            var pendingActionItems = totalActionItems - completedActionItems;

            var today = DateOnly.FromDateTime(DateTime.Now);
            var overdueActionItems = allMoms.Sum(m =>
                m.Momactionitems?.Count(ai => ai.Status != "Completed" && ai.DueDate < today) ?? 0);

            var actionItemCompletionRate = totalActionItems > 0
                ? (double)completedActionItems / totalActionItems * 100
                : 0;

            var avgActionItems = meetingsWithMoms.Count > 0
                ? (double)totalActionItems / meetingsWithMoms.Count
                : 0;

            var totalDiscussionPoints = allMoms.Sum(m => m.Momdiscussionpoints?.Count ?? 0);
            var avgDiscussionPoints = meetingsWithMoms.Count > 0
                ? (double)totalDiscussionPoints / meetingsWithMoms.Count
                : 0;

            var employeeStats = await GetEmployeeOneOnOneStatsAsync(managerId, oneOnOneMeetings);

            return new OneOnOneReportDto
            {
                TotalMeetings = totalMeetings,
                CompletedMeetings = completedMeetings,
                ScheduledMeetings = scheduledMeetings,
                CancelledMeetings = cancelledMeetings,
                CompletionRate = completionRate,
                TotalActionItems = totalActionItems,
                CompletedActionItems = completedActionItems,
                PendingActionItems = pendingActionItems,
                OverdueActionItems = overdueActionItems,
                ActionItemCompletionRate = actionItemCompletionRate,
                AverageActionItemsPerMeeting = avgActionItems,
                AverageDiscussionPointsPerMeeting = avgDiscussionPoints,
                Meetings = oneOnOneMeetings.Select(MapToMeetingResponseDto).ToList(),
                EmployeeStats = employeeStats
            };
        }

        public async Task<OneOnOneSummaryDto> GetOneOnOneSummaryAsync(int managerId, string role)
        {
            var mappedRole = MapRoleToEnum(role);
            if (mappedRole != "Manager")
                throw new UnauthorizedAccessException("Only managers can view summaries");

            var now = DateTime.Now;
            var startOfMonth = new DateTime(now.Year, now.Month, 1);
            var startOfQuarter = new DateTime(now.Year, ((now.Month - 1) / 3) * 3 + 1, 1);
            var startOfLastMonth = startOfMonth.AddMonths(-1);

            var allMeetings = await _meetingRepository.GetOneOnOneMeetingsByManagerAsync(managerId, null, null, null);
            var thisMonthMeetings = allMeetings.Count(m => m.MeetingDate >= startOfMonth);
            var thisQuarterMeetings = allMeetings.Count(m => m.MeetingDate >= startOfQuarter);
            var lastMonthMeetings = allMeetings.Count(m => m.MeetingDate >= startOfLastMonth && m.MeetingDate < startOfMonth);

            var teamMembers = await _meetingRepository.GetTeamMembersByManagerIdAsync(managerId);
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
                        EmployeeName = GetEmployeeName(m.Meetingparticipants?.FirstOrDefault()?.Employee),
                        ActionItemsCount = mom?.Momactionitems?.Count ?? 0,
                        CompletedActionItemsCount = mom?.Momactionitems?.Count(ai => ai.Status == "Completed") ?? 0,
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
            var today = DateOnly.FromDateTime(now);
            var overdueActionItems = allMoms.Sum(m =>
                m.Momactionitems?.Count(ai => ai.Status != "Completed" && ai.DueDate < today) ?? 0);

            return new OneOnOneSummaryDto
            {
                TotalTeamMembers = totalTeamMembers,
                TotalOneOnOnes = allMeetings.Count,
                ThisMonthOneOnOnes = thisMonthMeetings,
                ThisQuarterOneOnOnes = thisQuarterMeetings,
                LastMonthOneOnOnes = lastMonthMeetings,
                AverageMeetingsPerEmployee = avgMeetingsPerEmployee,
                AverageDaysBetweenMeetings = 0, 
                EmployeesWithNoRecentMeeting = employeesWithNoRecentMeeting,
                OverdueActionItemsCount = overdueActionItems,
                UpcomingMeetings = upcomingMeetings,
                RecentlyCompleted = recentlyCompleted
            };
        }


        private void ValidateCreateMomDto(CreateMomDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.MeetingTitle))
                throw new ArgumentException("Meeting title is required");

            if (string.IsNullOrWhiteSpace(dto.MeetingType))
                throw new ArgumentException("Meeting type is required");

            if (dto.MeetingDate < DateTime.Now.AddYears(-1))
                throw new ArgumentException("Meeting date cannot be more than 1 year in the past");

            if (dto.DiscussionPoints != null && dto.DiscussionPoints.Count > 50)
                throw new ArgumentException("Maximum 50 discussion points allowed");

            if (dto.ActionItems != null && dto.ActionItems.Count > 100)
                throw new ArgumentException("Maximum 100 action items allowed");
        }

        private string MapRoleToEnum(string role)
        {
            if (string.IsNullOrWhiteSpace(role))
                return "Employee";

            var roleMapping = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
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

            if (roleMapping.TryGetValue(role, out string? mappedRole))
            {
                return mappedRole;
            }

            var roleLower = role.ToLower();
            if (roleLower.Contains("manager") || roleLower.Contains("lead") || roleLower.Contains("director"))
            {
                return "Manager";
            }

            if (roleLower.Contains("hr") || roleLower.Contains("human resource"))
            {
                return "HR";
            }

            return "Employee";
        }

        private MomResponseDto MapToMomResponseDto(Mom mom)
        {
            return new MomResponseDto
            {
                MomId = mom.Momid,
                MeetingId = mom.MeetingId,
                MeetingTitle = mom.MeetingTitle,
                MeetingType = mom.MeetingType,
                MeetingDate = mom.MeetingDate,
                MeetingLink = mom.MeetingLink,
                Attendees = mom.Attendees,
                CommentsObservations = mom.CommentsObservations,
                SubmittedByEmployeeId = mom.SubmittedByEmployeeId,
                SubmittedByEmployeeName = GetEmployeeName(mom.SubmittedByEmployee),
                SubmittedByRole = mom.SubmittedByRole,
                IsEditable = mom.IsEditable ?? false,
                CreatedAt = mom.CreatedAt,
                UpdatedAt = mom.UpdatedAt,
                DiscussionPoints = mom.Momdiscussionpoints?.Select(dp => new DiscussionPointResponseDto
                {
                    PointId = dp.PointId,
                    PointText = dp.PointText,
                    PointOrder = dp.PointOrder
                }).OrderBy(dp => dp.PointOrder).ToList() ?? new List<DiscussionPointResponseDto>(),
                ActionItems = mom.Momactionitems?.Select(ai => new ActionItemResponseDto
                {
                    ActionItemId = ai.ActionItemId,
                    TaskDescription = ai.TaskDescription,
                    AssignedToEmployeeId = ai.AssignedToEmployeeId,
                    AssignedToEmployeeName = GetEmployeeName(ai.AssignedToEmployee),
                    DueDate = ai.DueDate,
                    Status = ai.Status,
                    CreatedAt = ai.CreatedAt,
                    MeetingTitle = mom.MeetingTitle,
                    MomId = mom.Momid,
                    AssignedByEmployeeId = mom.SubmittedByEmployeeId,
                    AssignedByEmployeeName = GetEmployeeName(mom.SubmittedByEmployee)
                }).ToList() ?? new List<ActionItemResponseDto>()
            };
        }

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
                Participants = meeting.Meetingparticipants?.Select(mp => new MeetingParticipantDto
                {
                    ParticipantId = mp.ParticipantId,
                    EmployeeId = mp.EmployeeId,
                    EmployeeName = GetEmployeeName(mp.Employee)
                }).ToList() ?? new List<MeetingParticipantDto>()
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

        private async Task<List<EmployeeOneOnOneStatsDto>> GetEmployeeOneOnOneStatsAsync(
            int managerId,
            List<Meeting> meetings)
        {
            var teamMembers = await _meetingRepository.GetTeamMembersByManagerIdAsync(managerId);
            var now = DateTime.Now;
            var today = DateOnly.FromDateTime(now);

            var stats = new List<EmployeeOneOnOneStatsDto>();

            foreach (var employee in teamMembers)
            {
                var employeeMeetings = meetings.Where(m =>
                    m.Meetingparticipants != null &&
                    m.Meetingparticipants.Any(p => p.EmployeeId == employee.EmployeeId)).ToList();

                var completedMeetings = employeeMeetings.Count(m => m.Status == "Completed");
                var lastMeeting = employeeMeetings.OrderByDescending(m => m.MeetingDate).FirstOrDefault();
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
        
        public async Task<MeetingInvitationDto> SubmitRsvpAsync(RsvpResponseDto rsvpDto, int employeeId)
        {
            var validStatuses = new[] { "Accepted", "Declined", "Tentative" };
            if (!validStatuses.Contains(rsvpDto.RsvpStatus))
                throw new ArgumentException("Invalid RSVP status. Must be: Accepted, Declined, or Tentative");

            var participant = await _meetingRepository.GetMeetingParticipantAsync(rsvpDto.MeetingId, employeeId);
            if (participant == null)
                throw new Exception("Meeting invitation not found for this employee");

            if (participant.Meeting.Status == "Cancelled")
                throw new Exception("Cannot RSVP to a cancelled meeting");

            if (participant.Meeting.Status == "Completed")
                throw new Exception("Cannot RSVP to a completed meeting");

            if (participant.Meeting.MeetingDate < DateTime.Now)
                throw new Exception("Cannot RSVP to a past meeting");

            var updatedParticipant = await _meetingRepository.UpdateRsvpStatusAsync(
                participant.ParticipantId,
                rsvpDto.RsvpStatus,
                rsvpDto.RsvpComments);

            return MapToMeetingInvitationDto(updatedParticipant);
        }

        public async Task<List<MeetingInvitationDto>> GetMyMeetingInvitationsAsync(int employeeId)
        {
            var invitations = await _meetingRepository.GetMeetingInvitationsAsync(employeeId);
            return invitations.Select(MapToMeetingInvitationDto).ToList();
        }

        public async Task<MeetingRsvpSummaryDto> GetMeetingRsvpSummaryAsync(
            int meetingId, 
            int managerId, 
            string role)
        {
            var mappedRole = MapRoleToEnum(role);
            if (mappedRole != "Manager")
                throw new UnauthorizedAccessException("Only managers can view RSVP summaries");

            var meeting = await _meetingRepository.GetMeetingByIdAsync(meetingId);
            if (meeting == null)
                throw new Exception("Meeting not found");

            if (meeting.ScheduledByEmployeeId != managerId)
                throw new UnauthorizedAccessException("You can only view RSVP summary for meetings you scheduled");

            var participants = await _meetingRepository.GetMeetingRsvpSummaryAsync(meetingId);

            var acceptedCount = participants.Count(p => p.Rsvpstatus == "Accepted");
            var declinedCount = participants.Count(p => p.Rsvpstatus == "Declined");
            var tentativeCount = participants.Count(p => p.Rsvpstatus == "Tentative");
            var pendingCount = participants.Count(p => p.Rsvpstatus == "Pending");

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
                    RsvpStatus = p.Rsvpstatus,
                    RsvpResponseDate = p.RsvpresponseDate,
                    RsvpComments = p.Rsvpcomments
                }).ToList()
            };
        }

        public async Task<int> GetPendingRsvpCountAsync(int employeeId)
        {
            return await _meetingRepository.GetPendingRsvpCountAsync(employeeId);
        }

        private MeetingInvitationDto MapToMeetingInvitationDto(Meetingparticipant participant)
        {
            var daysUntilMeeting = (int)(participant.Meeting.MeetingDate - DateTime.Now).TotalDays;

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
                MeetingStatus = participant.Meeting.Status,
                RsvpStatus = participant.Rsvpstatus,
                RsvpResponseDate = participant.RsvpresponseDate,
                RsvpComments = participant.Rsvpcomments,
                DaysUntilMeeting = daysUntilMeeting,
               // IsUpcoming = participant.Meeting.MeetingDate > DateTime.Now
            };
        }
    }
}
