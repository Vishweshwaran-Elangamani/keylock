using System.ComponentModel.DataAnnotations;   // ⭐ ADD THIS

namespace Relevantz.EEPZ.Common.DTOs
{
    public class RsvpResponseDto
    {
        public int MeetingId { get; set; }
        public int ParticipantId { get; set; }

        [Required]   // Now works
        public string RsvpStatus { get; set; } = string.Empty; // Pending, Accepted, Declined, Tentative

        public string? RsvpComments { get; set; }
    }
}
