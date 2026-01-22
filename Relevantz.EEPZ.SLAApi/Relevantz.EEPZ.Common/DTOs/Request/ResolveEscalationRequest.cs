using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
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
}
