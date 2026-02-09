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
    public class OrgGoalFeedbackService : IOrgGoalFeedbackService
    {
        private readonly IOrgGoalFeedbackRepository _orgGoalFeedbackRepo;
        private readonly ILogger<OrgGoalFeedbackService> _logger;

        public OrgGoalFeedbackService(IOrgGoalFeedbackRepository orgGoalFeedbackRepo, ILogger<OrgGoalFeedbackService> logger)
        {
            _orgGoalFeedbackRepo = orgGoalFeedbackRepo;
            _logger = logger;
        }

        public async Task<OrgGoalFeedbackResponseDto?> CreateOrgGoalFeedbackAsync(CreateOrgGoalFeedbackRequestDto dto)
        {
            ArgumentNullException.ThrowIfNull(dto);

            var feedback = dto.Adapt<Feedback>();
            var feedbackId = await _orgGoalFeedbackRepo.CreateOrgGoalFeedbackAsync(feedback);

            _logger.LogInformation("Organization goal feedback created. FeedbackId: {FeedbackId}", feedbackId);

            return await GetOrgGoalFeedbackByIdAsync(feedbackId);
        }

        public async Task<OrgGoalFeedbackResponseDto?> GetOrgGoalFeedbackByIdAsync(int feedbackId)
        {
            if (feedbackId <= 0) return null;

            var feedback = await _orgGoalFeedbackRepo.GetOrgGoalFeedbackByIdAsync(feedbackId);
            return feedback?.Adapt<OrgGoalFeedbackResponseDto>();
        }

        public async Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackByOrgGoalAsync(int goalId)
            => (await _orgGoalFeedbackRepo.GetFeedbackByOrgGoalAsync(goalId))
                .Adapt<List<OrgGoalFeedbackResponseDto>>();

        public async Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackBySubmitterAsync(int employeeId)
            => (await _orgGoalFeedbackRepo.GetFeedbackBySubmitterAsync(employeeId))
                .Adapt<List<OrgGoalFeedbackResponseDto>>();

        public async Task<List<OrgGoalFeedbackResponseDto>> GetAllOrgGoalFeedbackAsync(int pageNumber = 1, int pageSize = 20)
            => (await _orgGoalFeedbackRepo.GetAllOrgGoalFeedbackAsync(pageNumber, pageSize))
                .Adapt<List<OrgGoalFeedbackResponseDto>>();

        public async Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackByStatusAsync(string status)
            => (await _orgGoalFeedbackRepo.GetFeedbackByStatusAsync(status))
                .Adapt<List<OrgGoalFeedbackResponseDto>>();

        public async Task<List<OrgGoalFeedbackResponseDto>> GetAnonymousOrgGoalFeedbackAsync()
            => (await _orgGoalFeedbackRepo.GetAnonymousOrgGoalFeedbackAsync())
                .Adapt<List<OrgGoalFeedbackResponseDto>>();

        public async Task<OrgGoalFeedbackResponseDto?> UpdateOrgGoalFeedbackAsync(int feedbackId, UpdateOrgGoalFeedbackRequestDto dto)
        {
            if (feedbackId <= 0) return null;

            var feedback = await _orgGoalFeedbackRepo.GetOrgGoalFeedbackByIdAsync(feedbackId);
            if (feedback == null) return null;

            if (!string.Equals(feedback.Status, FeedbackConstants.Status.Submitted, StringComparison.OrdinalIgnoreCase))
                return null;

            if (dto.Rating.HasValue && (dto.Rating < 1 || dto.Rating > 5))
                return null;

            dto.Adapt(feedback);

            await _orgGoalFeedbackRepo.UpdateOrgGoalFeedbackAsync(feedback);

            _logger.LogInformation("Organization goal feedback updated. FeedbackId: {FeedbackId}", feedbackId);

            return await GetOrgGoalFeedbackByIdAsync(feedbackId);
        }

        public Task<bool> ArchiveOrgGoalFeedbackAsync(int feedbackId)
            => _orgGoalFeedbackRepo.UpdateFeedbackStatusAsync(feedbackId, FeedbackConstants.Status.Archived);

        public Task<bool> DeleteOrgGoalFeedbackAsync(int feedbackId)
            => _orgGoalFeedbackRepo.DeleteOrgGoalFeedbackAsync(feedbackId);

        public Task<bool> OrgGoalFeedbackExistsAsync(int feedbackId)
            => feedbackId <= 0
                ? Task.FromResult(false)
                : _orgGoalFeedbackRepo.OrgGoalFeedbackExistsAsync(feedbackId);
    }
}
