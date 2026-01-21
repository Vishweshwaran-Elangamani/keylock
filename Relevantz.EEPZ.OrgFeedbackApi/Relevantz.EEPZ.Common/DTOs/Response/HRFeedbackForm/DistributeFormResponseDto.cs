namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class DistributeFormResponseDto
    {
        public bool Success { get; set; }
        public int FormId { get; set; }
        public int EmployeeCount { get; set; }
        public string? Message { get; set; }
    }
}
