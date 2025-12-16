using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Hrfeedbackformresponse
{
    public int ResponseId { get; set; }

    public int FormId { get; set; }

    public int SubmittedByEmployeeId { get; set; }

    public string FormResponse { get; set; } = null!;

    public string Status { get; set; } = null!;

    public DateTime? SubmittedAt { get; set; }

    public int? ReviewedByHrid { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public string? HrreviewComments { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Hrfeedbackform Form { get; set; } = null!;

    public virtual Userauthentication? ReviewedByHr { get; set; }

    public virtual Employee SubmittedByEmployee { get; set; } = null!;
}
