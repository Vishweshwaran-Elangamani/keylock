using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IMeetingRepository
    {
        Task<Meeting> CreateMeetingAsync(
            Meeting meeting, 
            CancellationToken cancellationToken = default);
        
        Task<List<Meetingparticipant>> AddMeetingParticipantsAsync(
            List<Meetingparticipant> participants, 
            CancellationToken cancellationToken = default);
        
        Task<List<Meeting>> GetMeetingsByManagerIdAsync(
            int managerId, 
            CancellationToken cancellationToken = default);
        
        Task<Meeting?> GetMeetingByIdAsync(
            int meetingId, 
            CancellationToken cancellationToken = default);
        
        Task<List<Meeting>> GetMeetingsByParticipantIdAsync(
            int participantId, 
            CancellationToken cancellationToken = default);

        Task<List<Meeting>> GetOneOnOneMeetingsByManagerAsync(
            int managerId,
            int? employeeId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            CancellationToken cancellationToken = default);

        Task<Employee?> GetEmployeeByIdAsync(
            int employeeId, 
            CancellationToken cancellationToken = default);
        
        Task<List<Employee>> GetTeamMembersByManagerIdAsync(
            int managerId,
            int pageNumber = 1,
            int pageSize = 20,
            CancellationToken cancellationToken = default);
        
        Task<int> GetTeamMembersCountAsync(
            int managerId, 
            CancellationToken cancellationToken = default);

        Task<Meetingparticipant?> GetMeetingParticipantAsync(
            int meetingId, 
            int employeeId, 
            CancellationToken cancellationToken = default);
        
        Task<Meetingparticipant> UpdateRsvpStatusAsync(
            int participantId, 
            string rsvpStatus, 
            string? rsvpComments,
            CancellationToken cancellationToken = default);
        
        Task<List<Meetingparticipant>> GetMeetingInvitationsAsync(
            int employeeId, 
            CancellationToken cancellationToken = default);
        
        Task<List<Meetingparticipant>> GetMeetingRsvpSummaryAsync(
            int meetingId, 
            CancellationToken cancellationToken = default);
        
        Task<int> GetPendingRsvpCountAsync(
            int employeeId, 
            CancellationToken cancellationToken = default);
    }
}
