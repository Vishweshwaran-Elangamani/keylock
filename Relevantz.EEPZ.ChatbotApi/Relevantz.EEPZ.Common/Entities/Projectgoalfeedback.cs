using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Projectgoalfeedback
{
    public int FeedbackId { get; set; }

    public int EmployeeMasterId { get; set; }

    public int ProjectId { get; set; }

    public int GoalId { get; set; }

    public string FeedbackText { get; set; } = null!;

    public int Rating { get; set; }

    public DateTime SubmittedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Employeedetailsmaster EmployeeMaster { get; set; } = null!;

    public virtual Goal Goal { get; set; } = null!;

    public virtual Project Project { get; set; } = null!;
}
