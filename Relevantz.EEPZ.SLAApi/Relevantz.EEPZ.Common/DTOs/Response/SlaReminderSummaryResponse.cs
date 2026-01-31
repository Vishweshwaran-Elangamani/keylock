namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class SlaReminderSummaryResponse
    {
        public int EmailsSent { get; set; }
        public int EmailsFailed { get; set; }
        public int TotalSlas { get; set; }
    }
}
