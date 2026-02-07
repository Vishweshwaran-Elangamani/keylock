using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request to update an existing organization goal feedback entry.
    /// </summary>
    public class UpdateOrgGoalFeedbackRequestDto
    {
        /// <summary>Updated rating value.</summary>
        public int? Rating { get; set; }

        /// <summary>Updated feedback comments.</summary>
        public string FeedbackComments { get; set; }
    }
}
