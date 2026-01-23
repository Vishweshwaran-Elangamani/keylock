using System.Text.Json;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Mapster;
using Relevantz.EEPZ.Common.Constants;


namespace Relevantz.EEPZ.Core.Services.Implementations
{
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

                questionResponse.SelectedOptions =
                    responseDto.SelectedOptions != null && responseDto.SelectedOptions.Count > 0
                        ? JsonSerializer.Serialize(responseDto.SelectedOptions)
                        : null;

                await _feedbackRepo.CreateQuestionResponseAsync(questionResponse);
            }


            _logger.LogInformation("{Message}. FeedbackId: {FeedbackId}",
    MessageConstants.FeedbackCreatedLog,
    feedbackId);


            return await GetFeedbackByIdAsync(feedbackId);
        }

        public async Task<FeedbackResponseDto?> GetFeedbackByIdAsync(int feedbackId)
        {
            var feedback = await _feedbackRepo.GetFeedbackByIdAsync(feedbackId);
            if (feedback == null)
                return null;

            var responses = await _feedbackRepo.GetFeedbackResponsesAsync(feedbackId);
            return MapToFeedbackResponseDto(feedback, responses);
        }

        public async Task<List<FeedbackResponseDto>> GetMyFeedbackAsync(int employeeId)
        {
            var feedbacks = await _feedbackRepo.GetFeedbackBySubmitterAsync(employeeId);
            return await MapManyAsync(feedbacks);
        }

        public async Task<List<FeedbackResponseDto>> GetFeedbackAsRecipientAsync(int employeeId)
        {
            var feedbacks = await _feedbackRepo.GetFeedbackByRecipientAsync(employeeId);
            return await MapManyAsync(feedbacks);
        }

        public async Task<List<FeedbackResponseDto>> GetTeamFeedbackAsync(int managerId)
        {
            var feedbacks = await _feedbackRepo.GetTeamFeedbackAsync(managerId);
            return await MapManyAsync(feedbacks);
        }

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

        public async Task<List<FeedbackResponseDto>> GetFlaggedFeedbackAsync(bool? isBias = null, bool? isFairness = null)
        {
            var feedbacks = await _feedbackRepo.GetFlaggedFeedbackAsync(isBias, isFairness);
            return await MapManyAsync(feedbacks);
        }

        public async Task<List<FeedbackResponseDto>> GetAnonymousFeedbackAsync()
        {
            var feedbacks = await _feedbackRepo.GetAnonymousFeedbackAsync();
            return await MapManyAsync(feedbacks);
        }

        public async Task<List<FeedbackResponseDto>> GetPendingHRReviewAsync()
        {
            var feedbacks = await _feedbackRepo.GetPendingHRReviewAsync();
            return await MapManyAsync(feedbacks);
        }

        public async Task<List<FeedbackResponseDto>> GetAllFeedbackAsync(int pageNumber = 1, int pageSize = 20)
        {
            var feedbacks = await _feedbackRepo.GetAllFeedbackAsync(pageNumber, pageSize);
            return await MapManyAsync(feedbacks);
        }

        public async Task<List<FeedbackResponseDto>> GetFeedbackByGoalAsync(int goalId)
        {
            var feedbacks = await _feedbackRepo.GetFeedbackByGoalAsync(goalId);
            return await MapManyAsync(feedbacks);
        }

        public async Task<List<FeedbackResponseDto>> GetFeedbackByProjectAsync(int projectId)
        {
            var feedbacks = await _feedbackRepo.GetFeedbackByProjectAsync(projectId);
            return await MapManyAsync(feedbacks);
        }

        public async Task<FeedbackResponseDto?> UpdateFeedbackAsync(int feedbackId, UpdateFeedbackRequestDto dto)
        {
            ArgumentNullException.ThrowIfNull(dto);

            var feedback = await _feedbackRepo.GetFeedbackByIdAsync(feedbackId);
            if (feedback == null) return null;

            var canEdit = await _feedbackRepo.CanEditFeedbackAsync(feedbackId);
            if (!canEdit) return null;


            feedback.Rating = dto.Rating ?? feedback.Rating;
            feedback.Comments = dto.Comments ?? feedback.Comments;

            await _feedbackRepo.UpdateFeedbackAsync(feedback);

            if (dto.Responses != null && dto.Responses.Count > 0)
            {
                var existingResponses = await _feedbackRepo.GetFeedbackResponsesAsync(feedbackId);

                foreach (var responseDto in dto.Responses)

                {
                    var existingResponse = existingResponses.FirstOrDefault(r => r.QuestionId == responseDto.QuestionId);
                    if (existingResponse == null)
                        continue;

                    existingResponse.RatingValue = responseDto.RatingValue;
                    existingResponse.BooleanValue = responseDto.BooleanValue;
                    existingResponse.TextValue = responseDto.TextValue;
                    existingResponse.SelectedOptions = responseDto.SelectedOptions != null && responseDto.SelectedOptions.Count > 0
                        ? JsonSerializer.Serialize(responseDto.SelectedOptions)
                        : null;

                    await _feedbackRepo.UpdateQuestionResponseAsync(existingResponse);
                }
            }

            _logger.LogInformation("{Message}. FeedbackId: {FeedbackId}",
    MessageConstants.FeedbackUpdatedLog,
    feedbackId);


            return await GetFeedbackByIdAsync(feedbackId);
        }

        public async Task<bool> SubmitFeedbackAsync(int feedbackId)
        {
            var result = await _feedbackRepo.UpdateFeedbackStatusAsync(feedbackId, FeedbackConstants.Status.Submitted);

            if (result)
                _logger.LogInformation("{Message}. FeedbackId: {FeedbackId}",
    MessageConstants.FeedbackSubmittedLog,
    feedbackId);


            return result;
        }

        public async Task<bool> FlagFeedbackForBiasAsync(int feedbackId, bool isBias, bool isFairness, int reviewedByHRId)
        {
            var result = await _feedbackRepo.FlagFeedbackForBiasAsync(feedbackId, isBias, isFairness, reviewedByHRId);

            if (result)
                _logger.LogInformation("{Message}. FeedbackId: {FeedbackId}",
        MessageConstants.FeedbackFlaggedLog,
        feedbackId);



            return result;
        }

        public async Task<bool> SetHRReviewAsync(int feedbackId, string hrComments, int reviewedByHRId)
        {
            var result = await _feedbackRepo.SetHRReviewAsync(feedbackId, hrComments, reviewedByHRId);

            if (result)
                _logger.LogInformation("{Message}. FeedbackId: {FeedbackId}",
     MessageConstants.FeedbackHrReviewUpdatedLog,
     feedbackId);

            return result;
        }

        public async Task<bool> DeleteFeedbackAsync(int feedbackId)
        {
            var result = await _feedbackRepo.DeleteFeedbackAsync(feedbackId);

            if (result)
                _logger.LogInformation("{Message}. FeedbackId: {FeedbackId}",
    MessageConstants.FeedbackDeletedLog,
    feedbackId);

            return result;
        }

        public Task<bool> CanEditFeedbackAsync(int feedbackId)
        {
            return _feedbackRepo.CanEditFeedbackAsync(feedbackId);
        }

        private async Task<List<FeedbackResponseDto>> MapManyAsync(List<Feedback> feedbacks)
        {
            if (feedbacks == null || feedbacks.Count == 0)
                return new List<FeedbackResponseDto>();

            var result = new List<FeedbackResponseDto>(feedbacks.Count);

            foreach (var feedback in feedbacks)
            {
                var responses = await _feedbackRepo.GetFeedbackResponsesAsync(feedback.FeedbackId);
                result.Add(MapToFeedbackResponseDto(feedback, responses));
            }

            return result;
        }

        private static FeedbackResponseDto MapToFeedbackResponseDto(Feedback feedback, List<Feedbackquestionresponse> responses)
        {
            var responseList = new List<FeedbackQuestionResponseDto>();

            if (responses != null && responses.Count > 0)
            {
                foreach (var response in responses)
                {
                    responseList.Add(new FeedbackQuestionResponseDto
                    {
                        ResponseId = response.ResponseId,
                        QuestionId = response.QuestionId,
                        QuestionText = response.Question?.QuestionText ?? string.Empty,
                        ResponseType = response.Question?.ResponseType ?? string.Empty,
                        RatingValue = response.RatingValue,
                        BooleanValue = response.BooleanValue,
                        TextValue = response.TextValue,
                        SelectedOptions = ParseSelectedOptions(response.SelectedOptions),
                        CreatedAt = response.CreatedAt
                    });
                }
            }

            var submitterName = feedback.IsAnonymous
    ? MessageConstants.AnonymousUser
: feedback.SubmittedByEmployee?.Userprofile?.FirstName ?? MessageConstants.UnknownUser;

            var recipientName = feedback.RecipientEmployee?.Userprofile?.FirstName ?? MessageConstants.UnknownUser;


            return new FeedbackResponseDto
            {
                FeedbackId = feedback.FeedbackId,
                FeedbackType = feedback.FeedbackType,
                SubmittedByEmployeeId = feedback.SubmittedByEmployeeId,
                SubmitterName = submitterName,
                RecipientEmployeeId = feedback.RecipientEmployeeId,
                RecipientName = recipientName,
                Rating = feedback.Rating,
                Comments = feedback.Comments,
                IsAnonymous = feedback.IsAnonymous,
                BiasFlag = feedback.BiasFlag,
                FairnessFlag = feedback.FairnessFlag,
                IsApprovedForPeerReview = feedback.IsApprovedForPeerReview,
                Status = feedback.Status,
                CreatedAt = feedback.CreatedAt,
                SubmittedAt = feedback.SubmittedAt,
                UpdatedAt = feedback.UpdatedAt,
                ReviewedByHRId = feedback.ReviewedByHrid,
                HRReviewComments = feedback.HrreviewComments,
                QuestionResponses = responseList
            };
        }

        private static List<int> ParseSelectedOptions(string? selectedOptionsJson)
        {
            if (string.IsNullOrWhiteSpace(selectedOptionsJson))
                return new List<int>();

            try
            {
                return JsonSerializer.Deserialize<List<int>>(selectedOptionsJson) ?? new List<int>();
            }
            catch
            {
                return new List<int>();
            }
        }

        private static Dictionary<string, string>? ParseRatingLabels(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return null;

            try
            {
                return JsonSerializer.Deserialize<Dictionary<string, string>>(json);
            }
            catch
            {
                return null;
            }
        }

        private static List<ChoiceOptionDto>? ParseChoiceOptions(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return null;

            try
            {
                var options = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(json);
                if (options == null || options.Count == 0)
                    return null;

                return options
                    .Where(o => o.ContainsKey("value") && o.ContainsKey("label"))
                    .Select(o => new ChoiceOptionDto
                    {
                        Value = Convert.ToInt32(o["value"]),
                        Label = o["label"]?.ToString() ?? string.Empty
                    })
                    .ToList();
            }
            catch
            {
                return null;
            }
        }
    }
}
