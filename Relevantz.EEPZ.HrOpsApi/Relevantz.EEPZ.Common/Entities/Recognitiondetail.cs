using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Recognitiondetail
{
    public int OpportunityId { get; set; }
    public string OpportunityName { get; set; } = null!;
    public int DepartmentId { get; set; }
    public int RewardTypeId { get; set; }
    public string? Description { get; set; }
    public string? Requirements { get; set; }
    public string? EligibilityCriteria { get; set; }
    public DateOnly Deadline { get; set; }
    public string Status { get; set; } = null!;
    public int PostedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public virtual Department Department { get; set; } = null!;
    public virtual Userauthentication PostedByUser { get; set; } = null!;
    public virtual ICollection<Recognitionstatus> Recognitionstatuses { get; set; } = new List<Recognitionstatus>();
    public virtual Rewardtype RewardType { get; set; } = null!;
}
