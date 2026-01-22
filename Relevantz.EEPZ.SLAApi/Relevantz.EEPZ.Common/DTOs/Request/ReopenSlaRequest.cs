using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
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
}
