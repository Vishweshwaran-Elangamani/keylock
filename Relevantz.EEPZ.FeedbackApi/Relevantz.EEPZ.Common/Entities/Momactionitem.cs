using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Momactionitem
{
    public int ActionItemId { get; set; }

    public int Momid { get; set; }

    public string TaskDescription { get; set; } = null!;

    public int AssignedToEmployeeId { get; set; }

    public DateOnly DueDate { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual Employee AssignedToEmployee { get; set; } = null!;

    public virtual Mom Mom { get; set; } = null!;
}
