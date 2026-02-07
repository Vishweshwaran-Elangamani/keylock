using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request to update an existing feedback entry.
    /// </summary>
    public class UpdateFeedbackRequestDto
    {
        /// <summary>Updated overall rating.</summary>
        public int? Rating { get; set; }

        /// <summary>Updated feedback comments.</summary>
        public string Comments { get; set; }

        /// <summary>Updated responses to feedback questions.</summary>
        public List<FeedbackQuestionResponseRequestDto> QuestionResponses { get; set; }
    }
}
