using System;

namespace Relevantz.EEPZ.Common.ViewModels.Promotion.Response
{
    public class PromotionResponseDto
    {
        public int PromotionId { get; set; }
        public int EmployeeUserId { get; set; }
        public string? EmployeeName { get; set; }
        public int? NominationId { get; set; }
        public string? OpportunityName { get; set; }
        public string? NominationType { get; set; }
        public string? OldRole { get; set; }
        public string NewRole { get; set; } = null!;
        public decimal? OldSalary { get; set; }
        public decimal NewSalary { get; set; }
        public decimal? IncrementPercentage { get; set; }
        public DateOnly PromotionDate { get; set; }
        public string? Justification { get; set; }
        public string Status { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
    }
}
