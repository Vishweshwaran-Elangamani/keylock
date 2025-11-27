using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UpdatePolicyRequestDto
    {
        [StringLength(200, ErrorMessage = "Policy name cannot exceed 200 characters")]
        public string? PolicyName { get; set; }

        [StringLength(100, ErrorMessage = "Category cannot exceed 100 characters")]
        public string? Category { get; set; }

        public string? Description { get; set; }

        public string? ComplianceGuidance { get; set; }

        public string? Status { get; set; }

        public string? DocumentUrl { get; set; }
        public string? DocumentName { get; set; }
        public string? DocumentType { get; set; }
        public long? DocumentSize { get; set; }
    }
}
