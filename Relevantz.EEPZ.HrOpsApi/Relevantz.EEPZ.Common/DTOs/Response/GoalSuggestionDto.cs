namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class GoalSuggestionDto
    {
        public string GoalType { get; set; } = string.Empty;
        public string GoalTitle { get; set; } = string.Empty;
        public string GoalDescription { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty; 
        public string EstimatedDuration { get; set; } = string.Empty;
        public bool PolicyCompliant { get; set; } = true;
    }
}
