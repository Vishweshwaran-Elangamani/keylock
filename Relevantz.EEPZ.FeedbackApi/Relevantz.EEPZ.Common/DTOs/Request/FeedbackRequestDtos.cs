using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request DTO for creating feedback
    /// </summary>
    public class CreateFeedbackRequestDto
    {
        [Required(ErrorMessage = "FeedbackType is required")]
        public string FeedbackType { get; set; }
        

        public int? SubmittedByEmployeeId { get; set; }
       

        [Required(ErrorMessage = "RecipientEmployeeId is required")]
        public int RecipientEmployeeId { get; set; }
        

        public int? RelatedGoalId { get; set; }
        

        public int? RelatedProjectId { get; set; }
        

        public int? RelatedMentorId { get; set; }
        

        public int? RelatedOrganizationGoalId { get; set; }
        

        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int? Rating { get; set; }
        

        [MaxLength(2000, ErrorMessage = "Comments cannot exceed 2000 characters")]
        public string Comments { get; set; }
        

        public bool IsAnonymous { get; set; } = false;
        

        
        public List<FeedbackQuestionResponseRequestDto> QuestionResponses { get; set; } = new();
    }

    /// <summary>
    /// Request DTO for updating feedback
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
    /// Request DTO for individual question response
    /// </summary>
    public class FeedbackQuestionResponseRequestDto
    {
        [Required]
        public int QuestionId { get; set; }

        public int? RatingValue { get; set; }
      

        public bool? BooleanValue { get; set; }
   

        public string TextValue { get; set; }
  

        public List<int> SelectedOptions { get; set; }
     
    }

    /// <summary>
    /// Request DTO for Manager Review Comments
    /// </summary>
    public class CreateManagerReviewRequestDto
    {
        [Required(ErrorMessage = "ManagerEmployeeId is required")]
        public int ManagerEmployeeId { get; set; }

        [Required(ErrorMessage = "TargetEmployeeId is required")]
        public int TargetEmployeeId { get; set; }

        public int? TargetGoalId { get; set; }
      

        public int? TargetOrganizationGoalId { get; set; }
  

        [Required(ErrorMessage = "Rating is required")]
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int Rating { get; set; }

        [MaxLength(2000, ErrorMessage = "ReviewComment cannot exceed 2000 characters")]
        public string ReviewComment { get; set; }
    }

    /// <summary>
    /// Request DTO for Mentor Feedback
    /// </summary>
    public class CreateMentorFeedbackRequestDto
    {
        [Required]
        public int SmeId { get; set; }
       

        [Required]
        public int MentorEmployeeId { get; set; }
  

        [Required]
        public int MenteeEmployeeId { get; set; }
   

        [Required]
        public int SkillIdReference { get; set; }
     

        [Required]
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int Rating { get; set; }
 

        [MaxLength(2000)]
        public string FeedbackComments { get; set; }

        [Required]
        public int SubmittedByEmployeeId { get; set; }
   

        [Required]
        public string FeedbackFrom { get; set; }


        public bool IsAnonymous { get; set; } = false;
    }



    /// <summary>
    /// Request DTO for Peer Feedback
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
    /// Request DTO for HR Peer Feedback Approval
    /// </summary>
    public class ApprovePeerFeedbackRequestDto
    {
        [Required]
        public int QueueId { get; set; }

        [Required]
        public bool IsProfessional { get; set; }


        [Required]
        public bool IsRelevant { get; set; }


        public bool Approve { get; set; } = true;

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
        

        [Required]
        public int CreatedByHRId { get; set; }

        public List<int> DistributedToEmployeeIds { get; set; } = new();

        public DateTime? Deadline { get; set; }
    }

    /// <summary>
    /// Request DTO for HR Form Response Submission
    /// </summary>
    public class SubmitHRFormResponseRequestDto
    {
        [Required]
        public int FormId { get; set; }

        [Required]
        public int SubmittedByEmployeeId { get; set; }

        [Required]
        public Dictionary<string, object> FormResponse { get; set; }
    }

    /// <summary>
    /// Request DTO for updating manager review
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
        public int GoalId { get; set; } 

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



public class CreateOrgGoalFeedbackRequestDto
{
    [Required(ErrorMessage = "GoalId is required")]
    public int GoalId { get; set; }

    [Required(ErrorMessage = "SubmittedByEmployeeId is required")]
    public int SubmittedByEmployeeId { get; set; }

    [Required(ErrorMessage = "RecipientEmployeeId is required")]
    public int RecipientEmployeeId { get; set; }
    

    [Required(ErrorMessage = "Rating is required")]
    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
    public int Rating { get; set; }

    [MaxLength(2000, ErrorMessage = "Comments cannot exceed 2000 characters")]
    public string FeedbackComments { get; set; }

    public bool IsAnonymous { get; set; } = false;
}



    
}




