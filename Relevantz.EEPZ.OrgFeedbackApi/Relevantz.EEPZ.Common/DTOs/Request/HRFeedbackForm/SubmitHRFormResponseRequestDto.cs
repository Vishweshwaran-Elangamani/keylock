namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request DTO for HR Form Response Submission.
    /// </summary>
    public class SubmitHRFormResponseRequestDto
    {
        public int FormId { get; set; }

        public int SubmittedByEmployeeId { get; set; }

        public Dictionary<string, object> FormResponse { get; set; } = new();
    }
}
