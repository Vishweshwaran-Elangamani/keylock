using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request to submit feedback related to a specific goal.
    /// </summary>
    public class CreateGoalFeedbackRequestDto
    {
        /// <summary>Goal being reviewed.</summary>
        public int GoalId { get; set; }

        /// <summary>Employee submitting the feedback.</summary>
        public int SubmittedByEmployeeId { get; set; }

        /// <summary>Manager associated with the feedback (if applicable).</summary>
        public int? ManagerEmployeeId { get; set; }

        /// <summary>Rating assigned for the goal performance.</summary>
        public int Rating { get; set; }

        /// <summary>Written feedback comments.</summary>
        public string FeedbackComments { get; set; }

        /// <summary>Source of the feedback (e.g., Manager, Peer, Self).</summary>
        public string FeedbackFrom { get; set; }

        /// <summary>Indicates whether the feedback is anonymous.</summary>
        public bool IsAnonymous { get; set; } = false;
    }
}
