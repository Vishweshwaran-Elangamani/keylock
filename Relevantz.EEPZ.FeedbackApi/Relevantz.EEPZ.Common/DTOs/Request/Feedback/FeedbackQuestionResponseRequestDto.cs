using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Represents an answer to a feedback question.
    /// </summary>
    public class FeedbackQuestionResponseRequestDto
    {
        /// <summary>Identifier of the question being answered.</summary>
        public int QuestionId { get; set; }

        /// <summary>Numeric rating response (if applicable).</summary>
        public int? RatingValue { get; set; }

        /// <summary>Boolean response (if applicable).</summary>
        public bool? BooleanValue { get; set; }

        /// <summary>Free-text response.</summary>
        public string TextValue { get; set; }

        /// <summary>Selected option identifiers for multi-choice questions.</summary>
        public List<int> SelectedOptions { get; set; }
    }
}
