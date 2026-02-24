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
    /// <summary>
    /// ReviewerService provides business logic for handling reviewer-related operations.
    /// It acts as a bridge between the repository layer and higher-level application logic.
    /// - Fetch submitted forms, ratings, and assessments for reviewers.
    /// - Retrieve assessment details and attachments.
    /// - Save reviewer reviews and decisions.
    /// </summary>
    public class ReviewerService : IReviewerService
    {
        private readonly IReviewerRepository _repository;
        private readonly IConfiguration _configuration;
        private readonly IGridFSBucket _gridFSBucket;

        public ReviewerService(IReviewerRepository repository, IConfiguration configuration)
        {
            _repository = repository;
            _configuration = configuration;

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

        public async Task<IEnumerable<ApproverAssignmentRowDto>> GetSubmittedFormsAsync(int reviewerUserId, int page, int pageSize)
        {
            return await _repository.GetReviewerSubmittedFormsAsync(reviewerUserId, page, pageSize);
        }

        public async Task<IEnumerable<ApproverAssignmentRowDto>> GetSubmittedRatingsAsync(int reviewerUserId, int page, int pageSize)
        {
            return await _repository.GetReviewerSubmittedRatingsAsync(reviewerUserId, page, pageSize);
        }

        public async Task<IEnumerable<ReviewerAssessmentViewDto>> GetAssessmentsWithDetailsAsync(int reviewerUserId, int page, int pageSize)
        {
            return await _repository.GetReviewerAssessmentsWithDetailsAsync(reviewerUserId, page, pageSize);
        }

        public async Task<ReviewerAssessmentViewDto?> GetAssessmentAsync(int reviewerUserId, int assessmentId)
        {
            return await _repository.GetAssessmentForReviewerAsync(reviewerUserId, assessmentId);
        }

        public async Task<List<AttachmentInfoDto>> GetAssessmentAttachmentsAsync(int assessmentId)
        {
            return await _repository.GetAssessmentAttachmentsAsync(assessmentId);
        }

        public async Task<Selfassessmentattachment?> GetAttachmentByIdAsync(int attachmentId)
        {
            return await _repository.GetAttachmentByIdAsync(attachmentId);
        }

        public async Task<int> SaveReviewAsync(int reviewerUserId, SubmitReviewDto dto)
        {
            return await _repository.SaveReviewerReviewAsync(reviewerUserId, dto);
        }

        public async Task<bool> SetDecisionAsync(int reviewerUserId, int assessmentId, string decision, string? reviewerComment)
        {
            return await _repository.SetReviewerDecisionAsync(reviewerUserId, assessmentId, decision, reviewerComment);
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

                var fileId = MongoDB.Bson.ObjectId.Parse(attachment.FilePath);

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
