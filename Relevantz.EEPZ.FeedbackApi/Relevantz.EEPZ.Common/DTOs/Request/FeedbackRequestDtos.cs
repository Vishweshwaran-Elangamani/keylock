using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request DTO for creating feedback (US032, US033, US036, US037, US039)
    /// </summary>
    public class CreateFeedbackRequestDto
    {
        [Required(ErrorMessage = "FeedbackType is required")]
        public string FeedbackType { get; set; }
        // Values: GoalBased, ProjectBased, PeerFeedback, MentorFeedback, HRForm, OrganizationalGoal, BiasReview

        public int? SubmittedByEmployeeId { get; set; }
        // NULL if anonymous feedback

        [Required(ErrorMessage = "RecipientEmployeeId is required")]
        public int RecipientEmployeeId { get; set; }
        // Who receives the feedback

        public int? RelatedGoalId { get; set; }
        // For US032: Goal-based feedback

        public int? RelatedProjectId { get; set; }
        // For US032: Project-based feedback

        public int? RelatedMentorId { get; set; }
        // For US037: Mentor feedback

        public int? RelatedOrganizationGoalId { get; set; }
        // For US047, US049: Organization goal feedback

        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int? Rating { get; set; }
        // 1-5 scale rating

        [MaxLength(2000, ErrorMessage = "Comments cannot exceed 2000 characters")]
        public string Comments { get; set; }
        // Optional end comments

        public bool IsAnonymous { get; set; } = false;
        // For US036: Anonymous feedback flag

        // Question responses
        public List<FeedbackQuestionResponseRequestDto> QuestionResponses { get; set; } = new();
    }

    /// <summary>
    /// Request DTO for updating feedback (US038)
    /// </summary>
    public class UpdateFeedbackRequestDto
    {
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int? Rating { get; set; }

        [MaxLength(2000, ErrorMessage = "Comments cannot exceed 2000 characters")]
        public string Comments { get; set; }

        public List<FeedbackQuestionResponseRequestDto> QuestionResponses { get; set; }
    }

    /// <summary>
    /// Request DTO for individual question response (Part of CreateFeedbackRequestDto)
    /// </summary>
    public class FeedbackQuestionResponseRequestDto
    {
        [Required]
        public int QuestionId { get; set; }

        public int? RatingValue { get; set; }
        // For Rating type questions: 1-5

        public bool? BooleanValue { get; set; }
        // For Boolean type questions: True/False

        public string TextValue { get; set; }
        // For Text type questions: Free text

        public List<int> SelectedOptions { get; set; }
        // For Checkbox/MultipleChoice: Array of selected values
    }

    /// <summary>
    /// Request DTO for Manager Review Comments (US048, US050, US051)
    /// </summary>
    public class CreateManagerReviewRequestDto
    {
        [Required(ErrorMessage = "ManagerEmployeeId is required")]
        public int ManagerEmployeeId { get; set; }

        [Required(ErrorMessage = "TargetEmployeeId is required")]
        public int TargetEmployeeId { get; set; }

        public int? TargetGoalId { get; set; }
        // For goal-specific reviews (US048)

        public int? TargetOrganizationGoalId { get; set; }
        // For org goal reviews (US049)

        [Required(ErrorMessage = "Rating is required")]
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int Rating { get; set; }

        [MaxLength(2000, ErrorMessage = "ReviewComment cannot exceed 2000 characters")]
        public string ReviewComment { get; set; }
    }

    /// <summary>
    /// Request DTO for Mentor Feedback (US037, US121)
    /// </summary>
    public class CreateMentorFeedbackRequestDto
    {
        [Required]
        public int SmeId { get; set; }
        // Links to SME table (mentor + skill combo)

        [Required]
        public int MentorEmployeeId { get; set; }
        // The mentor's Employee ID

        [Required]
        public int MenteeEmployeeId { get; set; }
        // Person receiving mentorship

        [Required]
        public int SkillIdReference { get; set; }
        // Which skill is being mentored

        [Required]
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int Rating { get; set; }
        // Mentor effectiveness rating

        [MaxLength(2000)]
        public string FeedbackComments { get; set; }

        [Required]
        public int SubmittedByEmployeeId { get; set; }
        // Who submitted (mentee, HR, or manager)

        [Required]
        public string FeedbackFrom { get; set; }
        // Values: Mentee, HR, Manager

        public bool IsAnonymous { get; set; } = false;
    }

    /// <summary>
    /// Request DTO for Organization Goal Feedback (US047, US049)
    /// </summary>`


    /// <summary>
    /// Request DTO for Peer Feedback (US033, US075)
    /// </summary>
    public class CreatePeerFeedbackRequestDto
    {
        [Required]
        public int SubmittedByEmployeeId { get; set; }

        [Required]
        public int RecipientEmployeeId { get; set; }

        [Required]
        [MaxLength(2000)]
        public string FeedbackContent { get; set; }

        public bool IsAnonymous { get; set; } = false;
    }

    /// <summary>
    /// Request DTO for HR Peer Feedback Approval (US115, US116)
    /// </summary>
    public class ApprovePeerFeedbackRequestDto
    {
        [Required]
        public int QueueId { get; set; }

        [Required]
        public bool IsProfessional { get; set; }
        // Is feedback professional?

        [Required]
        public bool IsRelevant { get; set; }
        // Is feedback relevant?

        public bool Approve { get; set; } = true;
        // True = Approve, False = Reject
    }

    /// <summary>
    /// Request DTO for HR Feedback Form Creation (US039)
    /// </summary>
    public class CreateHRFeedbackFormRequestDto
    {
        [Required]
        [MaxLength(200)]
        public string FormName { get; set; }

        [MaxLength(1000)]
        public string FormDescription { get; set; }

        [Required]
        public string FormType { get; set; }
        // Values: GeneralFeedback, BiasReview, ProfessionalismReview, PerformanceReview

        [Required]
        public int CreatedByHRId { get; set; }

        public List<int> DistributedToEmployeeIds { get; set; } = new();

        public DateTime? Deadline { get; set; }
    }

    /// <summary>
    /// Request DTO for HR Form Response Submission (US039)
    /// </summary>
    public class SubmitHRFormResponseRequestDto
    {
        [Required]
        public int FormId { get; set; }

        [Required]
        public int SubmittedByEmployeeId { get; set; }

        [Required]
        public Dictionary<string, object> FormResponse { get; set; }
        // Dynamic form response data
    }

    /// <summary>
    /// Request DTO for updating manager review (US050)
    /// </summary>
    public class UpdateManagerReviewRequestDto
    {
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int? Rating { get; set; }

        [MaxLength(2000, ErrorMessage = "ReviewComment cannot exceed 2000 characters")]
        public string ReviewComment { get; set; }
    }

    public class UpdateMentorFeedbackRequestDto
    {
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int? Rating { get; set; }

        [MaxLength(2000)]
        public string FeedbackComments { get; set; }
    }

    public class UpdateOrgGoalFeedbackRequestDto
    {
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int? Rating { get; set; }

        [MaxLength(2000)]
        public string FeedbackComments { get; set; }
    }

    public class UpdatePeerFeedbackRequestDto
    {
        [MaxLength(2000)]
        public string FeedbackContent { get; set; }
    }

    public class DistributeFormRequest
    {
        public List<int> EmployeeIds { get; set; }
    }
    
       public class SubmitFeedbackRequest
    {
        public int EmployeeId { get; set; }
        public int ProjectId { get; set; }
        public int GoalId { get; set; }
        public string FeedbackText { get; set; }
        public int Rating { get; set; }
    }

     public class CreateGoalFeedbackRequestDto
    {
        [Required]
        public int GoalId { get; set; }  // ✅ Changed from OrganizationObjectiveId

        [Required]
        public int SubmittedByEmployeeId { get; set; }

        public int? ManagerEmployeeId { get; set; }

        [Required]
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int Rating { get; set; }

        [MaxLength(2000)]
        public string FeedbackComments { get; set; }

        [Required]
        public string FeedbackFrom { get; set; }
        // Values: Employee, Manager, DeptHead, HR

        public bool IsAnonymous { get; set; } = false;
    }

    public class UpdateGoalFeedbackRequestDto
    {
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int? Rating { get; set; }

        [MaxLength(2000)]
        public string FeedbackComments { get; set; }
        
        public string Status { get; set; }
    }

    // ============================================================================
// ORGANIZATION GOAL FEEDBACK REQUEST DTOs
// ============================================================================

/// <summary>
/// Request DTO for creating organization goal feedback
/// Uses Feedback table with RelatedGoalId filtered by Goal.GoalType
/// </summary>
public class CreateOrgGoalFeedbackRequestDto
{
    [Required(ErrorMessage = "GoalId is required")]
    public int GoalId { get; set; }

    [Required(ErrorMessage = "SubmittedByEmployeeId is required")]
    public int SubmittedByEmployeeId { get; set; }

    [Required(ErrorMessage = "RecipientEmployeeId is required")]
    public int RecipientEmployeeId { get; set; }
    // Manager, Department Head, or HR who receives the feedback

    [Required(ErrorMessage = "Rating is required")]
    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
    public int Rating { get; set; }

    [MaxLength(2000, ErrorMessage = "Comments cannot exceed 2000 characters")]
    public string FeedbackComments { get; set; }

    public bool IsAnonymous { get; set; } = false;
}



    
}




