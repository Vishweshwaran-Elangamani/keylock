using System.ComponentModel.DataAnnotations;
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UpdateUserRequestDto
    {
        [Required(ErrorMessage = "User ID is required")]
        public int UserId { get; set; }
        public string? EmploymentType { get; set; }
        public string? EmploymentStatus { get; set; }
        public DateTime? ConfirmationDate { get; set; }
        public DateTime? ExitDate { get; set; }
        public int? ReportingManagerEmployeeId { get; set; }
        [StringLength(100)]
        public string? WorkLocation { get; set; }
        public string? EmployeeType { get; set; }
        public int? NoticePeriodDays { get; set; }
        public bool? IsActive { get; set; }
        public string? Status { get; set; }
    }
}
