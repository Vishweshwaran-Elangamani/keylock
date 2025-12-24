using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class GoalComment
{
    public int Goalcommentid { get; set; }

    public int GoalId { get; set; }

    public string? GoalComment1 { get; set; }

    public int? CommentedBy { get; set; }

    public DateTime? CommentedOn { get; set; }

    public virtual Employeedetailsmaster? CommentedByNavigation { get; set; }

    public virtual Goal Goal { get; set; } = null!;
}
