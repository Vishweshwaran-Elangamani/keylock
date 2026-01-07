using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Feedback
{
    public int FeedbackId { get; set; }
    public string FeedbackType { get; set; } = null!;
    public int? SubmittedByEmployeeId { get; set; }
    public int RecipientEmployeeId { get; set; }
    public int? RelatedGoalId { get; set; }
    public int? RelatedProjectId { get; set; }
    public int? RelatedMentorId { get; set; }
    public int? RelatedOrganizationGoalId { get; set; }
    public int? Rating { get; set; }
    public string? Comments { get; set; }
    public bool IsAnonymous { get; set; }
    public bool BiasFlag { get; set; }
    public bool FairnessFlag { get; set; }
    public bool IsApprovedForPeerReview { get; set; }
    public string Status { get; set; } = null!;
    public int? ReviewedByHrid { get; set; }
    public string? HrreviewComments { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public virtual ICollection<Feedbackedithistory> Feedbackedithistories { get; set; } = new List<Feedbackedithistory>();
    public virtual ICollection<Feedbackquestionresponse> Feedbackquestionresponses { get; set; } = new List<Feedbackquestionresponse>();
    public virtual Employee RecipientEmployee { get; set; } = null!;
    public virtual Goal? RelatedGoal { get; set; }
    public virtual Employee? RelatedMentor { get; set; }
    public virtual Project? RelatedProject { get; set; }
    public virtual Userauthentication? ReviewedByHr { get; set; }
    public virtual Employee? SubmittedByEmployee { get; set; }
}
