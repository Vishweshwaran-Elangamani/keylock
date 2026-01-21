namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UpdateHRFormRequestDto
    {
        public string? FormName { get; set; }
        public string? FormDescription { get; set; }
        public DateTime? Deadline { get; set; }
    }
}
