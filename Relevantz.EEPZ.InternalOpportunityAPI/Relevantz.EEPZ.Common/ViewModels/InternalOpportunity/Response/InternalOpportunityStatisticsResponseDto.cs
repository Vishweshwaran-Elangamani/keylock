using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.ViewModels.InternalOpportunity.Response
{
    public class InternalOpportunityStatisticsResponseDto
    {
        public int TotalOpportunities { get; set; }
        public int ActiveOpportunities { get; set; }
        public int ClosedOpportunities { get; set; }
        public Dictionary<string, int> OpportunitiesByDepartment { get; set; }
        public Dictionary<string, int> ApplicationsByStatus { get; set; }
        public List<OpportunityTrendDto> Trends { get; set; }
    }

    public class OpportunityTrendDto
    {
        public string Month { get; set; }
        public int OpportunitiesCreated { get; set; }
        public int ApplicationsReceived { get; set; }
    }
}
