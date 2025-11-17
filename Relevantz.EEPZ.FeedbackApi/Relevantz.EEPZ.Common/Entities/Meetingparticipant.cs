using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Meetingparticipant
{
    public int ParticipantId { get; set; }

    public int MeetingId { get; set; }

    public int EmployeeId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Employee Employee { get; set; } = null!;

    public virtual Meeting Meeting { get; set; } = null!;
}
