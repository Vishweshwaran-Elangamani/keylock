namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class RoleResponseDto
    {
        public int RoleId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public string RoleCode { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsSystemRole { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
