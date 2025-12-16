namespace Relevantz.EEPZ.Common.DTOs.Response
{
    /// <summary>
    /// DTO containing an employee's primary project information
    /// </summary>
    public class EmployeePrimaryProjectInfo
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
    }
}
