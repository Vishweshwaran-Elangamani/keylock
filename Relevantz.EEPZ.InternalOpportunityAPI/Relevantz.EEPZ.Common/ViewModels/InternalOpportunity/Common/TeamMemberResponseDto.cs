using System;

namespace Relevantz.EEPZ.Common.ViewModels.Common
{
    public class TeamMemberResponseDto
    {
        public int EmployeeId { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Department { get; set; }
        public string Role { get; set; }
    }
}
