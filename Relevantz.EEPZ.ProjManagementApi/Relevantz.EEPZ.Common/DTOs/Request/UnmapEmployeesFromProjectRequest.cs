using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UnmapEmployeesFromProjectRequest
    {
        [Required]
        public int ProjectId { get; set; }

        [Required]
        public List<int> EmployeeIds { get; set; } = new List<int>();
    }
}
