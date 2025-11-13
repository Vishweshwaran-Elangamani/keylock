using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Core.Services.Implementations;  // ✅ ADD THIS for EmailService
using Relevantz.EEPZ.Common.Entities;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    /// <summary>
    /// Service implementation for OrganizationGoalFeedback business logic
    /// Handles organization-wide goal feedback
    /// </summary>
    public class OrgGoalFeedbackService : IOrgGoalFeedbackService
    {
        private readonly IOrgGoalFeedbackRepository _orgGoalFeedbackRepo;
        private readonly ILogger<OrgGoalFeedbackService> _logger;

        public OrgGoalFeedbackService(
            IOrgGoalFeedbackRepository orgGoalFeedbackRepo,
            ILogger<OrgGoalFeedbackService> logger)
        {
            _orgGoalFeedbackRepo = orgGoalFeedbackRepo;
            _logger = logger;
        }

        // ============================================================================
        // CREATE OPERATIONS
        // ============================================================================

        public async Task<OrgGoalFeedbackResponseDto> CreateOrgGoalFeedbackAsync(CreateOrgGoalFeedbackRequestDto dto)
        {
            try
            {
                // Validate inputs
                if (dto.OrganizationObjectiveId <= 0)
                    throw new ArgumentException("OrganizationObjectiveId must be valid");
                if (dto.SubmittedByEmployeeId <= 0)
                    throw new ArgumentException("SubmittedByEmployeeId must be valid");
                if (dto.Rating < 1 || dto.Rating > 5)
                    throw new ArgumentException("Rating must be between 1 and 5");

                var feedback = new Organizationgoalfeedback
                {
                    OrganizationObjectiveId = dto.OrganizationObjectiveId,
                    SubmittedByEmployeeId = dto.SubmittedByEmployeeId,
                    ManagerEmployeeId = dto.ManagerEmployeeId,
                    Rating = dto.Rating,
                    FeedbackComments = dto.FeedbackComments,
                    FeedbackFrom = dto.FeedbackFrom,
                    IsAnonymous = dto.IsAnonymous,
                    Status = "Submitted"
                };

                var feedbackId = await _orgGoalFeedbackRepo.CreateOrgGoalFeedbackAsync(feedback);
                _logger.LogInformation($"Organization goal feedback created: {feedbackId}");

                return await GetOrgGoalFeedbackByIdAsync(feedbackId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating org goal feedback: {ex.Message}");
                throw;
            }
        }

        // ============================================================================
        // READ OPERATIONS
        // ============================================================================

        public async Task<OrgGoalFeedbackResponseDto> GetOrgGoalFeedbackByIdAsync(int feedbackId)
        {
            try
            {
                var feedback = await _orgGoalFeedbackRepo.GetOrgGoalFeedbackByIdAsync(feedbackId);
                if (feedback == null)
                    throw new KeyNotFoundException($"Org goal feedback {feedbackId} not found");

                return MapToResponseDto(feedback);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting org goal feedback by ID: {ex.Message}");
                throw;
            }
        }

        public async Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackByOrgGoalAsync(int organizationObjectiveId)
        {
            try
            {
                var feedbacks = await _orgGoalFeedbackRepo.GetFeedbackByOrgObjectiveAsync(organizationObjectiveId);
                return feedbacks.Select(f => MapToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by org goal: {ex.Message}");
                throw;
            }
        }

        public async Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackBySubmitterAsync(int employeeId)
        {
            try
            {
                var feedbacks = await _orgGoalFeedbackRepo.GetFeedbackBySubmitterAsync(employeeId);
                return feedbacks.Select(f => MapToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by submitter: {ex.Message}");
                throw;
            }
        }

        public async Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackBySourceAsync(string feedbackFrom)
        {
            try
            {
                var feedbacks = await _orgGoalFeedbackRepo.GetFeedbackBySourceAsync(feedbackFrom);
                return feedbacks.Select(f => MapToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by source: {ex.Message}");
                throw;
            }
        }

        public async Task<List<OrgGoalFeedbackResponseDto>> GetAllOrgGoalFeedbackAsync(int pageNumber = 1, int pageSize = 20)
        {
            try
            {
                var feedbacks = await _orgGoalFeedbackRepo.GetAllOrgGoalFeedbackAsync(pageNumber, pageSize);
                return feedbacks.Select(f => MapToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting all org goal feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackByStatusAsync(string status)
        {
            try
            {
                var feedbacks = await _orgGoalFeedbackRepo.GetFeedbackByStatusAsync(status);
                return feedbacks.Select(f => MapToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting feedback by status: {ex.Message}");
                throw;
            }
        }

        public async Task<List<OrgGoalFeedbackResponseDto>> GetAnonymousOrgGoalFeedbackAsync()
        {
            try
            {
                var feedbacks = await _orgGoalFeedbackRepo.GetAnonymousOrgGoalFeedbackAsync();
                return feedbacks.Select(f => MapToResponseDto(f)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting anonymous org goal feedback: {ex.Message}");
                throw;
            }
        }

        // ============================================================================
        // UPDATE OPERATIONS
        // ============================================================================

        public async Task<OrgGoalFeedbackResponseDto> UpdateOrgGoalFeedbackAsync(int feedbackId, UpdateOrgGoalFeedbackRequestDto dto)
        {
            try
            {
                var feedback = await _orgGoalFeedbackRepo.GetOrgGoalFeedbackByIdAsync(feedbackId);
                if (feedback == null)
                    throw new KeyNotFoundException($"Org goal feedback {feedbackId} not found");

                // Can only edit Submitted status
                if (feedback.Status != "Submitted")
                    throw new InvalidOperationException($"Cannot edit feedback in {feedback.Status} status");

                if (dto.Rating.HasValue)
                {
                    if (dto.Rating < 1 || dto.Rating > 5)
                        throw new ArgumentException("Rating must be between 1 and 5");
                    feedback.Rating = dto.Rating.Value;
                }

                if (!string.IsNullOrEmpty(dto.FeedbackComments))
                    feedback.FeedbackComments = dto.FeedbackComments;

                await _orgGoalFeedbackRepo.UpdateOrgGoalFeedbackAsync(feedback);
                _logger.LogInformation($"Org goal feedback updated: {feedbackId}");

                return await GetOrgGoalFeedbackByIdAsync(feedbackId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating org goal feedback: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> ArchiveOrgGoalFeedbackAsync(int feedbackId)
        {
            try
            {
                var result = await _orgGoalFeedbackRepo.UpdateFeedbackStatusAsync(feedbackId, "Archived");
                if (result)
                    _logger.LogInformation($"Org goal feedback archived: {feedbackId}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error archiving org goal feedback: {ex.Message}");
                throw;
            }
        }

        // ============================================================================
        // DELETE OPERATIONS
        // ============================================================================

        public async Task<bool> DeleteOrgGoalFeedbackAsync(int feedbackId)
        {
            try
            {
                var result = await _orgGoalFeedbackRepo.DeleteOrgGoalFeedbackAsync(feedbackId);
                if (result)
                    _logger.LogInformation($"Org goal feedback deleted: {feedbackId}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting org goal feedback: {ex.Message}");
                throw;
            }
        }

        // ============================================================================
        // VALIDATION OPERATIONS
        // ============================================================================

        public async Task<bool> OrgGoalFeedbackExistsAsync(int feedbackId)
        {
            try
            {
                return await _orgGoalFeedbackRepo.OrgGoalFeedbackExistsAsync(feedbackId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error checking org goal feedback existence: {ex.Message}");
                throw;
            }
        }

        // ============================================================================
        // PRIVATE HELPER METHODS
        // ============================================================================

        private OrgGoalFeedbackResponseDto MapToResponseDto(Organizationgoalfeedback feedback)
        {
            return new OrgGoalFeedbackResponseDto
            {
                OrgGoalFeedbackId = feedback.OrgGoalFeedbackId,
                OrganizationObjectiveId = feedback.OrganizationObjectiveId,
                OrganizationGoalName = feedback.OrganizationObjective != null 
                    ? feedback.OrganizationObjective.Description 
                    : "Unknown",
                SubmittedByEmployeeId = feedback.SubmittedByEmployeeId,
                SubmitterName = feedback.SubmittedByEmployee != null 
                    ? $"{feedback.SubmittedByEmployee.EmployeeId}" 
                    : "Anonymous",
                ManagerEmployeeId = feedback.ManagerEmployeeId,
                ManagerName = feedback.ManagerEmployee != null 
                    ? $"{feedback.ManagerEmployee.EmployeeId}" 
                    : "Unknown",
                Rating = feedback.Rating,
                FeedbackComments = feedback.FeedbackComments,
                FeedbackFrom = feedback.FeedbackFrom,
                IsAnonymous = feedback.IsAnonymous,
                Status = feedback.Status,
                CreatedAt = feedback.CreatedAt,
                
            };
        }
    }
}
