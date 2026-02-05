namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class SubmitFeedbackRequest
    {
        public int EmployeeId { get; set; }
        public int ProjectId { get; set; }
        public int GoalId { get; set; }
        public string FeedbackText { get; set; }
        public int Rating { get; set; }
    }
}
