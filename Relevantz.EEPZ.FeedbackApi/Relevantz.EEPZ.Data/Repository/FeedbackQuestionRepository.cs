using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class FeedbackQuestionRepository : IFeedbackQuestionRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<FeedbackQuestionRepository> _logger;

        public FeedbackQuestionRepository(EEPZDbContext context, ILogger<FeedbackQuestionRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Feedbackquestion> GetQuestionByIdAsync(int questionId)
        {
            try
            {
                return await _context.Feedbackquestions
                    .FirstOrDefaultAsync(q => q.QuestionId == questionId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting question by ID: {ex.Message}");
                throw;
            }
        }

        public async Task<Feedbackquestion> GetQuestionByCodeAsync(string questionCode)
        {
            try
            {
                return await _context.Feedbackquestions
                    .FirstOrDefaultAsync(q => q.QuestionCode == questionCode);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting question by code: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Feedbackquestion>> GetQuestionsByTypeAsync(string feedbackType)
        {
            try
            {
                return await _context.Feedbackquestions
                    .Where(q => (q.IsActive ?? true))
                    .OrderBy(q => q.DisplayOrder)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting questions by type: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Feedbackquestion>> GetAllActiveQuestionsAsync()
        {
            try
            {
                return await _context.Feedbackquestions
                    .Where(q => (bool)q.IsActive)
                    .OrderBy(q => q.FeedbackType)
                    .ThenBy(q => q.DisplayOrder)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting all active questions: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Feedbackquestion>> GetAllQuestionsAsync()
        {
            try
            {
                return await _context.Feedbackquestions
                    .OrderBy(q => q.FeedbackType)
                    .ThenBy(q => q.DisplayOrder)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting all questions: {ex.Message}");
                throw;
            }
        }

        public async Task<Dictionary<string, string>> GetRatingLabelsAsync(int questionId)
        {
            try
            {
                var question = await _context.Feedbackquestions
                    .FirstOrDefaultAsync(q => q.QuestionId == questionId);

                if (question == null || string.IsNullOrEmpty(question.RatingScaleLabels))
                    return new Dictionary<string, string>();

                var labels = JsonSerializer.Deserialize<Dictionary<string, string>>(question.RatingScaleLabels);
                return labels ?? new Dictionary<string, string>();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting rating labels: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Dictionary<string, object>>> GetChoiceOptionsAsync(int questionId)
        {
            try
            {
                var question = await _context.Feedbackquestions
                    .FirstOrDefaultAsync(q => q.QuestionId == questionId);

                if (question == null || string.IsNullOrEmpty(question.ChoiceOptions))
                    return new List<Dictionary<string, object>>();

                var options = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(question.ChoiceOptions);
                return options ?? new List<Dictionary<string, object>>();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting choice options: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Feedbackquestion>> GetQuestionsByResponseTypeAsync(string responseType)
        {
            try
            {
                return await _context.Feedbackquestions
                    .Where(q => (q.IsActive ?? true))
                    .OrderBy(q => q.FeedbackType)
                    .ThenBy(q => q.DisplayOrder)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting questions by response type: {ex.Message}");
                throw;
            }
        }
        
        public async Task<int> CreateQuestionAsync(Feedbackquestion question)
        {
            try
            {
                question.CreatedAt = DateTime.UtcNow;

                _context.Feedbackquestions.Add(question);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Question created: {question.QuestionId}");
                return question.QuestionId;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating question: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> UpdateQuestionAsync(Feedbackquestion question)
        {
            try
            {
                question.UpdatedAt = DateTime.UtcNow;

                _context.Feedbackquestions.Update(question);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Question updated: {question.QuestionId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating question: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> SetQuestionActiveStatusAsync(int questionId, bool isActive)
        {
            try
            {
                var question = await _context.Feedbackquestions.FindAsync(questionId);
                if (question == null)
                    return false;

                question.IsActive = isActive;
                question.UpdatedAt = DateTime.UtcNow;

                _context.Feedbackquestions.Update(question);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Question active status updated: {questionId} → {isActive}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error setting question active status: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteQuestionAsync(int questionId)
        {
            try
            {
                var question = await _context.Feedbackquestions.FindAsync(questionId);
                if (question == null)
                    return false;

                var responseCount = await _context.Feedbackquestionresponses
                    .CountAsync(r => r.QuestionId == questionId);

                if (responseCount > 0)
                    throw new InvalidOperationException($"Cannot delete question {questionId}. {responseCount} responses exist. Use deactivation instead.");

                _context.Feedbackquestions.Remove(question);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Question deleted: {questionId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting question: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> QuestionExistsAsync(int questionId)
        {
            try
            {
                return await _context.Feedbackquestions.AnyAsync(q => q.QuestionId == questionId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error checking question existence: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> QuestionCodeExistsAsync(string questionCode)
        {
            try
            {
                return await _context.Feedbackquestions.AnyAsync(q => q.QuestionCode == questionCode);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error checking question code existence: {ex.Message}");
                throw;
            }
        }
    }
}
