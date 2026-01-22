using System;
using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
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
