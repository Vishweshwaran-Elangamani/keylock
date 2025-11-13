namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class BulkUserInactivateRequestDto
    {
        public List<int> UserIds { get; set; } = new List<int>();
    }
}
