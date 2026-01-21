namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request DTO for updating Manager Review.
    /// </summary>
    public class UpdateManagerReviewRequestDto
    {
        public int? Rating { get; set; }

        public string? ReviewComment { get; set; }
    }
}
