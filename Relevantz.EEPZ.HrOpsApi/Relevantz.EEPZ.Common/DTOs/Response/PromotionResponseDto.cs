namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class PromotionResponseDto
    {
        public int PromotionId { get; set; }
        public int EmployeeUserId { get; set; }
        public string EmployeeEmail { get; set; } = string.Empty;
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string OldRole { get; set; } = string.Empty;
        public string NewRole { get; set; } = string.Empty;
        public decimal? OldSalary { get; set; }
        public decimal? NewSalary { get; set; }
        public decimal? IncrementPercentage { get; set; }
        public DateTime PromotionDate { get; set; }
        public string Justification { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int? ApprovedByUserId { get; set; }
        public string? ApprovedByEmail { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string EmployeeFirstName { get; set; }
        public string EmployeeLastName { get; set; }
        public string EmployeeFullName
        {
            get
            {
                return $"{EmployeeFirstName} {EmployeeLastName}".Trim() ?? "Unknown";
            }
        }
    }
}
