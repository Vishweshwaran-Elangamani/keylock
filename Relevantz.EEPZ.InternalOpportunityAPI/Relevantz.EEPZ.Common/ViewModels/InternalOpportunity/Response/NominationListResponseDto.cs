using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.ViewModels.Nomination.Response
{
    public class NominationListResponseDto
    {
        public List<NominationResponseDto> Nominations { get; set; }
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
}
