using Microsoft.AspNetCore.Http;

namespace Relevantz.EEPZ.Common.DTOs
{
    // Approval requests
    public class ApprovalDecisionRequest
    {
        public int ApprovalId { get; set; }
        public bool IsApproved { get; set; }
        public string? Notes { get; set; }
    }

    // Assignment requests
    public class UploadCompletionProofRequest
    {
        public int AssignmentId { get; set; }
        public IFormFile ProofDocument { get; set; }
        public string? CompletionNotes { get; set; }
    }

    public class CompleteAssignmentRequest
    {
        public int AssignmentId { get; set; }
        public int NewRating { get; set; }
        public string? Notes { get; set; }
    }

    // Employee skill requests
    public class RecordSkillRequest
    {
        public int EmployeeId { get; set; }
        public int SkillId { get; set; }
        public int Rating { get; set; }
    }

    public class BulkRecordSkillRequest
    {
        public int EmployeeId { get; set; }
        public List<SkillRating> Skills { get; set; }
    }

    public class SkillRating
    {
        public int SkillId { get; set; }
        public int Rating { get; set; }
    }

    public class UpdateSkillRatingRequest
    {
        public int MapperId { get; set; }
        public int Rating { get; set; }
    }

    // SME requests
    public class BecomeSmeRequest
    {
        public int SkillId { get; set; }
        public IFormFile ProofDocument { get; set; }  
    }

    public class SmeRequestDto
    {
        public int SkillId { get; set; }
        public int MentorEmployeeId { get; set; }
        public int MenteeEmployeeId { get; set; }
        public DateTime? Deadline { get; set; }
    }
}
