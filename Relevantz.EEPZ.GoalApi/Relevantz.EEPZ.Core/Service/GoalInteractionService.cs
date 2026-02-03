using FluentValidation;
using Mapster;
using MapsterMapper;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Exceptions;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repository.Interface;
using Serilog;

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
        private readonly IMapper _mapper;

        public GoalInteractionService(
            IGoalInteractionRepository repo,
            IBaseGoalRepository baseRepo,
            IGoalApprovalsRepository approvalsRepo,
            IGoalRepository goalRepository,
            IBaseGoalService baseService,
            IWebHostEnvironment environment,
            IValidator<CreateCommentModel> createCommentValidator,
            IMapper mapper
        )
        {
            _repo = repo;
            _baseRepo = baseRepo;
            _approvalsRepo = approvalsRepo;
            _goalRepo = goalRepository;
            _baseService = baseService;
            _environment = environment;
            _createCommentValidator = createCommentValidator;
            _mapper = mapper;

            Log.Debug("GoalInteractionService initialized.");
        }

        public async Task<ApiResponseModel> AddComment(
            int goalId,
            CreateCommentModel commentDetails,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            Log.Information(
                "AddComment START | GoalId={GoalId} | UserId={UserId} | Role={Role} | CommentLength={Len}",
                goalId,
                currentUserEmployeeMasterId,
                currentUserRole,
                commentDetails?.Comment?.Length ?? 0
            );

            var validationResult = await _createCommentValidator.ValidateAsync(commentDetails);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                Log.Warning(
                    "AddComment VALIDATION_FAILED | GoalId={GoalId} | Errors={Errors}",
                    goalId,
                    string.Join("; ", errors)
                );
                throw new BadRequestException("VALIDATION_FAILED", string.Join("; ", errors));
            }

            var goal = await _baseRepo.GetGoalById(goalId);
            if (goal == null)
            {
                Log.Warning("AddComment FAILED | Goal not found | GoalId={GoalId}", goalId);
                throw new GoalNotFoundException(goalId);
            }

            var canComment = await _baseService.CanUserCommentOnGoal(
                goalId,
                currentUserEmployeeMasterId,
                currentUserRole
            );
            if (!canComment)
            {
                Log.Warning(
                    "AddComment ACCESS DENIED | GoalId={GoalId} | UserId={UserId} | Role={Role}",
                    goalId,
                    currentUserEmployeeMasterId,
                    currentUserRole
                );
                throw new AccessDeniedException(
                    ResponseMessages.Codes.COMMENT_ACCESS_DENIED,
                    "You do not have permission to comment on this goal"
                );
            }

            var isCommentable = await _baseService.IsGoalCommentable(goalId);
            if (!isCommentable)
            {
                Log.Warning(
                    "AddComment BLOCKED | Goal not commentable (completed/closed) | GoalId={GoalId}",
                    goalId
                );
                throw new BusinessRuleException(
                    ResponseMessages.Codes.GOAL_COMMENT_BLOCKED,
                    "Cannot comment on completed or closed goals"
                );
            }

            var comment = new GoalComment
            {
                GoalId = goalId,
                GoalComment1 = commentDetails.Comment,
                CommentedBy = currentUserEmployeeMasterId,
                CommentedOn = DateTime.UtcNow,
            };
            await _repo.AddComment(comment);
            await _baseRepo.SaveChanges();

            var metadata = new
            {
                GoalId = goalId,
                CommentId = comment.Goalcommentid,
                CommentedBy = currentUserEmployeeMasterId,
            };

            Log.Information(
                "AddComment END | GoalId={GoalId} | CommentId={CommentId} | UserId={UserId}",
                goalId,
                comment.Goalcommentid,
                currentUserEmployeeMasterId
            );

            return ApiResponseModel.SuccessResponse(
                ResponseMessages.Codes.COMMENT_ADDED_SUCCESS,
                metadata
            );
        }

        public async Task<List<GoalCommentModel>> GetAllComments(int goalId)
        {
            Log.Information("GetAllComments START | GoalId={GoalId}", goalId);

            var comments = await _repo.GetCommentsByGoal(goalId);
            var result = new List<GoalCommentModel>();

            foreach (var comment in comments)
            {
                var commentModel = _mapper.Map<GoalCommentModel>(comment);
                commentModel.CommentedByName = await _baseService.GetEmployeeName(
                    comment.CommentedBy
                );

                if (comment.CommentedBy.HasValue)
                {
                    commentModel.CommentedByRole = await _baseRepo.GetUserRole(
                        comment.CommentedBy.Value
                    );
                }

                result.Add(commentModel);
            }

            Log.Information(
                "GetAllComments END | GoalId={GoalId} | Count={Count}",
                goalId,
                result.Count
            );

            return result;
        }

        public async Task<GoalDashboardSummaryModel> GetDashboardDetails(
            int currentUserEmployeeMasterId
        )
        {
            Log.Information(
                "GetDashboardDetails START | UserId={UserId}",
                currentUserEmployeeMasterId
            );

            var userRole = await _baseRepo.GetUserRole(currentUserEmployeeMasterId);

            var allGoals = await _goalRepo.QueryGoals(
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

            var pendingApprovals = await _approvalsRepo.CountPendingApprovalsForUser(
                currentUserEmployeeMasterId
            );

            var summary = new GoalDashboardSummaryModel
            {
                Completed = completed.Count,
                Ongoing = ongoing.Count,
                Pending = pending.Count,
                Overdue = overdue.Count,
                PendingApprovals = pendingApprovals,
            };

            Log.Information(
                "GetDashboardDetails END | UserId={UserId} | Completed={Completed} | Ongoing={Ongoing} | Pending={Pending} | Overdue={Overdue} | PendingApprovals={PendingApprovals}",
                currentUserEmployeeMasterId,
                summary.Completed,
                summary.Ongoing,
                summary.Pending,
                summary.Overdue,
                summary.PendingApprovals
            );

            return summary;
        }

        public async Task<List<GoalSummaryModel>> GetOngoing(
            string type,
            int currentUserEmployeeMasterId
        )
        {
            Log.Information(
                "GetOngoing START | Type={Type} | UserId={UserId}",
                type,
                currentUserEmployeeMasterId
            );

            var goals = await _goalRepo.QueryGoals(
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
                var summary = _mapper.Map<GoalSummaryModel>(goal);

                summary.DescriptionShort = GetShortDescription(goal.GoalDescription);
                var latestProgress = goal
                    .Goalprogresslogs.OrderByDescending(p => p.UpdatedOn)
                    .FirstOrDefault();
                summary.ProgressPercent = latestProgress?.ProgressPercent ?? 0;
                summary.ProjectName = await GetProjectName(goal.ProjectId);
                summary.CreatedByName = await _baseService.GetEmployeeName(goal.CreatedBy);
                summary.IsOverdue =
                    goal.Goalendat.HasValue
                    && goal.Goalendat.Value < DateTime.UtcNow
                    && goal.Goalstatus != GOAL_STATUS.COMPLETED;

                result.Add(summary);
            }

            Log.Information(
                "GetOngoing END | Type={Type} | UserId={UserId} | Count={Count}",
                type,
                currentUserEmployeeMasterId,
                result.Count
            );

            return result;
        }

        public async Task<List<TimelineEventModel>> GetGoalTimeline(
            int goalId,
            int currentUserEmployeeMasterId
        )
        {
            Log.Information(
                "GetGoalTimeline START | GoalId={GoalId} | UserId={UserId}",
                goalId,
                currentUserEmployeeMasterId
            );

            var goal = await _baseRepo.GetGoalById(goalId);
            if (goal == null)
            {
                Log.Warning("GetGoalTimeline FAILED | Goal not found | GoalId={GoalId}", goalId);
                throw new GoalNotFoundException(goalId);
            }

            var canView = await _baseService.CanViewGoal(goalId, currentUserEmployeeMasterId);
            if (!canView)
            {
                Log.Warning(
                    "GetGoalTimeline ACCESS DENIED | GoalId={GoalId} | UserId={UserId}",
                    goalId,
                    currentUserEmployeeMasterId
                );
                throw new GoalAccessDeniedException();
            }

            var events = new List<TimelineEventModel>();

            // Goal created
            events.Add(await CreateGoalCreatedEvent(goal));

            // Progress logs
            var progressLogs = await _repo.GetProgressLogsByGoal(goalId);
            foreach (var progressLog in progressLogs)
            {
                events.Add(await MapProgressLogToTimelineEvent(progressLog));
            }

            // Approvals
            foreach (var approval in goal.GoalApprovals)
            {
                events.AddRange(await MapApprovalToTimelineEvents(approval));
            }

            // Comments
            foreach (var comment in goal.GoalComments)
            {
                events.Add(await MapCommentToTimelineEvent(comment));
            }

            // Assignments
            foreach (var assignment in goal.GoalAssignments)
            {
                events.Add(await MapAssignmentToTimelineEvent(assignment));
            }

            // Attachments
            foreach (var attachment in goal.GoalAttachments)
            {
                events.Add(await MapAttachmentToTimelineEvent(attachment));
            }

            var ordered = events.OrderByDescending(e => e.Timestamp).ToList();

            Log.Information(
                "GetGoalTimeline END | GoalId={GoalId} | EventsCount={Count}",
                goalId,
                ordered.Count
            );

            return ordered;
        }

        public async Task<List<ProjectEmployeeModel>> FetchProjectTeam(
            int projectId,
            int managerEmployeeMasterId
        )
        {
            Log.Information(
                "FetchProjectTeam START | ProjectId={ProjectId} | ManagerId={ManagerId}",
                projectId,
                managerEmployeeMasterId
            );

            var team = await _repo.FetchProjectTeam(projectId, managerEmployeeMasterId);

            Log.Information(
                "FetchProjectTeam END | ProjectId={ProjectId} | ManagerId={ManagerId} | Count={Count}",
                projectId,
                managerEmployeeMasterId,
                team?.Count ?? 0
            );

            return team;
        }

        // HELPER METHODS

        private string? GetShortDescription(string? description)
        {
            var result = (string.IsNullOrWhiteSpace(description))
                ? null
                : (description.Length > 80 ? description.Substring(0, 80) + "..." : description);

            Log.Debug(
                "GetShortDescription | InLen={InLen} | OutLen={OutLen}",
                description?.Length ?? 0,
                result?.Length ?? 0
            );

            return result;
        }

        private async Task<string?> GetProjectName(int? projectId)
        {
            Log.Debug("GetProjectName START | ProjectId={ProjectId}", projectId);

            if (!projectId.HasValue)
            {
                Log.Debug("GetProjectName | Null ProjectId -> null");
                return null;
            }

            var project = await _baseRepo.GetProjectById(projectId.Value);
            var name = project?.ProjectName;

            Log.Debug("GetProjectName END | ProjectId={ProjectId} | Name={Name}", projectId, name);
            return name;
        }

        private async Task<TimelineEventModel> CreateGoalCreatedEvent(Goal goal)
        {
            Log.Debug(
                "CreateGoalCreatedEvent | GoalId={GoalId} | CreatedBy={CreatedBy}",
                goal?.GoalId,
                goal?.CreatedBy
            );

            return new TimelineEventModel
            {
                Type = TIMELINE_EVENT_TYPE.GOAL_CREATED,
                Timestamp = goal.Goalcreatedat ?? DateTime.UtcNow,
                Description = "Goal created",
                UserId = goal.CreatedBy,
                UserName = await _baseService.GetEmployeeName(goal.CreatedBy),
                UserRole = goal.CreatedBy.HasValue
                    ? await _baseRepo.GetUserRole(goal.CreatedBy.Value)
                    : null,
            };
        }

        private async Task<TimelineEventModel> MapProgressLogToTimelineEvent(
            Goalprogresslog progressLog
        )
        {
            Log.Debug(
                "MapProgressLogToTimelineEvent START | GoalId={GoalId} | UpdatedBy={UpdatedBy} | Percent={Percent}",
                progressLog?.GoalId,
                progressLog?.UpdatedBy,
                progressLog?.ProgressPercent
            );

            var timelineEvent = _mapper.Map<TimelineEventModel>(progressLog);

            timelineEvent.UserName = await _baseService.GetEmployeeName(progressLog.UpdatedBy);

            if (progressLog.UpdatedBy.HasValue)
            {
                timelineEvent.UserRole = await _baseRepo.GetUserRole(
                    progressLog.UpdatedBy.Value
                );
            }

            timelineEvent.Metadata = new
            {
                ProgressPercent = progressLog.ProgressPercent,
                Source = progressLog.Source,
            };

            Log.Debug("MapProgressLogToTimelineEvent END | GoalId={GoalId}", progressLog?.GoalId);

            return timelineEvent;
        }

        private async Task<List<TimelineEventModel>> MapApprovalToTimelineEvents(
            GoalApproval approval
        )
        {
            Log.Debug(
                "MapApprovalToTimelineEvents START | ApprovalId={ApprovalId} | Type={Type} | Status={Status}",
                approval?.ApprovalId,
                approval?.ApprovalType,
                approval?.ApprovalStatus
            );

            var events = new List<TimelineEventModel>();

            string requestDescription = GetApprovalRequestDescription(approval.ApprovalType);

            events.Add(
                new TimelineEventModel
                {
                    Type = TIMELINE_EVENT_TYPE.APPROVAL,
                    Timestamp = approval.RequestedOn ?? DateTime.UtcNow,
                    Description = requestDescription,
                    UserId = approval.RequestedBy,
                    UserName = await _baseService.GetEmployeeName(approval.RequestedBy),
                    UserRole = approval.RequestedBy.HasValue
                        ? await _baseRepo.GetUserRole(approval.RequestedBy.Value)
                        : null,
                    Metadata = new
                    {
                        ApprovalType = approval.ApprovalType,
                        Status = approval.ApprovalStatus,
                    },
                }
            );

            if (approval.ApprovedOn.HasValue)
            {
                string decisionDescription = GetApprovalDecisionDescription(
                    approval.ApprovalType,
                    approval.ApprovalStatus
                );

                events.Add(
                    new TimelineEventModel
                    {
                        Type = TIMELINE_EVENT_TYPE.APPROVAL,
                        Timestamp = approval.ApprovedOn.Value,
                        Description = decisionDescription,
                        UserId = approval.ApprovedBy,
                        UserName = await _baseService.GetEmployeeName(approval.ApprovedBy),
                        UserRole = approval.ApprovedBy.HasValue
                            ? await _baseRepo.GetUserRole(approval.ApprovedBy.Value)
                            : null,
                        Metadata = new
                        {
                            ApprovalType = approval.ApprovalType,
                            Status = approval.ApprovalStatus,
                        },
                    }
                );
            }

            Log.Debug(
                "MapApprovalToTimelineEvents END | ApprovalId={ApprovalId} | EventsCount={Count}",
                approval?.ApprovalId,
                events.Count
            );

            return events;
        }

        private async Task<TimelineEventModel> MapCommentToTimelineEvent(GoalComment comment)
        {
            Log.Debug(
                "MapCommentToTimelineEvent START | CommentId={CommentId} | GoalId={GoalId}",
                comment?.Goalcommentid,
                comment?.GoalId
            );

            var timelineEvent = _mapper.Map<TimelineEventModel>(comment);

            timelineEvent.UserName = await _baseService.GetEmployeeName(comment.CommentedBy);

            if (comment.CommentedBy.HasValue)
            {
                timelineEvent.UserRole = await _baseRepo.GetUserRole(
                    comment.CommentedBy.Value
                );
            }

            timelineEvent.Metadata = new { Comment = comment.GoalComment1 };

            Log.Debug(
                "MapCommentToTimelineEvent END | CommentId={CommentId}",
                comment?.Goalcommentid
            );

            return timelineEvent;
        }

        private async Task<TimelineEventModel> MapAssignmentToTimelineEvent(
            GoalAssignment assignment
        )
        {
            Log.Debug(
                "MapAssignmentToTimelineEvent START | AssignmentId={AssignmentId} | GoalId={GoalId}",
                assignment?.AssignmentId,
                assignment?.GoalId
            );

            var timelineEvent = _mapper.Map<TimelineEventModel>(assignment);

            var assigneeName = await _baseService.GetEmployeeName(assignment.AssignedTo);
            timelineEvent.Description = $"Assigned to {assigneeName}";

            timelineEvent.UserName = await _baseService.GetEmployeeName(assignment.AssignedBy);

            if (assignment.AssignedBy.HasValue)
            {
                timelineEvent.UserRole = await _baseRepo.GetUserRole(
                    assignment.AssignedBy.Value
                );
            }

            Log.Debug(
                "MapAssignmentToTimelineEvent END | AssignmentId={AssignmentId}",
                assignment?.AssignmentId
            );

            return timelineEvent;
        }

        private async Task<TimelineEventModel> MapAttachmentToTimelineEvent(
            GoalAttachment attachment
        )
        {
            Log.Debug(
                "MapAttachmentToTimelineEvent START | AttachmentId={AttachmentId} | GoalId={GoalId}",
                attachment?.Goalattachmentsid,
                attachment?.GoalId
            );

            var timelineEvent = _mapper.Map<TimelineEventModel>(attachment);
            timelineEvent.UserName = await _baseService.GetEmployeeName(attachment.AttachedBy);

            if (attachment.AttachedBy.HasValue)
            {
                timelineEvent.UserRole = await _baseRepo.GetUserRole(
                    attachment.AttachedBy.Value
                );
            }

            Log.Debug(
                "MapAttachmentToTimelineEvent END | AttachmentId={AttachmentId}",
                attachment?.Goalattachmentsid
            );

            return timelineEvent;
        }

        private string GetApprovalRequestDescription(string? approvalType)
        {
            var desc = approvalType switch
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

            Log.Debug("GetApprovalRequestDescription | Type={Type} | Desc={Desc}", approvalType, desc);
            return desc;
        }

        private string GetApprovalDecisionDescription(string? approvalType, string? status)
        {
            var desc = approvalType switch
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

            Log.Debug(
                "GetApprovalDecisionDescription | Type={Type} | Status={Status} | Desc={Desc}",
                approvalType,
                status,
                desc
            );
            return desc;
        }
    }
}