using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
  
    public class CreateSlaRequest
    {
        [Required(ErrorMessage = "SLA Type is required")]
        [StringLength(50)]
        public string Slatype { get; set; }

        [Required(ErrorMessage = "Employee ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Invalid Employee ID")]
        public int EmployeeId { get; set; }

        
        public int? AssignedToEmployeeId { get; set; }

        [Required(ErrorMessage = "Deadline is required")]
        public DateTime Deadline { get; set; }

        [StringLength(100)]
        public string? RelatedEntityType { get; set; }

        [Required(ErrorMessage = "Department ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Invalid Department ID")]
        public int DepartmentId { get; set; }

        public int? RelatedEntityId { get; set; }

        [Required(ErrorMessage = "Created By Employee ID is required")]
        public int CreatedByEmployeeId { get; set; }

        [StringLength(500)]
        public string? CreationReason { get; set; }
    }

    public class SubmitSlaEscalationRequest
    {
        [Required(ErrorMessage = "SLA ID is required")]
        [Range(1, int.MaxValue)]
        public int Slaid { get; set; }

        [Required(ErrorMessage = "Reason is required")]
        [StringLength(200, MinimumLength = 3, 
            ErrorMessage = "Reason must be between 3 and 200 characters")]
        public string Reason { get; set; } = null!;

        [StringLength(500, 
            ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Escalation level is required")]
        [RegularExpression("^(L1|L2|DeptHead|Leadership)$",
            ErrorMessage = "Escalation level must be L1, L2, DeptHead, or Leadership")]
        public string EscalationLevel { get; set; } = "L1";


        public int? EscalatedToEmployeeId { get; set; }

        [Required(ErrorMessage = "Submitted by employee ID is required")]
        public int? SubmittedByEmployeeId { get; set; }
    }

    public class ReopenSlaRequest
    {
        [Required]
        public int Slaid { get; set; }

        [Required]
        [Range(1, 30)]
        public int ExtensionDays { get; set; }

        [Required]
        [MaxLength(500)]
        public string ReopenReason { get; set; } = string.Empty;

        [Required]
        public int ReopenedByEmployeeId { get; set; }
    }


    public class CalculateComplianceRequest
    {
        [Required]
        public int DepartmentId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Period { get; set; } = string.Empty;

        [Required]
        public DateTime PeriodStartDate { get; set; }

        [Required]
        public DateTime PeriodEndDate { get; set; }

        public int? CalculatedBy { get; set; }
    }


    public class ResolveEscalationRequest
    {
        [Required]
        public int EscalationId { get; set; }

        [Required]
        public int ResolvedByEmployeeId { get; set; }

        [Required]
        [RegularExpression("^(Resolved|Rejected)$")]
        public string EscalationStatus { get; set; } = "Resolved";

        [Required]
        public string ResolutionComments { get; set; } = string.Empty;
    }

    public class CloseSlaRequest
    {
        [Required]
        public int Slaid { get; set; }

        [Required]
        public int ClosedByEmployeeId { get; set; }

        public string? ComplianceStatus { get; set; }
    }


    public class UpdateSlaRequest
    {
        public string? Slatype { get; set; }
        
        public int? AssignedToEmployeeId { get; set; }
        
        public DateTime? Deadline { get; set; }
        
        public string? Status { get; set; }
        
        public string? ComplianceStatus { get; set; }
        
        [Required]
        public int UpdatedByEmployeeId { get; set; }
        
        public string? UpdateReason { get; set; }
    }
}
