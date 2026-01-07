using System.Text.Json.Serialization;

namespace Relevantz.EEPZ.Common.DTOs.Response
{
    /// <summary>
    /// SME (Subject Matter Expert) DTO
    /// </summary>
    public class SmeDto
    {
        [JsonPropertyName("smeId")]
        public int SmeId { get; set; }

        [JsonPropertyName("employeeId")]
        public int EmployeeId { get; set; }

        [JsonPropertyName("skillName")]
        public string SkillName { get; set; } = string.Empty;

        [JsonPropertyName("skillIdReference")]
        public int SkillIdReference { get; set; }

        [JsonPropertyName("employeeName")]
        public string EmployeeName { get; set; } = string.Empty;

        [JsonPropertyName("isActive")]
        public bool IsActive { get; set; }

        [JsonPropertyName("approvedOn")]
        public DateTime? ApprovedOn { get; set; }
    }
}
