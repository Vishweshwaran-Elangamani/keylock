using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Mentorfeedback
{
    public int MentorFeedbackId { get; set; }

    public int? MentorEmployeeId { get; set; }

    public string? MentorName { get; set; }

    public string Comments { get; set; } = null!;

    public int Rating { get; set; }

    public int? SubmittedByEmployeeId { get; set; }

    public int? SubmittedByLegacyId { get; set; }

    public bool IsAnonymous { get; set; }

    public DateTime SubmittedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Employee? SubmittedByEmployee { get; set; }
}
