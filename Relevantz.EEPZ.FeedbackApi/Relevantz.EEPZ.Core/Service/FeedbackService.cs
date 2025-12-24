using Microsoft.Extensions.Logging;
using System.Text.Json;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.Entities;

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
            _feedbackRepo = feedbackRepo;
            _questionRepo = questionRepo;
            _logger = logger;
        }

        public async Task<FeedbackResponseDto> CreateFeedbackAsync(CreateFeedbackRequestDto dto)
        {
            try
            {
                if (dto.QuestionResponses == null || !dto.QuestionResponses.Any())
                    throw new ArgumentException("At least one question response is required");

                var feedback = new Feedback
                {
                    FeedbackType = dto.FeedbackType,
                    SubmittedByEmployeeId = dto.IsAnonymous ? null : dto.SubmittedByEmployeeId,
                    RecipientEmployeeId = dto.RecipientEmployeeId,
                    RelatedGoalId = dto.RelatedGoalId,
                    RelatedProjectId = dto.RelatedProjectId,
                    RelatedMentorId = dto.RelatedMentorId,
                    RelatedOrganizationGoalId = dto.RelatedOrganizationGoalId,
                    Rating = dto.Rating,
                    Comments = dto.Comments,
                    IsAnonymous = dto.IsAnonymous,
                    Status = "Draft"
                };

                var feedbackId = await _feedbackRepo.CreateFeedbackAsync(feedback);

                foreach (var responseDto in dto.QuestionResponses)
                {
                    var questionResponse = new Feedbackquestionresponse
                    {
                        FeedbackId = feedbackId,
                        QuestionId = responseDto.QuestionId,
                        RatingValue = responseDto.RatingValue,
                        BooleanValue = responseDto.BooleanValue,
                        TextValue = responseDto.TextValue,
                        SelectedOptions = responseDto.SelectedOptions != null 
                            ? JsonSerializer.Serialize(responseDto.SelectedOptions)
                            : null
                    };

                    await _feedbackRepo.CreateQuestionResponseAsync(questionResponse);
                }

                _logger.LogInformation($"Feedback created successfully: {feedbackId}");

                return await GetFeedbackByIdAsync(feedbackId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating feedback: {ex.Message}");
                throw;
            }
        }


        public async Task<FeedbackResponseDto> GetFeedbackByIdAsync(int feedbackId)
        {
            try
            {
                var feedback = await _feedbackRepo.GetFeedbackByIdAsync(feedbackId);
                if (feedback == null)
                    throw new KeyNotFoundException($"Feedback {feedbackId} not found");

                var responses = await _feedbackRepo.GetFeedbackResponsesAsync(feedbackId);

                return MapToResponseDto(feedback, responses);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by ID: {ex.Message}");
                throw;
            }
        }

        public async Task<List<FeedbackResponseDto>> GetMyFeedbackAsync(int employeeId)
        {
            try
            {
                var feedbacks = await _feedbackRepo.GetFeedbackBySubmitterAsync(employeeId);
                var result = new List<FeedbackResponseDto>();

                foreach (var feedback in feedbacks)
                {
                    var responses = await _feedbackRepo.GetFeedbackResponsesAsync(feedback.FeedbackId);
                    result.Add(MapToResponseDto(feedback, responses));
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting my feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<List<FeedbackResponseDto>> GetFeedbackAsRecipientAsync(int employeeId)
        {
            try
            {
                var feedbacks = await _feedbackRepo.GetFeedbackByRecipientAsync(employeeId);
                var result = new List<FeedbackResponseDto>();

                foreach (var feedback in feedbacks)
                {
                    var responses = await _feedbackRepo.GetFeedbackResponsesAsync(feedback.FeedbackId);
                    result.Add(MapToResponseDto(feedback, responses));
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback as recipient: {ex.Message}");
                throw;
            }
        }

        public async Task<List<FeedbackResponseDto>> GetTeamFeedbackAsync(int managerId)
        {
            try
            {
                var feedbacks = await _feedbackRepo.GetTeamFeedbackAsync(managerId);
                var result = new List<FeedbackResponseDto>();

                foreach (var feedback in feedbacks)
                {
                    var responses = await _feedbackRepo.GetFeedbackResponsesAsync(feedback.FeedbackId);
                    result.Add(MapToResponseDto(feedback, responses));
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting team feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<FeedbackFormDto> GetFeedbackFormAsync(string feedbackType)
        {
            try
            {
                var questions = await _questionRepo.GetQuestionsByTypeAsync(feedbackType);

                var questionDtos = new List<FeedbackQuestionDto>();
                foreach (var question in questions)
                {
                    var questionDto = new FeedbackQuestionDto
                    {
                        QuestionId = question.QuestionId,
                        QuestionCode = question.QuestionCode,
                        QuestionText = question.QuestionText,
                        QuestionDescription = question.QuestionDescription,
                        ResponseType = question.ResponseType,
                        DisplayOrder = question.DisplayOrder,
                        IsRequired = question.IsRequired ?? true,
                        IsActive = question.IsActive ?? true,
                        RatingScaleMin = question.RatingScaleMin,
                        RatingScaleMax = question.RatingScaleMax
                    };

                    if (!string.IsNullOrEmpty(question.RatingScaleLabels))
                    {
                        questionDto.RatingScaleLabels = JsonSerializer.Deserialize<Dictionary<string, string>>(question.RatingScaleLabels);
                    }

                    if (!string.IsNullOrEmpty(question.ChoiceOptions))
                    {
                        var options = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(question.ChoiceOptions);
                        questionDto.ChoiceOptions = options?.Select(o => new ChoiceOptionDto
                        {
                            Value = Convert.ToInt32(o["value"]),
                            Label = o["label"].ToString()
                        }).ToList();
                    }

                    questionDtos.Add(questionDto);
                }

                return new FeedbackFormDto
                {
                    FeedbackType = feedbackType,
                    FormTitle = $"{feedbackType} Feedback Form",
                    FormDescription = $"Please complete the following questions for {feedbackType} feedback",
                    Questions = questionDtos.OrderBy(q => q.DisplayOrder).ToList()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback form: {ex.Message}");
                throw;
            }
        }

        public async Task<List<FeedbackResponseDto>> GetFlaggedFeedbackAsync(bool? isBias = null, bool? isFairness = null)
        {
            try
            {
                var feedbacks = await _feedbackRepo.GetFlaggedFeedbackAsync(isBias, isFairness);
                var result = new List<FeedbackResponseDto>();

                foreach (var feedback in feedbacks)
                {
                    var responses = await _feedbackRepo.GetFeedbackResponsesAsync(feedback.FeedbackId);
                    result.Add(MapToResponseDto(feedback, responses));
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting flagged feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<List<FeedbackResponseDto>> GetAnonymousFeedbackAsync()
        {
            try
            {
                var feedbacks = await _feedbackRepo.GetAnonymousFeedbackAsync();
                var result = new List<FeedbackResponseDto>();

                foreach (var feedback in feedbacks)
                {
                    var responses = await _feedbackRepo.GetFeedbackResponsesAsync(feedback.FeedbackId);
                    result.Add(MapToResponseDto(feedback, responses));
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting anonymous feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<List<FeedbackResponseDto>> GetPendingHRReviewAsync()
        {
            try
            {
                var feedbacks = await _feedbackRepo.GetPendingHRReviewAsync();
                var result = new List<FeedbackResponseDto>();

                foreach (var feedback in feedbacks)
                {
                    var responses = await _feedbackRepo.GetFeedbackResponsesAsync(feedback.FeedbackId);
                    result.Add(MapToResponseDto(feedback, responses));
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting pending HR review: {ex.Message}");
                throw;
            }
        }

        public async Task<List<FeedbackResponseDto>> GetAllFeedbackAsync(int pageNumber = 1, int pageSize = 20)
        {
            try
            {
                var feedbacks = await _feedbackRepo.GetAllFeedbackAsync(pageNumber, pageSize);
                var result = new List<FeedbackResponseDto>();

                foreach (var feedback in feedbacks)
                {
                    var responses = await _feedbackRepo.GetFeedbackResponsesAsync(feedback.FeedbackId);
                    result.Add(MapToResponseDto(feedback, responses));
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting all feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<List<FeedbackResponseDto>> GetFeedbackByGoalAsync(int goalId)
        {
            try
            {
                var feedbacks = await _feedbackRepo.GetFeedbackByGoalAsync(goalId);
                var result = new List<FeedbackResponseDto>();

                foreach (var feedback in feedbacks)
                {
                    var responses = await _feedbackRepo.GetFeedbackResponsesAsync(feedback.FeedbackId);
                    result.Add(MapToResponseDto(feedback, responses));
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by goal: {ex.Message}");
                throw;
            }
        }

        public async Task<List<FeedbackResponseDto>> GetFeedbackByProjectAsync(int projectId)
        {
            try
            {
                var feedbacks = await _feedbackRepo.GetFeedbackByProjectAsync(projectId);
                var result = new List<FeedbackResponseDto>();

                foreach (var feedback in feedbacks)
                {
                    var responses = await _feedbackRepo.GetFeedbackResponsesAsync(feedback.FeedbackId);
                    result.Add(MapToResponseDto(feedback, responses));
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by project: {ex.Message}");
                throw;
            }
        }


        public async Task<FeedbackResponseDto> UpdateFeedbackAsync(int feedbackId, UpdateFeedbackRequestDto dto)
        {
            try
            {
                var canEdit = await _feedbackRepo.CanEditFeedbackAsync(feedbackId);
                if (!canEdit)
                    throw new InvalidOperationException("Cannot edit feedback in current status. Only Draft feedback can be edited.");

                var feedback = await _feedbackRepo.GetFeedbackByIdAsync(feedbackId);
                if (feedback == null)
                    throw new KeyNotFoundException($"Feedback {feedbackId} not found");

                feedback.Rating = dto.Rating ?? feedback.Rating;
                feedback.Comments = dto.Comments ?? feedback.Comments;

                await _feedbackRepo.UpdateFeedbackAsync(feedback);

                if (dto.QuestionResponses != null && dto.QuestionResponses.Any())
                {
                    var existingResponses = await _feedbackRepo.GetFeedbackResponsesAsync(feedbackId);

                    foreach (var responseDto in dto.QuestionResponses)
                    {
                        var existingResponse = existingResponses.FirstOrDefault(r => r.QuestionId == responseDto.QuestionId);

                        if (existingResponse != null)
                        {
                            existingResponse.RatingValue = responseDto.RatingValue;
                            existingResponse.BooleanValue = responseDto.BooleanValue;
                            existingResponse.TextValue = responseDto.TextValue;
                            existingResponse.SelectedOptions = responseDto.SelectedOptions != null 
                                ? JsonSerializer.Serialize(responseDto.SelectedOptions)
                                : null;

                            await _feedbackRepo.UpdateQuestionResponseAsync(existingResponse);
                        }
                    }
                }

                _logger.LogInformation($"Feedback updated: {feedbackId}");
                return await GetFeedbackByIdAsync(feedbackId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> SubmitFeedbackAsync(int feedbackId)
        {
            try
            {
                var result = await _feedbackRepo.UpdateFeedbackStatusAsync(feedbackId, "Submitted");
                if (result)
                    _logger.LogInformation($"Feedback submitted: {feedbackId}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error submitting feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> FlagFeedbackForBiasAsync(int feedbackId, bool isBias, bool isFairness, int reviewedByHRId)
        {
            try
            {
                var result = await _feedbackRepo.FlagFeedbackForBiasAsync(feedbackId, isBias, isFairness, reviewedByHRId);
                if (result)
                    _logger.LogInformation($"Feedback flagged for review: {feedbackId}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error flagging feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> SetHRReviewAsync(int feedbackId, string hrComments, int reviewedByHRId)
        {
            try
            {
                var result = await _feedbackRepo.SetHRReviewAsync(feedbackId, hrComments, reviewedByHRId);
                if (result)
                    _logger.LogInformation($"HR review set: {feedbackId}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error setting HR review: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteFeedbackAsync(int feedbackId)
        {
            try
            {
                var result = await _feedbackRepo.DeleteFeedbackAsync(feedbackId);
                if (result)
                    _logger.LogInformation($"Feedback deleted: {feedbackId}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting feedback: {ex.Message}");
                throw;
            }
        }


        public async Task<bool> CanEditFeedbackAsync(int feedbackId)
        {
            try
            {
                return await _feedbackRepo.CanEditFeedbackAsync(feedbackId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error checking if can edit: {ex.Message}");
                throw;
            }
        }



        private FeedbackResponseDto MapToResponseDto(Feedback feedback, List<Feedbackquestionresponse> responses)
        {
            var responseList = new List<FeedbackQuestionResponseDto>();

            if (responses != null && responses.Any())
            {
                foreach (var response in responses)
                {
                    var selectedOptions = new List<int>();
                    if (!string.IsNullOrEmpty(response.SelectedOptions))
                    {
                        try
                        {
                            selectedOptions = JsonSerializer.Deserialize<List<int>>(response.SelectedOptions) ?? new List<int>();
                        }
                        catch { }
                    }

                    responseList.Add(new FeedbackQuestionResponseDto
                    {
                        ResponseId = response.ResponseId,
                        QuestionId = response.QuestionId,
                        QuestionText = response.Question?.QuestionText ?? "",
                        ResponseType = response.Question?.ResponseType ?? "",
                        RatingValue = response.RatingValue,
                        BooleanValue = response.BooleanValue,
                        TextValue = response.TextValue,
                        SelectedOptions = selectedOptions,
                        CreatedAt = response.CreatedAt
                    });
                }
            }


            string submitterName = "Anonymous";
            if (feedback.SubmittedByEmployee != null)
            {

                submitterName = "Unknown";
            }

            string recipientName = "Unknown";
            if (feedback.RecipientEmployee != null)
            {
                recipientName = "Unknown";
            }

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

    }
}
