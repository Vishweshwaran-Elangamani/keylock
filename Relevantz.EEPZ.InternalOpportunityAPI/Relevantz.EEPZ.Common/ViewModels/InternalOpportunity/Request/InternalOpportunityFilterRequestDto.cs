using System;

namespace Relevantz.EEPZ.Common.ViewModels.InternalOpportunity.Request
{
    public class InternalOpportunityFilterRequestDto
    {
        public int? DepartmentId { get; set; }
        public string Status { get; set; }
        public string SearchTerm { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string SortBy { get; set; } = "CreatedAt";
        public string SortOrder { get; set; } = "DESC";
    }
}
