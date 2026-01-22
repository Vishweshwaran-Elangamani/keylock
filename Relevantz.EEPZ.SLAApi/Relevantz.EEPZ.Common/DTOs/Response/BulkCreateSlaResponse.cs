namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class BulkCreateSlaResponse
    {
        public int TotalRequested { get; set; }
        public int SuccessfulInserts { get; set; }
        public int FailedInserts { get; set; }
        public List<string> FailedRecords { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
