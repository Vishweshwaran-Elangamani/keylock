using System.ComponentModel.DataAnnotations;
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class CreateUserRequestDto
    {
        [Required(ErrorMessage = "Employee Company ID is required")]
        [StringLength(50)]
        public string EmployeeCompanyId { get; set; } = string.Empty;
        [Required(ErrorMessage = "Employment Type is required")]
        public string EmploymentType { get; set; } = string.Empty;
        [Required(ErrorMessage = "Employment Status is required")]
        public string EmploymentStatus { get; set; } = string.Empty;
        [Required(ErrorMessage = "Joining Date is required")]
        public DateOnly JoiningDate { get; set; }  
        public DateOnly? ConfirmationDate { get; set; }  
        public int? ReportingManagerEmployeeId { get; set; }
        [StringLength(100)]
        public string? WorkLocation { get; set; }
        [Required(ErrorMessage = "Employee Type is required")]
        public string EmployeeType { get; set; } = string.Empty;
        public int NoticePeriodDays { get; set; } = 30;
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(255)]
        public string Email { get; set; } = string.Empty;
        [Required(ErrorMessage = "First Name is required")]
        [StringLength(100)]
        public string FirstName { get; set; } = string.Empty;
        [StringLength(100)]
        public string? MiddleName { get; set; }
        [Required(ErrorMessage = "Last Name is required")]
        [StringLength(100)]
        public string LastName { get; set; } = string.Empty;
        [StringLength(100)]
        public string? CallingName { get; set; }
        [StringLength(100)]
        public string? ReferredBy { get; set; }
        public string? Gender { get; set; }
        public DateOnly? DateOfBirthOfficial { get; set; }  
        public DateOnly? DateOfBirthActual { get; set; }  
        [StringLength(20)]
        public string? MobileNumber { get; set; }
        [StringLength(20)]
        public string? AlternateNumber { get; set; }
        [EmailAddress]
        [StringLength(255)]
        public string? PersonalEmail { get; set; }
        [Required(ErrorMessage = "Role ID is required")]
        public int RoleId { get; set; }
        [Required(ErrorMessage = "Department ID is required")]
        public int DepartmentId { get; set; }
    }
}
