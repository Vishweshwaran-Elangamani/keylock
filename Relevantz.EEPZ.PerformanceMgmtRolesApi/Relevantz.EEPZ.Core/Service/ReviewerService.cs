using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.GridFS;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    /// <summary>
    /// Provides reviewer-facing operations: fetching assessments,
    /// listing submitted forms/ratings, and downloading attachments from GridFS.
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

            // Initialize GridFS bucket from configuration (kept as-is to avoid DI breaking changes).
            var connectionString = _configuration["MongoDbSettings:ConnectionString"];
            var databaseName     = _configuration["MongoDbSettings:DatabaseName"];
            var bucketName       = _configuration["MongoDbSettings:GridFSBucketName"];

            var client   = new MongoClient(connectionString);
            var database = client.GetDatabase(databaseName);

            _gridFSBucket = new GridFSBucket(database, new GridFSBucketOptions
            {
                BucketName     = bucketName,
                ChunkSizeBytes = int.Parse(_configuration["MongoDbSettings:ChunkSizeBytes"] ?? "1048576")
            });
        }

        /// <summary>Returns a paginated list of forms submitted to this reviewer.</summary>
        public async Task<IEnumerable<ApproverAssignmentRowDto>> GetSubmittedFormsAsync(int reviewerUserId, int page, int pageSize)
            => await _repository.GetReviewerSubmittedFormsAsync(reviewerUserId, page, pageSize);

        /// <summary>Returns a paginated list of ratings submitted to this reviewer.</summary>
        public async Task<IEnumerable<ApproverAssignmentRowDto>> GetSubmittedRatingsAsync(int reviewerUserId, int page, int pageSize)
            => await _repository.GetReviewerSubmittedRatingsAsync(reviewerUserId, page, pageSize);

        /// <summary>Returns paged assessments with expanded details for a reviewer.</summary>
        public async Task<IEnumerable<ReviewerAssessmentViewDto>> GetAssessmentsWithDetailsAsync(int reviewerUserId, int page, int pageSize)
            => await _repository.GetReviewerAssessmentsWithDetailsAsync(reviewerUserId, page, pageSize);

        /// <summary>
        /// Retrieves a single assessment for the specified reviewer.
        /// Returns null when the reviewer is out of scope or the assessment does not exist.
        /// </summary>
        public async Task<ReviewerAssessmentViewDto?> GetAssessmentAsync(int reviewerUserId, int assessmentId)
            => await _repository.GetAssessmentForReviewerAsync(reviewerUserId, assessmentId);

        /// <summary>Returns attachment metadata for an assessment.</summary>
        public async Task<List<AttachmentInfoDto>> GetAssessmentAttachmentsAsync(int assessmentId)
            => await _repository.GetAssessmentAttachmentsAsync(assessmentId);

        /// <summary>Returns a single attachment entity by its primary key.</summary>
        public async Task<Selfassessmentattachment?> GetAttachmentByIdAsync(int attachmentId)
            => await _repository.GetAttachmentByIdAsync(attachmentId);

        /// <summary>Saves/updates a reviewer’s review submission.</summary>
        public async Task<int> SaveReviewAsync(int reviewerUserId, SubmitReviewDto dto)
            => await _repository.SaveReviewerReviewAsync(reviewerUserId, dto);

        /// <summary>Sets the reviewer decision for a given assessment.</summary>
        public async Task<bool> SetDecisionAsync(int reviewerUserId, int assessmentId, string decision, string? reviewerComment)
            => await _repository.SetReviewerDecisionAsync(reviewerUserId, assessmentId, decision, reviewerComment);

        /// <summary>
        /// Downloads an assessment attachment from GridFS.
        /// Handles invalid ObjectId format and GridFS-specific not-found conditions.
        /// </summary>
        public async Task<(bool success, byte[] fileBytes, string contentType, string fileName, List<string> errors)>
            DownloadAttachmentFromGridFSAsync(int attachmentId)
        {
            try
            {
                var attachment = await _repository.GetAttachmentByIdAsync(attachmentId);

                if (attachment == null)
                    return (false, null, null, null, new List<string> { "ATTACHMENT_NOT_FOUND" });

                if (string.IsNullOrWhiteSpace(attachment.FilePath))
                    return (false, null, null, null, new List<string> { "FILE_NOT_FOUND: File path missing." });

                // Avoid throwing FormatException by validating ObjectId first.
                if (!ObjectId.TryParse(attachment.FilePath.Trim(), out var fileId))
                    return (false, null, null, null, new List<string> { "INVALID_FILE_ID_FORMAT" });

                var fileBytes   = await _gridFSBucket.DownloadAsBytesAsync(fileId);
                var contentType = string.IsNullOrWhiteSpace(attachment.FileType)
                    ? "application/octet-stream"
                    : attachment.FileType;

                return (true, fileBytes, contentType, attachment.FileName, new List<string>());
            }
            catch (GridFSFileNotFoundException)
            {
                // Handle GridFS not-found explicitly.
                return (false, null, null, null, new List<string> { "FILE_NOT_FOUND: Not found in GridFS." });
            }
            catch (MongoException ex) // Catch Mongo-specific issues distinctly if desired.
            {
                return (false, null, null, null, new List<string> { $"MONGO_ERROR: {ex.Message}" });
            }
            catch (Exception ex)
            {
                return (false, null, null, null, new List<string> { $"ERROR: {ex.Message}" });
            }
        }
    }
}