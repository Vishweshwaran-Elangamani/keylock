using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.ViewModels.Promotion.Response
{
    public class PromotionListResponseDto
    {
        public List<PromotionResponseDto> Promotions { get; set; }
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
}
