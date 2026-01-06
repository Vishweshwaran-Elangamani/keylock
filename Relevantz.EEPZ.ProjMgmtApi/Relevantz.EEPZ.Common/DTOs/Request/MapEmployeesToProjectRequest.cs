using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class MapEmployeesToProjectRequest
    {
        [Required]
        public int ProjectId { get; set; }

        [Required]
        public List<EmployeeMappingDto> Employees { get; set; } = new List<EmployeeMappingDto>();
    }

    public class EmployeeMappingDto
    {
        [Required]
        public int EmployeeId { get; set; }

        public bool IsPrimary { get; set; }
    }
}
