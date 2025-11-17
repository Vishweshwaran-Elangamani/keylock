using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Achievement
{
    public int AchievementId { get; set; }

    public string AchievementName { get; set; } = null!;

    public string? AchievementDescription { get; set; }

    public string? AchievementIcon { get; set; }

    public int PointsRequired { get; set; }

    public DateTime CreatedAt { get; set; }
}
