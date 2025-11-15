using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

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

    [ForeignKey("AssignedBy")]
    [InverseProperty("AssignmentAssignedByNavigations")]
    public virtual Userauthentication AssignedByNavigation { get; set; } = null!;

    [ForeignKey("EmployeeId")]
    public virtual Userprofile EmployeeDraftProfile { get; set; } = null!;

    [ForeignKey("EmployeeId")]
    [InverseProperty("AssignmentEmployees")]
    public virtual Userauthentication Employee { get; set; } = null!;

    public virtual Assessmentform Form { get; set; } = null!;

    [JsonIgnore]
    public virtual ICollection<Formprogresstracker> Formprogresstrackers { get; set; } = new List<Formprogresstracker>();
}



