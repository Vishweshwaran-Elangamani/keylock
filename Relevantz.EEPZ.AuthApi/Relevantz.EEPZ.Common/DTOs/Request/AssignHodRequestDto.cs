using System.ComponentModel.DataAnnotations;
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class AssignHodRequestDto
    {
        [Required(ErrorMessage = "HOD Employee ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "HOD Employee ID must be greater than 0")]
        public int HodEmployeeId { get; set; }
    }
}
