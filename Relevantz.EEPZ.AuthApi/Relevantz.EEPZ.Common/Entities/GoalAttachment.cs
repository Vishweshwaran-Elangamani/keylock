using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class GoalAttachment
{
    public int Goalattachmentsid { get; set; }

    public int GoalId { get; set; }

    public string? AttachmentTitle { get; set; }

    /// <summary>
    /// File path or blob reference
    /// </summary>
    public string? Attachments { get; set; }

    public int? AttachedBy { get; set; }

    public DateTime? AttachedOn { get; set; }

    public virtual Employeedetailsmaster? AttachedByNavigation { get; set; }

    public virtual Goal Goal { get; set; } = null!;
}
