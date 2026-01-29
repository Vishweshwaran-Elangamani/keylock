namespace Relevantz.EEPZ.Common.DTOs
{
    public class MeetingRsvpSummaryDto
    {
        public int MeetingId { get; set; }
        public string MeetingTitle { get; set; } = string.Empty;
        public int TotalInvitations { get; set; }
        public int AcceptedCount { get; set; }
        public int DeclinedCount { get; set; }
        public int TentativeCount { get; set; }
        public int PendingCount { get; set; }
        public double ResponseRate { get; set; }
    }
}
