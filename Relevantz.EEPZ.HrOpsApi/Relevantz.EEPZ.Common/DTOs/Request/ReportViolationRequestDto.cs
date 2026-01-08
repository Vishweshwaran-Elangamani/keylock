using System;
using System.ComponentModel.DataAnnotations;
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class ReportViolationRequestDto
    {
        [Required(ErrorMessage = "Employee user ID is required")]
        public int EmployeeUserId { get; set; }
        public int? PolicyId { get; set; }
        [Required(ErrorMessage = "Violation type is required")]
        [StringLength(100, ErrorMessage = "Violation type cannot exceed 100 characters")]
        public string ViolationType { get; set; } = null!;
        [Required(ErrorMessage = "Description is required")]
        public string Description { get; set; } = null!;
        [Required(ErrorMessage = "Severity is required")]
        public string Severity { get; set; } = null!;
        public int? EscalatedToUserId { get; set; } 
    }
}
