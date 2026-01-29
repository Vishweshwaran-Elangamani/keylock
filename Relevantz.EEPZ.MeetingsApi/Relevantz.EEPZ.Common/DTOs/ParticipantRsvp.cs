namespace Relevantz.EEPZ.Common.DTOs
{
    public class ParticipantRsvp
    {
        public int ParticipantId { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; }
        public string RsvpStatus { get; set; }
        public DateTime? RsvpResponseDate { get; set; }
        public string? RsvpComments { get; set; }
    }
}
