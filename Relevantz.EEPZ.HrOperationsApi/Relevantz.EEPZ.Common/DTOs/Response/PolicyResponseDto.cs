using System;

namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class PolicyResponseDto
{
    public int PolicyId { get; set; }
    public string PolicyName { get; set; } = null!;
    public string Category { get; set; } = null!;
    public string? Description { get; set; }
    public string? ComplianceGuidance { get; set; }
    public string Status { get; set; } = null!;
    public int CreatedByUserId { get; set; }
    public string? CreatedByEmail { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int ViolationsCount { get; set; }
    public string? DocumentUrl { get; set; }
    public string? DocumentName { get; set; }
    public string? DocumentType { get; set; }
    public long? DocumentSize { get; set; }
    public string? DocumentSizeFormatted { get; set; }
    public DateTime? DocumentUploadedAt { get; set; }
    public bool IsPublished { get; set; }
    public DateTime? PublishedAt { get; set; }
    public int? PublishedBy { get; set; }
    public string? PublishedByEmail { get; set; }
}
}
