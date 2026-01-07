namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class UserResponseDto
    {
        public int UserId { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeCompanyId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public bool IsFirstLogin { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public string EmploymentType { get; set; } = string.Empty;
        public string EmploymentStatus { get; set; } = string.Empty;
        public DateOnly JoiningDate { get; set; }   
        public DateOnly? ConfirmationDate { get; set; }  
        public DateOnly? ExitDate { get; set; }  
        public string? WorkLocation { get; set; }
        public string EmployeeType { get; set; } = string.Empty;
        public int NoticePeriodDays { get; set; }
        public bool IsActive { get; set; }
        // Profile Information
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public string LastName { get; set; } = string.Empty;
        public string? CallingName { get; set; }
        public string? Gender { get; set; }
        public DateOnly? DateOfBirthOfficial { get; set; }  
        public string? MobileNumber { get; set; }
        public string? PersonalEmail { get; set; }
        public string? RoleName { get; set; }
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
    }
}
