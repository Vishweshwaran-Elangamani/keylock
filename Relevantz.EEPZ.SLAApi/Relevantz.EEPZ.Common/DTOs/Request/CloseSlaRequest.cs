using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class CloseSlaRequest
    {
        [Required]
        public int Slaid { get; set; }

        [Required]
        public int ClosedByEmployeeId { get; set; }

        public string? ComplianceStatus { get; set; }
    }
}
