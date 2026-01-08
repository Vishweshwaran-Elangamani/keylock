using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Profilechangerequest
{
    public int RequestId { get; set; }
    public int UserId { get; set; }
    public string? NewEmployeeCompanyId { get; set; }
    public string? NewEmail { get; set; }
    public string? Reason { get; set; }
    public string Status { get; set; } = null!;
    public int? ApprovedByUserId { get; set; }
    public string? AdminRemarks { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public virtual Userauthentication? ApprovedByUser { get; set; }
    public virtual Userauthentication User { get; set; } = null!;
}
