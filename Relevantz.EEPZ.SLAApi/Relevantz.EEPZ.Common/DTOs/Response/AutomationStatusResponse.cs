namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class AutomationStatusResponse
    {
        public int TotalSlas { get; set; }
        public int OpenSlas { get; set; }
        public int OverdueSlas { get; set; }
        public int CompletedSlas { get; set; }
        public int ClosedSlas { get; set; }
        public double CompliancePercentage { get; set; }
        public DateTime LastChecked { get; set; }
    }
}
