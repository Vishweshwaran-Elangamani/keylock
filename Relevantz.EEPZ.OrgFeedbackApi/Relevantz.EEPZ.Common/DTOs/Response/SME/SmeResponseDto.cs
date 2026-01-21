namespace Relevantz.EEPZ.Common.DTOs.Response
{
    /// <summary>
    /// SME (Subject Matter Expert) response DTO.
    /// </summary>
    public class SmeResponseDto
    {
        public int SmeId { get; set; }

        public int EmployeeId { get; set; }

        public string SkillName { get; set; } = string.Empty;

        public int SkillIdReference { get; set; }

        public string EmployeeName { get; set; } = string.Empty;

        public bool IsActive { get; set; }

        public DateTime? ApprovedOn { get; set; }
    }
}
