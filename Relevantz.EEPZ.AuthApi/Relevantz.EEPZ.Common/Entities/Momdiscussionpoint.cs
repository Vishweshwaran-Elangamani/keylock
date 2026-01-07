using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Momdiscussionpoint
{
    public int PointId { get; set; }
    public int Momid { get; set; }
    /// <summary>
    /// The discussion point content
    /// </summary>
    public string PointText { get; set; } = null!;
    /// <summary>
    /// Display order of discussion points
    /// </summary>
    public int PointOrder { get; set; }
    public virtual Mom Mom { get; set; } = null!;
}
