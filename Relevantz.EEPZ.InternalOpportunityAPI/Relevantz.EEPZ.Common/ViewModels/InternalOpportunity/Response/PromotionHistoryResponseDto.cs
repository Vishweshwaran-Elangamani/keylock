using System;

namespace Relevantz.EEPZ.Common.ViewModels.Promotion.Response
{
    public class PromotionHistoryResponseDto
    {
        public int HistoryId { get; set; }
        public int EmployeeUserId { get; set; }
        public string EmployeeName { get; set; }
        public int PromotionId { get; set; }
        public string FromRole { get; set; }
        public string ToRole { get; set; }
        public decimal SalaryChange { get; set; }
        public DateOnly PromotionDate { get; set; }
        public DateTime RecordedAt { get; set; }
    }
}
