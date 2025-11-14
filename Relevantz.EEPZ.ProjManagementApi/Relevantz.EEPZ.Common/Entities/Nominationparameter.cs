using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Nominationparameter
{
    public int ParameterId { get; set; }

    public int RewardTypeId { get; set; }

    /// <summary>
    /// E.g. &quot;Goal Commitment Rating&quot;, &quot;Key Achievements&quot;
    /// </summary>
    public string ParameterName { get; set; } = null!;

    public string ParameterType { get; set; } = null!;

    public bool? IsRequired { get; set; }

    public int? SortOrder { get; set; }

    public string? PlaceholderText { get; set; }

    /// <summary>
    /// For Number/Rating types
    /// </summary>
    public int? MinimumValue { get; set; }

    /// <summary>
    /// For Number/Rating types
    /// </summary>
    public int? MaximumValue { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<Nominationparametervalue> Nominationparametervalues { get; set; } = new List<Nominationparametervalue>();

    public virtual Rewardtype RewardType { get; set; } = null!;
}
