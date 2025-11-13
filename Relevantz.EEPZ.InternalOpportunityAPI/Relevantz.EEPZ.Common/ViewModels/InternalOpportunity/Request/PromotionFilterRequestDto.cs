using System;

namespace Relevantz.EEPZ.Common.ViewModels.Promotion.Request
{
    public class PromotionFilterRequestDto
    {
        public string Status { get; set; }
        public int? DepartmentId { get; set; }
        public string SearchTerm { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string SortBy { get; set; } = "PromotionDate";
        public string SortOrder { get; set; } = "DESC";
    }
}
