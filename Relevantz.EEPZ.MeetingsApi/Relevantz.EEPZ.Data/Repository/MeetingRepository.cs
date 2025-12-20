using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class MeetingRepository : IMeetingRepository
    {
        private readonly EEPZDbContext _context;

        public MeetingRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Meeting> CreateMeetingAsync(Meeting meeting)
        {
            _context.Meetings.Add(meeting);
            await _context.SaveChangesAsync();
            return meeting;
        }

        public async Task<List<Meetingparticipant>> AddMeetingParticipantsAsync(List<Meetingparticipant> participants)
        {
            _context.Meetingparticipants.AddRange(participants);
            await _context.SaveChangesAsync();
            return participants;
        }

        public async Task<List<Meeting>> GetMeetingsByManagerIdAsync(int managerId)
        {
            return await _context.Meetings
                .Include(m => m.Meetingparticipants)
                    .ThenInclude(mp => mp.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(m => m.ScheduledByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Where(m => m.ScheduledByEmployeeId == managerId)
                .OrderByDescending(m => m.MeetingDate)
                .ToListAsync();
        }

        public async Task<Meeting?> GetMeetingByIdAsync(int meetingId)
        {
            return await _context.Meetings
                .Include(m => m.Meetingparticipants)
                    .ThenInclude(mp => mp.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(m => m.ScheduledByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .FirstOrDefaultAsync(m => m.MeetingId == meetingId);
        }

        public async Task<List<Meeting>> GetMeetingsByParticipantIdAsync(int participantId)
        {
            var meetingIds = await _context.Meetingparticipants
                .Where(mp => mp.EmployeeId == participantId)
                .Select(mp => mp.MeetingId)
                .ToListAsync();

            return await _context.Meetings
                .Include(m => m.Meetingparticipants)
                    .ThenInclude(mp => mp.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(m => m.ScheduledByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Where(m => meetingIds.Contains(m.MeetingId))
                .OrderByDescending(m => m.MeetingDate)
                .ToListAsync();
        }

        public async Task<List<Meeting>> GetOneOnOneMeetingsByManagerAsync(
            int managerId,
            int? employeeId = null,
            DateTime? startDate = null,
            DateTime? endDate = null)
        {
            var query = _context.Meetings
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
                .ToListAsync();
        }

        public async Task<Employee?> GetEmployeeByIdAsync(int employeeId)
        {
            return await _context.Employees
                .Include(e => e.Userprofile)
                .FirstOrDefaultAsync(e => e.EmployeeId == employeeId);
        }

        public async Task<List<Employee>> GetTeamMembersByManagerIdAsync(int managerId)
        {
            return await _context.Employees
                .Include(e => e.Userprofile)
                .Where(e => e.ReportingManagerEmployeeId == managerId)
                .OrderBy(e => e.Userprofile.FirstName)
                .ThenBy(e => e.Userprofile.LastName)
                .ToListAsync();
        }

        public async Task<Meetingparticipant?> GetMeetingParticipantAsync(int meetingId, int employeeId)
        {
            return await _context.Meetingparticipants
                .Include(mp => mp.Meeting)
                    .ThenInclude(m => m.ScheduledByEmployee)
                        .ThenInclude(e => e.Userprofile)
                .Include(mp => mp.Employee)
                    .ThenInclude(e => e.Userprofile)
                .FirstOrDefaultAsync(mp => mp.MeetingId == meetingId && mp.EmployeeId == employeeId);
        }

        public async Task<Meetingparticipant> UpdateRsvpStatusAsync(
            int participantId, 
            string rsvpStatus, 
            string? rsvpComments)
        {
            var participant = await _context.Meetingparticipants
                .Include(mp => mp.Meeting)
                .Include(mp => mp.Employee)
                    .ThenInclude(e => e.Userprofile)
                .FirstOrDefaultAsync(mp => mp.ParticipantId == participantId);

            if (participant == null)
                throw new Exception("Meeting participant not found");

            participant.Rsvpstatus = rsvpStatus;
            participant.RsvpresponseDate = DateTime.Now;
            participant.Rsvpcomments = rsvpComments;
            participant.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return participant;
        }

        public async Task<List<Meetingparticipant>> GetMeetingInvitationsAsync(int employeeId)
        {
            return await _context.Meetingparticipants
                .Include(mp => mp.Meeting)
                    .ThenInclude(m => m.ScheduledByEmployee)
                        .ThenInclude(e => e.Userprofile)
                .Include(mp => mp.Employee)
                    .ThenInclude(e => e.Userprofile)
                .Where(mp => mp.EmployeeId == employeeId)
                .OrderByDescending(mp => mp.Meeting.MeetingDate)
                .ToListAsync();
        }

        public async Task<List<Meetingparticipant>> GetMeetingRsvpSummaryAsync(int meetingId)
        {
            return await _context.Meetingparticipants
                .Include(mp => mp.Employee)
                    .ThenInclude(e => e.Userprofile)
                .Where(mp => mp.MeetingId == meetingId)
                .OrderBy(mp => mp.Employee.Userprofile.FirstName)
                .ToListAsync();
        }

        public async Task<int> GetPendingRsvpCountAsync(int employeeId)
        {
            var now = DateTime.Now;
            return await _context.Meetingparticipants
                .Where(mp => mp.EmployeeId == employeeId 
                    && mp.Rsvpstatus == "Pending"
                    && mp.Meeting.MeetingDate >= now
                    && mp.Meeting.Status == "Scheduled")
                .CountAsync();
        }
    }
}
