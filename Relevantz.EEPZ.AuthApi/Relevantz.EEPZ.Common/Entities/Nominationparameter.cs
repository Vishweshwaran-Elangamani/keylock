using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Nominationparameter
{
    public int ParameterId { get; set; }
    public int RewardTypeId { get; set; }
    public string ParameterName { get; set; } = null!;
    public string ParameterType { get; set; } = null!;
    public bool? IsRequired { get; set; }
    public int? SortOrder { get; set; }
    public string? PlaceholderText { get; set; }
    public int? MinimumValue { get; set; }
    public int? MaximumValue { get; set; }
    public DateTime CreatedAt { get; set; }
    public virtual ICollection<Nominationparametervalue> Nominationparametervalues { get; set; } = new List<Nominationparametervalue>();
    public virtual Rewardtype RewardType { get; set; } = null!;
}
