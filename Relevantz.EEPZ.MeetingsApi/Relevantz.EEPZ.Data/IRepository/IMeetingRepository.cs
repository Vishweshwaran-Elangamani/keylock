using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.Enums;

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
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken = default);

        Task<int> GetMeetingsByManagerCountAsync(
            int managerId,
            CancellationToken cancellationToken = default);

        Task<Meeting?> GetMeetingByIdAsync(
            int meetingId,
            CancellationToken cancellationToken = default);

        Task<List<Meeting>> GetMeetingsByParticipantIdAsync(
            int participantId,
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken = default);

        Task<int> GetMeetingsByParticipantCountAsync(
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
            int pageNumber,
            int pageSize,
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
            RsvpStatus rsvpStatus,
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


        Task<List<Employee>> GetEmployeesByIdsAsync(
            List<int> employeeIds,
            CancellationToken cancellationToken = default);
    }
}
