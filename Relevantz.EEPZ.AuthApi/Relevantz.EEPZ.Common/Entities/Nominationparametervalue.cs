using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Nominationparametervalue
{
    public int ValueId { get; set; }
    public int NominationId { get; set; }
    public int ParameterId { get; set; }
    public string? ParameterValue { get; set; }
    public DateTime CreatedAt { get; set; }
    public virtual Recognitionstatus Nomination { get; set; } = null!;
    public virtual Nominationparameter Parameter { get; set; } = null!;
}
