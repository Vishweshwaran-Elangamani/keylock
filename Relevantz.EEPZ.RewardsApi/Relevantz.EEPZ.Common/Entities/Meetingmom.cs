using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Meetingmom
{
    public int Momid { get; set; }

    public string MeetingTitle { get; set; } = null!;

    public DateOnly MeetingDate { get; set; }

    public string Notes { get; set; } = null!;

    public int? CreatedBy { get; set; }

    public int? EmployeeId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Employee? Employee { get; set; }
}
