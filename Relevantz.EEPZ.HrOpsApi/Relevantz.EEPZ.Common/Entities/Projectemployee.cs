using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Projectemployee
{
    public int ProjectId { get; set; }
    public int EmployeeId { get; set; }
    public DateTime? AssignedAt { get; set; }
    public bool IsPrimary { get; set; }
    public virtual Employeedetailsmaster Employee { get; set; } = null!;
    public virtual Project Project { get; set; } = null!;
}
