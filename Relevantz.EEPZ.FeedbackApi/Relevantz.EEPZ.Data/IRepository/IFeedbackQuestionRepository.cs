using Relevantz.EEPZ.Common.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    /// <summary>
    /// Repository interface for FeedbackQuestion entity
    /// Handles reusable question templates for all feedback types
    /// Questions are shared across feedback types based on FeedbackType enum
    /// </summary>
    public interface IFeedbackQuestionRepository
    {
        // ============================================================================
        // READ OPERATIONS (Questions are mostly read-only after seeding)
        // ============================================================================

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
        /// Used by: All feedback submissions to populate form
        /// Example: GetQuestionsByTypeAsync("GoalBased") returns 5 questions for goal feedback
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
        /// Used for UI rendering of rating options
        /// Example: {"1":"Poor","2":"Fair","3":"Good","4":"Very Good","5":"Excellent"}
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

        // ============================================================================
        // CREATE OPERATIONS (Usually done via seed data, but can be used for dynamic questions)
        // ============================================================================

        /// <summary>
        /// Create new question (rarely used - questions seeded at DB init)
        /// </summary>
        Task<int> CreateQuestionAsync(Feedbackquestion question);

        // ============================================================================
        // UPDATE OPERATIONS (Question content updates by HR/Admin)
        // ============================================================================

        /// <summary>
        /// Update question text/description
        /// </summary>
        Task<bool> UpdateQuestionAsync(Feedbackquestion question);

        /// <summary>
        /// Activate/Deactivate question
        /// Used by: HR/Admin to control which questions are used
        /// </summary>
        Task<bool> SetQuestionActiveStatusAsync(int questionId, bool isActive);

        // ============================================================================
        // DELETE OPERATIONS (Rarely used - prefer deactivation)
        // ============================================================================

        /// <summary>
        /// Delete question (use with caution - prefer deactivation)
        /// Only delete if no responses exist
        /// </summary>
        Task<bool> DeleteQuestionAsync(int questionId);

        // ============================================================================
        // EXISTENCE CHECKS
        // ============================================================================

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
