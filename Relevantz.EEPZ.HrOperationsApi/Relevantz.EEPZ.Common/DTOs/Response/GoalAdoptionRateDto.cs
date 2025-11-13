namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class GoalAdoptionRateDto
    {
        public int TotalEmployees { get; set; }
        public int EmployeesWithGoals { get; set; }
        public int EmployeesWithoutGoals { get; set; }
        public double AdoptionRate { get; set; }
        public List<MonthlyGoalTrendDto> MonthlyTrend { get; set; } = new();
        public List<GoalTypeDistributionDto> GoalTypeDistribution { get; set; } = new();
    }

    public class MonthlyGoalTrendDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string MonthName { get; set; } = string.Empty;
        public int NewGoals { get; set; }
    }

    public class GoalTypeDistributionDto
    {
        public string GoalType { get; set; } = string.Empty;
        public int Count { get; set; }
        public double Percentage { get; set; }
    }
}
