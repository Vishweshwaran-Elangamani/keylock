using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class CreatePolicyRequestDto
    {
        [Required(ErrorMessage = "Policy name is required")]
        [StringLength(200, ErrorMessage = "Policy name cannot exceed 200 characters")]
        public string PolicyName { get; set; } = null!;

        [Required(ErrorMessage = "Category is required")]
        [StringLength(100, ErrorMessage = "Category cannot exceed 100 characters")]
        public string Category { get; set; } = null!;

        public string? Description { get; set; }

        public string? ComplianceGuidance { get; set; }

        public string Status { get; set; } = "Draft";
        
        public string? DocumentUrl { get; set; }
        public string? DocumentName { get; set; }
        public string? DocumentType { get; set; }
        public long? DocumentSize { get; set; }
    }
}
