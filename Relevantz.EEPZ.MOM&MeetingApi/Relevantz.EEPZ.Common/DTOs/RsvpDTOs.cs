// DTOs/RsvpDTOs.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs
{
    /// <summary>
    /// DTO for submitting RSVP response to meeting invitation
    /// </summary>
    public class RsvpResponseDto
    {
        [Required]
        public int MeetingId { get; set; }

        [Required(ErrorMessage = "RSVP status is required")]
        public string RsvpStatus { get; set; } = null!; // Pending, Accepted, Declined, Tentative

        [StringLength(500, ErrorMessage = "Comments cannot exceed 500 characters")]
        public string? RsvpComments { get; set; }
    }

    /// <summary>
    /// Response DTO for meeting invitation with RSVP details
    /// </summary>
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
        public string MeetingStatus { get; set; } = null!; // Scheduled, Completed, Cancelled
        public string RsvpStatus { get; set; } = null!; // Pending, Accepted, Declined, Tentative
        public DateTime? RsvpResponseDate { get; set; }
        public string? RsvpComments { get; set; }
        public DateTime InvitedAt { get; set; }
        public int DaysUntilMeeting { get; set; }
        public bool RequiresResponse => RsvpStatus == "Pending";
    }

    /// <summary>
    /// Summary of RSVP responses for a meeting (Manager view)
    /// </summary>
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

    /// <summary>
    /// Individual participant RSVP details
    /// </summary>
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
