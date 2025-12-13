using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class GoalChecklist
{
    public int ChecklistId { get; set; }

    public int GoalId { get; set; }

    public string? ItemTitle { get; set; }

    public string? ItemDescription { get; set; }

    public bool? IsShared { get; set; }

    public int? AddedBy { get; set; }

    public int? AddedFor { get; set; }

    public virtual Employeedetailsmaster? AddedByNavigation { get; set; }

    public virtual Employeedetailsmaster? AddedForNavigation { get; set; }

    public virtual Goal Goal { get; set; } = null!;

    public virtual ICollection<Goalchecklistprogress> Goalchecklistprogresses { get; set; } = new List<Goalchecklistprogress>();
}
