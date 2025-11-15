namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UpdateUtilizationDto
    {
        public int AllocationId { get; set; }
        public decimal UtilizedAmount { get; set; }
        public decimal UtilizationPercentage { get; set; }
        public string? Notes { get; set; }
        public int UpdatedByUserId { get; set; }
    }
}
