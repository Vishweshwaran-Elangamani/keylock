using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs
{

    public class RsvpResponseDto
    {
        [Required]
        public int MeetingId { get; set; }

        [Required(ErrorMessage = "RSVP status is required")]
        public string RsvpStatus { get; set; } = null!;

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
        public string MeetingStatus { get; set; } = null!; 
        public string RsvpStatus { get; set; } = null!; 
        public DateTime? RsvpResponseDate { get; set; }
        public string? RsvpComments { get; set; }
        public DateTime InvitedAt { get; set; }
        public int DaysUntilMeeting { get; set; }
        public bool RequiresResponse => RsvpStatus == "Pending";
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
        public string RsvpStatus { get; set; } = null!;
        public DateTime? RsvpResponseDate { get; set; }
        public string? RsvpComments { get; set; }
    }
}
