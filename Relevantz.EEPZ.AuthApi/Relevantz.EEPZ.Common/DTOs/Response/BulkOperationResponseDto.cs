namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class BulkOperationResponseDto
    {
        public int TotalRecords { get; set; }
        public int SuccessCount { get; set; }
        public int FailureCount { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
        public List<SuccessfulUserDto> SuccessfulUsers { get; set; } = new List<SuccessfulUserDto>();
        public string Message { get; set; }
    }
    public class SuccessfulUserDto
    {
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string EmployeeCompanyId { get; set; }
        public string Role { get; set; }
        public string Department { get; set; }
    }
}
