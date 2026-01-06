using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs
{
    public enum RsvpStatus
    {
        Pending = 0,
        Accepted = 1,
        Declined = 2,
        Tentative = 3
    }
    public enum MeetingStatus
    {
        Scheduled = 0,
        InProgress = 1,
        Completed = 2,
        Cancelled = 3
    }
    public class RsvpResponseDto
    {
        [Required]
        public int MeetingId { get; set; }

        [Required(ErrorMessage = "RSVP status is required")]
        [EnumDataType(typeof(RsvpStatus), ErrorMessage = "Invalid RSVP status")]
        public RsvpStatus RsvpStatus { get; set; }

        [StringLength(500, ErrorMessage = "Comments cannot exceed 500 characters")]
        public string? RsvpComments { get; set; }
    }
    public class MeetingInvitationDto
    {
        public int ParticipantId { get; set; }
        public int MeetingId { get; set; }
        public string MeetingTitle { get; set; } = null!;
        public string MeetingType { get; set; } = null!;
        public DateTime MeetingDate { get; set; }
        public string? MeetingLink { get; set; }
        public string? Agenda { get; set; }
        public int ScheduledByEmployeeId { get; set; }
        public string ScheduledByEmployeeName { get; set; } = null!;
        public MeetingStatus MeetingStatus { get; set; }
        public RsvpStatus RsvpStatus { get; set; }
        public DateTime? RsvpResponseDate { get; set; }
        public string? RsvpComments { get; set; }
        public DateTime InvitedAt { get; set; }
        public int DaysUntilMeeting { get; set; }
        public bool RequiresResponse => RsvpStatus == RsvpStatus.Pending;
    }
    public class MeetingRsvpSummaryDto
    {
        public int MeetingId { get; set; }
        public string MeetingTitle { get; set; } = null!;
        public int TotalInvitations { get; set; }
        public int AcceptedCount { get; set; }
        public int DeclinedCount { get; set; }
        public int TentativeCount { get; set; }
        public int PendingCount { get; set; }
        public double ResponseRate => TotalInvitations > 0
            ? (double)(TotalInvitations - PendingCount) / TotalInvitations * 100
            : 0;
        public List<ParticipantRsvpDto> Participants { get; set; } = new();
    }
    public class ParticipantRsvpDto
    {
        public int ParticipantId { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = null!;
        public RsvpStatus RsvpStatus { get; set; }
        public DateTime? RsvpResponseDate { get; set; }
        public string? RsvpComments { get; set; }
    }
    public class PaginatedMeetingInvitationDto
    {
        public List<MeetingInvitationDto> Invitations { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasPreviousPage { get; set; }
        public bool HasNextPage { get; set; }
    }
    public class MeetingInvitationFilterDto
    {
        [Range(1, int.MaxValue, ErrorMessage = "Page number must be at least 1")]
        public int PageNumber { get; set; } = 1;

        [Range(1, 100, ErrorMessage = "Page size must be between 1 and 100")]
        public int PageSize { get; set; } = 20;
        public RsvpStatus? RsvpStatus { get; set; }
        public MeetingStatus? MeetingStatus { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string SortBy { get; set; } = "MeetingDate";
        public string SortOrder { get; set; } = "asc";
    }
}
