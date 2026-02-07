using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request to submit feedback for an employee, goal, or project.
    /// </summary>
    public class CreateFeedbackRequestDto
    {
        /// <summary>Type of feedback being submitted.</summary>
        public string FeedbackType { get; set; }

        /// <summary>Employee submitting the feedback (if not anonymous).</summary>
        public int? SubmittedByEmployeeId { get; set; }

        /// <summary>Employee receiving the feedback.</summary>
        public int RecipientEmployeeId { get; set; }

        /// <summary>Optional related goal identifier.</summary>
        public int? RelatedGoalId { get; set; }

        /// <summary>Optional related project identifier.</summary>
        public int? RelatedProjectId { get; set; }

        /// <summary>Optional related mentor identifier.</summary>
        public int? RelatedMentorId { get; set; }

        /// <summary>Optional related organization goal identifier.</summary>
        public int? RelatedOrganizationGoalId { get; set; }

        /// <summary>Overall rating provided in the feedback.</summary>
        public int? Rating { get; set; }

        /// <summary>Additional written comments.</summary>
        public string Comments { get; set; }

        /// <summary>Indicates whether the feedback is anonymous.</summary>
        public bool IsAnonymous { get; set; } = false;

        /// <summary>Responses to structured feedback questions.</summary>
        public List<FeedbackQuestionResponseRequestDto> QuestionResponses { get; set; } = new();
    }
}
