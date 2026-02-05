using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class CreatePeerFeedbackRequestDto
    {
        [Required] public int SubmittedByEmployeeId { get; set; }
        [Required] public int RecipientEmployeeId { get; set; }

        [Required]
        [MaxLength(2000)]
        public string FeedbackContent { get; set; }

        public bool IsAnonymous { get; set; } = false;
    }
}
