using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Bulkoperationlog
{
    public int LogId { get; set; }
    public int PerformedByUserId { get; set; }
    public string OperationType { get; set; } = null!;
    public int TotalRecords { get; set; }
    public int SuccessCount { get; set; }
    public int FailureCount { get; set; }
    public string? ErrorDetails { get; set; }
    public string? FileName { get; set; }
    public DateTime PerformedAt { get; set; }
    public virtual Userauthentication PerformedByUser { get; set; } = null!;
}
