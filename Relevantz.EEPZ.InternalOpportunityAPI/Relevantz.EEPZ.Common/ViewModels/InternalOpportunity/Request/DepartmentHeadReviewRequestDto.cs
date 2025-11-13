using System;
using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.ViewModels.Nomination.Request
{
    public class DepartmentHeadReviewRequestDto
    {
        [Required(ErrorMessage = "Action is required")]
        [StringLength(20)]
        public string Action { get; set; } // "Approved" or "Rejected"

        [StringLength(500)]
        public string ReviewRemarks { get; set; }

        [Range(0, 100)]
        public decimal? MeritScore { get; set; }

        [Range(0, 100)]
        public decimal? DiversityScore { get; set; }

        public bool ConflictOfInterest { get; set; } = false;

        [StringLength(500)]
        public string ReviewNotes { get; set; }
    }
}
