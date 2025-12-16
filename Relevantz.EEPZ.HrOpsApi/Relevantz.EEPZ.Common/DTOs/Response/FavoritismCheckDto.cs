namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class FavoritismCheckDto
    {
        public int PromotionId { get; set; }
        
        public int ManagerId { get; set; }
        public string? ManagerName { get; set; }
        public string? ManagerEmail { get; set; }
        
        public int EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public string? EmployeeEmail { get; set; }

        public bool IsFavoritism { get; set; }
        public int PreviousNominationCount { get; set; }

        public List<PreviousNominationDto> PreviousNominations { get; set; } = new();
    }

    public class PreviousNominationDto
    {
        public int PreviousPromotionId { get; set; }
        public DateTime NominationDate { get; set; }
        public string? Status { get; set; }
        public string? ApprovedByEmail { get; set; }
        public string? RejectionReason { get; set; }
    }
}
