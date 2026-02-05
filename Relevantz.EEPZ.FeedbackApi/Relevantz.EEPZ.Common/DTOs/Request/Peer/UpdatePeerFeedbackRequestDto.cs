using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UpdatePeerFeedbackRequestDto
    {
        [MaxLength(2000)]
        public string FeedbackContent { get; set; }
    }
}
