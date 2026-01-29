namespace Relevantz.EEPZ.Common.DTOs
{
    public class ParticipantRsvpDto
    {
        public int ParticipantId { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string RsvpStatus { get; set; } = string.Empty;
        public DateTime? RsvpResponseDate { get; set; }
        public string? RsvpComments { get; set; }
    }
}
