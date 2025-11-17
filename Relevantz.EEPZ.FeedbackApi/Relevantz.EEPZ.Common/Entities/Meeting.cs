using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Meeting
{
    public int MeetingId { get; set; }

    public string MeetingTitle { get; set; } = null!;

    public string MeetingType { get; set; } = null!;

    public DateTime MeetingDate { get; set; }

    /// <summary>
    /// Teams/Zoom/Google Meet link
    /// </summary>
    public string? MeetingLink { get; set; }

    public string? Agenda { get; set; }

    /// <summary>
    /// Manager who scheduled
    /// </summary>
    public int ScheduledByEmployeeId { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Meetingparticipant> Meetingparticipants { get; set; } = new List<Meetingparticipant>();

    public virtual ICollection<Mom> Moms { get; set; } = new List<Mom>();

    public virtual Employee ScheduledByEmployee { get; set; } = null!;
}
