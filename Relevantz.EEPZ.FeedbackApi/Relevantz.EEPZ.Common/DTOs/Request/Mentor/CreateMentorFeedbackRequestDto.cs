using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request to submit mentor feedback for a mentee.
    /// </summary>
    public class CreateMentorFeedbackRequestDto
    {
        /// <summary>Subject matter expert identifier.</summary>
        public int SmeId { get; set; }

        /// <summary>Mentor providing the feedback.</summary>
        public int MentorEmployeeId { get; set; }

        /// <summary>Mentee receiving the feedback.</summary>
        public int MenteeEmployeeId { get; set; }

        /// <summary>Skill reference related to the feedback.</summary>
        public int SkillIdReference { get; set; }

        /// <summary>Rating given for the mentorship interaction.</summary>
        public int Rating { get; set; }

        /// <summary>Written feedback comments.</summary>
        public string FeedbackComments { get; set; }

        /// <summary>Employee submitting the feedback.</summary>
        public int SubmittedByEmployeeId { get; set; }

        /// <summary>Source of the feedback (e.g., Mentor, SME).</summary>
        public string FeedbackFrom { get; set; }

        /// <summary>Indicates whether the feedback is anonymous.</summary>
        public bool IsAnonymous { get; set; } = false;
    }
}
