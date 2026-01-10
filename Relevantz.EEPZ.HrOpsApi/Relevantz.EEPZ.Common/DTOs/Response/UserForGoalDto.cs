using System;

namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class UserForGoalDto
    {
        public int UserId { get; set; }
        public int? EmployeeId { get; set; }
        public string? Email { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
