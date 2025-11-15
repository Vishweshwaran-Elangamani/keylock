using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Organizationalpolicy
{
    public int PolicyId { get; set; }

    public string PolicyName { get; set; } = null!;

    /// <summary>
    /// HR, IT, Finance, Operations
    /// </summary>
    public string Category { get; set; } = null!;

    public string? Description { get; set; }

    public string? ComplianceGuidance { get; set; }

    public string Status { get; set; } = null!;

    public int CreatedByUserId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Userauthentication CreatedByUser { get; set; } = null!;

    public virtual ICollection<Policyviolation> Policyviolations { get; set; } = new List<Policyviolation>();
}
