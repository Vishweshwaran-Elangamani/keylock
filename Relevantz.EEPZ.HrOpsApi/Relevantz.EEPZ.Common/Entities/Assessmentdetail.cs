using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Assessmentdetail
{
    public int DetailId { get; set; }

    public int AssessmentId { get; set; }

    public int CompetencyId { get; set; }

    public int? EmployeeRating { get; set; }

    public string? EmployeeComments { get; set; }

    public virtual Selfassessment Assessment { get; set; } = null!;

    public virtual ICollection<Assessmentreview> Assessmentreviews { get; set; } = new List<Assessmentreview>();

    public virtual Competency Competency { get; set; } = null!;
}
