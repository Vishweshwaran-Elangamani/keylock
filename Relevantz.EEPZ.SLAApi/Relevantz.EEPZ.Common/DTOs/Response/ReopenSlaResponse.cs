namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class ReopenSlaResponse
    {
        public string Message { get; set; } = string.Empty;
        public DateTime OldDeadline { get; set; }
        public DateTime NewDeadline { get; set; }
        public int ExtensionDays { get; set; }
    }
}
