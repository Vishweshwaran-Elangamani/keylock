namespace Relevantz.EEPZ.Common.DTOs
{
    public class MeetingResponseDto
    {
        public int MeetingId { get; set; }
        public string MeetingTitle { get; set; } = string.Empty;
        public string MeetingType { get; set; } = string.Empty;
        public DateTime MeetingDate { get; set; }
        public string? MeetingLink { get; set; }
        public string Attendees { get; set; } = string.Empty;
        public string? CommentsObservations { get; set; }
        public string Agenda { get; set; } = string.Empty;
        public string ScheduledByEmployeeName { get; set; } = string.Empty;
        public int ScheduledByEmployeeId { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
