using System;

namespace Relevantz.EEPZ.Common.ViewModels.Nomination.Request
{
    public class NominationFilterRequestDto
    {
        public int? OpportunityId { get; set; }
        public string Status { get; set; }
        public string NominationType { get; set; }
        public int? DepartmentId { get; set; }
        public string SearchTerm { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string SortBy { get; set; } = "SubmittedAt";
        public string SortOrder { get; set; } = "DESC";
    }
}
