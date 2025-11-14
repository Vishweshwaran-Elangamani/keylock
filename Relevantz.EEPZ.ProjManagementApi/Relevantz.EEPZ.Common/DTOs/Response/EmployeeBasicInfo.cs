namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class EmployeeBasicInfo
    {
        public int EmployeeMasterId { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeCompanyId { get; set; } = null!;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? RoleName { get; set; }
        public string? DepartmentName { get; set; }

         public bool IsPrimary { get; set; } // ✅ Maps to bit field in DB
    }
}
