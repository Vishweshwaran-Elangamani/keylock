using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request to create a new HR feedback form.
    /// </summary>
    public class CreateHRFeedbackFormRequestDto
    {
        /// <summary>Name of the feedback form.</summary>
        public string FormName { get; set; }

        /// <summary>Description of the feedback form.</summary>
        public string FormDescription { get; set; }

        /// <summary>Type or category of the form.</summary>
        public string FormType { get; set; }

        /// <summary>HR user creating the form.</summary>
        public int CreatedByHRId { get; set; }

        /// <summary>Employees to whom the form is distributed.</summary>
        public List<int> DistributedToEmployeeIds { get; set; } = new();

        /// <summary>Optional submission deadline.</summary>
        public DateTime? Deadline { get; set; }
    }
}
