namespace Relevantz.EEPZ.Common.DTOs.Response
{
    /// <summary>
    /// Goal assignment information.
    /// </summary>
    public class GoalAssignmentInfoDto
    {
        public int AssignmentId { get; set; }

        public int EmployeeId { get; set; }

        public string? EmployeeName { get; set; }

        public string? Email { get; set; }
    }
}
