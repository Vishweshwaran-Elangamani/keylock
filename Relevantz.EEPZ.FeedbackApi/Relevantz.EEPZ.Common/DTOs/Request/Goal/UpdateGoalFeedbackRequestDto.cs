using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request to update an existing goal feedback entry.
    /// </summary>
    public class UpdateGoalFeedbackRequestDto
    {
        /// <summary>Updated rating value.</summary>
        public int? Rating { get; set; }

        /// <summary>Updated feedback comments.</summary>
        public string FeedbackComments { get; set; }

        /// <summary>Updated status of the feedback.</summary>
        public string Status { get; set; }
    }
}
