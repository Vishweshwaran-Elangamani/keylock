namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class GoalStatisticsDto
    {
        public int TotalGoals { get; set; }
        public int CompletedGoals { get; set; }
        public int InProgressGoals { get; set; }
        public int ExpiredGoals { get; set; }
        public double CompletionRate { get; set; }
        public Dictionary<string, int> GoalsByStatus { get; set; } = new();
        public List<GoalTypeCountDto> TopGoalTypes { get; set; } = new();
    }

    public class GoalTypeCountDto
    {
        public string GoalType { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
