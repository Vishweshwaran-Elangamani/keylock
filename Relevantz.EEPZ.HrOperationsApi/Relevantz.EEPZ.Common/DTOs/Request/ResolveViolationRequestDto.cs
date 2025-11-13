using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class ResolveViolationRequestDto
    {
        [Required(ErrorMessage = "Resolution notes are required")]
        public string ResolutionNotes { get; set; } = null!;
    }
}
