    using Microsoft.EntityFrameworkCore;
    using Microsoft.Extensions.Logging;
    using Relevantz.EEPZ.Common.Constants;
    using Relevantz.EEPZ.Common.DTOs;
    using Relevantz.EEPZ.Common.Entities;
    using Relevantz.EEPZ.Data.DBContexts;
    using Relevantz.EEPZ.Data.Repository.Interfaces;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Relevantz.EEPZ.Common.Enums;
    using Relevantz.EEPZ.Common.Utils;


    namespace Relevantz.EEPZ.Data.Repository.Implementations
    {
        public class MeetingRepository : IMeetingRepository
        {
            private readonly EEPZDbContext _context;
            private readonly ILogger<MeetingRepository> _logger;

            public MeetingRepository(EEPZDbContext context, ILogger<MeetingRepository> logger)
            {
                _context = context ?? throw new ArgumentNullException(nameof(context));
                _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            }

            public async Task<Meeting> CreateMeetingAsync(Meeting meeting, CancellationToken cancellationToken = default)
            {
                if (meeting == null) throw new ArgumentNullException(nameof(meeting));

                _logger.LogInformation("Creating meeting. ScheduledByEmployeeId={ScheduledByEmployeeId}, MeetingTitle={MeetingTitle}", meeting.ScheduledByEmployeeId, meeting.MeetingTitle);

                _context.Meetings.Add(meeting);

                var affectedRows = await _context.SaveChangesAsync(cancellationToken);

                if (affectedRows == 0)
                    throw new InvalidOperationException(AppConstants.ExceptionMessages.InvalidOperation);

                _logger.LogInformation("Meeting created successfully. MeetingId={MeetingId}", meeting.MeetingId);
                return meeting;
            }

            public async Task<List<Meetingparticipant>> AddMeetingParticipantsAsync(List<Meetingparticipant> participants, CancellationToken cancellationToken = default)
            {
                if (participants == null || participants.Count == 0)
                {
                    _logger.LogWarning("AddMeetingParticipants called with empty list.");
                    return new List<Meetingparticipant>();
                }

                var meetingId = participants[0].MeetingId;
                _logger.LogInformation("Adding {ParticipantCount} participants to meeting. MeetingId={MeetingId}", participants.Count, meetingId);

                using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

                _context.Meetingparticipants.AddRange(participants);

                var affectedRows = await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                if (affectedRows == 0)
                    throw new InvalidOperationException(AppConstants.ExceptionMessages.InvalidOperation);

                _logger.LogInformation("Successfully added participants to meeting. MeetingId={MeetingId}", meetingId);
                return participants;
            }

            public async Task<List<Meeting>> GetMeetingsByManagerIdAsync(int managerId, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
            {
                if (managerId <= 0 || pageNumber <= 0 || pageSize <= 0)
                   throw new ArgumentException(AppConstants.ExceptionMessages.InvalidArgument);

                _logger.LogDebug("Getting meetings for ManagerId={ManagerId}. PageNumber={PageNumber}, PageSize={PageSize}", managerId, pageNumber, pageSize);

                var meetings = await _context.Meetings
                    .AsNoTracking()
                    .Include(m => m.Meetingparticipants)
                        .ThenInclude(mp => mp.Employee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(m => m.ScheduledByEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .Where(m => m.ScheduledByEmployeeId == managerId)
                    .OrderByDescending(m => m.MeetingDate)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync(cancellationToken);

                if (!meetings.Any())
                    _logger.LogWarning("No meetings found for ManagerId={ManagerId}", managerId);

                _logger.LogDebug("Retrieved {MeetingCount} meetings for ManagerId={ManagerId}", meetings.Count, managerId);
                return meetings;
            }

            public async Task<int> GetMeetingsByManagerCountAsync(int managerId, CancellationToken cancellationToken = default)
            {
                if (managerId <= 0)
                    throw new ArgumentException(AppConstants.ExceptionMessages.InvalidArgument);


                _logger.LogDebug("Counting meetings for ManagerId={ManagerId}", managerId);

                var count = await _context.Meetings
                    .AsNoTracking()
                    .Where(m => m.ScheduledByEmployeeId == managerId)
                    .CountAsync(cancellationToken);

                _logger.LogDebug("Meetings count for ManagerId={ManagerId}: {Count}", managerId, count);
                return count;
            }

            public async Task<Meeting?> GetMeetingByIdAsync(int meetingId, CancellationToken cancellationToken = default)
            {
                if (meetingId <= 0)
                   throw new ArgumentException(AppConstants.ExceptionMessages.InvalidMeetingId);


                _logger.LogDebug("Getting meeting by Id={MeetingId}", meetingId);

                var meeting = await _context.Meetings
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Include(m => m.Meetingparticipants)
                        .ThenInclude(mp => mp.Employee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(m => m.ScheduledByEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .FirstOrDefaultAsync(m => m.MeetingId == meetingId, cancellationToken);

                if (meeting == null)
                    _logger.LogWarning("Meeting with Id={MeetingId} not found", meetingId);

                return meeting;
            }

            public async Task<List<Meeting>> GetMeetingsByParticipantIdAsync(int participantId, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
            {
                if (participantId <= 0 || pageNumber <= 0 || pageSize <= 0)
                   throw new ArgumentException(AppConstants.ExceptionMessages.InvalidArgument);

                _logger.LogDebug("Getting meetings for ParticipantId={ParticipantId}. PageNumber={PageNumber}, PageSize={PageSize}", participantId, pageNumber, pageSize);

                var meetings = await _context.Meetings
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Include(m => m.Meetingparticipants)
                        .ThenInclude(mp => mp.Employee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(m => m.ScheduledByEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .Where(m => m.Meetingparticipants.Any(mp => mp.EmployeeId == participantId))
                    .OrderByDescending(m => m.MeetingDate)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync(cancellationToken);

                if (!meetings.Any())
                    _logger.LogWarning("No meetings found for ParticipantId={ParticipantId}", participantId);

                _logger.LogDebug("Retrieved {MeetingCount} meetings for ParticipantId={ParticipantId}", meetings.Count, participantId);
                return meetings;
            }

            public async Task<int> GetMeetingsByParticipantCountAsync(int participantId, CancellationToken cancellationToken = default)
            {
                if (participantId <= 0)
                  throw new ArgumentException(AppConstants.ExceptionMessages.InvalidArgument);

                _logger.LogDebug("Counting meetings for ParticipantId={ParticipantId}", participantId);

                var count = await _context.Meetings
                    .AsNoTracking()
                    .Where(m => m.Meetingparticipants.Any(mp => mp.EmployeeId == participantId))
                    .CountAsync(cancellationToken);

                _logger.LogDebug("Meetings count for ParticipantId={ParticipantId}: {Count}", participantId, count);
                return count;
            }

            public async Task<Meetingparticipant?> GetMeetingParticipantAsync(int meetingId, int employeeId, CancellationToken cancellationToken = default)
            {
                if (meetingId <= 0 || employeeId <= 0)
                    throw new ArgumentException(AppConstants.ExceptionMessages.InvalidArgument);

                _logger.LogDebug("Getting participant for MeetingId={MeetingId} and EmployeeId={EmployeeId}", meetingId, employeeId);

                var participant = await _context.Meetingparticipants
                    .Include(mp => mp.Meeting)
                        .ThenInclude(m => m.ScheduledByEmployee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(mp => mp.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .FirstOrDefaultAsync(mp => mp.MeetingId == meetingId && mp.EmployeeId == employeeId, cancellationToken);

                if (participant == null)
                    _logger.LogWarning("Participant not found for MeetingId={MeetingId} and EmployeeId={EmployeeId}", meetingId, employeeId);

                return participant;
            }

            public async Task<Meetingparticipant> UpdateRsvpStatusAsync(int participantId, RsvpStatus rsvpStatus, string? rsvpComments, CancellationToken cancellationToken = default)
            {
                if (participantId <= 0)
                    throw new ArgumentException(AppConstants.ExceptionMessages.InvalidArgument);

                _logger.LogInformation("Updating RSVP status for ParticipantId={ParticipantId} to Status={Status}", participantId, rsvpStatus);

                var participant = await _context.Meetingparticipants
                    .Include(mp => mp.Meeting)
                    .Include(mp => mp.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .FirstOrDefaultAsync(mp => mp.ParticipantId == participantId, cancellationToken);

                if (participant == null)
                    throw new InvalidOperationException(AppConstants.ExceptionMessages.InvalidOperation);

                participant.Rsvpstatus = rsvpStatus.ToDbValue();
                participant.RsvpresponseDate = DateTime.UtcNow;
                participant.Rsvpcomments = rsvpComments;
                participant.UpdatedAt = DateTime.UtcNow;

                var affectedRows = await _context.SaveChangesAsync(cancellationToken);

                if (affectedRows == 0)
                  throw new InvalidOperationException(AppConstants.ExceptionMessages.InvalidOperation);

                _logger.LogInformation("RSVP status updated successfully for ParticipantId={ParticipantId}", participantId);
                return participant;
            }

            public async Task<List<Meetingparticipant>> GetMeetingInvitationsAsync(int employeeId, CancellationToken cancellationToken = default)
            {
                if (employeeId <= 0)
                   throw new ArgumentException(AppConstants.ExceptionMessages.InvalidArgument);

                _logger.LogDebug("Getting meeting invitations for EmployeeId={EmployeeId}", employeeId);

                var invitations = await _context.Meetingparticipants
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Include(mp => mp.Meeting)
                        .ThenInclude(m => m.ScheduledByEmployee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(mp => mp.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Where(mp => mp.EmployeeId == employeeId)
                    .OrderByDescending(mp => mp.Meeting.MeetingDate)
                    .ToListAsync(cancellationToken);

                if (!invitations.Any())
                    _logger.LogWarning("No invitations found for EmployeeId={EmployeeId}", employeeId);

                _logger.LogDebug("Retrieved {InvitationCount} invitations for EmployeeId={EmployeeId}", invitations.Count, employeeId);
                return invitations;
            }

            public async Task<List<Meetingparticipant>> GetMeetingRsvpSummaryAsync(int meetingId, CancellationToken cancellationToken = default)
            {
                if (meetingId <= 0)
                    throw new ArgumentException(AppConstants.ExceptionMessages.InvalidMeetingId);


                _logger.LogDebug("Getting RSVP summary for MeetingId={MeetingId}", meetingId);

                var participants = await _context.Meetingparticipants
                    .AsNoTracking()
                    .Include(mp => mp.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Where(mp => mp.MeetingId == meetingId)
                    .OrderBy(mp => mp.Employee.Userprofile.FirstName)
                    .ToListAsync(cancellationToken);

                if (!participants.Any())
                    _logger.LogWarning("No participants found for MeetingId={MeetingId}", meetingId);

                _logger.LogDebug("Retrieved {ParticipantCount} participants for MeetingId={MeetingId}", participants.Count, meetingId);
                return participants;
            }

            public async Task<int> GetPendingRsvpCountAsync(int employeeId, CancellationToken cancellationToken = default)
            {
                if (employeeId <= 0)
                    throw new ArgumentException(AppConstants.ExceptionMessages.InvalidArgument);

                _logger.LogDebug("Getting pending RSVP count for EmployeeId={EmployeeId}", employeeId);

                var count = await _context.Meetingparticipants
                    .AsNoTracking()
                    .Where(mp => mp.EmployeeId == employeeId
                        && mp.Rsvpstatus == AppConstants.RsvpStatusValues.Pending
                        && mp.Meeting.MeetingDate >= DateTime.UtcNow
                        && mp.Meeting.Status == AppConstants.MeetingStatusValues.Scheduled)
                    .CountAsync(cancellationToken);

                _logger.LogDebug("Pending RSVP count for EmployeeId={EmployeeId}: {Count}", employeeId, count);
                return count;
            }

            public async Task<List<Meeting>> GetOneOnOneMeetingsByManagerAsync(
        int managerId,
        int? employeeId = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        CancellationToken cancellationToken = default)
            {
                if (managerId <= 0)
                    throw new ArgumentException(AppConstants.ExceptionMessages.InvalidArgument);

                _logger.LogDebug("Getting one-on-one meetings for ManagerId={ManagerId}", managerId);

                var query = _context.Meetings
                    .AsNoTracking()
                    .Include(m => m.Meetingparticipants)
                        .ThenInclude(mp => mp.Employee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(m => m.ScheduledByEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .Where(m => m.ScheduledByEmployeeId == managerId && m.MeetingType == AppConstants.MeetingTypes.OneOnOne)
                    .AsQueryable();

                if (employeeId.HasValue)
                    query = query.Where(m => m.Meetingparticipants.Any(mp => mp.EmployeeId == employeeId.Value));

                if (startDate.HasValue)
                    query = query.Where(m => m.MeetingDate >= startDate.Value);

                if (endDate.HasValue)
                    query = query.Where(m => m.MeetingDate <= endDate.Value);

                var meetings = await query.OrderByDescending(m => m.MeetingDate).ToListAsync(cancellationToken);

                if (!meetings.Any())
                    _logger.LogWarning("No one-on-one meetings found for ManagerId={ManagerId}", managerId);

                return meetings;
            }

            public async Task<List<Employee>> GetTeamMembersByManagerIdAsync(
        int managerId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
            {
                if (managerId <= 0 || pageNumber <= 0 || pageSize <= 0)
                   throw new ArgumentException(AppConstants.ExceptionMessages.InvalidArgument);

                _logger.LogDebug("Getting team members for ManagerId={ManagerId}. PageNumber={PageNumber}, PageSize={PageSize}", managerId, pageNumber, pageSize);

                var teamMembers = await _context.Employees
                    .AsNoTracking()
                    .Include(e => e.Userprofile)
                    .Where(e => e.ReportingManagerEmployeeId == managerId)
                    .OrderBy(e => e.Userprofile.FirstName)
                    .ThenBy(e => e.Userprofile.LastName)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync(cancellationToken);

                if (!teamMembers.Any())
                    _logger.LogWarning("No team members found for ManagerId={ManagerId}", managerId);

                return teamMembers;
            }


            public async Task<int> GetTeamMembersCountAsync(int managerId, CancellationToken cancellationToken = default)
            {
                if (managerId <= 0)
                    throw new ArgumentException(AppConstants.ExceptionMessages.InvalidArgument);

                _logger.LogDebug("Counting team members for ManagerId={ManagerId}", managerId);

                var count = await _context.Employees
                    .AsNoTracking()
                    .Where(e => e.ReportingManagerEmployeeId == managerId)
                    .CountAsync(cancellationToken);

                _logger.LogDebug("Team members count for ManagerId={ManagerId}: {Count}", managerId, count);
                return count;
            }

            


            public async Task<Employee?> GetEmployeeByIdAsync(int employeeId, CancellationToken cancellationToken = default)
            {
                if (employeeId <= 0)
                    throw new ArgumentException(AppConstants.ExceptionMessages.InvalidArgument);

                _logger.LogDebug("Getting employee by Id={EmployeeId}", employeeId);

                var employee = await _context.Employees
                    .AsNoTracking()
                    .Include(e => e.Userprofile)
                    .FirstOrDefaultAsync(e => e.EmployeeId == employeeId, cancellationToken);

                if (employee == null)
                    _logger.LogWarning("Employee with Id={EmployeeId} not found", employeeId);

                return employee;
            }

            public async Task<List<Employee>> GetEmployeesByIdsAsync(List<int> employeeIds, CancellationToken cancellationToken = default)
    {
        return await _context.Employees
            .Where(e => employeeIds.Contains(e.EmployeeId))
            .ToListAsync(cancellationToken);
    }


            














        }
    }
