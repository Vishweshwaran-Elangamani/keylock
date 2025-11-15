// Services/Interface/IMomService.cs
using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IMomService
    {
        // ============================================================================
        // MOM Operations (US034, US076, US077)
        // ============================================================================

        /// <summary>
        /// Creates a new MOM (Minutes of Meeting) record
        /// </summary>
        Task<MomResponseDto> CreateMomAsync(CreateMomDto createMomDto, int submittedByEmployeeId, string role);

        /// <summary>
        /// Retrieves a specific MOM by ID
        /// </summary>
        Task<MomResponseDto?> GetMomByIdAsync(int momId);

        /// <summary>
        /// Gets all MOMs submitted by a specific employee (US035, US077)
        /// </summary>
        Task<List<MomResponseDto>> GetMomsSubmittedByEmployeeAsync(int employeeId);

        /// <summary>
        /// Updates an existing MOM (Manager only) (US077)
        /// </summary>
        Task<MomResponseDto> UpdateMomAsync(UpdateMomDto updateMomDto, int employeeId, string role);

        /// <summary>
        /// Deletes a MOM (only submitter can delete)
        /// </summary>
        Task<bool> DeleteMomAsync(int momId, int employeeId, string role);

        // ============================================================================
        // HR Operations (US119) - NEW
        // ============================================================================

        /// <summary>
        /// Gets all MOMs across the organization (HR only) (US119)
        /// </summary>
        /// <param name="hrEmployeeId">HR employee ID making the request</param>
        /// <param name="role">Role from JWT token for validation</param>
        /// <param name="searchTerm">Optional search term for meeting title or attendees</param>
        /// <param name="meetingType">Optional filter by meeting type</param>
        /// <param name="departmentId">Optional filter by department</param>
        /// <param name="startDate">Optional start date filter</param>
        /// <param name="endDate">Optional end date filter</param>
        /// <param name="pageNumber">Page number for pagination (default: 1)</param>
        /// <param name="pageSize">Number of records per page (default: 20)</param>
        Task<PaginatedMomResponseDto> GetAllMomsForHRAsync(
            int hrEmployeeId,
            string role,
            string? searchTerm = null,
            string? meetingType = null,
            int? departmentId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int pageNumber = 1,
            int pageSize = 20);

        // ============================================================================
        // Sharing Operations (US035)
        // ============================================================================

        /// <summary>
        /// Shares a MOM with other employees
        /// </summary>
        Task<List<MomSharingResponseDto>> ShareMomAsync(ShareMomDto shareMomDto, int sharedByEmployeeId);

        /// <summary>
        /// Gets all MOMs shared by the logged-in employee
        /// </summary>
        Task<List<MomSharingResponseDto>> GetMomsSharedByEmployeeAsync(int employeeId);

        /// <summary>
        /// Gets all MOMs that have been shared with the logged-in employee
        /// </summary>
        Task<List<MomResponseDto>> GetMomsSharedWithEmployeeAsync(int employeeId);

        // ============================================================================
        // Meeting Scheduling Operations (US059)
        // ============================================================================

        /// <summary>
        /// Schedules a new meeting (one-on-one or team meeting) (US059)
        /// </summary>
        Task<MeetingResponseDto> ScheduleMeetingAsync(
            ScheduleMeetingDto scheduleMeetingDto,
            int scheduledByEmployeeId,
            string role);

        /// <summary>
        /// Gets all meetings scheduled by a manager
        /// </summary>
        Task<List<MeetingResponseDto>> GetMeetingsByManagerIdAsync(int managerId);

        /// <summary>
        /// Retrieves a specific meeting by ID
        /// </summary>
        Task<MeetingResponseDto?> GetMeetingByIdAsync(int meetingId);

        // ============================================================================
        // One-on-One Reports (US060) - NEW
        // ============================================================================

        /// <summary>
        /// Gets reports and analytics for one-on-one discussions (Manager only) (US060)
        /// </summary>
        /// <param name="managerId">Manager employee ID making the request</param>
        /// <param name="role">Role from JWT token for validation</param>
        /// <param name="employeeId">Optional filter by specific team member</param>
        /// <param name="startDate">Optional start date for report period</param>
        /// <param name="endDate">Optional end date for report period</param>
        Task<OneOnOneReportDto> GetOneOnOneReportsAsync(
            int managerId,
            string role,
            int? employeeId = null,
            DateTime? startDate = null,
            DateTime? endDate = null);

        /// <summary>
        /// Gets summary statistics for all one-on-one meetings (US060)
        /// </summary>
        Task<OneOnOneSummaryDto> GetOneOnOneSummaryAsync(int managerId, string role);

        // ============================================================================
        // Action Item Management
        // ============================================================================

        /// <summary>
        /// Updates the status of an action item (Pending/Completed)
        /// </summary>
        Task<bool> UpdateActionItemStatusAsync(int actionItemId, string status, int employeeId);

        /// <summary>
        /// Gets all action items assigned to an employee
        /// </summary>
        Task<List<ActionItemResponseDto>> GetMyActionItemsAsync(int employeeId);

        /// <summary>
        /// Gets all action items assigned by an employee (Manager view)
        /// </summary>
        Task<List<ActionItemResponseDto>> GetActionItemsAssignedByMeAsync(int employeeId);

        /// <summary>
        /// Gets all overdue action items for an employee
        /// </summary>
        Task<List<ActionItemResponseDto>> GetOverdueActionItemsAsync(int employeeId);
        


        // ============================================================================
        // RSVP OPERATIONS (US061)
        // ============================================================================
        
        /// <summary>
        /// Submit RSVP response to meeting invitation
        /// </summary>
        Task<MeetingInvitationDto> SubmitRsvpAsync(RsvpResponseDto rsvpDto, int employeeId);
        
        /// <summary>
        /// Get all meeting invitations for logged-in employee
        /// </summary>
        Task<List<MeetingInvitationDto>> GetMyMeetingInvitationsAsync(int employeeId);
        
        /// <summary>
        /// Get RSVP summary for a meeting (Manager view)
        /// </summary>
        Task<MeetingRsvpSummaryDto> GetMeetingRsvpSummaryAsync(int meetingId, int managerId, string role);
        
        /// <summary>
        /// Get count of pending RSVP invitations
        /// </summary>
        Task<int> GetPendingRsvpCountAsync(int employeeId);
    }
}
