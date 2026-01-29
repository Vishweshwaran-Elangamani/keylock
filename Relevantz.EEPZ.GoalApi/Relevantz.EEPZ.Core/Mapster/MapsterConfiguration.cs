using Mapster;
using Microsoft.Extensions.DependencyInjection;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;
using System.Reflection;

namespace Relevantz.EEPZ.Core.Configuration
{
    public static class MapsterConfiguration
    {
        public static void RegisterMapsterConfiguration(this IServiceCollection services)
        {
            var config = TypeAdapterConfig.GlobalSettings;
            config.Scan(Assembly.GetExecutingAssembly());

            // Configure all mappings in order
            ConfigureGoalMappings(config);
            ConfigureChecklistMappings(config);
            ConfigureAssigneeMappings(config);
            ConfigureApprovalMappings(config);
            ConfigureAttachmentMappings(config);
            ConfigureFileUploadMappings(config);
            ConfigureCommentMappings(config);
            ConfigureSummaryMappings(config);
            ConfigureTimelineMappings(config);
            ConfigureProgressMappings(config);
            ConfigureProjectMappings(config);

            // Register mapper
            services.AddSingleton(config);
            services.AddScoped<MapsterMapper.IMapper, MapsterMapper.ServiceMapper>();
        }

        // 1. Goal Detail Mappings
        private static void ConfigureGoalMappings(TypeAdapterConfig config)
        {
            config.NewConfig<Goal, GoalDetailModel>()
                .Map(dest => dest.GoalId, src => src.GoalId)
                .Map(dest => dest.GoalType, src => src.GoalType ?? GOAL_TYPE.SELF)
                .Map(dest => dest.ProjectId, src => src.ProjectId)
                .Map(dest => dest.Title, src => src.GoalTitle ?? "")
                .Map(dest => dest.Description, src => src.GoalDescription)
                .Map(dest => dest.CreatedAt, src => src.Goalcreatedat)
                .Map(dest => dest.CreatedByEmployeeMasterId, src => src.CreatedBy)
                .Map(dest => dest.EndAt, src => src.Goalendat)
                .Map(dest => dest.Status, src => src.Goalstatus ?? GOAL_STATUS.PENDING)
                .Map(dest => dest.ProjectName, src => (string)null)
                .Map(dest => dest.CreatedByName, src => (string)null)
                .Map(dest => dest.ProgressPercent, src => 0)
                .Map(dest => dest.HasPendingApproval, src => false)
                .Map(dest => dest.Checklist, src => src.GoalChecklists)
                .Map(dest => dest.Assignees, src => new List<AssigneeModel>())
                .Map(dest => dest.CanEdit, src => false)
                .Map(dest => dest.CanComment, src => false)
                .Map(dest => dest.CanMarkComplete, src => false)
                .Map(dest => dest.IsOverdue, src => false)
                .Map(dest => dest.CanRequestReopen, src => false);
        }

        // 2. Checklist Mappings
        private static void ConfigureChecklistMappings(TypeAdapterConfig config)
        {
            config.NewConfig<GoalChecklist, GoalChecklistItemModel>()
                .Map(dest => dest.ChecklistId, src => src.ChecklistId)
                .Map(dest => dest.Title, src => src.ItemTitle ?? "")
                .Map(dest => dest.Description, src => src.ItemDescription)
                .Map(dest => dest.IsShared, src => src.IsShared ?? false)
                .Map(dest => dest.AddedForEmployeeMasterId, src => src.AddedFor)
                .Map(dest => dest.IsCompletedForCurrentUser, src => false);
        }

        // 3. Assignee Mappings
        private static void ConfigureAssigneeMappings(TypeAdapterConfig config)
        {
            config.NewConfig<GoalAssignment, AssigneeModel>()
                .Map(dest => dest.EmployeeMasterId, src => src.AssignedTo ?? 0)
                .Map(dest => dest.Name, src => (string)null)
                .Map(dest => dest.Role, src => (string)null)
                .Map(dest => dest.IsAcknowledged, src => src.IsAcknowledged ?? false)
                .Map(dest => dest.AcknowledgedOn, src => src.AcknowledgedOn);
        }

