namespace Relevantz.EEPZ.Common.DTOs.Response.Employees
{
    public class EmployeeBasicInfoDto
    {
        public int EmployeeMasterId { get; set; }

        public int EmployeeId { get; set; }

        public string EmployeeCompanyId { get; set; } = string.Empty;

        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string RoleName { get; set; } = string.Empty;

        public string DepartmentName { get; set; } = string.Empty;
    }
}
