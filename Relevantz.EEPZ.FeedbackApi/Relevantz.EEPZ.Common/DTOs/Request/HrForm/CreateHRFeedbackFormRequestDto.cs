using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class CreateHRFeedbackFormRequestDto
    {

        public string FormName { get; set; }

        public string FormDescription { get; set; }


        public string FormType { get; set; }


        public int CreatedByHRId { get; set; }

        public List<int> DistributedToEmployeeIds { get; set; } = new();
        public DateTime? Deadline { get; set; }
    }
}
