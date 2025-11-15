using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Promotion
{
    public int PromotionId { get; set; }

    public int EmployeeUserId { get; set; }

    public int DepartmentId { get; set; }

    public string? OldRole { get; set; }

    public string NewRole { get; set; } = null!;

    public decimal? OldSalary { get; set; }

    public decimal NewSalary { get; set; }

    public decimal? IncrementPercentage { get; set; }

    public DateOnly PromotionDate { get; set; }

    public string? Justification { get; set; }

    public string Status { get; set; } = null!;

    public int? ApprovedByUserId { get; set; }

    public int? NominationId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Userauthentication? ApprovedByUser { get; set; }

    public virtual Department Department { get; set; } = null!;

    public virtual Userauthentication EmployeeUser { get; set; } = null!;

    public virtual Nomination? Nomination { get; set; }

    public virtual ICollection<Promotionhistory> Promotionhistories { get; set; } = new List<Promotionhistory>();
}
