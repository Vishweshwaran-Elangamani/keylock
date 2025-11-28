using System;

namespace Relevantz.EEPZ.Common.ViewModels.Promotion.Request
{
    public class CreatePromotionRequestDto
    {
        public int NominationId { get; set; }
        
        public int EmployeeUserId { get; set; }
        public int DepartmentId { get; set; }
        public string? OldRole { get; set; }
        public string NewRole { get; set; } = null!;
        public decimal? OldSalary { get; set; }
        public decimal NewSalary { get; set; }
        public decimal? IncrementPercentage { get; set; }
        public DateOnly PromotionDate { get; set; }
        public string? Justification { get; set; }
    }
}
