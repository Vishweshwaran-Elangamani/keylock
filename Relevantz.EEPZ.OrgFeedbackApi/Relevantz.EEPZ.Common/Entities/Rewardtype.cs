using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Rewardtype
{
    public int RewardTypeId { get; set; }

    public string RewardCategory { get; set; } = null!;

    public string RewardName { get; set; } = null!;

    public string? Description { get; set; }

    public bool? IsActive { get; set; }

    public bool IsVisibleForManagerNomination { get; set; }

    public int? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Userauthentication? CreatedByNavigation { get; set; }

    public virtual ICollection<Nominationparameter> Nominationparameters { get; set; } = new List<Nominationparameter>();

    public virtual ICollection<Recognitiondetail> Recognitiondetails { get; set; } = new List<Recognitiondetail>();
}
