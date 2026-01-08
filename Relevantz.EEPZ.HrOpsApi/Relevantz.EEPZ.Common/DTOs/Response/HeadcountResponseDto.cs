namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class HeadcountResponseDto
    {
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public int CurrentHeadcount { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
