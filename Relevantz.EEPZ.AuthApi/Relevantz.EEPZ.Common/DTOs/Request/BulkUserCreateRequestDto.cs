namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class BulkUserCreateRequestDto
    {
        public List<CreateUserRequestDto> Users { get; set; } = new List<CreateUserRequestDto>();
    }
    public class BulkUserCreateItem
    {
        public string EmployeeCompanyId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string EmploymentType { get; set; } = string.Empty;
        public string EmploymentStatus { get; set; } = string.Empty;
        public DateTime JoiningDate { get; set; }
        public string EmployeeType { get; set; } = string.Empty;
        public int RoleId { get; set; }
        public int DepartmentId { get; set; }
        public string? MobileNumber { get; set; }
        public string? Gender { get; set; }
    }
}
