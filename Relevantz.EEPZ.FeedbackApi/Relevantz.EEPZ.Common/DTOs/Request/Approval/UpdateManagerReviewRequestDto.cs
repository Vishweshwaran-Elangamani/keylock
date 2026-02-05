using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UpdateManagerReviewRequestDto
    {

        public int? Rating { get; set; }
        public string ReviewComment { get; set; }
    }
}
