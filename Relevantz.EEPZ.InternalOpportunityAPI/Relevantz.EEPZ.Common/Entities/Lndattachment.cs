using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Lndattachment
{
    public int AttachmentId { get; set; }

    public string FileName { get; set; } = null!;

    public string FilePath { get; set; } = null!;

    public long? FileSize { get; set; }

    public string AttachmentType { get; set; } = null!;

    public int CreatedByEmployeeId { get; set; }

    public DateTime? CreatedOn { get; set; }

    public virtual Employee CreatedByEmployee { get; set; } = null!;

    public virtual ICollection<Lndapproval> Lndapprovals { get; set; } = new List<Lndapproval>();

    public virtual ICollection<Sme> Smes { get; set; } = new List<Sme>();
}
