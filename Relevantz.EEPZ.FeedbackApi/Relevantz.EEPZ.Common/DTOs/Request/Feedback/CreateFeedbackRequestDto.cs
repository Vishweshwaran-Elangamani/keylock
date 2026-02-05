using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class CreateFeedbackRequestDto
    {
        public string FeedbackType { get; set; }

        public int? SubmittedByEmployeeId { get; set; }
        public int RecipientEmployeeId { get; set; }

        public int? RelatedGoalId { get; set; }
        public int? RelatedProjectId { get; set; }
        public int? RelatedMentorId { get; set; }
        public int? RelatedOrganizationGoalId { get; set; }

        public int? Rating { get; set; }

        public string Comments { get; set; }

        public bool IsAnonymous { get; set; } = false;

        public List<FeedbackQuestionResponseRequestDto> QuestionResponses { get; set; } = new();
    }
}
