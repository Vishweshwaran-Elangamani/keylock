namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class DepartmentComplianceResponse
    {
        public int ComplianceId { get; set; }
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string Period { get; set; } = string.Empty;
        public DateOnly PeriodStartDate { get; set; }
        public DateOnly PeriodEndDate { get; set; }
        public int TotalSlas { get; set; }
        public int OnTimeSlas { get; set; }
        public int BreachedSlas { get; set; }
        public int ExtendedSlas { get; set; }
        public int PendingSlas { get; set; }
        public decimal CompliancePercentage { get; set; }
        public DateTime CalculatedAt { get; set; }
    }
}
