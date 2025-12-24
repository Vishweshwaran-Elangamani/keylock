using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Competency
{
    public int CompetencyId { get; set; }

    public int FormId { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    public int? DisplayOrder { get; set; }

    public virtual ICollection<Assessmentdetail> Assessmentdetails { get; set; } = new List<Assessmentdetail>();

    public virtual Assessmentform Form { get; set; } = null!;
}
