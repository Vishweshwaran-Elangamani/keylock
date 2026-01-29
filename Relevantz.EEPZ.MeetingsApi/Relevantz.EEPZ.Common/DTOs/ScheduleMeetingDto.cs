namespace Relevantz.EEPZ.Common.DTOs
{
    public class ScheduleMeetingDto
    {
        public string MeetingTitle { get; set; } = string.Empty;
        public string MeetingType { get; set; } = string.Empty;
        public DateTime MeetingDate { get; set; }
        public string? MeetingLink { get; set; }
        public string Agenda { get; set; } = string.Empty;
        public List<int>? ParticipantEmployeeIds { get; set; } = new List<int>();
    }
}
