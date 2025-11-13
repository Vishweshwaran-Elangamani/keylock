using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Lndcomment
{
    public int CommentId { get; set; }

    public int AssignmentId { get; set; }

    public string Comment { get; set; } = null!;

    public int CreatedByEmployeeId { get; set; }

    public DateTime? CreatedOn { get; set; }

    public virtual Lndassignment Assignment { get; set; } = null!;

    public virtual Employee CreatedByEmployee { get; set; } = null!;
}
