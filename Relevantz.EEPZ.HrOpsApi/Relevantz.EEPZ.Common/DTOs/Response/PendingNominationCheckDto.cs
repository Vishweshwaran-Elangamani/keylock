namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class PendingNominationCheckDto
    {
        public int EmployeeUserId { get; set; }
        public string EmployeeName { get; set; }
        public bool HasPendingNomination { get; set; }
        public int? PendingPromotionId { get; set; }
        public string? PendingNewRole { get; set; }
        public DateTime? PendingCreatedAt { get; set; }
        public string? PendingJustification { get; set; }
        public int? PendingManagerId { get; set; }
        public string? PendingManagerEmail { get; set; }
    }
}