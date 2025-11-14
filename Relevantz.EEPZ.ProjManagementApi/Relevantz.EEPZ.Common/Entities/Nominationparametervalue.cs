using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Nominationparametervalue
{
    public int ValueId { get; set; }

    public int NominationId { get; set; }

    public int ParameterId { get; set; }

    /// <summary>
    /// Text, number, or rating value
    /// </summary>
    public string? ParameterValue { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Nomination Nomination { get; set; } = null!;

    public virtual Nominationparameter Parameter { get; set; } = null!;
}
