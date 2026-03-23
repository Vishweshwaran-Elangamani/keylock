namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class UserDto
    {
        public int UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public int EmpId { get; set; }
        public int EmpMasterId { get; set; }
        public string Role { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
    }
}