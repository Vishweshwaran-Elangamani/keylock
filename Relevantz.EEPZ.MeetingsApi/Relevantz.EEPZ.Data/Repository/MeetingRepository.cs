using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class MeetingRepository : IMeetingRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<MeetingRepository> _logger;

        public MeetingRepository(EEPZDbContext context, ILogger<MeetingRepository> logger)
        {
            _context = context;
            _logger = logger;
        }
        public async Task<Meeting> CreateMeetingAsync(Meeting meeting, CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Creating new meeting: {MeetingTitle}", meeting.MeetingTitle);
                _context.Meetings.Add(meeting);
                await _context.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Meeting created successfully with ID: {MeetingId}", meeting.MeetingId);
                return meeting;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating meeting: {MeetingTitle}", meeting.MeetingTitle);
                throw;
            }
        }
        public async Task<List<Meetingparticipant>> AddMeetingParticipantsAsync(
            List<Meetingparticipant> participants,
            CancellationToken cancellationToken = default)
        {
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                _logger.LogInformation("Adding {Count} meeting participants", participants.Count);
                _context.Meetingparticipants.AddRange(participants);
                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                _logger.LogInformation("Meeting participants added successfully");
                return participants;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding meeting participants");
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }
        public async Task<List<Meeting>> GetMeetingsByManagerIdAsync(
            int managerId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Fetching meetings for manager ID: {ManagerId}", managerId);
                return await _context.Meetings
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Include(m => m.Meetingparticipants)
                        .ThenInclude(mp => mp.Employee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(m => m.ScheduledByEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .Where(m => m.ScheduledByEmployeeId == managerId)
                    .OrderByDescending(m => m.MeetingDate)
                    .ToListAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching meetings for manager ID: {ManagerId}", managerId);
                throw;
            }
        }
        public async Task<Meeting?> GetMeetingByIdAsync(int meetingId, CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Fetching meeting by ID: {MeetingId}", meetingId);
                return await _context.Meetings
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Include(m => m.Meetingparticipants)
                        .ThenInclude(mp => mp.Employee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(m => m.ScheduledByEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .FirstOrDefaultAsync(m => m.MeetingId == meetingId, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching meeting by ID: {MeetingId}", meetingId);
                throw;
            }
        }
        public async Task<List<Meeting>> GetMeetingsByParticipantIdAsync(
            int participantId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Fetching meetings for participant ID: {ParticipantId}", participantId);
                return await _context.Meetings
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Include(m => m.Meetingparticipants)
                        .ThenInclude(mp => mp.Employee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(m => m.ScheduledByEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .Where(m => m.Meetingparticipants.Any(mp => mp.EmployeeId == participantId))
                    .OrderByDescending(m => m.MeetingDate)
                    .ToListAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching meetings for participant ID: {ParticipantId}", participantId);
                throw;
            }
        }
        public async Task<List<Meeting>> GetOneOnOneMeetingsByManagerAsync(
            int managerId,
            int? employeeId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation(
                    "Fetching one-on-one meetings for manager ID: {ManagerId}, Employee ID: {EmployeeId}",
                    managerId,
                    employeeId);

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
                    .Where(m => m.ScheduledByEmployeeId == managerId && m.MeetingType == "One-on-One")
                    .AsQueryable();

                if (employeeId.HasValue)
                {
                    query = query.Where(m => m.Meetingparticipants
                        .Any(mp => mp.EmployeeId == employeeId.Value));
                }

                if (startDate.HasValue)
                {
                    query = query.Where(m => m.MeetingDate >= startDate.Value);
                }

                if (endDate.HasValue)
                {
                    query = query.Where(m => m.MeetingDate <= endDate.Value);
                }

                return await query
                    .OrderByDescending(m => m.MeetingDate)
                    .ToListAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching one-on-one meetings for manager ID: {ManagerId}", managerId);
                throw;
            }
        }
        public async Task<Employee?> GetEmployeeByIdAsync(int employeeId, CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Fetching employee by ID: {EmployeeId}", employeeId);
                return await _context.Employees
                    .AsNoTracking()
                    .Include(e => e.Userprofile)
                    .FirstOrDefaultAsync(e => e.EmployeeId == employeeId, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching employee by ID: {EmployeeId}", employeeId);
                throw;
            }
        }
        public async Task<List<Employee>> GetTeamMembersByManagerIdAsync(
            int managerId,
            int pageNumber = 1,
            int pageSize = 20,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation(
                    "Fetching team members for manager ID: {ManagerId}, Page: {PageNumber}, Size: {PageSize}",
                    managerId,
                    pageNumber,
                    pageSize);

                return await _context.Employees
                    .AsNoTracking()
                    .Include(e => e.Userprofile)
                    .Where(e => e.ReportingManagerEmployeeId == managerId)
                    .OrderBy(e => e.Userprofile.FirstName)
                    .ThenBy(e => e.Userprofile.LastName)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching team members for manager ID: {ManagerId}", managerId);
                throw;
            }
        }
        public async Task<int> GetTeamMembersCountAsync(int managerId, CancellationToken cancellationToken = default)
        {
            try
            {
                return await _context.Employees
                    .AsNoTracking()
                    .Where(e => e.ReportingManagerEmployeeId == managerId)
                    .CountAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting team members count for manager ID: {ManagerId}", managerId);
                throw;
            }
        }
        public async Task<Meetingparticipant?> GetMeetingParticipantAsync(
            int meetingId,
            int employeeId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation(
                    "Fetching meeting participant for Meeting ID: {MeetingId}, Employee ID: {EmployeeId}",
                    meetingId,
                    employeeId);

                return await _context.Meetingparticipants
                    .Include(mp => mp.Meeting)
                        .ThenInclude(m => m.ScheduledByEmployee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(mp => mp.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .FirstOrDefaultAsync(
                        mp => mp.MeetingId == meetingId && mp.EmployeeId == employeeId,
                        cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error fetching meeting participant for Meeting ID: {MeetingId}, Employee ID: {EmployeeId}",
                    meetingId,
                    employeeId);
                throw;
            }
        }
        public async Task<Meetingparticipant> UpdateRsvpStatusAsync(
            int participantId,
            string rsvpStatus,
            string? rsvpComments,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Updating RSVP status for participant ID: {ParticipantId}", participantId);

                var participant = await _context.Meetingparticipants
                    .Include(mp => mp.Meeting)
                    .Include(mp => mp.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .FirstOrDefaultAsync(mp => mp.ParticipantId == participantId, cancellationToken);

                if (participant == null)
                {
                    _logger.LogWarning("Meeting participant not found: {ParticipantId}", participantId);
                    throw new Exception("Meeting participant not found");
                }

                participant.Rsvpstatus = rsvpStatus;
                participant.RsvpresponseDate = DateTime.Now;
                participant.Rsvpcomments = rsvpComments;
                participant.UpdatedAt = DateTime.Now;

                try
                {
                    await _context.SaveChangesAsync(cancellationToken);
                    _logger.LogInformation("RSVP status updated successfully for participant ID: {ParticipantId}", participantId);
                }
                catch (DbUpdateConcurrencyException ex)
                {
                    _logger.LogWarning(
                        ex,
                        "Concurrency conflict when updating RSVP for participant ID: {ParticipantId}",
                        participantId);
                    throw new Exception("The record was modified by another user. Please refresh and try again.", ex);
                }

                return participant;
            }
            catch (Exception ex) when (!(ex is DbUpdateConcurrencyException))
            {
                _logger.LogError(ex, "Error updating RSVP status for participant ID: {ParticipantId}", participantId);
                throw;
            }
        }
        public async Task<List<Meetingparticipant>> GetMeetingInvitationsAsync(
            int employeeId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Fetching meeting invitations for employee ID: {EmployeeId}", employeeId);
                return await _context.Meetingparticipants
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
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching meeting invitations for employee ID: {EmployeeId}", employeeId);
                throw;
            }
        }
        public async Task<List<Meetingparticipant>> GetMeetingRsvpSummaryAsync(
            int meetingId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Fetching RSVP summary for meeting ID: {MeetingId}", meetingId);
                return await _context.Meetingparticipants
                    .AsNoTracking()
                    .Include(mp => mp.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Where(mp => mp.MeetingId == meetingId)
                    .OrderBy(mp => mp.Employee.Userprofile.FirstName)
                    .ToListAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching RSVP summary for meeting ID: {MeetingId}", meetingId);
                throw;
            }
        }
        public async Task<int> GetPendingRsvpCountAsync(
            int employeeId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Getting pending RSVP count for employee ID: {EmployeeId}", employeeId);
                var now = DateTime.Now;
                return await _context.Meetingparticipants
                    .AsNoTracking()
                    .Where(mp => mp.EmployeeId == employeeId
                        && mp.Rsvpstatus == "Pending"
                        && mp.Meeting.MeetingDate >= now
                        && mp.Meeting.Status == "Scheduled")
                    .CountAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pending RSVP count for employee ID: {EmployeeId}", employeeId);
                throw;
            }
        }
    }
}
