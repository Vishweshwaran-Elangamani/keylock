using System;
using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.ViewModels.Promotion.Request
{
    public class ApprovePromotionRequestDto
    {
        [StringLength(500)]
        public string ApprovalRemarks { get; set; }
    }
}
