using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class GoalAssignment
{
    public int AssignmentId { get; set; }
    public int GoalId { get; set; }
    public int? AssignedBy { get; set; }
    public int? AssignedTo { get; set; }
    public DateTime? AssignedOn { get; set; }
    public bool? IsAcknowledged { get; set; }
    public DateTime? AcknowledgedOn { get; set; }
    public int? AcknowledgedBy { get; set; }
    public virtual Employeedetailsmaster? AcknowledgedByNavigation { get; set; }
    public virtual Employeedetailsmaster? AssignedByNavigation { get; set; }
    public virtual Employeedetailsmaster? AssignedToNavigation { get; set; }
    public virtual Goal Goal { get; set; } = null!;
}
