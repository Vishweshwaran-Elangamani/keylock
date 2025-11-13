using System;

namespace Relevantz.EEPZ.Common.ViewModels.Promotion.Response
{
    public class PromotionDetailResponseDto
    {
        public int PromotionId { get; set; }
        public int EmployeeUserId { get; set; }
        public string EmployeeName { get; set; }
        public string EmployeeEmail { get; set; }
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; }
        public string OldRole { get; set; }
        public string NewRole { get; set; }
        public decimal? OldSalary { get; set; }
        public decimal NewSalary { get; set; }
        public decimal? IncrementPercentage { get; set; }
        public DateOnly PromotionDate { get; set; }
        public string Justification { get; set; }
        public string Status { get; set; }
        public int? ApprovedByUserId { get; set; }
        public string ApprovedByName { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
