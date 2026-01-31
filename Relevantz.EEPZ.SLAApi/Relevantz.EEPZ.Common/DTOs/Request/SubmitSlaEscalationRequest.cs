using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class SubmitSlaEscalationRequest
    {
        // Set internally from route, not from client
        public int Slaid { get; set; }

        [Required(ErrorMessage = "Reason is required")]
        [StringLength(200, MinimumLength = 3,
            ErrorMessage = "Reason must be between 3 and 200 characters")]
        public string Reason { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }

        // Controller decides this using query param
        public string EscalationLevel { get; set; } = "L1";

        // Optional (service can auto-pick manager if null)
        public int? EscalatedToEmployeeId { get; set; }

        // NEVER from client — comes from token
        public int SubmittedByEmployeeId { get; set; }
    }
}
