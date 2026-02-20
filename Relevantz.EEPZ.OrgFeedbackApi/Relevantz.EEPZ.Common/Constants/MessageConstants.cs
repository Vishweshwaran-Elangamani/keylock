namespace Relevantz.EEPZ.Common.Constants
{
    public static class MessageConstants
    {
        #region Mentor Feedback Messages
        public const string MentorFeedbackCreated = "Mentor feedback created successfully";
        public const string MentorFeedbackRetrieved = "Mentor feedback retrieved successfully";
        public const string MentorFeedbackUpdated = "Mentor feedback updated successfully";
        public const string MentorFeedbackDeleted = "Mentor feedback deleted successfully";
        public const string MentorFeedbackAcknowledged = "Mentor feedback acknowledged successfully";
        public const string MentorFeedbackNotFound = "Mentor feedback not found";
        public const string FeedbackAboutMeRetrieved = "Feedback about you retrieved successfully";
        public const string MyMentorFeedbackRetrieved = "Your mentor feedback retrieved successfully";
        public const string AllMentorFeedbackRetrieved = "All mentor feedback retrieved successfully";
        #endregion

        #region Organization Goal Feedback Messages
        public const string OrgGoalFeedbackCreated = "Organization goal feedback created successfully";
        public const string OrgGoalFeedbackRetrieved = "Organization goal feedback retrieved successfully";
        public const string OrgGoalFeedbackUpdated = "Organization goal feedback updated successfully";
        public const string OrgGoalFeedbackDeleted = "Organization goal feedback deleted successfully";
        public const string OrgGoalFeedbackNotFound = "Organization goal feedback not found";
        public const string OrgGoalFeedbackByGoalRetrieved = "Organization goal feedback by goal retrieved successfully";
        public const string AllOrgGoalFeedbackRetrieved = "All organization goal feedback retrieved successfully";
        #endregion

        #region Goals Messages
        public const string GoalsRetrievedSuccessfully = "Goals retrieved successfully";
        public const string GoalRetrievedSuccessfully = "Goal retrieved successfully";
        public const string GoalNotFound = "Goal not found";
        public const string TeamGoalsRetrievedSuccessfully = "Team goals retrieved successfully";
        public const string OrganizationLevelGoalsRetrievedSuccessfully = "Organization level goals retrieved successfully";
        public const string ProjectGoalsRetrievedSuccessfully = "Project goals retrieved successfully";
        #endregion

        #region Organization Objectives Messages
        public const string OrganizationObjectivesRetrieved = "Organization objectives retrieved successfully";
        public const string OrganizationObjectiveRetrieved = "Organization objective retrieved successfully";
        public const string OrganizationObjectiveNotFound = "Organization objective not found";
        public const string ActiveObjectivesRetrieved = "Active organization objectives retrieved successfully";
        public const string ObjectivesByStatusRetrieved = "Organization objectives by status retrieved successfully";
        public const string InvalidStatusProvided = "Invalid status provided";
        #endregion

        #region SME Messages
        public const string ActiveSmesRetrievedSuccessfully = "Active SMEs retrieved successfully";
        #endregion

        #region Feedback API Response Messages
        public const string FeedbackCreated = "Feedback created successfully";
        public const string FeedbackRetrieved = "Feedback retrieved successfully";
        public const string FeedbackUpdated = "Feedback updated successfully";
        public const string FeedbackSubmitted = "Feedback submitted successfully";
        public const string FeedbackDeleted = "Feedback deleted successfully";
        public const string FeedbackNotFound = "Feedback not found";
        #endregion

        #region Common User Display
        public const string AnonymousUser = "Anonymous";
        public const string UnknownUser = "Unknown";
        #endregion

        #region Feedback Validation Messages
        public const string FeedbackTypeRequired = "FeedbackType is required.";
        public const string QuestionResponsesRequired = "At least one question response is required.";

        //Use this constant in service rating validation instead of hardcoded strings
        public const string InvalidRatingRange = "Rating must be between 1 and 5.";
        public const string FeedbackFromRequired = "FeedbackFrom is required.";

        // common invalid ID message reused across all modules
        public const string InvalidIdProvided = "Invalid ID provided.";

        //common not editable message reused across feedback update guards
        public const string FeedbackNotEditable = "Feedback cannot be edited in its current status.";

        public const string FeedbackNotDeletable = "Feedback cannot be deleted in its current status. Only Submitted feedback can be deleted.";
        #endregion

        #region Feedback Log Messages
        
        public const string FeedbackCreatedLog = "Feedback created";
        public const string FeedbackUpdatedLog = "Feedback updated";
        public const string FeedbackSubmittedLog = "Feedback submitted";
        public const string FeedbackDeletedLog = "Feedback deleted";
        public const string FeedbackFlaggedLog = "Feedback flagged for HR review";
        public const string FeedbackHrReviewUpdatedLog = "HR review updated";
        #endregion

        #region Peer Feedback Queue Messages
        public const string PeerFeedbackCreated = "Peer feedback created successfully";
        public const string PeerFeedbackUpdated = "Peer feedback updated successfully";
        public const string PeerFeedbackDeleted = "Peer feedback deleted successfully";
        public const string PeerFeedbackNotFound = "Peer feedback not found";
        #endregion

        #region Generic Messages
        public const string OperationSuccessful = "Operation completed successfully";
        public const string OperationFailed = "Operation failed";
        public const string ValidationError = "Validation error occurred";
        public const string UnauthorizedAccess = "Unauthorized access";
        public const string InternalServerError = "An internal server error occurred";
        #endregion
    }
}
