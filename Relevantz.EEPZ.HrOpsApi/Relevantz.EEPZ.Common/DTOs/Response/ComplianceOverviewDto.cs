namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class ComplianceOverviewDto
    {
        public int TotalPolicies { get; set; }
        public int ActivePolicies { get; set; }
        public int InactivePolicies { get; set; }
        public int TotalViolations { get; set; }
        public int ActiveViolations { get; set; }
        public int ResolvedViolations { get; set; }
        public double ComplianceRate { get; set; }
    }
}
