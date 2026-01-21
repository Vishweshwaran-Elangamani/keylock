using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{

    public interface IFeedbackRepository
    {
        Task<int> CreateFeedbackAsync(Feedback feedback);

        Task<int> CreateQuestionResponseAsync(Feedbackquestionresponse response);

        Task<Feedback?> GetFeedbackByIdAsync(int feedbackId);

        Task<List<Feedback>> GetFeedbackBySubmitterAsync(int employeeId);

        Task<List<Feedback>> GetFeedbackByRecipientAsync(int employeeId);

        Task<List<Feedback>> GetTeamFeedbackAsync(int managerId);

        Task<List<Feedback>> GetFlaggedFeedbackAsync(bool? isBias = null, bool? isFairness = null);

        Task<List<Feedback>> GetAnonymousFeedbackAsync();

        Task<List<Feedback>> GetPendingHRReviewAsync();

        Task<List<Feedback>> GetFeedbackByGoalAsync(int goalId);

        Task<List<Feedback>> GetFeedbackByProjectAsync(int projectId);

        Task<List<Feedbackquestionresponse>> GetFeedbackResponsesAsync(int feedbackId);

        Task<Feedbackquestionresponse?> GetQuestionResponseAsync(int responseId);

        Task<List<Feedback>> GetAllFeedbackAsync(int pageNumber = 1, int pageSize = 20);

        Task<bool> UpdateFeedbackAsync(Feedback feedback);

        Task<bool> UpdateFeedbackStatusAsync(int feedbackId, string newStatus);

        Task<bool> FlagFeedbackForBiasAsync(int feedbackId, bool isBias, bool isFairness, int reviewedByHRId);

        Task<bool> SetHRReviewAsync(int feedbackId, string hrComments, int reviewedByHRId);

        Task<bool> UpdateQuestionResponseAsync(Feedbackquestionresponse response);

        Task<bool> DeleteFeedbackAsync(int feedbackId);

        Task<bool> DeleteQuestionResponseAsync(int responseId);

        Task<bool> FeedbackExistsAsync(int feedbackId);

        Task<bool> CanEditFeedbackAsync(int feedbackId);
    }
}
