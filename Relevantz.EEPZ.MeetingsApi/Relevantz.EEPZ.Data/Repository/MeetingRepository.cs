using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

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
            _logger.LogInformation(
                "DB Insert: Creating meeting. ScheduledByEmployeeId={ScheduledByEmployeeId} MeetingTitle={MeetingTitle} MeetingType={MeetingType} MeetingDate={MeetingDate}",
                meeting.ScheduledByEmployeeId,
                meeting.MeetingTitle,
                meeting.MeetingType,
                meeting.MeetingDate);

            _context.Meetings.Add(meeting);

            var affectedRows = await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "DB Insert: Meeting created successfully. MeetingId={MeetingId} AffectedRows={AffectedRows}",
                meeting.MeetingId,
                affectedRows);

            return meeting;
        }

        public async Task<List<Meetingparticipant>> AddMeetingParticipantsAsync(
            List<Meetingparticipant> participants,
            CancellationToken cancellationToken = default)
        {
            if (participants == null || participants.Count == 0)
            {
                _logger.LogWarning("DB Insert: AddMeetingParticipants called with empty list.");
                return new List<Meetingparticipant>();
            }

            var meetingId = participants[0].MeetingId;

            _logger.LogInformation(
                "DB Insert: Adding meeting participants. MeetingId={MeetingId} ParticipantCount={ParticipantCount}",
                meetingId,
                participants.Count);

            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            _context.Meetingparticipants.AddRange(participants);

            var affectedRows = await _context.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation(
                "DB Insert: Meeting participants added successfully. MeetingId={MeetingId} AffectedRows={AffectedRows}",
                meetingId,
                affectedRows);

            return participants;
        }

        public async Task<List<Meeting>> GetMeetingsByManagerIdAsync(
            int managerId,
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken = default)
        {
            _logger.LogDebug(
                "DB Query: GetMeetingsByManagerId started. ManagerId={ManagerId} PageNumber={PageNumber} PageSize={PageSize}",
                managerId,
                pageNumber,
                pageSize);

            var meetings = await _context.Meetings
                .AsNoTracking()
                .AsSingleQuery()
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

            _logger.LogDebug(
                "DB Query: GetMeetingsByManagerId completed. ManagerId={ManagerId} ReturnedCount={ReturnedCount}",
                managerId,
                meetings.Count);

            return meetings;
        }

        public async Task<int> GetMeetingsByManagerCountAsync(
            int managerId,
            CancellationToken cancellationToken = default)
        {
            _logger.LogDebug(
                "DB Query: GetMeetingsByManagerCount started. ManagerId={ManagerId}",
                managerId);

            var count = await _context.Meetings
                .AsNoTracking()
                .Where(m => m.ScheduledByEmployeeId == managerId)
                .CountAsync(cancellationToken);

            _logger.LogDebug(
                "DB Query: GetMeetingsByManagerCount completed. ManagerId={ManagerId} Count={Count}",
                managerId,
                count);

            return count;
        }

        public async Task<Meeting?> GetMeetingByIdAsync(int meetingId, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("DB Query: GetMeetingById started. MeetingId={MeetingId}", meetingId);

            var meeting = await _context.Meetings
                .AsNoTracking()
                .AsSplitQuery()
                .Include(m => m.Meetingparticipants)
                    .ThenInclude(mp => mp.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(m => m.ScheduledByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .FirstOrDefaultAsync(m => m.MeetingId == meetingId, cancellationToken);

            _logger.LogDebug(
                "DB Query: GetMeetingById completed. MeetingId={MeetingId} Found={Found}",
                meetingId,
                meeting != null);

            return meeting;
        }

        public async Task<List<Meeting>> GetMeetingsByParticipantIdAsync(
            int participantId,
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken = default)
        {
            _logger.LogDebug(
                "DB Query: GetMeetingsByParticipantId started. ParticipantId={ParticipantId} PageNumber={PageNumber} PageSize={PageSize}",
                participantId,
                pageNumber,
                pageSize);

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

            _logger.LogDebug(
                "DB Query: GetMeetingsByParticipantId completed. ParticipantId={ParticipantId} ReturnedCount={ReturnedCount}",
                participantId,
                meetings.Count);

            return meetings;
        }

        public async Task<int> GetMeetingsByParticipantCountAsync(
            int participantId,
            CancellationToken cancellationToken = default)
        {
            _logger.LogDebug(
                "DB Query: GetMeetingsByParticipantCount started. ParticipantId={ParticipantId}",
                participantId);

            var count = await _context.Meetings
                .AsNoTracking()
                .Where(m => m.Meetingparticipants.Any(mp => mp.EmployeeId == participantId))
                .CountAsync(cancellationToken);

            _logger.LogDebug(
                "DB Query: GetMeetingsByParticipantCount completed. ParticipantId={ParticipantId} Count={Count}",
                participantId,
                count);

            return count;
        }

        public async Task<List<Meeting>> GetOneOnOneMeetingsByManagerAsync(
            int managerId,
            int? employeeId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            CancellationToken cancellationToken = default)
        {
            _logger.LogDebug(
                "DB Query: GetOneOnOneMeetingsByManager started. ManagerId={ManagerId} EmployeeId={EmployeeId} StartDate={StartDate} EndDate={EndDate}",
                managerId,
                employeeId,
                startDate,
                endDate);

            var query = _context.Meetings
                .AsNoTracking()
                .AsSplitQuery()
                .Include(m => m.Meetingparticipants)
                    .ThenInclude(mp => mp.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(m => m.ScheduledByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(m => m.Moms)
                    .ThenInclude(mom => mom.Momdiscussionpoints)
                .Include(m => m.Moms)
                    .ThenInclude(mom => mom.Momactionitems)
                        .ThenInclude(ai => ai.AssignedToEmployee)
                            .ThenInclude(e => e.Userprofile)
                .Where(m => m.ScheduledByEmployeeId == managerId &&
                            m.MeetingType == AppConstants.MeetingTypes.OneOnOne)
                .AsQueryable();

            if (employeeId.HasValue)
                query = query.Where(m => m.Meetingparticipants.Any(mp => mp.EmployeeId == employeeId.Value));

            if (startDate.HasValue)
                query = query.Where(m => m.MeetingDate >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(m => m.MeetingDate <= endDate.Value);

            var meetings = await query
                .OrderByDescending(m => m.MeetingDate)
                .ToListAsync(cancellationToken);

            _logger.LogDebug(
                "DB Query: GetOneOnOneMeetingsByManager completed. ManagerId={ManagerId} ReturnedCount={ReturnedCount}",
                managerId,
                meetings.Count);

            return meetings;
        }

        public async Task<Employee?> GetEmployeeByIdAsync(int employeeId, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("DB Query: GetEmployeeById started. EmployeeId={EmployeeId}", employeeId);

            var employee = await _context.Employees
                .AsNoTracking()
                .Include(e => e.Userprofile)
                .FirstOrDefaultAsync(e => e.EmployeeId == employeeId, cancellationToken);

            _logger.LogDebug(
                "DB Query: GetEmployeeById completed. EmployeeId={EmployeeId} Found={Found}",
                employeeId,
                employee != null);

            return employee;
        }

        public async Task<List<Employee>> GetTeamMembersByManagerIdAsync(
            int managerId,
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken = default)
        {
            _logger.LogDebug(
                "DB Query: GetTeamMembersByManagerId started. ManagerId={ManagerId} PageNumber={PageNumber} PageSize={PageSize}",
                managerId,
                pageNumber,
                pageSize);

            var members = await _context.Employees
                .AsNoTracking()
                .Include(e => e.Userprofile)
                .Where(e => e.ReportingManagerEmployeeId == managerId)
                .OrderBy(e => e.Userprofile.FirstName)
                .ThenBy(e => e.Userprofile.LastName)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            _logger.LogDebug(
                "DB Query: GetTeamMembersByManagerId completed. ManagerId={ManagerId} ReturnedCount={ReturnedCount}",
                managerId,
                members.Count);

            return members;
        }

        public async Task<int> GetTeamMembersCountAsync(int managerId, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("DB Query: GetTeamMembersCount started. ManagerId={ManagerId}", managerId);

            var count = await _context.Employees
                .AsNoTracking()
                .Where(e => e.ReportingManagerEmployeeId == managerId)
                .CountAsync(cancellationToken);

            _logger.LogDebug(
                "DB Query: GetTeamMembersCount completed. ManagerId={ManagerId} Count={Count}",
                managerId,
                count);

            return count;
        }

        public async Task<Meetingparticipant?> GetMeetingParticipantAsync(
            int meetingId,
            int employeeId,
            CancellationToken cancellationToken = default)
        {
            _logger.LogDebug(
                "DB Query: GetMeetingParticipant started. MeetingId={MeetingId} EmployeeId={EmployeeId}",
                meetingId,
                employeeId);

            var participant = await _context.Meetingparticipants
                .Include(mp => mp.Meeting)
                    .ThenInclude(m => m.ScheduledByEmployee)
                        .ThenInclude(e => e.Userprofile)
                .Include(mp => mp.Employee)
                    .ThenInclude(e => e.Userprofile)
                .FirstOrDefaultAsync(
                    mp => mp.MeetingId == meetingId && mp.EmployeeId == employeeId,
                    cancellationToken);

            _logger.LogDebug(
                "DB Query: GetMeetingParticipant completed. MeetingId={MeetingId} EmployeeId={EmployeeId} Found={Found}",
                meetingId,
                employeeId,
                participant != null);

            return participant;
        }

        public async Task<Meetingparticipant> UpdateRsvpStatusAsync(
            int participantId,
            RsvpStatus rsvpStatus,
            string? rsvpComments,
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation(
                "DB Update: UpdateRsvpStatus started. ParticipantId={ParticipantId} NewStatus={NewStatus}",
                participantId,
                rsvpStatus);

            var participant = await _context.Meetingparticipants
                .Include(mp => mp.Meeting)
                .Include(mp => mp.Employee)
                    .ThenInclude(e => e.Userprofile)
                .FirstOrDefaultAsync(mp => mp.ParticipantId == participantId, cancellationToken);

            if (participant == null)
            {
                _logger.LogWarning(
                    "DB Update: UpdateRsvpStatus failed. Participant not found. ParticipantId={ParticipantId}",
                    participantId);

                throw new InvalidOperationException(AppConstants.ExceptionMessages.MeetingNotFound);
            }

            participant.Rsvpstatus = rsvpStatus.ToDbValue();
            participant.RsvpresponseDate = DateTime.UtcNow;
            participant.Rsvpcomments = rsvpComments;
            participant.UpdatedAt = DateTime.UtcNow;

            var affectedRows = await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "DB Update: UpdateRsvpStatus completed. ParticipantId={ParticipantId} DbStatus={DbStatus} AffectedRows={AffectedRows}",
                participantId,
                participant.Rsvpstatus,
                affectedRows);

            return participant;
        }

        public async Task<List<Meetingparticipant>> GetMeetingInvitationsAsync(
            int employeeId,
            CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("DB Query: GetMeetingInvitations started. EmployeeId={EmployeeId}", employeeId);

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

            _logger.LogDebug(
                "DB Query: GetMeetingInvitations completed. EmployeeId={EmployeeId} ReturnedCount={ReturnedCount}",
                employeeId,
                invitations.Count);

            return invitations;
        }

        public async Task<List<Meetingparticipant>> GetMeetingRsvpSummaryAsync(
            int meetingId,
            CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("DB Query: GetMeetingRsvpSummary started. MeetingId={MeetingId}", meetingId);

            var participants = await _context.Meetingparticipants
                .AsNoTracking()
                .Include(mp => mp.Employee)
                    .ThenInclude(e => e.Userprofile)
                .Where(mp => mp.MeetingId == meetingId)
                .OrderBy(mp => mp.Employee.Userprofile.FirstName)
                .ToListAsync(cancellationToken);

            _logger.LogDebug(
                "DB Query: GetMeetingRsvpSummary completed. MeetingId={MeetingId} ReturnedCount={ReturnedCount}",
                meetingId,
                participants.Count);

            return participants;
        }

        public async Task<int> GetPendingRsvpCountAsync(int employeeId, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("DB Query: GetPendingRsvpCount started. EmployeeId={EmployeeId}", employeeId);

            var now = DateTime.UtcNow;

            var count = await _context.Meetingparticipants
                .AsNoTracking()
                .Where(mp => mp.EmployeeId == employeeId
                    && mp.Rsvpstatus == AppConstants.RsvpStatusValues.Pending
                    && mp.Meeting.MeetingDate >= now
                    && mp.Meeting.Status == AppConstants.MeetingStatusValues.Scheduled)
                .CountAsync(cancellationToken);

            _logger.LogDebug(
                "DB Query: GetPendingRsvpCount completed. EmployeeId={EmployeeId} PendingCount={PendingCount}",
                employeeId,
                count);

            return count;
        }
    }
}
