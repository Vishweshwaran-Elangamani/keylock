using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{    
    public interface IFeedbackQuestionRepository
    {
       

        /// <summary>
        /// Get question by ID
        /// </summary>
        Task<Feedbackquestion> GetQuestionByIdAsync(int questionId);

        /// <summary>
        /// Get question by unique code
        /// Used internally to identify specific questions
        /// </summary>
        Task<Feedbackquestion> GetQuestionByCodeAsync(string questionCode);

        /// <summary>
        /// Get all questions for specific feedback type
        /// </summary>
        Task<List<Feedbackquestion>> GetQuestionsByTypeAsync(string feedbackType);

        /// <summary>
        /// Get all active questions
        /// </summary>
        Task<List<Feedbackquestion>> GetAllActiveQuestionsAsync();

        /// <summary>
        /// Get all questions (including inactive)
        /// Used by: Admin/HR for question management
        /// </summary>
        Task<List<Feedbackquestion>> GetAllQuestionsAsync();

        /// <summary>
        /// Get rating scale labels for a question
        /// </summary>
        Task<Dictionary<string, string>> GetRatingLabelsAsync(int questionId);

        /// <summary>
        /// Get choice options for MultipleChoice/Checkbox questions
        /// </summary>
        Task<List<Dictionary<string, object>>> GetChoiceOptionsAsync(int questionId);

        /// <summary>
        /// Get all questions by response type
        /// Used for filtering questions by response mechanism
        /// </summary>
        Task<List<Feedbackquestion>> GetQuestionsByResponseTypeAsync(string responseType);

 

        /// <summary>
        /// Create new question (rarely used - questions seeded at DB init)
        /// </summary>
        Task<int> CreateQuestionAsync(Feedbackquestion question);


        /// <summary>
        /// Update question text/description
        /// </summary>
        Task<bool> UpdateQuestionAsync(Feedbackquestion question);

        /// <summary>
        /// Activate/Deactivate question
        /// </summary>
        Task<bool> SetQuestionActiveStatusAsync(int questionId, bool isActive);


        /// <summary>
        /// Delete question (use with caution - prefer deactivation)
        /// Only delete if no responses exist
        /// </summary>
        Task<bool> DeleteQuestionAsync(int questionId);



        /// <summary>
        /// Check if question exists
        /// </summary>
        Task<bool> QuestionExistsAsync(int questionId);

        /// <summary>
        /// Check if question code exists
        /// </summary>
        Task<bool> QuestionCodeExistsAsync(string questionCode);
    }
}
