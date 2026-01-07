using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Goalchecklistprogress
{
    public int ChecklistProgressId { get; set; }
    public int ChecklistId { get; set; }
    public int? UserId { get; set; }
    public bool? IsCompleted { get; set; }
    public DateTime? CompletedOn { get; set; }
    public virtual GoalChecklist Checklist { get; set; } = null!;
    public virtual Employeedetailsmaster? User { get; set; }
}
