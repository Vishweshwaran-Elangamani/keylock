using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Momdiscussionpoint
{
    public int PointId { get; set; }

    public int Momid { get; set; }

    public string PointText { get; set; } = null!;

    public int PointOrder { get; set; }

    public virtual Mom Mom { get; set; } = null!;
}
