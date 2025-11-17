using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Momsharing
{
    public int SharingId { get; set; }

    public int Momid { get; set; }

    public int SharedByEmployeeId { get; set; }

    public int SharedWithEmployeeId { get; set; }

    public DateTime SharedAt { get; set; }

    public virtual Mom Mom { get; set; } = null!;

    public virtual Employee SharedByEmployee { get; set; } = null!;

    public virtual Employee SharedWithEmployee { get; set; } = null!;
}
