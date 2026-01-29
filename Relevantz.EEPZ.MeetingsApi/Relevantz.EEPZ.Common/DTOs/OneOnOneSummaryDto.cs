namespace Relevantz.EEPZ.Common.DTOs
{
    public class OneOnOneSummaryDto
    {
        public int TotalTeamMembers { get; set; }
        public int TotalOneOnOnes { get; set; }
        public int ThisMonthOneOnOnes { get; set; }
        public int ThisQuarterOneOnOnes { get; set; }
        public int LastMonthOneOnOnes { get; set; }
        public double AverageMeetingsPerEmployee { get; set; }
        public double AverageDaysBetweenMeetings { get; set; }
        public List<EmployeeSummaryDto> EmployeesWithNoRecentMeeting { get; set; } = new List<EmployeeSummaryDto>();
        public int OverdueActionItemsCount { get; set; }
    }

    public class EmployeeSummaryDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string LastMeetingDate { get; set; } = string.Empty;
    }
}
