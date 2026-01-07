using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Selfassessment
{
    public int AssessmentId { get; set; }
    public int FormId { get; set; }
    public int EmployeeId { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public string? Status { get; set; }
    public virtual ICollection<Assessmentdetail> Assessmentdetails { get; set; } = new List<Assessmentdetail>();
    public virtual ICollection<Departmentheadapproval> Departmentheadapprovals { get; set; } = new List<Departmentheadapproval>();
    public virtual Userauthentication Employee { get; set; } = null!;
    public virtual Assessmentform Form { get; set; } = null!;
    public virtual ICollection<Selfassessmentattachment> Selfassessmentattachments { get; set; } = new List<Selfassessmentattachment>();
}
