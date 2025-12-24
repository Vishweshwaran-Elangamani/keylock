using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.ViewModels.Nomination.Response
{
    public class NominationHistoryResponseDto
    {
        public List<HistoryNominationDto> SelfNominations { get; set; } = new List<HistoryNominationDto>();
        public List<HistoryNominationDto> TeamNominations { get; set; } = new List<HistoryNominationDto>();
        public int TotalCount { get; set; }
        public HistoryStatistics Statistics { get; set; } = new HistoryStatistics();
    }

    public class HistoryNominationDto
    {
        public int NominationId { get; set; }
        public int OpportunityId { get; set; }
        public string OpportunityTitle { get; set; } = string.Empty;
        public string OpportunityType { get; set; } = string.Empty;

        // Employee Details (For both self and team nominations)
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeCompanyId { get; set; } = string.Empty;
        public string EmployeeEmail { get; set; } = string.Empty;

        // Nomination Type
        public string NominationType { get; set; } = string.Empty;

        // Status & Workflow
        public string CurrentStatus { get; set; } = string.Empty;
        public string WorkflowStage { get; set; } = string.Empty;

        // Dates
        public DateTime NominatedDate { get; set; }
        public DateTime? ManagerReviewedDate { get; set; }
        public DateTime? DeptHeadReviewedDate { get; set; }
        public DateTime? FinalizedDate { get; set; }

        // Review Details
        public string? ManagerReviewAction { get; set; }
        public string? ManagerReviewComments { get; set; }
        public string? ManagerName { get; set; }

        public string? DeptHeadReviewAction { get; set; }
        public string? DeptHeadReviewComments { get; set; }
        public string? DeptHeadName { get; set; }

        // Justification
        public string? Justification { get; set; }

        // Skills/Experience
        public string? RelevantSkills { get; set; }
        public string? RelevantExperience { get; set; }
    }

    public class HistoryStatistics
    {
        public int TotalSelfNominations { get; set; }
        public int TotalTeamNominations { get; set; }
        public int ApprovedCount { get; set; }
        public int RejectedCount { get; set; }
        public int PendingCount { get; set; }
        public int WithdrawnCount { get; set; }
    }
}
