using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class FeedbackQuestionRepository : IFeedbackQuestionRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<FeedbackQuestionRepository> _logger;

        public FeedbackQuestionRepository(
            EEPZDbContext context,
            ILogger<FeedbackQuestionRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Feedbackquestion?> GetQuestionByIdAsync(int questionId)
        {
            return await _context.Feedbackquestions
                .AsNoTracking()
                .FirstOrDefaultAsync(q => q.QuestionId == questionId);
        }

        public async Task<Feedbackquestion?> GetQuestionByCodeAsync(string questionCode)
        {
            return await _context.Feedbackquestions
                .AsNoTracking()
                .FirstOrDefaultAsync(q => q.QuestionCode == questionCode);
        }

        public async Task<List<Feedbackquestion>> GetQuestionsByTypeAsync(string feedbackType)
        {
            return await _context.Feedbackquestions
                .AsNoTracking()
                .Where(q => q.IsActive == true && q.FeedbackType == feedbackType)
                .OrderBy(q => q.DisplayOrder)
                .ToListAsync();
        }

        public async Task<List<Feedbackquestion>> GetAllActiveQuestionsAsync()
        {
            return await _context.Feedbackquestions
                .AsNoTracking()
                .Where(q => q.IsActive == true)
                .OrderBy(q => q.FeedbackType)
                .ThenBy(q => q.DisplayOrder)
                .ToListAsync();
        }

        public async Task<List<Feedbackquestion>> GetAllQuestionsAsync()
        {
            return await _context.Feedbackquestions
                .AsNoTracking()
                .OrderBy(q => q.FeedbackType)
                .ThenBy(q => q.DisplayOrder)
                .ToListAsync();
        }

        public async Task<Dictionary<string, string>> GetRatingLabelsAsync(int questionId)
        {
            var question = await _context.Feedbackquestions
                .AsNoTracking()
                .FirstOrDefaultAsync(q => q.QuestionId == questionId);

            if (question == null || string.IsNullOrWhiteSpace(question.RatingScaleLabels))
                return new Dictionary<string, string>();

            var labels = JsonSerializer.Deserialize<Dictionary<string, string>>(question.RatingScaleLabels);
            return labels ?? new Dictionary<string, string>();
        }

        public async Task<List<Dictionary<string, object>>> GetChoiceOptionsAsync(int questionId)
        {
            var optionsList = new List<Dictionary<string, object>>();

            var question = await _context.Feedbackquestions
                .AsNoTracking()
                .FirstOrDefaultAsync(q => q.QuestionId == questionId);

            if (question == null || string.IsNullOrWhiteSpace(question.ChoiceOptions))
                return optionsList;

            var options = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(question.ChoiceOptions);
            return options ?? optionsList;
        }

        public async Task<List<Feedbackquestion>> GetQuestionsByResponseTypeAsync(string responseType)
        {
            return await _context.Feedbackquestions
                .AsNoTracking()
                .Where(q => q.IsActive == true && q.ResponseType == responseType)
                .OrderBy(q => q.FeedbackType)
                .ThenBy(q => q.DisplayOrder)
                .ToListAsync();
        }

        public async Task<int> CreateQuestionAsync(Feedbackquestion question)
        {
            question.CreatedAt = DateTime.UtcNow;

            _context.Feedbackquestions.Add(question);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Question created: {QuestionId}", question.QuestionId);

            return question.QuestionId;
        }

        public async Task<bool> UpdateQuestionAsync(Feedbackquestion question)
        {
            question.UpdatedAt = DateTime.UtcNow;

            _context.Feedbackquestions.Update(question);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Question updated: {QuestionId}", question.QuestionId);

            return true;
        }

        public async Task<bool> SetQuestionActiveStatusAsync(int questionId, bool isActive)
        {
            var question = await _context.Feedbackquestions
                .FirstOrDefaultAsync(q => q.QuestionId == questionId);

            if (question == null)
                return false;

            question.IsActive = isActive;
            question.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Question active status changed. QuestionId: {QuestionId}, IsActive: {IsActive}", questionId, isActive);

            return true;
        }

        public async Task<bool> DeleteQuestionAsync(int questionId)
        {
            var question = await _context.Feedbackquestions
                .FirstOrDefaultAsync(q => q.QuestionId == questionId);

            if (question == null)
                return false;

            var responseCount = await _context.Feedbackquestionresponses
                .CountAsync(r => r.QuestionId == questionId);

            if (responseCount > 0)
                throw new InvalidOperationException(
                    $"Cannot delete question {questionId}. {responseCount} responses exist. Deactivate the question instead."
                );

            _context.Feedbackquestions.Remove(question);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Question deleted: {QuestionId}", questionId);

            return true;
        }

        public async Task<bool> QuestionExistsAsync(int questionId)
        {
            return await _context.Feedbackquestions
                .AsNoTracking()
                .AnyAsync(q => q.QuestionId == questionId);
        }

        public async Task<bool> QuestionCodeExistsAsync(string questionCode)
        {
            return await _context.Feedbackquestions
                .AsNoTracking()
                .AnyAsync(q => q.QuestionCode == questionCode);
        }
    }
}
