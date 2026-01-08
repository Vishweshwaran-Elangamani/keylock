using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Assignment
{
    public int AssignmentId { get; set; }
    public int FormId { get; set; }
    public int EmployeeId { get; set; }
    public int AssignedBy { get; set; }
    public DateTime? AssignedAt { get; set; }
    public DateTime? Deadline { get; set; }
    public string? Action { get; set; }
    public virtual Userauthentication AssignedByNavigation { get; set; } = null!;
    public virtual Userauthentication Employee { get; set; } = null!;
    public virtual Assessmentform Form { get; set; } = null!;
    public virtual ICollection<Formprogresstracker> Formprogresstrackers { get; set; } = new List<Formprogresstracker>();
}
