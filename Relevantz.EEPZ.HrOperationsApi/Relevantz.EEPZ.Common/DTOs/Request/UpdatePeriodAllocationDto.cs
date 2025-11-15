namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UpdatePeriodAllocationDto
    {
        public int PeriodAllocationId { get; set; }
        public decimal AllocatedAmount { get; set; }
        public string? Notes { get; set; }
    }
}
