using FluentValidation;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Exceptions;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repository.Interface;
using MapsterMapper;  // ← ADD THIS
using Mapster;        // ← ADD THIS

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class GoalInteractionService : IGoalInteractionService
    {
        private readonly IGoalInteractionRepository _repo;
        private readonly IBaseGoalRepository _baseRepo;
        private readonly IGoalApprovalsRepository _approvalsRepo;
        private readonly IGoalRepository _goalRepo;
        private readonly IBaseGoalService _baseService;
        private readonly IWebHostEnvironment _environment;
        private readonly IValidator<CreateCommentModel> _createCommentValidator;
        private readonly IMapper _mapper;  // ← ADD THIS

        public GoalInteractionService(
            IGoalInteractionRepository repo,
            IBaseGoalRepository baseRepo,
            IGoalApprovalsRepository approvalsRepo,
            IGoalRepository goalRepository,
            IBaseGoalService baseService,
            IWebHostEnvironment environment,
            IValidator<CreateCommentModel> createCommentValidator,
            IMapper mapper)  // ← ADD THIS
        {
            _repo = repo;
            _baseRepo = baseRepo;
            _approvalsRepo = approvalsRepo;
            _goalRepo = goalRepository;
            _baseService = baseService;
            _environment = environment;
            _createCommentValidator = createCommentValidator;
            _mapper = mapper;  // ← ADD THIS
        }

        // AddCommentAsync remains UNCHANGED - no mapping needed
        public async Task<ApiResponseModel> AddCommentAsync(
            int goalId,
            CreateCommentModel dto,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            var validationResult = await _createCommentValidator.ValidateAsync(dto);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                throw new BadRequestException("VALIDATION_FAILED", string.Join("; ", errors));
            }

            var goal = await _baseRepo.GetGoalByIdAsync(goalId);
            if (goal == null)
            {
                throw new GoalNotFoundException(goalId);
            }

            var canComment = await _baseService.CanUserCommentOnGoalAsync(
                goalId,
                currentUserEmployeeMasterId,
                currentUserRole
            );
            if (!canComment)
            {
                throw new AccessDeniedException(
                    ResponseMessages.Codes.COMMENT_ACCESS_DENIED,
                    "You do not have permission to comment on this goal"
                );
            }

            var isCommentable = await _baseService.IsGoalCommentableAsync(goalId);
            if (!isCommentable)
            {
                throw new BusinessRuleException(
                    ResponseMessages.Codes.GOAL_COMMENT_BLOCKED,
                    "Cannot comment on completed or closed goals"
                );
            }

            var comment = new GoalComment
            {
                GoalId = goalId,
                GoalComment1 = dto.Comment,
                CommentedBy = currentUserEmployeeMasterId,
                CommentedOn = DateTime.UtcNow,
            };
            await _repo.AddCommentAsync(comment);
            await _baseRepo.SaveChangesAsync();

            var metadata = new
            {
                GoalId = goalId,
                CommentId = comment.Goalcommentid,
                CommentedBy = currentUserEmployeeMasterId,
            };

            return ApiResponseModel.SuccessResponse(
                ResponseMessages.Codes.COMMENT_ADDED_SUCCESS,
                metadata
            );
        }

        // REFACTORED: GetAllCommentsAsync with Mapster
        public async Task<List<GoalCommentModel>> GetAllCommentsAsync(int goalId)
        {
            var comments = await _repo.GetCommentsByGoalAsync(goalId);
            var result = new List<GoalCommentModel>();

            foreach (var comment in comments)
            {
                // Use Mapster for base mapping
                var commentModel = _mapper.Map<GoalCommentModel>(comment);

                // Set user details
                commentModel.CommentedByName = await _baseService.GetEmployeeNameAsync(
                    comment.CommentedBy
                );
                
                if (comment.CommentedBy.HasValue)
                {
                    commentModel.CommentedByRole = await _baseRepo.GetUserRoleAsync(
                        comment.CommentedBy.Value
                    );
                }

                result.Add(commentModel);
            }

            return result;
        }

        // GetDashboardDetailsAsync remains UNCHANGED - no mapping needed
        public async Task<GoalDashboardSummaryModel> GetDashboardDetailsAsync(
            int currentUserEmployeeMasterId
        )
        {
            var userRole = await _baseRepo.GetUserRoleAsync(currentUserEmployeeMasterId);

            var allGoals = await _goalRepo.QueryGoalsAsync(
                new GoalQueryModel
                {
                    CurrentUserEmpMasterID = currentUserEmployeeMasterId,
                    CurrentUserRole = userRole,
                    Page = 1,
                    PageSize = 1000000,
                }
            );

            var completed = allGoals
                .Where(g => g.Goalstatus?.ToLower() == GOAL_STATUS.COMPLETED.ToLower())
                .ToList();

            var pending = allGoals
                .Where(g => g.Goalstatus?.ToLower() == GOAL_STATUS.PENDING.ToLower())
                .ToList();

            var ongoing = allGoals
                .Where(g =>
                    g.Goalstatus?.ToLower() == GOAL_STATUS.IN_PROGRESS.ToLower()
                    || g.Goalstatus?.ToLower() == GOAL_STATUS.OPEN.ToLower()
                    || g.Goalstatus?.ToLower() == GOAL_STATUS.REOPENED.ToLower()
                )
                .ToList();

            var overdue = allGoals
                .Where(g =>
                    g.Goalendat.HasValue
                    && g.Goalendat.Value < DateTime.UtcNow
                    && g.Goalstatus?.ToLower() != GOAL_STATUS.COMPLETED.ToLower()
                    && g.Goalstatus?.ToLower() != GOAL_STATUS.CLOSED.ToLower()
                )
                .ToList();

            var pendingApprovals = await _approvalsRepo.CountPendingApprovalsForUserAsync(
                currentUserEmployeeMasterId
            );

            return new GoalDashboardSummaryModel
            {
                Completed = completed.Count,
                Ongoing = ongoing.Count,
                Pending = pending.Count,
                Overdue = overdue.Count,
                PendingApprovals = pendingApprovals,
            };
        }

        // REFACTORED: GetOngoingAsync with Mapster
        public async Task<List<GoalSummaryModel>> GetOngoingAsync(
            string type,
            int currentUserEmployeeMasterId
        )
        {
            var goals = await _goalRepo.QueryGoalsAsync(
                new GoalQueryModel { Page = 1, PageSize = 1_000_000 }
            );

            var ongoing = goals
                .Where(g =>
                    g.Goalstatus == GOAL_STATUS.OPEN
                    || g.Goalstatus == GOAL_STATUS.IN_PROGRESS
                    || g.Goalstatus == GOAL_STATUS.REOPENED
                )
                .ToList();

            var result = new List<GoalSummaryModel>();
            
            foreach (var goal in ongoing)
            {
                // Use Mapster for base mapping
                var summary = _mapper.Map<GoalSummaryModel>(goal);

                // Set description short
                summary.DescriptionShort = GetShortDescription(goal.GoalDescription);

                // Set progress from latest log
                var latestProgress = goal
                    .Goalprogresslogs.OrderByDescending(p => p.UpdatedOn)
                    .FirstOrDefault();
                summary.ProgressPercent = latestProgress?.ProgressPercent ?? 0;

                // Set project name
                summary.ProjectName = await GetProjectNameAsync(goal.ProjectId);

                // Set creator name
                summary.CreatedByName = await _baseService.GetEmployeeNameAsync(goal.CreatedBy);

                // Calculate overdue status
                summary.IsOverdue = goal.Goalendat.HasValue
                    && goal.Goalendat.Value < DateTime.UtcNow
                    && goal.Goalstatus != GOAL_STATUS.COMPLETED;

                result.Add(summary);
            }

            return result;
        }

        // REFACTORED: GetGoalTimelineAsync with Mapster
        public async Task<List<TimelineEventModel>> GetGoalTimelineAsync(
            int goalId,
            int currentUserEmployeeMasterId
        )
        {
            var goal = await _baseRepo.GetGoalByIdAsync(goalId);
            if (goal == null)
                throw new GoalNotFoundException(goalId);

            var canView = await _baseService.CanViewGoalAsync(goalId, currentUserEmployeeMasterId);
            if (!canView)
                throw new GoalAccessDeniedException();

            var events = new List<TimelineEventModel>();

            // Goal created event
            events.Add(await CreateGoalCreatedEventAsync(goal));

            // Progress log events
            var progressLogs = await _repo.GetProgressLogsByGoalAsync(goalId);
            foreach (var progressLog in progressLogs)
            {
                events.Add(await MapProgressLogToTimelineEventAsync(progressLog));
            }

            // Approval events
            foreach (var approval in goal.GoalApprovals)
            {
                events.AddRange(await MapApprovalToTimelineEventsAsync(approval));
            }

            // Comment events
            foreach (var comment in goal.GoalComments)
            {
                events.Add(await MapCommentToTimelineEventAsync(comment));
            }

            // Assignment events
            foreach (var assignment in goal.GoalAssignments)
            {
                events.Add(await MapAssignmentToTimelineEventAsync(assignment));
            }

            // Attachment events
            foreach (var attachment in goal.GoalAttachments)
            {
                events.Add(await MapAttachmentToTimelineEventAsync(attachment));
            }

            return events.OrderByDescending(e => e.Timestamp).ToList();
        }

        public async Task<List<ProjectEmployeeModel>> GetProjectSubordinatesAsync(
            int projectId,
            int managerEmployeeMasterId
        )
        {
            return await _repo.GetProjectSubordinatesAsync(projectId, managerEmployeeMasterId);
        }

        // ==================== HELPER METHODS ====================

        private string? GetShortDescription(string? description)
        {
            if (string.IsNullOrWhiteSpace(description))
                return null;

            return description.Length > 80
                ? description.Substring(0, 80) + "..."
                : description;
        }

        private async Task<string?> GetProjectNameAsync(int? projectId)
        {
            if (!projectId.HasValue)
                return null;

            var project = await _baseRepo.GetProjectByIdAsync(projectId.Value);
            return project?.ProjectName;
        }

        private async Task<TimelineEventModel> CreateGoalCreatedEventAsync(Goal goal)
        {
            return new TimelineEventModel
            {
                Type = TIMELINE_EVENT_TYPE.GOAL_CREATED,
                Timestamp = goal.Goalcreatedat ?? DateTime.UtcNow,
                Description = "Goal created",
                UserId = goal.CreatedBy,
                UserName = await _baseService.GetEmployeeNameAsync(goal.CreatedBy),
                UserRole = goal.CreatedBy.HasValue
                    ? await _baseRepo.GetUserRoleAsync(goal.CreatedBy.Value)
                    : null,
            };
        }

        private async Task<TimelineEventModel> MapProgressLogToTimelineEventAsync(
            Goalprogresslog progressLog
        )
        {
            // Use Mapster for base mapping
            var timelineEvent = _mapper.Map<TimelineEventModel>(progressLog);

            // Set user details
            timelineEvent.UserName = await _baseService.GetEmployeeNameAsync(progressLog.UpdatedBy);
            
            if (progressLog.UpdatedBy.HasValue)
            {
                timelineEvent.UserRole = await _baseRepo.GetUserRoleAsync(
                    progressLog.UpdatedBy.Value
                );
            }

            // Set metadata
            timelineEvent.Metadata = new
            {
                ProgressPercent = progressLog.ProgressPercent,
                Source = progressLog.Source
            };

            return timelineEvent;
        }

        private async Task<List<TimelineEventModel>> MapApprovalToTimelineEventsAsync(
            GoalApproval approval
        )
        {
            var events = new List<TimelineEventModel>();

            // Approval request event
            string requestDescription = GetApprovalRequestDescription(approval.ApprovalType);
            
            events.Add(new TimelineEventModel
            {
                Type = TIMELINE_EVENT_TYPE.APPROVAL,
                Timestamp = approval.RequestedOn ?? DateTime.UtcNow,
                Description = requestDescription,
                UserId = approval.RequestedBy,
                UserName = await _baseService.GetEmployeeNameAsync(approval.RequestedBy),
                UserRole = approval.RequestedBy.HasValue
                    ? await _baseRepo.GetUserRoleAsync(approval.RequestedBy.Value)
                    : null,
                Metadata = new
                {
                    ApprovalType = approval.ApprovalType,
                    Status = approval.ApprovalStatus
                },
            });

            // Approval decision event (if approved/rejected)
            if (approval.ApprovedOn.HasValue)
            {
                string decisionDescription = GetApprovalDecisionDescription(
                    approval.ApprovalType, 
                    approval.ApprovalStatus
                );

                events.Add(new TimelineEventModel
                {
                    Type = TIMELINE_EVENT_TYPE.APPROVAL,
                    Timestamp = approval.ApprovedOn.Value,
                    Description = decisionDescription,
                    UserId = approval.ApprovedBy,
                    UserName = await _baseService.GetEmployeeNameAsync(approval.ApprovedBy),
                    UserRole = approval.ApprovedBy.HasValue
                        ? await _baseRepo.GetUserRoleAsync(approval.ApprovedBy.Value)
                        : null,
                    Metadata = new
                    {
                        ApprovalType = approval.ApprovalType,
                        Status = approval.ApprovalStatus,
                    },
                });
            }

            return events;
        }

        private async Task<TimelineEventModel> MapCommentToTimelineEventAsync(GoalComment comment)
        {
            // Use Mapster for base mapping
            var timelineEvent = _mapper.Map<TimelineEventModel>(comment);

            // Set user details
            timelineEvent.UserName = await _baseService.GetEmployeeNameAsync(comment.CommentedBy);
            
            if (comment.CommentedBy.HasValue)
            {
                timelineEvent.UserRole = await _baseRepo.GetUserRoleAsync(
                    comment.CommentedBy.Value
                );
            }

            // Set metadata
            timelineEvent.Metadata = new { Comment = comment.GoalComment1 };

            return timelineEvent;
        }

        private async Task<TimelineEventModel> MapAssignmentToTimelineEventAsync(
            GoalAssignment assignment
        )
        {
            // Use Mapster for base mapping
            var timelineEvent = _mapper.Map<TimelineEventModel>(assignment);

            // Set description with assignee name
            var assigneeName = await _baseService.GetEmployeeNameAsync(assignment.AssignedTo);
            timelineEvent.Description = $"Assigned to {assigneeName}";

            // Set user details (assigner)
            timelineEvent.UserName = await _baseService.GetEmployeeNameAsync(assignment.AssignedBy);
            
            if (assignment.AssignedBy.HasValue)
            {
                timelineEvent.UserRole = await _baseRepo.GetUserRoleAsync(
                    assignment.AssignedBy.Value
                );
            }

            return timelineEvent;
        }

        private async Task<TimelineEventModel> MapAttachmentToTimelineEventAsync(
            GoalAttachment attachment
        )
        {
            // Use Mapster for base mapping
            var timelineEvent = _mapper.Map<TimelineEventModel>(attachment);

            // Set user details
            timelineEvent.UserName = await _baseService.GetEmployeeNameAsync(attachment.AttachedBy);
            
            if (attachment.AttachedBy.HasValue)
            {
                timelineEvent.UserRole = await _baseRepo.GetUserRoleAsync(
                    attachment.AttachedBy.Value
                );
            }

            return timelineEvent;
        }

        private string GetApprovalRequestDescription(string? approvalType)
        {
            return approvalType switch
            {
                APPROVAL_TYPE.TASK_ACKNOWLEDGMENT => "Task acknowledgment requested",
                APPROVAL_TYPE.COMPLETION => "Completion approval requested",
                APPROVAL_TYPE.CREATION => "Creation approval requested",
                APPROVAL_TYPE.DELEGATION => "Delegation approval requested",
                APPROVAL_TYPE.SELF_GOAL_ACTIVATION => "Self goal activation requested",
                APPROVAL_TYPE.REOPENING => "Reopen approval requested",
                APPROVAL_TYPE.CLOSURE => "Goal Closure requested",
                APPROVAL_TYPE.REACTIVATION => "Goal Reactivation requested",
                _ => $"{approvalType} requested",
            };
        }

        private string GetApprovalDecisionDescription(string? approvalType, string? status)
        {
            return approvalType switch
            {
                APPROVAL_TYPE.TASK_ACKNOWLEDGMENT => $"Task acknowledgment {status}",
                APPROVAL_TYPE.COMPLETION => $"Completion {status}",
                APPROVAL_TYPE.CREATION => $"Creation {status}",
                APPROVAL_TYPE.DELEGATION => $"Delegation {status}",
                APPROVAL_TYPE.SELF_GOAL_ACTIVATION => $"Self goal activation {status}",
                APPROVAL_TYPE.REOPENING => $"Reopen request {status}",
                APPROVAL_TYPE.CLOSURE => $"Closure request {status}",
                APPROVAL_TYPE.REACTIVATION => $"Reactivation request {status}",
                _ => $"{approvalType} {status}",
            };
        }
    }
}
