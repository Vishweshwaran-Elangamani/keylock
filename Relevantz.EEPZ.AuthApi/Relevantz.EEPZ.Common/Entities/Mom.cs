using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Mom
{
    public int Momid { get; set; }
    /// <summary>
    /// NULL if instant MOM without pre-scheduled meeting
    /// </summary>
    public int? MeetingId { get; set; }
    public string MeetingTitle { get; set; } = null!;
    public string MeetingType { get; set; } = null!;
    public DateTime MeetingDate { get; set; }
    /// <summary>
    /// Teams/Zoom/Google Meet link
    /// </summary>
    public string? MeetingLink { get; set; }
    /// <summary>
    /// Comma-separated list or JSON array of attendee names
    /// </summary>
    public string Attendees { get; set; } = null!;
    /// <summary>
    /// General comments and observations from the meeting
    /// </summary>
    public string? CommentsObservations { get; set; }
    public int SubmittedByEmployeeId { get; set; }
    /// <summary>
    /// Role of the person submitting MOM
    /// </summary>
    public string SubmittedByRole { get; set; } = null!;
    /// <summary>
    /// Managers can edit their own MOMs (US077)
    /// </summary>
    public bool? IsEditable { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public virtual Meeting? Meeting { get; set; }
    public virtual ICollection<Momactionitem> Momactionitems { get; set; } = new List<Momactionitem>();
    public virtual ICollection<Momdiscussionpoint> Momdiscussionpoints { get; set; } = new List<Momdiscussionpoint>();
    public virtual ICollection<Momsharing> Momsharings { get; set; } = new List<Momsharing>();
    public virtual Employee SubmittedByEmployee { get; set; } = null!;
}
