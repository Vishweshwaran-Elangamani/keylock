using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Recognitionstatus
{
    public int NominationId { get; set; }

    public int OpportunityId { get; set; }

    public int NomineeEmployeeId { get; set; }

    public string NominationType { get; set; } = null!;

    public int NominatedByEmployeeId { get; set; }

    public string? Justification { get; set; }

    public string Status { get; set; } = null!;

    public int? ReviewedByEmployeeId { get; set; }

    public string? ReviewRemarks { get; set; }

    public DateTime SubmittedAt { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public virtual Employee NominatedByEmployee { get; set; } = null!;

    public virtual ICollection<Nominationparametervalue> Nominationparametervalues { get; set; } = new List<Nominationparametervalue>();

    public virtual ICollection<Nominationvisibilitytracking> Nominationvisibilitytrackings { get; set; } = new List<Nominationvisibilitytracking>();

    public virtual Employee NomineeEmployee { get; set; } = null!;

    public virtual Recognitiondetail Opportunity { get; set; } = null!;

    public virtual Employee? ReviewedByEmployee { get; set; }
}
