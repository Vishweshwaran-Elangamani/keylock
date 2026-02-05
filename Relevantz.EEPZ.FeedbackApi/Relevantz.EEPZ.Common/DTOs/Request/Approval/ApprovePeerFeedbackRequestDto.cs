using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class ApprovePeerFeedbackRequestDto
    {
        [Required] public int QueueId { get; set; }
        [Required] public bool IsProfessional { get; set; }
        [Required] public bool IsRelevant { get; set; }

        public bool Approve { get; set; } = true;
    }
}
