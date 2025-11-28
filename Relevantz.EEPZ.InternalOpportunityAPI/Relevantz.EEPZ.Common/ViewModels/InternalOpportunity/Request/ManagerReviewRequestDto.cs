using System;
using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.ViewModels.Nomination.Request
{
    public class ManagerReviewRequestDto
    {
        [Required(ErrorMessage = "Action is required")]
        [StringLength(20)]
        public string ActionTaken { get; set; }

        [StringLength(500)]
        public string Remarks { get; set; }
    }
}
