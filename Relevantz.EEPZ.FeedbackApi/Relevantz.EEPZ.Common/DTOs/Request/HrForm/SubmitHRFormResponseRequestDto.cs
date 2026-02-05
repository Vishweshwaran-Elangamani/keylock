using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class SubmitHRFormResponseRequestDto
    {
        public int FormId { get; set; }
        public int SubmittedByEmployeeId { get; set; }
        public Dictionary<string, object> FormResponse { get; set; }
    }
}
