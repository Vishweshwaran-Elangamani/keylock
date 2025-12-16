using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Meetingparticipant
{
    public int ParticipantId { get; set; }

    public int MeetingId { get; set; }

    public int EmployeeId { get; set; }

    /// <summary>
    /// Employee response to meeting invitation
    /// </summary>
    public string Rsvpstatus { get; set; } = null!;

    /// <summary>
    /// When employee responded to invitation
    /// </summary>
    public DateTime? RsvpresponseDate { get; set; }

    /// <summary>
    /// Optional comments from employee (e.g., reason for decline)
    /// </summary>
    public string? Rsvpcomments { get; set; }

    /// <summary>
    /// When invitation was sent
    /// </summary>
    public DateTime InvitedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Employee Employee { get; set; } = null!;

    public virtual Meeting Meeting { get; set; } = null!;
}
