using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Meeting
{
    public int MeetingId { get; set; }
    /// <summary>
    /// Title/Subject of the meeting
    /// </summary>
    public string MeetingTitle { get; set; } = null!;
    public string MeetingType { get; set; } = null!;
    /// <summary>
    /// Scheduled date and time
    /// </summary>
    public DateTime MeetingDate { get; set; }
    /// <summary>
    /// Teams/Zoom/Google Meet link
    /// </summary>
    public string? MeetingLink { get; set; }
    /// <summary>
    /// Meeting agenda/discussion topics
    /// </summary>
    public string? Agenda { get; set; }
    /// <summary>
    /// Manager/Employee who scheduled the meeting
    /// </summary>
    public int ScheduledByEmployeeId { get; set; }
    public string Status { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public virtual ICollection<Meetingparticipant> Meetingparticipants { get; set; } = new List<Meetingparticipant>();
    public virtual ICollection<Mom> Moms { get; set; } = new List<Mom>();
    public virtual Employee ScheduledByEmployee { get; set; } = null!;
}
