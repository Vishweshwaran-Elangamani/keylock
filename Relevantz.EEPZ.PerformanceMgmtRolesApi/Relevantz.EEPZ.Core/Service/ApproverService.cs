using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;
using MongoDB.Driver;
using MongoDB.Driver.GridFS;
using MongoDB.Bson;
using Microsoft.Extensions.Configuration;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class ApproverService : IApproverService
    {
        private readonly IApproverRepository _repository;
        private readonly IConfiguration _configuration;
        private readonly IGridFSBucket _gridFSBucket;

        public ApproverService(IApproverRepository repository, IConfiguration configuration)
        {
            _repository = repository;
            _configuration = configuration;

            // Initialize MongoDB GridFS
            var connectionString = _configuration["MongoDbSettings:ConnectionString"];
            var databaseName = _configuration["MongoDbSettings:DatabaseName"];
            var bucketName = _configuration["MongoDbSettings:GridFSBucketName"];

            var client = new MongoClient(connectionString);
            var database = client.GetDatabase(databaseName);
            _gridFSBucket = new GridFSBucket(database, new GridFSBucketOptions
            {
                BucketName = bucketName,
                ChunkSizeBytes = int.Parse(_configuration["MongoDbSettings:ChunkSizeBytes"] ?? "1048576")
            });
        }

        public async Task<IEnumerable<ApproverAssignmentRowDto>> GetSubmittedFormsAsync(int approverUserId, int page, int pageSize)
        {
            return await _repository.GetApproverSubmittedFormsAsync(approverUserId, page, pageSize);
        }

        public async Task<IEnumerable<ApproverAssignmentRowDto>> GetReworkFormsAsync(int approverUserId, int page, int pageSize)
        {
            return await _repository.GetApproverReworkFormsAsync(approverUserId, page, pageSize);
        }

        public async Task<IEnumerable<ApproverAssignmentRowDto>> GetSubmittedL1RatingsAsync(int approverUserId, int page, int pageSize)
        {
            return await _repository.GetSubmittedL1RatingsAsync(approverUserId, page, pageSize);
        }

        public async Task<IEnumerable<ReviewerAssessmentViewDto>> GetAssessmentsWithDetailsAsync(int approverUserId, int page, int pageSize)
        {
            return await _repository.GetApproverAssessmentsWithDetailsAsync(approverUserId, page, pageSize);
        }

        public async Task<ReviewerAssessmentViewDto?> GetAssessmentAsync(int approverUserId, int assessmentId)
        {
            return await _repository.GetAssessmentForApproverAsync(approverUserId, assessmentId);
        }

        public async Task<int> SaveReviewAsync(int approverUserId, SubmitReviewDto dto)
        {
            return await _repository.SaveApproverReviewAsync(approverUserId, dto);
        }

        public async Task<bool> SetDecisionAsync(int approverUserId, int assessmentId, string decision, string? approverComment)
        {
            return await _repository.SetApproverDecisionAsync(approverUserId, assessmentId, decision, approverComment);
        }

        public async Task<ReviewerDecisionDto?> GetLatestReviewerDecisionAsync(int assessmentId)
        {
            return await _repository.GetLatestReviewerDecisionAsync(assessmentId);
        }

        public async Task<List<AttachmentInfoDto>> GetAssessmentAttachmentsAsync(int assessmentId)
        {
            return await _repository.GetAssessmentAttachmentsAsync(assessmentId);
        }

        public async Task<Selfassessmentattachment?> GetAttachmentByIdAsync(int attachmentId)
        {
            return await _repository.GetAttachmentByIdAsync(attachmentId);
        }

        public async Task<(bool success, byte[] fileBytes, string contentType, string fileName, List<string> errors)>
    DownloadAttachmentFromGridFSAsync(int attachmentId)
{
    var errors = new List<string>();

    try
    {
        var attachment = await _repository.GetAttachmentByIdAsync(attachmentId);

        if (attachment is null)
        {
            errors.Add(Relevantz.EEPZ.Common.Constants.AttachmentConstants.ATTACHMENT_NOT_FOUND);
            return (false, null, null, null, errors);
        }

        if (string.IsNullOrWhiteSpace(attachment.FilePath))
        {
            errors.Add(Relevantz.EEPZ.Common.Constants.AttachmentConstants.FILE_NOT_FOUND);
            return (false, null, null, null, errors);
        }

        if (!ObjectId.TryParse(attachment.FilePath, out var fileId))
        {
            errors.Add("INVALID_FILE_ID"); 
            return (false, null, null, null, errors);
        }

        byte[] fileBytes;
        try
        {
            fileBytes = await _gridFSBucket.DownloadAsBytesAsync(fileId);
        }
        catch (GridFSFileNotFoundException)
        {
            errors.Add(Relevantz.EEPZ.Common.Constants.AttachmentConstants.FILE_NOT_FOUND); // 404
            return (false, null, null, null, errors);
        }
        catch (MongoConnectionException)
        {
            errors.Add("STORAGE_UNAVAILABLE"); 
            return (false, null, null, null, errors);
        }
        catch (TimeoutException)
        {
            errors.Add("STORAGE_TIMEOUT"); 
            return (false, null, null, null, errors);
        }
        catch (GridFSException ex)
        {
            errors.Add($"STORAGE_ERROR: {ex.Message}"); 
            return (false, null, null, null, errors);
        }
        var contentType = string.IsNullOrWhiteSpace(attachment.FileType)
            ? "application/octet-stream"
            : attachment.FileType;

        var fileName = string.IsNullOrWhiteSpace(attachment.FileName)
            ? $"{fileId}.bin"
            : attachment.FileName;

        return (true, fileBytes, contentType, fileName, errors);
    }
    catch (Exception ex)
    {
        errors.Add($"UNKNOWN_ERROR: {ex.Message}");
        return (false, null, null, null, errors);
    }
}

    }
}
