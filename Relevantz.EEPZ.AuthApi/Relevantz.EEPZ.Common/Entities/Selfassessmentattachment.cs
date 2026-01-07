using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Selfassessmentattachment
{
    public int AttachmentId { get; set; }
    public int AssessmentId { get; set; }
    public int? UploadedBy { get; set; }
    public string FileName { get; set; } = null!;
    public string FilePath { get; set; } = null!;
    public string? FileType { get; set; }
    public long? FileSize { get; set; }
    public string? AttachmentNote { get; set; }
    public int? DisplayOrder { get; set; }
    public DateTime? UploadedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public virtual Selfassessment Assessment { get; set; } = null!;
    public virtual Userauthentication? UploadedByNavigation { get; set; }
}
