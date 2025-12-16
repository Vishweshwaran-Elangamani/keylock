namespace Relevantz.EEPZ.Common.DTOs.Response;

public class UpdateDraftRequestDto
{
    public int FormId { get; set; }
    public int EmployeeId { get; set; }
    public int AssignedBy { get; set; }
    public string Action { get; set; } = "Save as Draft";
}
