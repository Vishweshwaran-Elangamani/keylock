using FluentValidation;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Exceptions;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repository.Interface;                   

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

        public GoalInteractionService(
            IGoalInteractionRepository repo,
            IBaseGoalRepository baseRepo,
            IGoalApprovalsRepository approvalsRepo,
            IGoalRepository goalRepository,
            IBaseGoalService baseService,
            IWebHostEnvironment environment,
            IValidator<CreateCommentModel> createCommentValidator
        )
        {
            _repo = repo;
            _baseRepo = baseRepo;
            _approvalsRepo = approvalsRepo;
            _goalRepo = goalRepository;
            _baseService = baseService;
            _environment = environment;
            _createCommentValidator = createCommentValidator;
        }

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

        public async Task<List<GoalCommentModel>> GetAllCommentsAsync(int goalId)
        {
            var comments = await _repo.GetCommentsByGoalAsync(goalId);
            var result = new List<GoalCommentModel>();

            foreach (var c in comments)
            {
                var commenterName = await _baseService.GetEmployeeNameAsync(c.CommentedBy);
                var commenterRole = c.CommentedBy.HasValue
                    ? await _baseRepo.GetUserRoleAsync(c.CommentedBy.Value)
                    : null;

                result.Add(
                    new GoalCommentModel
                    {
                        GoalCommentId = c.Goalcommentid,
                        GoalId = c.GoalId,
                        Comment = c.GoalComment1 ?? "",
                        CommentedByEmployeeMasterId = c.CommentedBy,
                        CommentedByName = commenterName,
                        CommentedByRole = commenterRole,
                        CommentedOn = c.CommentedOn,
                    }
                );
            }

            return result;
        }

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
            foreach (var g in ongoing)
            {
                var latestProgress = g
                    .Goalprogresslogs.OrderByDescending(p => p.UpdatedOn)
                    .FirstOrDefault();
                var isOverdue =
                    g.Goalendat.HasValue
                    && g.Goalendat.Value < DateTime.UtcNow
                    && g.Goalstatus != GOAL_STATUS.COMPLETED;

                string? projectName = null;
                if (g.ProjectId.HasValue)
                {
                    var project = await _baseRepo.GetProjectByIdAsync(g.ProjectId.Value);
                    projectName = project?.ProjectName;
                }

                var creatorName = await _baseService.GetEmployeeNameAsync(g.CreatedBy);

                result.Add(
                    new GoalSummaryModel
                    {
                        GoalId = g.GoalId,
                        Title = g.GoalTitle ?? "",
                        DescriptionShort = string.IsNullOrWhiteSpace(g.GoalDescription)
                            ? null
                            : (
                                g.GoalDescription!.Length > 80
                                    ? g.GoalDescription.Substring(0, 80) + "..."
                                    : g.GoalDescription
                            ),
                        GoalType = g.GoalType ?? GOAL_TYPE.SELF,
                        Status = g.Goalstatus ?? GOAL_STATUS.PENDING,
                        CreatedAt = g.Goalcreatedat,
                        EndAt = g.Goalendat,
                        ProgressPercent = latestProgress?.ProgressPercent ?? 0,
                        ProjectId = g.ProjectId,
                        ProjectName = projectName,
                        CreatedByEmployeeMasterId = g.CreatedBy,
                        CreatedByName = creatorName,
                        IsOverdue = isOverdue,
                    }
                );
            }

            return result;
        }

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

            events.Add(
                new TimelineEventModel
                {
                    Type = TIMELINE_EVENT_TYPE.GOAL_CREATED,
                    Timestamp = goal.Goalcreatedat ?? DateTime.UtcNow,
                    Description = "Goal created",
                    UserId = goal.CreatedBy,
                    UserName = await _baseService.GetEmployeeNameAsync(goal.CreatedBy),
                    UserRole = goal.CreatedBy.HasValue
                        ? await _baseRepo.GetUserRoleAsync(goal.CreatedBy.Value)
                        : null,
                }
            );

            var progressLogs = await _repo.GetProgressLogsByGoalAsync(goalId);
            foreach (var p in progressLogs)
            {
                events.Add(
                    new TimelineEventModel
                    {
                        Type = TIMELINE_EVENT_TYPE.PROGRESS,
                        Timestamp = p.UpdatedOn ?? DateTime.UtcNow,
                        Description = $"Progress updated to {p.ProgressPercent}%",
                        UserId = p.UpdatedBy,
                        UserName = await _baseService.GetEmployeeNameAsync(p.UpdatedBy),
                        UserRole = p.UpdatedBy.HasValue
                            ? await _baseRepo.GetUserRoleAsync(p.UpdatedBy.Value)
                            : null,
                        Metadata = new { ProgressPercent = p.ProgressPercent, Source = p.Source },
                    }
                );
            }

            foreach (var a in goal.GoalApprovals)
            {
                string requestDescription = a.ApprovalType switch
                {
                    APPROVAL_TYPE.TASK_ACKNOWLEDGMENT => "Task acknowledgment requested",
                    APPROVAL_TYPE.COMPLETION => "Completion approval requested",
                    APPROVAL_TYPE.CREATION => "Creation approval requested",
                    APPROVAL_TYPE.DELEGATION => "Delegation approval requested",
                    APPROVAL_TYPE.SELF_GOAL_ACTIVATION => "Self goal activation requested",
                    APPROVAL_TYPE.REOPENING => "Reopen approval requested",
                    APPROVAL_TYPE.CLOSURE => "Goal Closure requested",
                    APPROVAL_TYPE.REACTIVATION => "Goal Reactivation requested",
                    _ => $"{a.ApprovalType} requested",
                };

                events.Add(
                    new TimelineEventModel
                    {
                        Type = TIMELINE_EVENT_TYPE.APPROVAL,
                        Timestamp = a.RequestedOn ?? DateTime.UtcNow,
                        Description = requestDescription,
                        UserId = a.RequestedBy,
                        UserName = await _baseService.GetEmployeeNameAsync(a.RequestedBy),
                        UserRole = a.RequestedBy.HasValue
                            ? await _baseRepo.GetUserRoleAsync(a.RequestedBy.Value)
                            : null,
                        Metadata = new { ApprovalType = a.ApprovalType, Status = a.ApprovalStatus },
                    }
                );

                if (a.ApprovedOn.HasValue)
                {
                    string decisionDescription = a.ApprovalType switch
                    {
                        APPROVAL_TYPE.TASK_ACKNOWLEDGMENT =>
                            $"Task acknowledgment {a.ApprovalStatus}",
                        APPROVAL_TYPE.COMPLETION => $"Completion {a.ApprovalStatus}",
                        APPROVAL_TYPE.CREATION => $"Creation {a.ApprovalStatus}",
                        APPROVAL_TYPE.DELEGATION => $"Delegation {a.ApprovalStatus}",
                        APPROVAL_TYPE.SELF_GOAL_ACTIVATION =>
                            $"Self goal activation {a.ApprovalStatus}",
                        APPROVAL_TYPE.REOPENING => $"Reopen request {a.ApprovalStatus}",
                        APPROVAL_TYPE.CLOSURE => $"Closure request {a.ApprovalStatus}",
                        APPROVAL_TYPE.REACTIVATION => $"Reactivation request {a.ApprovalStatus}",
                        _ => $"{a.ApprovalType} {a.ApprovalStatus}",
                    };

                    events.Add(
                        new TimelineEventModel
                        {
                            Type = TIMELINE_EVENT_TYPE.APPROVAL,
                            Timestamp = a.ApprovedOn.Value,
                            Description = decisionDescription,
                            UserId = a.ApprovedBy,
                            UserName = await _baseService.GetEmployeeNameAsync(a.ApprovedBy),
                            UserRole = a.ApprovedBy.HasValue
                                ? await _baseRepo.GetUserRoleAsync(a.ApprovedBy.Value)
                                : null,
                            Metadata = new
                            {
                                ApprovalType = a.ApprovalType,
                                Status = a.ApprovalStatus,
                            },
                        }
                    );
                }
            }

            foreach (var c in goal.GoalComments)
            {
                events.Add(
                    new TimelineEventModel
                    {
                        Type = TIMELINE_EVENT_TYPE.COMMENT,
                        Timestamp = c.CommentedOn ?? DateTime.UtcNow,
                        Description = "Comment added",
                        UserId = c.CommentedBy,
                        UserName = await _baseService.GetEmployeeNameAsync(c.CommentedBy),
                        UserRole = c.CommentedBy.HasValue
                            ? await _baseRepo.GetUserRoleAsync(c.CommentedBy.Value)
                            : null,
                        Metadata = new { Comment = c.GoalComment1 },
                    }
                );
            }

            foreach (var a in goal.GoalAssignments)
            {
                events.Add(
                    new TimelineEventModel
                    {
                        Type = TIMELINE_EVENT_TYPE.ASSIGNMENT,
                        Timestamp = a.AssignedOn ?? DateTime.UtcNow,
                        Description =
                            $"Assigned to {await _baseService.GetEmployeeNameAsync(a.AssignedTo)}",
                        UserId = a.AssignedBy,
                        UserName = await _baseService.GetEmployeeNameAsync(a.AssignedBy),
                        UserRole = a.AssignedBy.HasValue
                            ? await _baseRepo.GetUserRoleAsync(a.AssignedBy.Value)
                            : null,
                    }
                );
            }

            foreach (var att in goal.GoalAttachments)
            {
                events.Add(
                    new TimelineEventModel
                    {
                        Type = TIMELINE_EVENT_TYPE.ATTACHMENT,
                        Timestamp = att.AttachedOn ?? DateTime.UtcNow,
                        Description = $"Attachment added: {att.AttachmentTitle}",
                        UserId = att.AttachedBy,
                        UserName = await _baseService.GetEmployeeNameAsync(att.AttachedBy),
                        UserRole = att.AttachedBy.HasValue
                            ? await _baseRepo.GetUserRoleAsync(att.AttachedBy.Value)
                            : null,
                    }
                );
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
    }
}
