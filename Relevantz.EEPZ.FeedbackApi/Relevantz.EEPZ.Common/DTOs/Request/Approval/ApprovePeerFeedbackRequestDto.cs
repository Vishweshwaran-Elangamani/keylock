using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request for HR to approve or reject a peer feedback queue item.
    /// </summary>
    public class ApprovePeerFeedbackRequestDto
    {
        /// <summary>Queue item identifier.</summary>
        [Required]
        public int QueueId { get; set; }

        /// <summary>Indicates if feedback is professional.</summary>
        [Required]
        public bool IsProfessional { get; set; }

        /// <summary>Indicates if feedback is relevant.</summary>
        [Required]
        public bool IsRelevant { get; set; }

        /// <summary>Final decision (true = approve, false = reject).</summary>
        public bool Approve { get; set; } = true;
    }
}
