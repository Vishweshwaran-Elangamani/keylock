using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class SubmitSlaEscalationRequest
    {
        [Required(ErrorMessage = "SLA ID is required")]
        [Range(1, int.MaxValue)]
        public int Slaid { get; set; }

        [Required(ErrorMessage = "Reason is required")]
        [StringLength(200, MinimumLength = 3,
            ErrorMessage = "Reason must be between 3 and 200 characters")]
        public string Reason { get; set; } = null!;

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Escalation level is required")]
        [RegularExpression("^(L1|L2|DeptHead|Leadership)$", 
            ErrorMessage = "Escalation level must be L1, L2, DeptHead, or Leadership")]
        public string EscalationLevel { get; set; } = "L1";

        public int? EscalatedToEmployeeId { get; set; }

        [Required(ErrorMessage = "Submitted by employee ID is required")]
        public int? SubmittedByEmployeeId { get; set; }
    }
}