        // 4. Approval Mappings
        private static void ConfigureApprovalMappings(TypeAdapterConfig config)
        {
            // GoalApproval -> GoalApprovalModel
            config.NewConfig<GoalApproval, GoalApprovalModel>()
                .Map(dest => dest.ApprovalId, src => src.ApprovalId)
                .Map(dest => dest.GoalId, src => src.GoalId)
                .Map(dest => dest.GoalTitle, src => src.Goal != null ? src.Goal.GoalTitle ?? "" : "")
                .Map(dest => dest.ApprovalType, src => src.ApprovalType ?? "")
                .Map(dest => dest.RequestedByEmployeeMasterId, src => src.RequestedBy)
                .Map(dest => dest.RequestedByName, src => (string)null)
                .Map(dest => dest.RequestedOn, src => src.RequestedOn)
                .Map(dest => dest.ApprovalStatus, src => src.ApprovalStatus ?? APPROVAL_STATUS.PENDING)
                .Map(dest => dest.AllAttachments, src => (List<GoalAttachmentModel>)null)
                .Map(dest => dest.ProofAttachments, src => (List<GoalAttachmentModel>)null)
                .Map(dest => dest.ReopenUntil, src => src.Goal != null ? src.Goal.ReopenUntil : null);

            // GoalApproval -> UserGoalApprovalModel
            config.NewConfig<GoalApproval, UserGoalApprovalModel>()
                .Map(dest => dest.ApprovalId, src => src.ApprovalId)
                .Map(dest => dest.GoalId, src => src.GoalId)
                .Map(dest => dest.GoalTitle, src => src.Goal != null ? src.Goal.GoalTitle ?? "" : "")
                .Map(dest => dest.ApprovalType, src => src.ApprovalType ?? "")
                .Map(dest => dest.RequestedByEmployeeMasterId, src => src.RequestedBy)
                .Map(dest => dest.RequestedByName, src => (string)null)
                .Map(dest => dest.RequestedOn, src => src.RequestedOn)
                .Map(dest => dest.ApprovalStatus, src => src.ApprovalStatus ?? APPROVAL_STATUS.PENDING)
                .Map(dest => dest.ReopenUntil, src => src.Goal != null ? src.Goal.ReopenUntil : null)
                .Map(dest => dest.ApproverEmployeeMasterId, src => src.ApprovedBy)
                .Map(dest => dest.ApproverName, src => (string)null)
                .Map(dest => dest.ApproverRole, src => (string)null)
                .Map(dest => dest.ApprovedOn, src => src.ApprovedOn)
                .Map(dest => dest.GoalCreatedByEmployeeMasterId, src => src.Goal != null ? src.Goal.CreatedBy : null)
                .Map(dest => dest.GoalCreatedByName, src => (string)null)
                .Map(dest => dest.GoalAssignees, src => new List<AssigneeModel>())
                .Map(dest => dest.AllAttachments, src => new List<GoalAttachmentModel>())
                .Map(dest => dest.ProofAttachments, src => new List<GoalAttachmentModel>())
                .Map(dest => dest.UserRole, src => (string)null)
                .Map(dest => dest.CanMakeDecision, src => false)
                .Map(dest => dest.UserContext, src => (string)null);
        }

        // 5. Attachment Mappings
        private static void ConfigureAttachmentMappings(TypeAdapterConfig config)
        {
            config.NewConfig<GoalAttachment, GoalAttachmentModel>()
                .Map(dest => dest.GoalAttachmentId, src => src.Goalattachmentsid)
                .Map(dest => dest.GoalId, src => src.GoalId)
                .Map(dest => dest.AttachmentTitle, src => src.AttachmentTitle ?? "")
                .Map(dest => dest.FilePath, src => src.Attachments ?? "")
                .Map(dest => dest.AttachedByEmployeeMasterId, src => src.AttachedBy)
                .Map(dest => dest.AttachedByName, src => (string)null)
                .Map(dest => dest.AttachedOn, src => src.AttachedOn)
                .Map(dest => dest.IsProofOfCompletion, src => src.IsProofOfCompletion ?? true)
                .Map(dest => dest.LinkedApprovalId, src => src.LinkedApprovalId);
        }

