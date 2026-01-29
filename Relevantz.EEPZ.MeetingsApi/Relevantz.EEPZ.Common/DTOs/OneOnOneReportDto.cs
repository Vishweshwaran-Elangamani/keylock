namespace Relevantz.EEPZ.Common.DTOs
{
    public class OneOnOneReportDto
    {
        public int TotalMeetings { get; set; }
        public int CompletedMeetings { get; set; }
        public int ScheduledMeetings { get; set; }
        public int CancelledMeetings { get; set; }
        public int HostEmployeeId { get; set; }

    }
}
