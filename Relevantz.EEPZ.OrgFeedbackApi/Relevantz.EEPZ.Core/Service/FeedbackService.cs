using System.Text.Json;
using Microsoft.Extensions.Logging;
using Mapster;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    /// <summary>
    /// Service implementation for Feedback operations.
    /// Handles creation, retrieval, update, submission, flagging, and deletion of feedback records,
    /// including question responses and HR review workflows.
    /// </summary>
    public class FeedbackService : IFeedbackService
    {
        private readonly IFeedbackRepository _feedbackRepo;
        private readonly IFeedbackQuestionRepository _questionRepo;
        private readonly ILogger<FeedbackService> _logger;

        public FeedbackService(
            IFeedbackRepository feedbackRepo,
            IFeedbackQuestionRepository questionRepo,
            ILogger<FeedbackService> logger)
        {
            _feedbackRepo = feedbackRepo ?? throw new ArgumentNullException(nameof(feedbackRepo));
            _questionRepo = questionRepo ?? throw new ArgumentNullException(nameof(questionRepo));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Creates a new feedback entry along with its question responses.
        /// Maps the DTO to the entity, sets the initial status to Draft,
        /// persists the feedback and each question response, then returns the created record.
        /// Throws <see cref="ArgumentException"/> if no question responses are provided.
        /// </summary>
        public async Task<FeedbackResponseDto?> CreateFeedbackAsync(CreateFeedbackRequestDto dto)
        {
            ArgumentNullException.ThrowIfNull(dto);

            if (dto.Responses == null || dto.Responses.Count == 0)
                throw new ArgumentException(MessageConstants.QuestionResponsesRequired, nameof(dto.Responses));

            var feedback = dto.Adapt<Feedback>();
            feedback.SubmittedByEmployeeId = dto.IsAnonymous ? null : dto.SubmittedByEmployeeId;
            feedback.Status = FeedbackConstants.Status.Draft;

            var feedbackId = await _feedbackRepo.CreateFeedbackAsync(feedback);

            foreach (var responseDto in dto.Responses)
            {
                var questionResponse = responseDto.Adapt<Feedbackquestionresponse>();
                questionResponse.FeedbackId = feedbackId;
                questionResponse.SelectedOptions = responseDto.SelectedOptions?.Any() == true
                    ? JsonSerializer.Serialize(responseDto.SelectedOptions)
                    : null;

                await _feedbackRepo.CreateQuestionResponseAsync(questionResponse);
            }

            _logger.LogInformation("{Message}. FeedbackId: {FeedbackId}",
                MessageConstants.FeedbackCreatedLog, feedbackId);

            return await GetFeedbackByIdAsync(feedbackId);
        }

        /// <summary>
        /// Retrieves a feedback entry by its unique identifier,
        /// including all associated question responses.
        /// Returns null if the record does not exist.
        /// </summary>
        public async Task<FeedbackResponseDto?> GetFeedbackByIdAsync(int feedbackId)
        {
            var feedback = await _feedbackRepo.GetFeedbackByIdAsync(feedbackId);
            if (feedback == null) return null;

            var responses = await _feedbackRepo.GetFeedbackResponsesAsync(feedbackId);
            return MapToFeedbackResponseDto(feedback, responses);
        }

        /// <summary>
        /// Retrieves all feedback entries submitted by a specific employee.
        /// </summary>
        public async Task<List<FeedbackResponseDto>> GetMyFeedbackAsync(int employeeId)
            => await MapManyAsync(await _feedbackRepo.GetFeedbackBySubmitterAsync(employeeId));

        /// <summary>
        /// Retrieves all feedback entries where a specific employee is the recipient.
        /// </summary>
        public async Task<List<FeedbackResponseDto>> GetFeedbackAsRecipientAsync(int employeeId)
            => await MapManyAsync(await _feedbackRepo.GetFeedbackByRecipientAsync(employeeId));

        /// <summary>
        /// Retrieves all feedback entries for the team managed by the given manager.
        /// </summary>
        public async Task<List<FeedbackResponseDto>> GetTeamFeedbackAsync(int managerId)
            => await MapManyAsync(await _feedbackRepo.GetTeamFeedbackAsync(managerId));

        /// <summary>
        /// Retrieves all flagged feedback entries.
        /// Optionally filters by bias flag or fairness flag.
        /// </summary>
        public async Task<List<FeedbackResponseDto>> GetFlaggedFeedbackAsync(bool? isBias = null, bool? isFairness = null)
            => await MapManyAsync(await _feedbackRepo.GetFlaggedFeedbackAsync(isBias, isFairness));

        /// <summary>
        /// Retrieves all anonymous feedback entries.
        /// </summary>
        public async Task<List<FeedbackResponseDto>> GetAnonymousFeedbackAsync()
            => await MapManyAsync(await _feedbackRepo.GetAnonymousFeedbackAsync());

        /// <summary>
        /// Retrieves all feedback entries that are pending HR review.
        /// </summary>
        public async Task<List<FeedbackResponseDto>> GetPendingHRReviewAsync()
            => await MapManyAsync(await _feedbackRepo.GetPendingHRReviewAsync());

        /// <summary>
        /// Retrieves all feedback entries with pagination support.
        /// Defaults to page 1 with 20 items per page.
        /// </summary>
        public async Task<List<FeedbackResponseDto>> GetAllFeedbackAsync(int pageNumber = 1, int pageSize = 20)
            => await MapManyAsync(await _feedbackRepo.GetAllFeedbackAsync(pageNumber, pageSize));

        /// <summary>
        /// Retrieves all feedback entries associated with a specific goal.
        /// </summary>
        public async Task<List<FeedbackResponseDto>> GetFeedbackByGoalAsync(int goalId)
            => await MapManyAsync(await _feedbackRepo.GetFeedbackByGoalAsync(goalId));

        /// <summary>
        /// Retrieves all feedback entries associated with a specific project.
        /// </summary>
        public async Task<List<FeedbackResponseDto>> GetFeedbackByProjectAsync(int projectId)
            => await MapManyAsync(await _feedbackRepo.GetFeedbackByProjectAsync(projectId));

        /// <summary>
        /// Updates an existing feedback entry and its question responses.
        /// Only feedback that is editable (checked via repository) can be updated.
        /// Returns null if the feedback is not found or cannot be edited.
        /// </summary>
        public async Task<FeedbackResponseDto?> UpdateFeedbackAsync(int feedbackId, UpdateFeedbackRequestDto dto)
        {
            ArgumentNullException.ThrowIfNull(dto);

            var feedback = await _feedbackRepo.GetFeedbackByIdAsync(feedbackId);
            if (feedback == null) return null;

            if (!await _feedbackRepo.CanEditFeedbackAsync(feedbackId))
                return null;

            dto.Adapt(feedback);
            await _feedbackRepo.UpdateFeedbackAsync(feedback);

            if (dto.Responses?.Any() == true)
            {
                var existingResponses = await _feedbackRepo.GetFeedbackResponsesAsync(feedbackId);

                foreach (var responseDto in dto.Responses)
                {
                    var existingResponse = existingResponses.FirstOrDefault(r => r.QuestionId == responseDto.QuestionId);
                    if (existingResponse == null) continue;

                    responseDto.Adapt(existingResponse);
                    existingResponse.SelectedOptions = responseDto.SelectedOptions?.Any() == true
                        ? JsonSerializer.Serialize(responseDto.SelectedOptions)
                        : null;

                    await _feedbackRepo.UpdateQuestionResponseAsync(existingResponse);
                }
            }

            _logger.LogInformation("{Message}. FeedbackId: {FeedbackId}",
                MessageConstants.FeedbackUpdatedLog, feedbackId);

            return await GetFeedbackByIdAsync(feedbackId);
        }

        /// <summary>
        /// Submits a feedback entry by updating its status to Submitted.
        /// Returns true if the status was successfully updated.
        /// </summary>
        public Task<bool> SubmitFeedbackAsync(int feedbackId)
            => _feedbackRepo.UpdateFeedbackStatusAsync(feedbackId, FeedbackConstants.Status.Submitted);

        /// <summary>
        /// Deletes a feedback entry by its unique identifier.
        /// Returns true if the deletion was successful.
        /// </summary>
        public Task<bool> DeleteFeedbackAsync(int feedbackId)
            => _feedbackRepo.DeleteFeedbackAsync(feedbackId);

        /// <summary>
        /// Checks whether a specific feedback entry is eligible for editing.
        /// Returns true if the feedback can be edited.
        /// </summary>
        public Task<bool> CanEditFeedbackAsync(int feedbackId)
            => _feedbackRepo.CanEditFeedbackAsync(feedbackId);

        /// <summary>
        /// Sets the HR review details for a specific feedback entry.
        /// Updates HR comments and the reviewer ID.
        /// Returns true if the update was successful.
        /// </summary>
        public async Task<bool> SetHRReviewAsync(int feedbackId, string hrComments, int reviewedByHRId)
        {
            var result = await _feedbackRepo.SetHRReviewAsync(feedbackId, hrComments, reviewedByHRId);

            if (result)
                _logger.LogInformation("{Message}. FeedbackId: {FeedbackId}",
                    MessageConstants.FeedbackHrReviewUpdatedLog, feedbackId);

            return result;
        }

        /// <summary>
        /// Flags a feedback entry for bias or fairness issues.
        /// Updates the bias and fairness flags along with the reviewing HR employee ID.
        /// Returns true if the flag was successfully applied.
        /// </summary>
        public async Task<bool> FlagFeedbackForBiasAsync(int feedbackId, bool isBias, bool isFairness, int reviewedByHRId)
        {
            var result = await _feedbackRepo.FlagFeedbackForBiasAsync(feedbackId, isBias, isFairness, reviewedByHRId);

            if (result)
                _logger.LogInformation("{Message}. FeedbackId: {FeedbackId}",
                    MessageConstants.FeedbackFlaggedLog, feedbackId);

            return result;
        }

        /// <summary>
        /// Retrieves the feedback form structure for a given feedback type.
        /// Returns the list of questions with their response types, options, and display order.
        /// Throws <see cref="ArgumentException"/> if the feedback type is null or whitespace.
        /// </summary>
        public async Task<FeedbackFormDto?> GetFeedbackFormAsync(string feedbackType)
        {
            if (string.IsNullOrWhiteSpace(feedbackType))
                throw new ArgumentException(MessageConstants.FeedbackTypeRequired, nameof(feedbackType));

            var questions = await _questionRepo.GetQuestionsByTypeAsync(feedbackType);

            var questionDtos = questions
                .Select(q => new FeedbackQuestionDto
                {
                    QuestionId = q.QuestionId,
                    QuestionCode = q.QuestionCode,
                    QuestionText = q.QuestionText,
                    QuestionDescription = q.QuestionDescription,
                    ResponseType = q.ResponseType,
                    DisplayOrder = q.DisplayOrder,
                    IsRequired = q.IsRequired ?? true,
                    IsActive = q.IsActive ?? true,
                    RatingScaleMin = q.RatingScaleMin,
                    RatingScaleMax = q.RatingScaleMax,
                    RatingScaleLabels = ParseRatingLabels(q.RatingScaleLabels),
                    ChoiceOptions = ParseChoiceOptions(q.ChoiceOptions)
                })
                .OrderBy(x => x.DisplayOrder)
                .ToList();

            return new FeedbackFormDto
            {
                FeedbackType = feedbackType,
                FormTitle = $"{feedbackType} Feedback Form",
                FormDescription = $"Please complete the following questions for {feedbackType} feedback",
                Questions = questionDtos
            };
        }

        // ─── Private Helpers ────────────────────────────────────────────────────────

        /// <summary>
        /// Maps a list of Feedback entities to a list of FeedbackResponseDto,
        /// loading question responses for each entry.
        /// </summary>
        private async Task<List<FeedbackResponseDto>> MapManyAsync(List<Feedback> feedbacks)
        {
            var result = new List<FeedbackResponseDto>();

            foreach (var feedback in feedbacks)
            {
                var responses = await _feedbackRepo.GetFeedbackResponsesAsync(feedback.FeedbackId);
                result.Add(MapToFeedbackResponseDto(feedback, responses));
            }

            return result;
        }

        /// <summary>
        /// Maps a single Feedback entity and its question responses to a FeedbackResponseDto.
        /// Handles anonymous submitter display and parses selected options from JSON.
        /// </summary>
        private static FeedbackResponseDto MapToFeedbackResponseDto(
            Feedback feedback,
            List<Feedbackquestionresponse> responses)
        {
            var dto = feedback.Adapt<FeedbackResponseDto>();

            dto.SubmitterName = feedback.IsAnonymous
                ? MessageConstants.AnonymousUser
                : feedback.SubmittedByEmployee?.Userprofile?.FirstName ?? MessageConstants.UnknownUser;

            dto.RecipientName = feedback.RecipientEmployee?.Userprofile?.FirstName ?? MessageConstants.UnknownUser;

            dto.QuestionResponses = responses?.Adapt<List<FeedbackQuestionResponseDto>>() ?? new();

            foreach (var r in dto.QuestionResponses)
            {
                var entity = responses.First(x => x.ResponseId == r.ResponseId);
                r.SelectedOptions = ParseSelectedOptions(entity.SelectedOptions);
            }

            return dto;
        }

        /// <summary>
        /// Parses a JSON string into a list of selected option IDs.
        /// Returns an empty list if the input is null or whitespace.
        /// </summary>
        private static List<int> ParseSelectedOptions(string? json)
            => string.IsNullOrWhiteSpace(json)
                ? new List<int>()
                : JsonSerializer.Deserialize<List<int>>(json) ?? new List<int>();

        /// <summary>
        /// Parses a JSON string into a dictionary of rating scale labels.
        /// Returns null if the input is null or whitespace.
        /// </summary>
        private static Dictionary<string, string>? ParseRatingLabels(string? json)
            => string.IsNullOrWhiteSpace(json) ? null : JsonSerializer.Deserialize<Dictionary<string, string>>(json);

        /// <summary>
        /// Parses a JSON string into a list of choice option DTOs.
        /// Returns null if the input is null or whitespace or cannot be parsed.
        /// </summary>
        private static List<ChoiceOptionDto>? ParseChoiceOptions(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return null;

            var options = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(json);
            return options?
                .Where(o => o.ContainsKey("value") && o.ContainsKey("label"))
                .Select(o => new ChoiceOptionDto
                {
                    Value = Convert.ToInt32(o["value"]),
                    Label = o["label"]?.ToString() ?? string.Empty
                }).ToList();
        }
    }
}
