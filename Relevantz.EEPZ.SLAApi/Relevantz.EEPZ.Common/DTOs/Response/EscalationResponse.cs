namespace Relevantz.EEPZ.Common.DTOs.Response
{
   public class EscalationResponse
{
    public int EscalationId { get; set; }
    public int Slaid { get; set; }

    public string EscalationLevel { get; set; } = string.Empty;
    public string EscalationStatus { get; set; } = string.Empty;

    public string? Reason { get; set; }
    public string? Description { get; set; }
    public DateTime? SubmittedAt { get; set; }

    public int EmployeeId { get; set; }              // ✔ only once
    public string EmployeeName { get; set; } = "";   // ✔ only once

    public int? SubmittedByEmployeeId { get; set; }
    public string? SubmittedByName { get; set; }

    public int? EscalatedToEmployeeId { get; set; }
    public string? EscalatedToName { get; set; }
}

}
