using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request to submit a response for an HR feedback form.
    /// </summary>
    public class SubmitHRFormResponseRequestDto
    {
        /// <summary>Identifier of the feedback form being answered.</summary>
        public int FormId { get; set; }

        /// <summary>Employee submitting the form response.</summary>
        public int SubmittedByEmployeeId { get; set; }

        /// <summary>Key-value responses to form questions.</summary>
        public Dictionary<string, object> FormResponse { get; set; }
    }
}
