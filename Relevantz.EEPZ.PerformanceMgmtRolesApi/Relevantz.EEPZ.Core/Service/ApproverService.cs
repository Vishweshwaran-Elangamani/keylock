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

        public async Task<(bool success, byte[] fileBytes, string contentType, string fileName, List<string> errors)> DownloadAttachmentFromGridFSAsync(int attachmentId)
        {
            try
            {
                var attachment = await _repository.GetAttachmentByIdAsync(attachmentId);

                if (attachment == null)
                    return (false, null, null, null, new List<string> { "ATTACHMENT_NOT_FOUND" });

                if (string.IsNullOrWhiteSpace(attachment.FilePath))
                    return (false, null, null, null, new List<string> { "FILE_NOT_FOUND - File path missing." });

                // FilePath contains the GridFS ObjectId
                var fileId = MongoDB.Bson.ObjectId.Parse(attachment.FilePath);

                // Download file from GridFS
                var fileBytes = await _gridFSBucket.DownloadAsBytesAsync(fileId);
                var contentType = attachment.FileType ?? "application/octet-stream";

                return (true, fileBytes, contentType, attachment.FileName, new List<string>());
            }
            catch (MongoDB.Driver.GridFS.GridFSFileNotFoundException)
            {
                return (false, null, null, null, new List<string> { "FILE_NOT_FOUND - File not found in GridFS." });
            }
            catch (Exception ex)
            {
                return (false, null, null, null, new List<string> { $"Error: {ex.Message}" });
            }
        }
    }
}
