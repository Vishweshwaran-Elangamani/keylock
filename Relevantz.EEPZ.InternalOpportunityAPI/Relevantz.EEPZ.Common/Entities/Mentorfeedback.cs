using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Mentorfeedback
{
    public int MentorFeedbackId { get; set; }

    /// <summary>
    /// FK to internal mentor
    /// </summary>
    public int? MentorEmployeeId { get; set; }

    /// <summary>
    /// Legacy free-text name
    /// </summary>
    public string? MentorName { get; set; }

    public string Comments { get; set; } = null!;

    public int Rating { get; set; }

    public int? SubmittedByEmployeeId { get; set; }

    /// <summary>
    /// Legacy submitter id
    /// </summary>
    public int? SubmittedByLegacyId { get; set; }

    public bool IsAnonymous { get; set; }

    public DateTime SubmittedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Employee? SubmittedByEmployee { get; set; }
}
