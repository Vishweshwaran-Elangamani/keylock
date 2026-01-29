namespace Relevantz.EEPZ.Common.DTOs
{
    public class MeetingInvitationDto
    {
        public int MeetingId { get; set; }
        public int EmployeeId { get; set; }

        public string EmployeeName { get; set; } = string.Empty;

        public string RsvpStatus { get; set; } = string.Empty;
        public string? RsvpComments { get; set; }
        public DateTime? RsvpResponseDate { get; set; }

        public string? MeetingLink { get; set; }
        public DateTime MeetingDate { get; set; }
        public string MeetingTitle { get; set; } = string.Empty;
        public string MeetingType { get; set; } = string.Empty;
    }
}
