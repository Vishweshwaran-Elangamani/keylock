using System;
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
}
