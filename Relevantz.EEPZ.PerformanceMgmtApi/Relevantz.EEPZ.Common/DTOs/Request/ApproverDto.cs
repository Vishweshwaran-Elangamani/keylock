namespace Relevantz.EEPZ.Common.DTOs.Request;
public class ApproverAssignmentRowDto
{
    public int AssessmentId { get; set; }
    public string EmployeeName { get; set; } = "";
    public string FormName { get; set; } = "";
    public string SubmittedAt { get; set; } = "";
    public string Status { get; set; } = "";
    public string Project { get; set; } = "";
}
 