using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request to submit feedback for an organization-level goal.
    /// </summary>
    public class CreateOrgGoalFeedbackRequestDto
    {
        /// <summary>Organization goal being reviewed.</summary>
        public int GoalId { get; set; }

        /// <summary>Employee submitting the feedback.</summary>
        public int SubmittedByEmployeeId { get; set; }

        /// <summary>Employee receiving the feedback.</summary>
        public int RecipientEmployeeId { get; set; }

        /// <summary>Rating assigned to the goal performance.</summary>
        public int Rating { get; set; }

        /// <summary>Written feedback comments.</summary>
        public string FeedbackComments { get; set; }

        /// <summary>Indicates whether the feedback is anonymous.</summary>
        public bool IsAnonymous { get; set; } = false;
    }
}
