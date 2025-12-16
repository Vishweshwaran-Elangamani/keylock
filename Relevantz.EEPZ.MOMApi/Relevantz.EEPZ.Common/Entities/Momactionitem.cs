using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Momactionitem
{
    public int ActionItemId { get; set; }

    public int Momid { get; set; }

    /// <summary>
    /// Description of the action item/task
    /// </summary>
    public string TaskDescription { get; set; } = null!;

    /// <summary>
    /// Employee responsible for the task
    /// </summary>
    public int AssignedToEmployeeId { get; set; }

    /// <summary>
    /// Deadline for completion
    /// </summary>
    public DateOnly DueDate { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Employee AssignedToEmployee { get; set; } = null!;

    public virtual Mom Mom { get; set; } = null!;
}
