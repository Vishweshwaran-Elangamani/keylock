using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Microsoft.EntityFrameworkCore;

namespace Relevantz.EEPZ.Core.Service
{
    public class PolicyService : IPolicyService
    {
        private readonly IPolicyRepository _policyRepository;
        private readonly ILogger<PolicyService> _logger;

        public PolicyService(IPolicyRepository policyRepository, ILogger<PolicyService> logger)
        {
            _policyRepository = policyRepository;
            _logger = logger;
        }

        public async Task<ApiResponseDto<PolicyResponseDto>> CreatePolicyAsync(CreatePolicyRequestDto request, int createdByUserId)
        {
            try
            {
                // Check if policy name already exists
                if (await _policyRepository.PolicyNameExistsAsync(request.PolicyName))
                {
                    return ApiResponseDto<PolicyResponseDto>.ErrorResponse(PolicyMessages.PolicyNameExists);
                }

                var policy = new Organizationalpolicy
                {
                    PolicyName = request.PolicyName,
                    Category = request.Category,
                    Description = request.Description,
                    ComplianceGuidance = request.ComplianceGuidance,
                    Status = request.Status ?? "Draft",
                    CreatedByUserId = createdByUserId,
                    DocumentUrl = request.DocumentUrl,
                    DocumentName = request.DocumentName,
                    DocumentType = request.DocumentType,
                    DocumentSize = request.DocumentSize,
                    DocumentUploadedAt = !string.IsNullOrEmpty(request.DocumentUrl) ? DateTime.Now : null
                };

                var createdPolicy = await _policyRepository.CreatePolicyAsync(policy);
                _logger.LogInformation(PolicyMessages.LogPolicyCreated, createdPolicy.PolicyName, createdPolicy.PolicyId, createdByUserId);

                var response = MapToResponseDto(createdPolicy);
                return ApiResponseDto<PolicyResponseDto>.SuccessResponse(response, PolicyMessages.PolicyCreatedSuccess);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, PolicyMessages.LogErrorCreatingPolicy, request.PolicyName);
                return ApiResponseDto<PolicyResponseDto>.ErrorResponse(PolicyMessages.FailedToCreatePolicy);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, PolicyMessages.LogErrorCreatingPolicy, request.PolicyName);
                return ApiResponseDto<PolicyResponseDto>.ErrorResponse(PolicyMessages.FailedToCreatePolicy);
            }
        }

        public async Task<ApiResponseDto<List<PolicyResponseDto>>> GetAllPoliciesAsync()
        {
            try
            {
                var policies = await _policyRepository.GetAllPoliciesAsync();
                var response = MapPolicies(policies);
                return ApiResponseDto<List<PolicyResponseDto>>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, PolicyMessages.LogErrorFetchingAllPolicies);
                return ApiResponseDto<List<PolicyResponseDto>>.ErrorResponse(PolicyMessages.FailedToFetchPolicies);
            }
        }

        public async Task<ApiResponseDto<List<PolicyResponseDto>>> GetActivePoliciesAsync()
        {
            try
            {
                var policies = await _policyRepository.GetActivePoliciesAsync();
                var response = MapPolicies(policies);
                return ApiResponseDto<List<PolicyResponseDto>>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, PolicyMessages.LogErrorFetchingActivePolicies);
                return ApiResponseDto<List<PolicyResponseDto>>.ErrorResponse(PolicyMessages.FailedToFetchPolicies);
            }
        }

        public async Task<ApiResponseDto<List<PolicyResponseDto>>> GetInactivePoliciesAsync()
        {
            try
            {
                var policies = await _policyRepository.GetInactivePoliciesAsync();
                var response = MapPolicies(policies);
                return ApiResponseDto<List<PolicyResponseDto>>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, PolicyMessages.LogErrorFetchingInactivePolicies);
                return ApiResponseDto<List<PolicyResponseDto>>.ErrorResponse(PolicyMessages.FailedToFetchPolicies);
            }
        }

        public async Task<ApiResponseDto<List<PolicyResponseDto>>> GetPublishedPoliciesAsync()
        {
            try
            {
                var policies = await _policyRepository.GetPublishedPoliciesAsync();
                var response = MapPolicies(policies);
                return ApiResponseDto<List<PolicyResponseDto>>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, PolicyMessages.LogErrorFetchingPublishedPolicies);
                return ApiResponseDto<List<PolicyResponseDto>>.ErrorResponse(PolicyMessages.FailedToFetchPolicies);
            }
        }

        public async Task<ApiResponseDto<List<PolicyResponseDto>>> GetDraftPoliciesAsync()
        {
            try
            {
                var policies = await _policyRepository.GetDraftPoliciesAsync();
                var response = MapPolicies(policies);
                return ApiResponseDto<List<PolicyResponseDto>>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, PolicyMessages.LogErrorFetchingDraftPolicies);
                return ApiResponseDto<List<PolicyResponseDto>>.ErrorResponse(PolicyMessages.FailedToFetchPolicies);
            }
        }

        public async Task<ApiResponseDto<PolicyResponseDto>> GetPolicyByIdAsync(int policyId)
        {
            try
            {
                var policy = await _policyRepository.GetPolicyByIdAsync(policyId);
                if (policy == null)
                {
                    return ApiResponseDto<PolicyResponseDto>.ErrorResponse(PolicyMessages.PolicyNotFound);
                }

                var response = MapToResponseDto(policy);
                return ApiResponseDto<PolicyResponseDto>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, PolicyMessages.LogErrorFetchingPolicy, policyId);
                return ApiResponseDto<PolicyResponseDto>.ErrorResponse(PolicyMessages.FailedToFetchPolicy);
            }
        }

        public async Task<ApiResponseDto<PolicyResponseDto>> UpdatePolicyAsync(int policyId, UpdatePolicyRequestDto request)
        {
            try
            {
                var policy = await _policyRepository.GetPolicyByIdAsync(policyId);
                if (policy == null)
                {
                    return ApiResponseDto<PolicyResponseDto>.ErrorResponse(PolicyMessages.PolicyNotFound);
                }

                // Check for duplicate name if name is being updated
                if (!string.IsNullOrEmpty(request.PolicyName) && request.PolicyName != policy.PolicyName)
                {
                    if (await _policyRepository.PolicyNameExistsAsync(request.PolicyName, policyId))
                    {
                        return ApiResponseDto<PolicyResponseDto>.ErrorResponse(PolicyMessages.PolicyNameExists);
                    }
                }

                // Update only provided fields
                if (!string.IsNullOrEmpty(request.PolicyName))
                    policy.PolicyName = request.PolicyName;

                if (!string.IsNullOrEmpty(request.Category))
                    policy.Category = request.Category;

                if (request.Description != null)
                    policy.Description = request.Description;

                if (request.ComplianceGuidance != null)
                    policy.ComplianceGuidance = request.ComplianceGuidance;

                if (!string.IsNullOrEmpty(request.Status))
                    policy.Status = request.Status;

                if (!string.IsNullOrEmpty(request.DocumentUrl))
                {
                    policy.DocumentUrl = request.DocumentUrl;
                    policy.DocumentName = request.DocumentName;
                    policy.DocumentType = request.DocumentType;
                    policy.DocumentSize = request.DocumentSize;
                    policy.DocumentUploadedAt = DateTime.Now;
                }

                var updatedPolicy = await _policyRepository.UpdatePolicyAsync(policy);
                _logger.LogInformation(PolicyMessages.LogPolicyUpdated, updatedPolicy.PolicyName, updatedPolicy.PolicyId);

                var response = MapToResponseDto(updatedPolicy);
                return ApiResponseDto<PolicyResponseDto>.SuccessResponse(response, PolicyMessages.PolicyUpdatedSuccess);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, PolicyMessages.LogErrorUpdatingPolicy, policyId);
                return ApiResponseDto<PolicyResponseDto>.ErrorResponse(PolicyMessages.FailedToUpdatePolicy);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, PolicyMessages.LogErrorUpdatingPolicy, policyId);
                return ApiResponseDto<PolicyResponseDto>.ErrorResponse(PolicyMessages.FailedToUpdatePolicy);
            }
        }

        public async Task<ApiResponseDto<string>> PublishPolicyAsync(int policyId, int publishedBy)
        {
            try
            {
                var policy = await _policyRepository.GetPolicyByIdAsync(policyId);
                if (policy == null)
                {
                    return ApiResponseDto<string>.ErrorResponse(PolicyMessages.PolicyNotFound);
                }

                if (policy.IsPublished)
                {
                    return ApiResponseDto<string>.ErrorResponse(PolicyMessages.PolicyAlreadyPublished);
                }

                policy.IsPublished = true;
                policy.PublishedAt = DateTime.Now;
                policy.PublishedBy = publishedBy;
                policy.UpdatedAt = DateTime.Now;

                await _policyRepository.UpdatePolicyAsync(policy);
                _logger.LogInformation(PolicyMessages.LogPolicyPublished, policy.PolicyName, policy.PolicyId, publishedBy);

                return ApiResponseDto<string>.SuccessResponse(
                    PolicyMessages.PolicyCreatedSuccess,
                    PolicyMessages.PolicyPublishedSuccess
                );
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, PolicyMessages.LogErrorPublishingPolicy, policyId);
                return ApiResponseDto<string>.ErrorResponse(PolicyMessages.FailedToPublishPolicy);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, PolicyMessages.LogErrorPublishingPolicy, policyId);
                return ApiResponseDto<string>.ErrorResponse(PolicyMessages.FailedToPublishPolicy);
            }
        }

        public async Task<ApiResponseDto<bool>> DeletePolicyAsync(int policyId)
        {
            try
            {
                var result = await _policyRepository.DeletePolicyAsync(policyId);
                if (!result)
                {
                    return ApiResponseDto<bool>.ErrorResponse(PolicyMessages.PolicyNotFound);
                }

                _logger.LogInformation(PolicyMessages.LogPolicyDeleted, policyId);
                return ApiResponseDto<bool>.SuccessResponse(true, PolicyMessages.PolicyDeletedSuccess);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, PolicyMessages.LogErrorDeletingPolicy, policyId);
                return ApiResponseDto<bool>.ErrorResponse(PolicyMessages.FailedToDeletePolicy);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, PolicyMessages.LogErrorDeletingPolicy, policyId);
                return ApiResponseDto<bool>.ErrorResponse(PolicyMessages.FailedToDeletePolicy);
            }
        }

        public async Task<ApiResponseDto<PolicyResponseDto>> UnpublishPolicyAsync(int policyId, int userId)
        {
            try
            {
                var policy = await _policyRepository.GetPolicyByIdAsync(policyId);

                if (policy == null)
                {
                    return ApiResponseDto<PolicyResponseDto>.ErrorResponse(PolicyMessages.PolicyNotFound);
                }

                policy.IsPublished = false;
                policy.PublishedAt = null;
                policy.PublishedBy = null;
                policy.UpdatedAt = DateTime.Now;

                await _policyRepository.UpdatePolicyAsync(policy);

                _logger.LogInformation(PolicyMessages.LogPolicyUnpublished, policyId);

                var response = MapToResponseDto(policy);
                return ApiResponseDto<PolicyResponseDto>.SuccessResponse(response, PolicyMessages.PolicyUnpublishedSuccess);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, PolicyMessages.LogErrorUnpublishingPolicy);
                return ApiResponseDto<PolicyResponseDto>.ErrorResponse(PolicyMessages.FailedToUnpublishPolicy);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, PolicyMessages.LogErrorUnpublishingPolicy);
                return ApiResponseDto<PolicyResponseDto>.ErrorResponse(PolicyMessages.FailedToUnpublishPolicy);
            }
        }

        private List<PolicyResponseDto> MapPolicies(IEnumerable<Organizationalpolicy> policies)
        {
            return policies.Select(MapToResponseDto).ToList();
        }

        private PolicyResponseDto MapToResponseDto(Organizationalpolicy policy)
        {
            return new PolicyResponseDto
            {
                PolicyId = policy.PolicyId,
                PolicyName = policy.PolicyName,
                Category = policy.Category,
                Description = policy.Description,
                ComplianceGuidance = policy.ComplianceGuidance,
                Status = policy.Status,
                CreatedByUserId = policy.CreatedByUserId,
                CreatedByEmail = policy.CreatedByUser?.Email,
                CreatedAt = policy.CreatedAt,
                UpdatedAt = policy.UpdatedAt,
                ViolationsCount = policy.Policyviolations?.Count ?? 0,
                DocumentUrl = policy.DocumentUrl,
                DocumentName = policy.DocumentName,
                DocumentType = policy.DocumentType,
                DocumentSize = policy.DocumentSize,
                DocumentSizeFormatted = FormatFileSize(policy.DocumentSize),
                DocumentUploadedAt = policy.DocumentUploadedAt,
                IsPublished = policy.IsPublished,
                PublishedAt = policy.PublishedAt,
                PublishedBy = policy.PublishedBy,
                PublishedByEmail = policy.PublishedBy.HasValue ? "TODO: Get from PublishedBy UserId" : null
            };
        }

        private string FormatFileSize(long? bytes)
        {
            if (!bytes.HasValue || bytes.Value == 0)
                return null;

            string[] sizes = { "B", "KB", "MB", "GB" };
            double len = bytes.Value;
            int order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len = len / 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }
    }
}
