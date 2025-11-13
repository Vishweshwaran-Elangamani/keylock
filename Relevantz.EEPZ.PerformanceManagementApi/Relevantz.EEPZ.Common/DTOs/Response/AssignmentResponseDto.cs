namespace Relevantz.EEPZ.Common.DTOs.Response;

public class AssignmentResponseDto
{
    public int AssignmentId { get; set; }
    public int FormId { get; set; }
    public int EmployeeId { get; set; }
    public string Action { get; set; }
    public DateTime AssignedAt { get; set; }
    public DateTime Deadline { get; set; }
}

public class FormProgressTrackerDto
{
    public int TrackerId { get; set; }
    public string Status { get; set; }
}
 