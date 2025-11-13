using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.ViewModels.InternalOpportunity.Response
{
    public class InternalOpportunityListResponseDto
    {
        public List<InternalOpportunityResponseDto> Opportunities { get; set; }
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
}
