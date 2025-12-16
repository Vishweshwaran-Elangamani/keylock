using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Oneononediscussion
{
    public int DiscussionId { get; set; }

    public int HostEmployeeId { get; set; }

    public int ParticipantEmployeeId { get; set; }

    public string MeetingLink { get; set; } = null!;

    public string? Agenda { get; set; }

    public DateTime ScheduledAt { get; set; }

    public int? DurationMinutes { get; set; }

    public string Status { get; set; } = null!;

    public bool? IsPrivate { get; set; }

    public string? RecordingLink { get; set; }

    public string? Notes { get; set; }

    public int CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Employeedetailsmaster CreatedByNavigation { get; set; } = null!;

    public virtual Employeedetailsmaster HostEmployee { get; set; } = null!;

    public virtual Employeedetailsmaster ParticipantEmployee { get; set; } = null!;
}
