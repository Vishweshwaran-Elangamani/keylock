using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Hrfeedbackform
{
    public int FormId { get; set; }

    public string FormName { get; set; } = null!;

    public string? FormDescription { get; set; }

    public string FormType { get; set; } = null!;

    public int CreatedByHrid { get; set; }

    public string? DistributedToEmployeeIds { get; set; }

    public DateTime? Deadline { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual Userauthentication CreatedByHr { get; set; } = null!;

    public virtual ICollection<Hrfeedbackformresponse> Hrfeedbackformresponses { get; set; } = new List<Hrfeedbackformresponse>();
}
