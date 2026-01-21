using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IFeedbackQuestionRepository
    {
        Task<Feedbackquestion?> GetQuestionByIdAsync(int questionId);

        Task<Feedbackquestion?> GetQuestionByCodeAsync(string questionCode);

        Task<List<Feedbackquestion>> GetQuestionsByTypeAsync(string feedbackType);

        Task<List<Feedbackquestion>> GetAllActiveQuestionsAsync();

        Task<List<Feedbackquestion>> GetAllQuestionsAsync();

        Task<Dictionary<string, string>> GetRatingLabelsAsync(int questionId);

        Task<List<Dictionary<string, object>>> GetChoiceOptionsAsync(int questionId);

        Task<List<Feedbackquestion>> GetQuestionsByResponseTypeAsync(string responseType);

        Task<int> CreateQuestionAsync(Feedbackquestion question);

        Task<bool> UpdateQuestionAsync(Feedbackquestion question);

        Task<bool> SetQuestionActiveStatusAsync(int questionId, bool isActive);

        Task<bool> DeleteQuestionAsync(int questionId);

        Task<bool> QuestionExistsAsync(int questionId);

        Task<bool> QuestionCodeExistsAsync(string questionCode);
    }
}
