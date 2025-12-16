namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class EmployeeWithoutGoalsDto
    {
        public int UserId { get; set; }
        public int EmployeeUserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? EmployeeCompanyId { get; set; }
        public int? DaysWithoutGoals { get; set; }
        public string RecommendedAction { get; set; } = "Encourage goal setting";
        public string EmployeeName { get; set; } = string.Empty;
        public string DepartmentName { get; set; } = string.Empty;

    }
}
