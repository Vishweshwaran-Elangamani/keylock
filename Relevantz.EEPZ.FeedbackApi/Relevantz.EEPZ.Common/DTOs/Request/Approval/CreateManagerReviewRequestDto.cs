using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request to create a manager performance review for an employee.
    /// </summary>
    public class CreateManagerReviewRequestDto
    {
        /// <summary>Manager providing the review.</summary>
        public int ManagerEmployeeId { get; set; }

        /// <summary>Employee being reviewed.</summary>
        public int TargetEmployeeId { get; set; }

        /// <summary>Optional goal identifier linked to the review.</summary>
        public int? TargetGoalId { get; set; }

        /// <summary>Optional organization-level goal identifier.</summary>
        public int? TargetOrganizationGoalId { get; set; }

        /// <summary>Performance rating assigned by the manager.</summary>
        public int Rating { get; set; }

        /// <summary>Manager's written feedback.</summary>
        public string ReviewComment { get; set; }
    }
}
