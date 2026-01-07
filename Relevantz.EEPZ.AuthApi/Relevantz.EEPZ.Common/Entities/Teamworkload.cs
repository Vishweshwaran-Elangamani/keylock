using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Teamworkload
{
    public int WorkloadId { get; set; }
    public int TeamId { get; set; }
    public int ManagerUserId { get; set; }
    public int MemberCount { get; set; }
    public decimal AvgWorkload { get; set; }
    public decimal WorkloadVariance { get; set; }
    public int TasksDistributed { get; set; }
    public string Status { get; set; } = null!;
    public DateOnly EvaluationDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public virtual Userauthentication ManagerUser { get; set; } = null!;
}
