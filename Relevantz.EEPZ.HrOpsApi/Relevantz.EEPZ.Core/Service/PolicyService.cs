using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
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

        public async Task<ApiResponseDto<PolicyResponseDto>> CreatePolicyAsync(
            CreatePolicyRequestDto request, int createdByUserId)
        {
            if (await _policyRepository.PolicyNameExistsAsync(request.PolicyName))
            {
                return ApiResponseDto<PolicyResponseDto>
                    .ErrorResponse(PolicyMessages.PolicyNameExists);
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
                DocumentUploadedAt = !string.IsNullOrEmpty(request.DocumentUrl)
                    ? DateTime.Now
                    : null
            };

            var createdPolicy = await _policyRepository.CreatePolicyAsync(policy);

            _logger.LogInformation(
                PolicyMessages.LogPolicyCreated,
                createdPolicy.PolicyName,
                createdPolicy.PolicyId,
                createdByUserId);

            return ApiResponseDto<PolicyResponseDto>.SuccessResponse(
                MapToResponseDto(createdPolicy),
                PolicyMessages.PolicyCreatedSuccess);
        }

        public async Task<ApiResponseDto<List<PolicyResponseDto>>> GetAllPoliciesAsync()
        {
            var policies = await _policyRepository.GetAllPoliciesAsync();
            return ApiResponseDto<List<PolicyResponseDto>>
                .SuccessResponse(MapPolicies(policies));
        }

        public async Task<ApiResponseDto<List<PolicyResponseDto>>> GetActivePoliciesAsync()
        {
            var policies = await _policyRepository.GetActivePoliciesAsync();
            return ApiResponseDto<List<PolicyResponseDto>>
                .SuccessResponse(MapPolicies(policies));
        }

        public async Task<ApiResponseDto<List<PolicyResponseDto>>> GetInactivePoliciesAsync()
        {
            var policies = await _policyRepository.GetInactivePoliciesAsync();
            return ApiResponseDto<List<PolicyResponseDto>>
                .SuccessResponse(MapPolicies(policies));
        }

        public async Task<ApiResponseDto<List<PolicyResponseDto>>> GetPublishedPoliciesAsync()
        {
            var policies = await _policyRepository.GetPublishedPoliciesAsync();
            return ApiResponseDto<List<PolicyResponseDto>>
                .SuccessResponse(MapPolicies(policies));
        }

        public async Task<ApiResponseDto<List<PolicyResponseDto>>> GetDraftPoliciesAsync()
        {
            var policies = await _policyRepository.GetDraftPoliciesAsync();
            return ApiResponseDto<List<PolicyResponseDto>>
                .SuccessResponse(MapPolicies(policies));
        }

        public async Task<ApiResponseDto<PolicyResponseDto>> GetPolicyByIdAsync(int policyId)
        {
            var policy = await _policyRepository.GetPolicyByIdAsync(policyId);

            if (policy == null)
            {
                return ApiResponseDto<PolicyResponseDto>
                    .ErrorResponse(PolicyMessages.PolicyNotFound);
            }

            return ApiResponseDto<PolicyResponseDto>
                .SuccessResponse(MapToResponseDto(policy));
        }

        public async Task<ApiResponseDto<PolicyResponseDto>> UpdatePolicyAsync(
            int policyId, UpdatePolicyRequestDto request)
        {
            var policy = await _policyRepository.GetPolicyByIdAsync(policyId);

            if (policy == null)
            {
                return ApiResponseDto<PolicyResponseDto>
                    .ErrorResponse(PolicyMessages.PolicyNotFound);
            }

            if (!string.IsNullOrEmpty(request.PolicyName) &&
                request.PolicyName != policy.PolicyName &&
                await _policyRepository.PolicyNameExistsAsync(request.PolicyName, policyId))
            {
                return ApiResponseDto<PolicyResponseDto>
                    .ErrorResponse(PolicyMessages.PolicyNameExists);
            }

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

            _logger.LogInformation(
                PolicyMessages.LogPolicyUpdated,
                updatedPolicy.PolicyName,
                updatedPolicy.PolicyId);

            return ApiResponseDto<PolicyResponseDto>.SuccessResponse(
                MapToResponseDto(updatedPolicy),
                PolicyMessages.PolicyUpdatedSuccess);
        }

        public async Task<ApiResponseDto<string>> PublishPolicyAsync(int policyId, int publishedBy)
        {
            var policy = await _policyRepository.GetPolicyByIdAsync(policyId);

            if (policy == null)
                return ApiResponseDto<string>.ErrorResponse(PolicyMessages.PolicyNotFound);

            if (policy.IsPublished)
                return ApiResponseDto<string>.ErrorResponse(PolicyMessages.PolicyAlreadyPublished);

            policy.IsPublished = true;
            policy.PublishedAt = DateTime.Now;
            policy.PublishedBy = publishedBy;
            policy.UpdatedAt = DateTime.Now;

            await _policyRepository.UpdatePolicyAsync(policy);

            _logger.LogInformation(
                PolicyMessages.LogPolicyPublished,
                policy.PolicyName,
                policy.PolicyId,
                publishedBy);

            return ApiResponseDto<string>.SuccessResponse(
                PolicyMessages.PolicyCreatedSuccess,
                PolicyMessages.PolicyPublishedSuccess);
        }

        public async Task<ApiResponseDto<bool>> DeletePolicyAsync(int policyId)
        {
            var result = await _policyRepository.DeletePolicyAsync(policyId);

            if (!result)
                return ApiResponseDto<bool>.ErrorResponse(PolicyMessages.PolicyNotFound);

            _logger.LogInformation(PolicyMessages.LogPolicyDeleted, policyId);

            return ApiResponseDto<bool>.SuccessResponse(
                true,
                PolicyMessages.PolicyDeletedSuccess);
        }

        public async Task<ApiResponseDto<PolicyResponseDto>> UnpublishPolicyAsync(
            int policyId, int userId)
        {
            var policy = await _policyRepository.GetPolicyByIdAsync(policyId);

            if (policy == null)
                return ApiResponseDto<PolicyResponseDto>
                    .ErrorResponse(PolicyMessages.PolicyNotFound);

            policy.IsPublished = false;
            policy.PublishedAt = null;
            policy.PublishedBy = null;
            policy.UpdatedAt = DateTime.Now;

            await _policyRepository.UpdatePolicyAsync(policy);

            _logger.LogInformation(
                PolicyMessages.LogPolicyUnpublished,
                policyId);

            return ApiResponseDto<PolicyResponseDto>.SuccessResponse(
                MapToResponseDto(policy),
                PolicyMessages.PolicyUnpublishedSuccess);
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
                PublishedByEmail = policy.PublishedBy.HasValue
                    ? "TODO: Get from PublishedBy UserId"
                    : null
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
                len /= 1024;
            }

            return $"{len:0.##} {sizes[order]}";
        }
    }
}
