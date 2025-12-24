using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class EmployeeNotificationItemDto
    {
        public int NominationId { get; set; }
        public string RoleType { get; set; } = string.Empty;
    }

    public class EmployeeNotificationSearchResultDto
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public List<EmployeeNotificationItemDto> Data { get; set; } = new();
        public int Count => Data.Count;
    }
}
