using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Formprogresstracker
{
    public int TrackerId { get; set; }
    public int AssignmentId { get; set; }
    public bool? Initiated { get; set; }
    public bool? SentToEmployee { get; set; }
    public bool? EmployeeCompleted { get; set; }
    public bool? SentToManager { get; set; }
    public bool? ManagerCompleted { get; set; }
    public bool? SentToDeptHead { get; set; }
    public bool? SentToLeadership { get; set; }
    public DateTime? LastUpdated { get; set; }
    public virtual Assignment Assignment { get; set; } = null!;
}