        // 6. File Upload Mappings
        private static void ConfigureFileUploadMappings(TypeAdapterConfig config)
        {
            config.NewConfig<GoalAttachment, FileUploadResponseModel>()
                .Map(dest => dest.AttachmentId, src => src.Goalattachmentsid)
                .Map(dest => dest.AttachmentTitle, src => src.AttachmentTitle ?? "")
                .Map(dest => dest.FilePath, src => src.Attachments ?? "")
                .Map(dest => dest.FileName, src => (string)null)
                .Map(dest => dest.FileSize, src => 0L)
                .Map(dest => dest.ContentType, src => (string)null)
                .Map(dest => dest.UploadedOn, src => src.AttachedOn ?? DateTime.UtcNow);
        }

        // 7. Comment Mappings
        private static void ConfigureCommentMappings(TypeAdapterConfig config)
        {
            config.NewConfig<GoalComment, GoalCommentModel>()
                .Map(dest => dest.GoalCommentId, src => src.Goalcommentid)
                .Map(dest => dest.GoalId, src => src.GoalId)
                .Map(dest => dest.Comment, src => src.GoalComment1 ?? "")
                .Map(dest => dest.CommentedByEmployeeMasterId, src => src.CommentedBy)
                .Map(dest => dest.CommentedByName, src => (string)null)
                .Map(dest => dest.CommentedByRole, src => (string)null)
                .Map(dest => dest.CommentedOn, src => src.CommentedOn);
        }

        // 8. Goal Summary Mappings (for query results)
        private static void ConfigureSummaryMappings(TypeAdapterConfig config)
        {
            config.NewConfig<Goal, GoalSummaryModel>()
                .Map(dest => dest.GoalId, src => src.GoalId)
                .Map(dest => dest.Title, src => src.GoalTitle ?? "")
                .Map(dest => dest.DescriptionShort, src => (string)null) // Set manually
                .Map(dest => dest.GoalType, src => src.GoalType ?? GOAL_TYPE.SELF)
                .Map(dest => dest.Status, src => src.Goalstatus ?? GOAL_STATUS.PENDING)
                .Map(dest => dest.CreatedAt, src => src.Goalcreatedat)
                .Map(dest => dest.EndAt, src => src.Goalendat)
                .Map(dest => dest.ProgressPercent, src => 0) // Set manually
                .Map(dest => dest.ProjectId, src => src.ProjectId)
                .Map(dest => dest.ProjectName, src => (string)null) // Set manually
                .Map(dest => dest.CreatedByEmployeeMasterId, src => src.CreatedBy)
                .Map(dest => dest.CreatedByName, src => (string)null) // Set manually
                .Map(dest => dest.IsOverdue, src => false) // Set manually
                .Map(dest => dest.CanAssign, src => false) // Set manually
                .Map(dest => dest.MyProgress, src => (int?)null) // Set manually
                .Map(dest => dest.HasPendingApproval, src => false) // Set manually
                .Map(dest => dest.IsAcknowledged, src => false) // Set manually
                .Map(dest => dest.Assignees, src => (List<AssigneeModel>)null); // Set manually
        }

