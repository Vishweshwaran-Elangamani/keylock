using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Peerfeedback
{
    public int PeerFeedbackId { get; set; }

    public int? PeerEmployeeId { get; set; }

    public string? PeerName { get; set; }

    public string Comments { get; set; } = null!;

    public bool IsAnonymous { get; set; }

    public int? SubmittedByEmployeeId { get; set; }

    public DateTime SubmittedAt { get; set; }

    public bool ManagerReviewed { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Employeedetailsmaster? PeerEmployee { get; set; }

    public virtual Employeedetailsmaster? SubmittedByEmployee { get; set; }
}
