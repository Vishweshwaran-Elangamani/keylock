namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class SendGoalReminderRequestDto
    {
        public string SendType { get; set; } = "single"; 
        public int? UserId { get; set; } 
        public List<int>? UserIds { get; set; } 
        public bool IncludeGoalSuggestions { get; set; } = true;
        public int? FilterByDays { get; set; } 
    }
}