        // 9. Timeline Event Mappings
        private static void ConfigureTimelineMappings(TypeAdapterConfig config)
        {
            // GoalComment -> TimelineEventModel
            config.NewConfig<GoalComment, TimelineEventModel>()
                .Map(dest => dest.Type, src => TIMELINE_EVENT_TYPE.COMMENT)
                .Map(dest => dest.Timestamp, src => src.CommentedOn ?? DateTime.UtcNow)
                .Map(dest => dest.Description, src => "Comment added")
                .Map(dest => dest.UserId, src => src.CommentedBy)
                .Map(dest => dest.UserName, src => (string)null)
                .Map(dest => dest.UserRole, src => (string)null)
                .Map(dest => dest.Metadata, src => (object)null);

            // GoalAssignment -> TimelineEventModel
            config.NewConfig<GoalAssignment, TimelineEventModel>()
                .Map(dest => dest.Type, src => TIMELINE_EVENT_TYPE.ASSIGNMENT)
                .Map(dest => dest.Timestamp, src => src.AssignedOn ?? DateTime.UtcNow)
                .Map(dest => dest.Description, src => (string)null) // Set manually
                .Map(dest => dest.UserId, src => src.AssignedBy)
                .Map(dest => dest.UserName, src => (string)null)
                .Map(dest => dest.UserRole, src => (string)null)
                .Map(dest => dest.Metadata, src => (object)null);

            // GoalAttachment -> TimelineEventModel
            config.NewConfig<GoalAttachment, TimelineEventModel>()
                .Map(dest => dest.Type, src => TIMELINE_EVENT_TYPE.ATTACHMENT)
                .Map(dest => dest.Timestamp, src => src.AttachedOn ?? DateTime.UtcNow)
                .Map(dest => dest.Description, src => $"Attachment added: {src.AttachmentTitle}")
                .Map(dest => dest.UserId, src => src.AttachedBy)
                .Map(dest => dest.UserName, src => (string)null)
                .Map(dest => dest.UserRole, src => (string)null)
                .Map(dest => dest.Metadata, src => (object)null);

            // Goalprogresslog -> TimelineEventModel
            config.NewConfig<Goalprogresslog, TimelineEventModel>()
                .Map(dest => dest.Type, src => TIMELINE_EVENT_TYPE.PROGRESS)
                .Map(dest => dest.Timestamp, src => src.UpdatedOn ?? DateTime.UtcNow)
                .Map(dest => dest.Description, src => $"Progress updated to {src.ProgressPercent}%")
                .Map(dest => dest.UserId, src => src.UpdatedBy)
                .Map(dest => dest.UserName, src => (string)null)
                .Map(dest => dest.UserRole, src => (string)null)
                .Map(dest => dest.Metadata, src => (object)null);
        }

        // 10. Progress Hierarchy Mappings
        private static void ConfigureProgressMappings(TypeAdapterConfig config)
        {
            // Tuple mapping for subordinate progress
            config.NewConfig<(Employeedetailsmaster edm, int userId), SubordinateProgressModel>()
                .Map(dest => dest.UserId, src => src.userId)
                .Map(dest => dest.UserName, src =>
                    $"{src.edm.Employee.Userprofile.FirstName} {src.edm.Employee.Userprofile.LastName}")
                .Map(dest => dest.Role, src => src.edm.Role.RoleName)
                .Map(dest => dest.Progress, src => 0)  // Set manually
                .Map(dest => dest.ItemCount, src => 0)  // Set manually
                .Map(dest => dest.ItemsCompleted, src => 0);  // Set manually
        }

        // 11. Project Mappings
        private static void ConfigureProjectMappings(TypeAdapterConfig config)
        {
            config.NewConfig<Project, ProjectModel>()
                .Map(dest => dest.ProjectId, src => src.ProjectId)
                .Map(dest => dest.ProjectName, src => src.ProjectName ?? "")
                .Map(dest => dest.Description, src => src.Description)
                .Map(dest => dest.Status, src => src.Status ?? PROJECT_STATUS.UNKNOWN)
                .Map(dest => dest.StartDate, src => src.StartDate)
                .Map(dest => dest.EndDate, src => src.EndDate)
                .Map(dest => dest.Employees, src => (List<ProjectEmployeeModel>)null);
        }
    }
}
