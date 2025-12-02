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
    public class MomRepository : IMomRepository
    {
        private readonly EEPZDbContext _context;

        public MomRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Mom> CreateMomAsync(Mom mom)
        {
            _context.Moms.Add(mom);
            await _context.SaveChangesAsync();
            return mom;
        }

        public async Task<Mom?> GetMomByIdAsync(int momId)
        {
            return await _context.Moms
                .Include(m => m.Momdiscussionpoints)
                .Include(m => m.Momactionitems)
                    .ThenInclude(ai => ai.AssignedToEmployee)
                        .ThenInclude(e => e.Userprofile)
                .Include(m => m.SubmittedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .FirstOrDefaultAsync(m => m.Momid == momId);
        }

        public async Task<List<Mom>> GetMomsByEmployeeIdAsync(int employeeId)
        {
            return await _context.Moms
                .Include(m => m.Momdiscussionpoints)
                .Include(m => m.Momactionitems)
                .Include(m => m.SubmittedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Where(m => m.SubmittedByEmployeeId == employeeId)
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Mom>> GetMomsSubmittedByEmployeeAsync(int employeeId)
        {
            return await _context.Moms
                .Include(m => m.Momdiscussionpoints)
                .Include(m => m.Momactionitems)
                    .ThenInclude(ai => ai.AssignedToEmployee)
                        .ThenInclude(e => e.Userprofile)
                .Include(m => m.SubmittedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Where(m => m.SubmittedByEmployeeId == employeeId)
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Mom>> GetMomsSharedWithEmployeeAsync(int employeeId)
        {
            var sharedMomIds = await _context.Momsharings
                .Where(ms => ms.SharedWithEmployeeId == employeeId)
                .Select(ms => ms.Momid)
                .ToListAsync();

            return await _context.Moms
                .Include(m => m.Momdiscussionpoints)
                .Include(m => m.Momactionitems)
                    .ThenInclude(ai => ai.AssignedToEmployee)
                        .ThenInclude(e => e.Userprofile)
                .Include(m => m.SubmittedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Where(m => sharedMomIds.Contains(m.Momid))
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task<Mom> UpdateMomAsync(Mom mom)
        {
            _context.Moms.Update(mom);
            await _context.SaveChangesAsync();
            return mom;
        }

        public async Task<bool> DeleteMomAsync(int momId)
        {
            var mom = await _context.Moms.FindAsync(momId);
            if (mom == null) return false;

            _context.Moms.Remove(mom);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetAllMomsCountAsync(
            string? searchTerm = null,
            string? meetingType = null,
            int? departmentId = null,
            DateTime? startDate = null,
            DateTime? endDate = null)
        {
            var query = _context.Moms.AsQueryable();

            query = ApplyMomFilters(query, searchTerm, meetingType, departmentId, startDate, endDate);
            return await query.CountAsync();
        }

        public async Task<List<Mom>> GetAllMomsAsync(
            string? searchTerm = null,
            string? meetingType = null,
            int? departmentId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int pageNumber = 1,
            int pageSize = 20)
        {
            var query = _context.Moms
                .Include(m => m.Momdiscussionpoints)
                .Include(m => m.Momactionitems)
                    .ThenInclude(ai => ai.AssignedToEmployee)
                        .ThenInclude(e => e.Userprofile)
                .Include(m => m.SubmittedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .AsQueryable();

            query = ApplyMomFilters(query, searchTerm, meetingType, departmentId, startDate, endDate);

            return await query
                .OrderByDescending(m => m.MeetingDate)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        private IQueryable<Mom> ApplyMomFilters(
            IQueryable<Mom> query,
            string? searchTerm,
            string? meetingType,
            int? departmentId,
            DateTime? startDate,
            DateTime? endDate)
        {
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                query = query.Where(m =>
                    m.MeetingTitle.Contains(searchTerm) ||
                    m.Attendees.Contains(searchTerm));
            }

            if (!string.IsNullOrWhiteSpace(meetingType))
            {
                query = query.Where(m => m.MeetingType == meetingType);
            }

            if (startDate.HasValue)
            {
                query = query.Where(m => m.MeetingDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(m => m.MeetingDate <= endDate.Value);
            }

            return query;
        }

        public async Task<List<Momdiscussionpoint>> AddDiscussionPointsAsync(List<Momdiscussionpoint> points)
        {
            _context.Momdiscussionpoints.AddRange(points);
            await _context.SaveChangesAsync();
            return points;
        }

        public async Task<bool> DeleteDiscussionPointsByMomIdAsync(int momId)
        {
            var points = await _context.Momdiscussionpoints
                .Where(dp => dp.Momid == momId)
                .ToListAsync();

            _context.Momdiscussionpoints.RemoveRange(points);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<Momactionitem>> AddActionItemsAsync(List<Momactionitem> actionItems)
        {
            _context.Momactionitems.AddRange(actionItems);
            await _context.SaveChangesAsync();
            return actionItems;
        }

        public async Task<bool> DeleteActionItemsByMomIdAsync(int momId)
        {
            var actionItems = await _context.Momactionitems
                .Where(ai => ai.Momid == momId)
                .ToListAsync();

            _context.Momactionitems.RemoveRange(actionItems);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<Momactionitem?> GetActionItemByIdAsync(int actionItemId)
        {
            return await _context.Momactionitems
                .Include(ai => ai.AssignedToEmployee)
                    .ThenInclude(e => e.Userprofile)
                .FirstOrDefaultAsync(ai => ai.ActionItemId == actionItemId);
        }

        public async Task<Momactionitem?> UpdateActionItemStatusAsync(int actionItemId, string status)
        {
            var actionItem = await _context.Momactionitems.FindAsync(actionItemId);
            if (actionItem == null) return null;

            actionItem.Status = status;
            await _context.SaveChangesAsync();
            return actionItem;
        }


        public async Task<List<Momactionitem>> GetActionItemsByEmployeeIdAsync(int employeeId)
        {
            Console.WriteLine("========================================");
            Console.WriteLine($"[REPO] Fetching action items for employee {employeeId}");
            Console.WriteLine("========================================");
            
            
            var actionItems = await _context.Momactionitems
                .Where(ai => ai.AssignedToEmployeeId == employeeId)
                .ToListAsync();

            Console.WriteLine($"[REPO] Found {actionItems.Count} action items");

           
            var momIds = actionItems.Select(ai => ai.Momid).Distinct().ToList();
            Console.WriteLine($"[REPO] Need to load {momIds.Count} MOMs");

            
            var moms = await _context.Moms
                .Include(m => m.SubmittedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Where(m => momIds.Contains(m.Momid))
                .ToListAsync();

            Console.WriteLine($"[REPO] Loaded {moms.Count} MOMs");

           
            foreach (var item in actionItems)
            {
                item.Mom = moms.FirstOrDefault(m => m.Momid == item.Momid);
                if (item.Mom != null)
                {
                    Console.WriteLine($"[REPO] Assigned MOM '{item.Mom.MeetingTitle}' (ID: {item.Mom.Momid}) to Action Item {item.ActionItemId}");
                }
                else
                {
                    Console.WriteLine($"[REPO] Could not find MOM {item.Momid} for Action Item {item.ActionItemId}");
                }
            }

            // Step 5: Load assigned employees
            var employeeIds = actionItems.Select(ai => ai.AssignedToEmployeeId).Distinct().ToList();
            var employees = await _context.Employees
                .Include(e => e.Userprofile)
                .Where(e => employeeIds.Contains(e.EmployeeId))
                .ToListAsync();

            foreach (var item in actionItems)
            {
                item.AssignedToEmployee = employees.FirstOrDefault(e => e.EmployeeId == item.AssignedToEmployeeId);
            }

            Console.WriteLine("========================================");
            Console.WriteLine($"[REPO] Returning {actionItems.Count} action items with loaded MOMs");
            Console.WriteLine("========================================");

            return actionItems.OrderBy(ai => ai.DueDate).ToList();
        }

        
        public async Task<List<Momactionitem>> GetActionItemsAssignedByEmployeeAsync(int employeeId)
        {
            Console.WriteLine("========================================");
            Console.WriteLine($"[REPO] Fetching action items assigned by employee {employeeId}");
            Console.WriteLine("========================================");
            
            
            var momIds = await _context.Moms
                .Where(m => m.SubmittedByEmployeeId == employeeId)
                .Select(m => m.Momid)
                .ToListAsync();

            Console.WriteLine($"[REPO] Found {momIds.Count} MOMs created by this employee");

            
            var actionItems = await _context.Momactionitems
                .Where(ai => momIds.Contains(ai.Momid))
                .ToListAsync();

            Console.WriteLine($"[REPO] Found {actionItems.Count} action items assigned by this employee");

            
            var moms = await _context.Moms
                .Include(m => m.SubmittedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Where(m => momIds.Contains(m.Momid))
                .ToListAsync();

            Console.WriteLine($"[REPO] Loaded {moms.Count} MOMs");

            
            foreach (var item in actionItems)
            {
                item.Mom = moms.FirstOrDefault(m => m.Momid == item.Momid);
                if (item.Mom != null)
                {
                    Console.WriteLine($"[REPO] Assigned MOM '{item.Mom.MeetingTitle}' (ID: {item.Mom.Momid}) to Action Item {item.ActionItemId}");
                }
            }

            var employeeIdsList = actionItems.Select(ai => ai.AssignedToEmployeeId).Distinct().ToList();
            var employees = await _context.Employees
                .Include(e => e.Userprofile)
                .Where(e => employeeIdsList.Contains(e.EmployeeId))
                .ToListAsync();

            foreach (var item in actionItems)
            {
                item.AssignedToEmployee = employees.FirstOrDefault(e => e.EmployeeId == item.AssignedToEmployeeId);
            }

            Console.WriteLine("========================================");
            Console.WriteLine($"[REPO] Returning {actionItems.Count} action items with loaded MOMs");
            Console.WriteLine("========================================");

            return actionItems.OrderBy(ai => ai.DueDate).ToList();
        }

        public async Task<List<Momsharing>> ShareMomAsync(List<Momsharing> sharings)
        {
            _context.Momsharings.AddRange(sharings);
            await _context.SaveChangesAsync();
            return sharings;
        }

        public async Task<List<Momsharing>> GetMomSharingsByEmployeeIdAsync(int employeeId)
        {
            return await _context.Momsharings
                .Include(ms => ms.Mom)
                .Include(ms => ms.SharedByEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(ms => ms.SharedWithEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Where(ms => ms.SharedByEmployeeId == employeeId)
                .OrderByDescending(ms => ms.SharedAt)
                .ToListAsync();
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
