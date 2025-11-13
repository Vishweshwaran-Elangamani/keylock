namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class BulkOperationResponseDto
    {
        public int TotalRecords { get; set; }
        public int SuccessCount { get; set; }
        public int FailureCount { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
        public string Message { get; set; } = string.Empty;
    }
}
