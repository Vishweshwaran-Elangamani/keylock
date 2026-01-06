using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class FeedbackResponseDto
    {
        public int FeedbackId { get; set; }
        public string FeedbackType { get; set; }
        public int? SubmittedByEmployeeId { get; set; }
        public string SubmitterName { get; set; }
        public int RecipientEmployeeId { get; set; }
        public string RecipientName { get; set; }
        public int? Rating { get; set; }
        public string Comments { get; set; }
        public bool IsAnonymous { get; set; }
        public bool BiasFlag { get; set; }
        public bool FairnessFlag { get; set; }
        public bool IsApprovedForPeerReview { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int? ReviewedByHRId { get; set; }
        public string HRReviewComments { get; set; }
        public List<FeedbackQuestionResponseDto> QuestionResponses { get; set; } = new();
    }

    public class FeedbackQuestionResponseDto
    {
        public int ResponseId { get; set; }
        public int QuestionId { get; set; }
        public string QuestionText { get; set; }
        public string ResponseType { get; set; }
        public int? RatingValue { get; set; }
        public bool? BooleanValue { get; set; }
        public string TextValue { get; set; }
        public List<int> SelectedOptions { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class FeedbackQuestionDto
    {
        public int QuestionId { get; set; }
        public string QuestionCode { get; set; }
        public string QuestionText { get; set; }
        public string QuestionDescription { get; set; }
        public string ResponseType { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsRequired { get; set; }
        public bool IsActive { get; set; }
        public int? RatingScaleMin { get; set; }
        public int? RatingScaleMax { get; set; }
        public Dictionary<string, string> RatingScaleLabels { get; set; }
        public List<ChoiceOptionDto> ChoiceOptions { get; set; }
    }

    public class ChoiceOptionDto
    {
        public int Value { get; set; }
        public string Label { get; set; }
    }

    public class FeedbackFormDto
    {
        public string FeedbackType { get; set; }
        public string FormTitle { get; set; }
        public string FormDescription { get; set; }
        public List<FeedbackQuestionDto> Questions { get; set; } = new();
    }

    public class ManagerReviewResponseDto
    {
        public int ReviewcommentId { get; set; }
        public int ManagerEmployeeId { get; set; }
        public string ManagerName { get; set; }
        public int TargetEmployeeId { get; set; }
        public string TargetEmployeeName { get; set; }
        public int? TargetGoalId { get; set; }
        public string TargetGoalName { get; set; }
        public int? TargetOrganizationGoalId { get; set; }
        public int Rating { get; set; }
        public string ReviewComment { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public DateTime? ModifiedAt { get; set; }
    }

    public class MentorFeedbackResponseDto
    {
        public int TrackingId { get; set; }
        public int SmeId { get; set; }
        public int MentorEmployeeId { get; set; }
        public string MentorName { get; set; }
        public int MenteeEmployeeId { get; set; }
        public string MenteeName { get; set; }
        public int SkillIdReference { get; set; }
        public string SkillName { get; set; }
        public int Rating { get; set; }
        public string FeedbackComments { get; set; }
        public string FeedbackFrom { get; set; }
        public bool IsAnonymous { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
    }

    /// <summary>
    /// Response DTO for organization goal feedback
    /// Maps from Feedback table where RelatedGoal.GoalType = "Organization"
    /// </summary>
    public class OrgGoalFeedbackResponseDto
    {
        public int OrgGoalFeedbackId { get; set; }

        public int GoalId { get; set; }

        public string OrganizationGoalName { get; set; }

        public string GoalDescription { get; set; }

        public string GoalType { get; set; }

        public int SubmittedByEmployeeId { get; set; }

        public string SubmitterName { get; set; }

        public int RecipientEmployeeId { get; set; }

        public string RecipientName { get; set; }

        public int Rating { get; set; }

        public string FeedbackComments { get; set; }

        public bool IsAnonymous { get; set; }

        public string Status { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public DateTime? SubmittedAt { get; set; }
    }

    public class PeerFeedbackQueueResponseDto
    {
        public int QueueId { get; set; }
        public int SubmittedByEmployeeId { get; set; }
        public string SubmitterName { get; set; }
        public int RecipientEmployeeId { get; set; }
        public string RecipientName { get; set; }
        public string FeedbackContent { get; set; }
        public bool IsAnonymous { get; set; }
        public bool? IsProfessional { get; set; }
        public bool? IsRelevant { get; set; }
        public int? ApprovedByHRId { get; set; }
        public string ApprovedByHRName { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
    }
    public class HrFeedbackFormResponseDto
    {
        public int FormId { get; set; }
        public string FormName { get; set; }
        public string FormDescription { get; set; }
        public string FormType { get; set; }
        public int CreatedByHRId { get; set; }
        public string CreatedByHRName { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? Deadline { get; set; }
        public int TotalResponsesCount { get; set; }
        public int SubmittedResponsesCount { get; set; }
    }

    public class HrFeedbackFormResponseResponseDto
    {
        public int ResponseId { get; set; }
        public int FormId { get; set; }
        public string FormName { get; set; }
        public int SubmittedByEmployeeId { get; set; }
        public string SubmitterName { get; set; }
        public Dictionary<string, object> FormResponse { get; set; }
        public string Status { get; set; }
        public string HRReviewComments { get; set; }
        public int? ReviewedByHRId { get; set; }
        public string ReviewedByHRName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
    }

    public class UpdateHRFormRequestDto
    {
        [MaxLength(200)]
        public string FormName { get; set; }

        [MaxLength(1000)]
        public string FormDescription { get; set; }

        public DateTime? Deadline { get; set; }
    }

    public class UpdateHRFormResponseRequestDto
    {
        [Required]
        public Dictionary<string, object> FormResponse { get; set; }
    }

    public class DistributeFormResponse
    {
        public bool Success { get; set; }
        public int FormId { get; set; }
        public int EmployeeCount { get; set; }
        public string Message { get; set; }
    }
    public class ApiResponseDto<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public T Data { get; set; }
        public List<string> Errors { get; set; } = new();

        public static ApiResponseDto<T> SuccessResponse(T data, string message = "Success")
        {
            return new ApiResponseDto<T>
            {
                Success = true,
                Message = message,
                Data = data
            };
        }

        public static ApiResponseDto<T> ErrorResponse(string message, List<string> errors = null)
        {
            return new ApiResponseDto<T>
            {
                Success = false,
                Message = message,
                Errors = errors ?? new List<string>()
            };
        }

        public class SubmitFeedbackResponse
        {
            public int FeedbackId { get; set; }
            public int EmployeeId { get; set; }
            public int ProjectId { get; set; }
            public int GoalId { get; set; }
            public DateTime SubmittedAt { get; set; }
        }

        public class FeedbackListResponse
        {
            public int ProjectId { get; set; }
            public string ProjectName { get; set; }
            public int? GoalId { get; set; }
            public string GoalName { get; set; }
            public int TotalFeedbacks { get; set; }
            public double AverageRating { get; set; }
            public List<FeedbackItemResponse> Feedbacks { get; set; }
        }

        public class FeedbackItemResponse
        {
            public int FeedbackId { get; set; }
            public int EmployeeId { get; set; }
            public string EmployeeFirstName { get; set; }
            public string EmployeeLastName { get; set; }
            public string Email { get; set; }
            public string FeedbackText { get; set; }
            public int Rating { get; set; }
            public DateTime SubmittedAt { get; set; }
        }

        public class FeedbackDetailResponse
        {
            public int FeedbackId { get; set; }
            public int EmployeeId { get; set; }
            public string EmployeeFirstName { get; set; }
            public string EmployeeLastName { get; set; }
            public string Email { get; set; }
            public int ProjectId { get; set; }
            public string ProjectName { get; set; }
            public int GoalId { get; set; }
            public string GoalName { get; set; }
            public string FeedbackText { get; set; }
            public int Rating { get; set; }
            public DateTime SubmittedAt { get; set; }
            public DateTime CreatedAt { get; set; }
            public DateTime UpdatedAt { get; set; }
        }
        
        /// <summary>
        /// Response DTO for HR Feedback Form
        /// </summary>

        public class HrFeedbackFormResponseDto
        {
            public int FormId { get; set; }
            public string FormName { get; set; }
            public string FormDescription { get; set; }
            public string FormType { get; set; }
            public int CreatedByHRId { get; set; }
            public string CreatedByHRName { get; set; }
            public string Status { get; set; }
            public DateTime CreatedAt { get; set; }
            public DateTime? Deadline { get; set; }

            public List<int> DistributedToEmployeeIds { get; set; } = new List<int>();

            public int TotalResponsesCount { get; set; }
            public int SubmittedResponsesCount { get; set; }
        }
    }
}
