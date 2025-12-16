using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Departmentheadapproval
{
    public int ApprovalId { get; set; }

    public int EmployeeId { get; set; }

    public int ProjectId { get; set; }

    public int AssessmentId { get; set; }

    public int ApprovedBy { get; set; }

    public DateTime ApprovedAt { get; set; }

    public string Status { get; set; } = null!;

    public bool AcknowledgedByEmployee { get; set; }

    public DateTime? AcknowledgedAt { get; set; }

    public string? EmployeeComments { get; set; }

    public virtual Userauthentication ApprovedByNavigation { get; set; } = null!;

    public virtual Selfassessment Assessment { get; set; } = null!;

    public virtual Employeedetailsmaster Employee { get; set; } = null!;

    public virtual Project Project { get; set; } = null!;
}
