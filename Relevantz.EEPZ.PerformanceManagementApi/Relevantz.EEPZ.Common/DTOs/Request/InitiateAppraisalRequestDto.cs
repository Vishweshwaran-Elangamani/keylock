using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class InitiateAppraisalRequestDto
    {
     [Required]
    public int FormId { get; set; }

    [Required]
    public List<int> UserIds { get; set; }

    [Required]
    public int AssignedBy { get; set; }

    [Required]
    public string Action { get; set; }

    public int DeadlineInDays { get; set; } 
    }
}