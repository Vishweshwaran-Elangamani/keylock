using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request to update an existing manager review.
    /// </summary>
    public class UpdateManagerReviewRequestDto
    {
        /// <summary>Updated performance rating.</summary>
        public int? Rating { get; set; }

        /// <summary>Updated review comment.</summary>
        public string ReviewComment { get; set; }
    }
}
