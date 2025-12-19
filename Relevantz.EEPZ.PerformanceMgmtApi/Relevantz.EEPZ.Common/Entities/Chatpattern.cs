using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Chatpattern
{
    public int PatternId { get; set; }

    public string Pattern { get; set; } = null!;

    public string Response { get; set; } = null!;

    public string? Category { get; set; }

    public int? Priority { get; set; }

    public bool? IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? CreatedByUserId { get; set; }

    public virtual Userauthentication? CreatedByUser { get; set; }
}
