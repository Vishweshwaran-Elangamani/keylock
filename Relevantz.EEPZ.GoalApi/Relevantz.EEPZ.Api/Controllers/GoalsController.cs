using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Enums;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interface;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GoalsController : ControllerBase
    {
        private readonly IGoalModuleService _service;
        private readonly ILogger<GoalsController> _logger;

        public GoalsController(IGoalModuleService service, ILogger<GoalsController> logger)
        {
            _service = service;
            _logger = logger;
        }

        private string GetUserRole()
        {
            return User.FindFirst("role")?.Value
                ?? User.FindFirst(ClaimTypes.Role)?.Value
                ?? throw new UnauthorizedAccessException("Role claim not found");
        }

        private int GetEmpMasterId()
        {
            var claim = User.FindFirst(CLAIM_TYPES.EMPLOYEE_MASTER_ID)?.Value;
            if (string.IsNullOrEmpty(claim))
                throw new UnauthorizedAccessException("Employee Master ID not found");
            return int.Parse(claim);
        }

        // ==================== GOALS ====================

        /// <summary>
        /// Create a new goal (self, team, or org based on role)
        /// </summary>
        [HttpPost]
        [Authorize(
            Roles = $"{USER_ROLE.EMPLOYEE},{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD},{USER_ROLE.LEADERSHIP}"
        )]
        public async Task<IActionResult> Create([FromBody] CreateGoalDto dto)
        {
            var userId = 0;

            try
            {
                userId = GetEmpMasterId();

                var role = GetUserRole();

                var result = await _service.CreateGoalAsync(dto, userId, role);

                _logger.LogInformation(
                    "User {UserId} ({Role}) creating goal: {GoalTitle}",
                    userId,
                    role,
                    dto.Title
                );

                if (result.Success)
                {
                    _logger.LogInformation(
                        "Goal created successfully. GoalId: {GoalId}, CreatedBy: {UserId}",
                        result.Data,
                        userId
                    );
                    return CreatedAtAction(nameof(GetGoalDetailsById), new { id = result.Data }, result);
                }

                _logger.LogWarning(
                    "Goal creation failed for User {UserId}. Reason: {Message}",
                    userId,
                    result.Message
                );

                return BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating goal for User {UserId}", userId);
                var response = ApiResponseDto<int>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Get goal details by ID
        /// </summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetGoalDetailsById(int id)
        {
            var userId = 0;
            try
            {
                userId = GetEmpMasterId();

                var role = GetUserRole();

                _logger.LogInformation("User {UserId} requesting goal {GoalId}", userId, id);

                var goal = await _service.GetGoalAsync(id, userId, role);

                var response = ApiResponseDto<GoalDetailDto>.SuccessResponse(
                    ResponseMessages.Codes.GOAL_RETRIEVED_SUCCESS,
                    goal,
                    new { GoalId = id, RequestedBy = userId }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                _logger.LogWarning(
                    "Goal {GoalId} not found (requested by User {UserId})",
                    id,
                    userId
                );
                var response = ApiResponseDto<GoalDetailDto>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_NOT_FOUND
                );
                return NotFound(response);
            }
            catch (UnauthorizedAccessException)
            {
                _logger.LogWarning("User {UserId} denied access to Goal {GoalId}", userId, id);
                var response = ApiResponseDto<GoalDetailDto>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_ACCESS_DENIED
                );
                return Forbid(response.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error retrieving goal {GoalId} for User {UserId}",
                    id,
                    userId
                );
                var response = ApiResponseDto<GoalDetailDto>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        [HttpGet("query")]
        public async Task<IActionResult> QueryGoals([FromQuery] GoalQueryDto query)
        {
            try
            {
                var userId = GetEmpMasterId();
                var role = GetUserRole();

                _logger.LogInformation(
                    "[GoalsController.Query] Querying - Type: {Type}, Role: {Role}, UserID: {ID}",
                    query.Type,
                    role ?? "NULL",
                    userId
                );

                // MUST PASS ROLE HERE TO SERVICE
                var goals = await _service.QueryGoalsAsync(query, userId, role);

                var response = ApiResponseDto<List<GoalSummaryDto>>.SuccessResponse(
                    ResponseMessages.Codes.GOAL_RETRIEVED_SUCCESS,
                    goals,
                    new
                    {
                        Page = query.Page,
                        PageSize = query.PageSize,
                        ResultCount = goals.Count,
                        UserRole = role,
                    }
                );

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GoalsController.Query] Error");
                return StatusCode(
                    500,
                    ApiResponseDto<List<GoalSummaryDto>>.ErrorResponse(
                        ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                    )
                );
            }
        }

        /// <summary>
        /// Update goal (title, description, deadline)
        /// </summary>
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateGoal(int id, [FromBody] UpdateGoalDto dto)
        {
            var userId = 0;
            try
            {
                userId = GetEmpMasterId();
                var role = GetUserRole();

                _logger.LogInformation("User {UserId} updating goal {GoalId}", userId, id);

                var result = await _service.UpdateGoalAsync(id, dto, userId, role);

                if (result.Success)
                {
                    _logger.LogInformation(
                        "Goal {GoalId} updated successfully by User {UserId}",
                        id,
                        userId
                    );
                    return Ok(result);
                }

                _logger.LogWarning("Goal {GoalId} update failed. Code: {Code}", id, result.Code);

                return result.Code switch
                {
                    ResponseMessages.Codes.GOAL_NOT_FOUND => NotFound(result),
                    ResponseMessages.Codes.GOAL_ACCESS_DENIED => Forbid(result.Message),
                    _ => BadRequest(result),
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating goal {GoalId} by User {UserId}", id, userId);
                var response = ApiResponseDto.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Get list of assignees for a goal
        /// </summary>
        [HttpGet("{id:int}/assignees")]
        public async Task<IActionResult> GetAssignees(int id)
        {
            try
            {
                var assignees = await _service.GetAssigneesAsync(id);

                var response = ApiResponseDto<List<AssigneeDto>>.SuccessResponse(
                    ResponseMessages.Codes.ASSIGNMENT_RETRIEVED_SUCCESS,
                    assignees,
                    new { GoalId = id, AssigneeCount = assignees.Count }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseDto<List<AssigneeDto>>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_NOT_FOUND
                );
                return NotFound(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<List<AssigneeDto>>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        // ==================== ASSIGNMENTS ====================

        /// <summary>
        /// Assign a team goal to subordinates (managers/Department Heads only)
        /// </summary>
        [HttpPost("{id:int}/assign")]
        [Authorize(Roles = $"{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD}")]
        public async Task<IActionResult> Assign(int id, [FromBody] AssignGoalDto dto)
        {
            try
            {
                var userId = GetEmpMasterId();
                var role = GetUserRole();

                var result = await _service.AssignAsync(id, dto, userId, role);

                if (result.Success)
                {
                    return Ok(result);
                }

                return result.Code switch
                {
                    ResponseMessages.Codes.GOAL_NOT_FOUND => NotFound(result),
                    ResponseMessages.Codes.ASSIGNMENT_ACCESS_DENIED => Forbid(result.Message),
                    ResponseMessages.Codes.ASSIGNMENT_INVALID_SUBORDINATE => BadRequest(result),
                    ResponseMessages.Codes.ASSIGNMENT_DUPLICATE => Conflict(result),
                    _ => BadRequest(result),
                };
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        // ==================== APPROVALS ====================

        /// <summary>
        /// Request approval (creation, completion, reopening, delegation)
        /// </summary>
        [HttpPost("{id:int}/approvals")]
        public async Task<IActionResult> RequestApproval(
            int id,
            [FromBody] CreateApprovalRequestDto dto
        )
        {
            try
            {
                var userId = GetEmpMasterId();
                var role = GetUserRole();

                var result = await _service.RequestApprovalAsync(id, dto, userId, role);

                if (result.Success)
                {
                    return Ok(result);
                }

                return result.Code switch
                {
                    ResponseMessages.Codes.GOAL_NOT_FOUND => NotFound(result),
                    ResponseMessages.Codes.GOAL_ACCESS_DENIED => Forbid(result.Message),
                    ResponseMessages.Codes.GOAL_INVALID_STATUS => BadRequest(result),
                    ResponseMessages.Codes.APPROVAL_PROOF_REQUIRED => BadRequest(result),
                    ResponseMessages.Codes.APPROVAL_PROOF_INVALID => BadRequest(result),
                    ResponseMessages.Codes.APPROVAL_NO_MANAGER => BadRequest(result),
                    ResponseMessages.Codes.INVALID_REQUEST => BadRequest(result),
                    _ => BadRequest(result),
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error requesting approval for goal {GoalId} by User {UserId}",
                    id,
                    GetEmpMasterId()
                );
                var response = ApiResponseDto<int>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Approve or reject an approval request
        /// </summary>
        [HttpPut("approvals/{approvalId:int}")]
        [Authorize(
            Roles = $"{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD},{USER_ROLE.LEADERSHIP}"
        )]
        public async Task<IActionResult> DecideApproval(
            int approvalId,
            [FromBody] DecideApprovalDto dto
        )
        {
            try
            {
                var userId = GetEmpMasterId();
                var role = GetUserRole();

                var result = await _service.DecideApprovalAsync(approvalId, dto, userId, role);

                if (result.Success)
                {
                    return Ok(result);
                }

                return result.Code switch
                {
                    ResponseMessages.Codes.APPROVAL_NOT_FOUND => NotFound(result),
                    ResponseMessages.Codes.APPROVAL_ACCESS_DENIED => Forbid(result.Message),
                    ResponseMessages.Codes.APPROVAL_ALREADY_DECIDED => Conflict(result),
                    _ => BadRequest(result),
                };
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Get pending approvals for current user (manager/Department Head/Leadership)
        /// </summary>
        [HttpGet("approvals/pending")]
        [Authorize(
            Roles = $"{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD},{USER_ROLE.LEADERSHIP}"
        )]
        public async Task<IActionResult> PendingApprovals()
        {
            try
            {
                var userId = GetEmpMasterId();

                var approvals = await _service.GetPendingApprovalsAsync(userId);

                var response = ApiResponseDto<List<GoalApprovalDto>>.SuccessResponse(
                    ResponseMessages.Codes.APPROVAL_RETRIEVED_SUCCESS,
                    approvals,
                    new { PendingCount = approvals.Count, ApproverId = userId }
                );

                return Ok(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<List<GoalApprovalDto>>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Get all approvals that the current user is involved in (requested, approving, or goal participant)
        /// </summary>
        [HttpGet("approvals/my")]
        public async Task<IActionResult> GetMyApprovals([FromQuery] ApprovalQueryDto query)
        {
            try
            {
                var userId = GetEmpMasterId();
                var role = GetUserRole();

                var approvals = await _service.GetUserApprovalsAsync(query, userId, role);

                var response = ApiResponseDto<PagedApprovalsDto>.SuccessResponse(
                    ResponseMessages.Codes.APPROVAL_RETRIEVED_SUCCESS,
                    approvals,
                    new { UserId = userId, Role = role }
                );

                return Ok(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<PagedApprovalsDto>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        // ==================== CHECKLIST & PROGRESS ====================

        /// <summary>
        /// Toggle checklist item completion status
        /// </summary>
        [HttpPut("{id:int}/checklist/toggle")]
        public async Task<IActionResult> ToggleChecklist(int id, [FromBody] ToggleChecklistDto dto)
        {
            try
            {
                var userId = GetEmpMasterId();

                var result = await _service.ToggleChecklistAsync(id, dto, userId);

                if (result.Success)
                {
                    return Ok(result);
                }

                return result.Code switch
                {
                    ResponseMessages.Codes.GOAL_NOT_FOUND => NotFound(result),
                    ResponseMessages.Codes.CHECKLIST_NOT_FOUND => NotFound(result),
                    _ => BadRequest(result),
                };
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Manually update progress (managers/Department Heads/leaders only)
        /// </summary>
        [HttpPut("{id:int}/progress/manual")]
        [Authorize(
            Roles = $"{USER_ROLE.EMPLOYEE},{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD},{USER_ROLE.LEADERSHIP}"
        )]
        public async Task<IActionResult> ManualProgress(
            int id,
            [FromBody] ManualProgressUpdateDto dto
        )
        {
            try
            {
                var userId = GetEmpMasterId();

                var result = await _service.ManualUpdateProgressAsync(id, dto, userId);

                if (result.Success)
                {
                    return Ok(result);
                }

                return result.Code switch
                {
                    ResponseMessages.Codes.GOAL_NOT_FOUND => NotFound(result),
                    ResponseMessages.Codes.PROGRESS_UPDATE_DENIED => Forbid(result.Message),
                    _ => BadRequest(result),
                };
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Get current progress percentage for a goal
        /// </summary>
        [HttpGet("{id:int}/progress")]
        public async Task<IActionResult> GetProgress(int id)
        {
            try
            {
                var userId = GetEmpMasterId();

                var percent = await _service.GetGoalProgressPercentAsync(id, userId);

                var response = ApiResponseDto<object>.SuccessResponse(
                    ResponseMessages.Codes.PROGRESS_CALCULATED_SUCCESS,
                    new { progress = percent },
                    new { GoalId = id, UserId = userId }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseDto<object>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_NOT_FOUND
                );
                return NotFound(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<object>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Get team goal progress for manager (aggregated from subordinates)
        /// </summary>
        [HttpGet("{id:int}/progress/team")]
        [Authorize(
            Roles = $"{USER_ROLE.EMPLOYEE},{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD},{USER_ROLE.LEADERSHIP}"
        )]
        public async Task<IActionResult> GetTeamProgress(int id)
        {
            try
            {
                var userId = GetEmpMasterId();

                var percent = await _service.GetTeamGoalProgressForManagerAsync(id, userId);

                var response = ApiResponseDto<object>.SuccessResponse(
                    ResponseMessages.Codes.PROGRESS_CALCULATED_SUCCESS,
                    new { teamProgress = percent },
                    new { GoalId = id, ManagerId = userId }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseDto<object>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_NOT_FOUND
                );
                return NotFound(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<object>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        // ==================== CASCADING PROGRESS ====================

        /// <summary>
        /// Get cascading progress for a user (includes subordinate progress)
        /// </summary>
        [HttpGet("{id:int}/progress/cascading")]
        public async Task<IActionResult> GetCascadingProgress(int id)
        {
            try
            {
                var userId = GetEmpMasterId();

                var progress = await _service.GetCascadingProgressAsync(id, userId);

                var response = ApiResponseDto<object>.SuccessResponse(
                    ResponseMessages.Codes.PROGRESS_CALCULATED_SUCCESS,
                    new { cascadingProgress = progress },
                    new { GoalId = id, UserId = userId }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseDto<object>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_NOT_FOUND
                );
                return NotFound(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<object>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Get detailed hierarchical progress breakdown
        /// </summary>
        [HttpGet("{id:int}/progress/hierarchy")]
        public async Task<IActionResult> GetProgressHierarchy(int id)
        {
            try
            {
                var userId = GetEmpMasterId();

                var hierarchy = await _service.GetProgressHierarchyAsync(id, userId);

                var response = ApiResponseDto<GoalProgressHierarchyDto>.SuccessResponse(
                    ResponseMessages.Codes.PROGRESS_CALCULATED_SUCCESS,
                    hierarchy,
                    new { GoalId = id, UserId = userId }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseDto<GoalProgressHierarchyDto>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_NOT_FOUND
                );
                return NotFound(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<GoalProgressHierarchyDto>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        // ==================== PROJECTS ====================

        /// <summary>
        /// Get projects for the current authenticated user
        /// </summary>
        [HttpGet("projects/user")]
        public async Task<IActionResult> GetUserProjects()
        {
            try
            {
                var userId = GetEmpMasterId();

                var userProjects = await _service.GetUserProjectsAsync(userId);

                var response = ApiResponseDto<List<ProjectDto>>.SuccessResponse(
                    ResponseMessages.Codes.PROJECTS_RETRIEVED_SUCCESS,
                    userProjects,
                    new { UserId = userId, ProjectCount = userProjects.Count }
                );

                return Ok(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<List<ProjectDto>>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Get all projects (for reference)
        /// </summary>
        [HttpGet("projects")]
        [Authorize(
            Roles = $"{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD},{USER_ROLE.LEADERSHIP}"
        )]
        public async Task<IActionResult> GetAllProjects()
        {
            try
            {
                var allProjects = await _service.GetAllProjectsAsync();

                var response = ApiResponseDto<List<ProjectDto>>.SuccessResponse(
                    ResponseMessages.Codes.PROJECTS_RETRIEVED_SUCCESS,
                    allProjects,
                    new { ProjectCount = allProjects.Count }
                );

                return Ok(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<List<ProjectDto>>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Get project by ID
        /// </summary>
        [HttpGet("projects/{projectId:int}")]
        public async Task<IActionResult> GetProject(int projectId)
        {
            try
            {
                var project = await _service.GetProjectAsync(projectId);

                var response = ApiResponseDto<ProjectDto>.SuccessResponse(
                    ResponseMessages.Codes.PROJECT_RETRIEVED_SUCCESS,
                    project,
                    new { ProjectId = projectId }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseDto<ProjectDto>.ErrorResponse(
                    ResponseMessages.Codes.PROJECT_NOT_FOUND
                );
                return NotFound(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<ProjectDto>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        [HttpGet("projects/{projectId}/subordinates")]
        public async Task<IActionResult> GetProjectSubordinates(int projectId)
        {
            try
            {
                var currentUserId = GetEmpMasterId();
                var subordinates = await _service.GetProjectSubordinatesAsync(
                    projectId,
                    currentUserId
                );

                return Ok(
                    new ApiResponseDto<List<ProjectEmployeeDto>>
                    {
                        Success = true,
                        Data = subordinates,
                        Message = "Project subordinates retrieved successfully",
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving project subordinates");
                return StatusCode(
                    500,
                    new ApiResponseDto<object>
                    {
                        Success = false,
                        Message = "Failed to retrieve project subordinates",
                        DetailedMessage = ex.Message,
                    }
                );
            }
        }

        // ==================== ATTACHMENTS ====================

        /// <summary>
        /// Upload a file attachment to a goal
        /// </summary>
        /// 
        /// <summary>
/// Preview attachment without downloading (inline display)
/// </summary>
/// <summary>
/// Preview attachment without downloading (inline display)
/// </summary>
/// <summary>
/// Preview attachment without downloading (inline display)
/// </summary>
[HttpGet("attachments/{attachmentId:int}/preview")]
public async Task<IActionResult> PreviewAttachment(int attachmentId)
{
    try
    {
        var userId = GetEmpMasterId();
        var result = await _service.PreviewFileAsync(attachmentId, userId);
        
        if (result == null)
        {
            var response = ApiResponseDto<object>.ErrorResponse(
                ResponseMessages.Codes.FILE_NOT_FOUND,
                "Attachment not found or access denied");
            return NotFound(response);
        }
        
        byte[] fileBytes = result.Value.fileBytes;
        string contentType = result.Value.contentType;
        string fileName = result.Value.fileName;
        
        // ===  CRITICAL FIX: Set proper headers for inline preview ===
        
        // 1. Set Content-Disposition to "inline" (not attachment)
        Response.Headers["Content-Disposition"] = $"inline; filename=\"{fileName}\"";
        
        // 2. Set Cache headers for better performance
        Response.Headers["Cache-Control"] = "public, max-age=3600";
        
        // 3. Set Content-Length
        Response.Headers["Content-Length"] = fileBytes.Length.ToString();
        
        // 4. Enable range requests for large files
        Response.Headers["Accept-Ranges"] = "bytes";
        
        // Return the file with proper content type
        return File(fileBytes, contentType, enableRangeProcessing: true);
    }
    catch (UnauthorizedAccessException)
    {
        var response = ApiResponseDto<object>.ErrorResponse(
            ResponseMessages.Codes.FILE_ACCESS_DENIED);
        return Forbid(response.Message);
    }
    catch (FileNotFoundException)
    {
        var response = ApiResponseDto<object>.ErrorResponse(
            ResponseMessages.Codes.FILE_NOT_FOUND);
        return NotFound(response);
    }
    catch (Exception)
    {
        var response = ApiResponseDto<object>.ErrorResponse(
            ResponseMessages.Codes.INTERNAL_SERVER_ERROR);
        return StatusCode(500, response);
    }
}

        [HttpPost("{id:int}/attachments/upload")]
        public async Task<IActionResult> UploadFile(int id, IFormFile file, [FromForm] string title)
        {
            var userId = 0;
            try
            {
                userId = GetEmpMasterId();

                _logger.LogInformation(
                    "User {UserId} uploading file to goal {GoalId}: {FileName} ({FileSize} bytes)",
                    userId,
                    id,
                    file.FileName,
                    file.Length
                );

                var result = await _service.UploadFileAsync(id, file, title, userId);

                _logger.LogInformation(
                    "File uploaded successfully to goal {GoalId}. AttachmentId: {AttachmentId}",
                    id,
                    result.AttachmentId
                );

                var response = ApiResponseDto<FileUploadResponseDto>.SuccessResponse(
                    ResponseMessages.Codes.FILE_UPLOADED_SUCCESS,
                    result,
                    new { GoalId = id, UploadedBy = userId }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                _logger.LogWarning("Goal {GoalId} not found during file upload", id);
                var response = ApiResponseDto<FileUploadResponseDto>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_NOT_FOUND
                );
                return NotFound(response);
            }
            catch (UnauthorizedAccessException)
            {
                var response = ApiResponseDto<FileUploadResponseDto>.ErrorResponse(
                    ResponseMessages.Codes.FILE_ACCESS_DENIED
                );
                return Forbid(response.Message);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("size"))
            {
                var response = ApiResponseDto<FileUploadResponseDto>.ErrorResponse(
                    ResponseMessages.Codes.FILE_SIZE_EXCEEDED,
                    ex.Message
                );
                return BadRequest(response);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("type"))
            {
                var response = ApiResponseDto<FileUploadResponseDto>.ErrorResponse(
                    ResponseMessages.Codes.FILE_TYPE_INVALID,
                    ex.Message
                );
                return BadRequest(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error uploading file to goal {GoalId} by User {UserId}",
                    id,
                    userId
                );
                var response = ApiResponseDto<FileUploadResponseDto>.ErrorResponse(
                    ResponseMessages.Codes.FILE_UPLOAD_FAILED
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// List all attachments for a goal
        /// </summary>
        [HttpGet("{id:int}/attachments")]
        public async Task<IActionResult> ListAttachments(int id)
        {
            try
            {
                var items = await _service.ListAttachmentsAsync(id);

                var response = ApiResponseDto<List<GoalAttachment>>.SuccessResponse(
                    ResponseMessages.Codes.FILE_DOWNLOADED_SUCCESS,
                    items,
                    new { GoalId = id, AttachmentCount = items.Count }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseDto<List<GoalAttachment>>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_NOT_FOUND
                );
                return NotFound(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<List<GoalAttachment>>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Download an attachment by ID (enhanced with security)
        /// </summary>
        [HttpGet("attachments/{attachmentId:int}/download")]
        public async Task<IActionResult> DownloadAttachment(int attachmentId)
        {
            try
            {
                var userId = GetEmpMasterId();

                var (fileBytes, contentType, fileName) = await _service.DownloadFileAsync(
                    attachmentId,
                    userId
                );

                // Set Content-Disposition header with proper filename
                Response.Headers.Add("Content-Disposition", $"attachment; filename=\"{fileName}\"");

                // Also set Access-Control-Expose-Headers to allow frontend to read Content-Disposition
                Response.Headers.Add("Access-Control-Expose-Headers", "Content-Disposition");

                return File(fileBytes, contentType, fileName);
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseDto.ErrorResponse(ResponseMessages.Codes.FILE_NOT_FOUND);
                return NotFound(response);
            }
            catch (UnauthorizedAccessException)
            {
                var response = ApiResponseDto.ErrorResponse(
                    ResponseMessages.Codes.FILE_ACCESS_DENIED
                );
                return Forbid(response.Message);
            }
            catch (FileNotFoundException)
            {
                var response = ApiResponseDto.ErrorResponse(ResponseMessages.Codes.FILE_NOT_FOUND);
                return NotFound(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading attachment {AttachmentId}", attachmentId);
                var response = ApiResponseDto.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Delete an attachment
        /// </summary>
        [HttpDelete("attachments/{attachmentId:int}")]
        public async Task<IActionResult> DeleteAttachment(int attachmentId)
        {
            try
            {
                var userId = GetEmpMasterId();

                var success = await _service.DeleteAttachmentAsync(attachmentId, userId);

                if (success)
                {
                    var response = ApiResponseDto.SuccessResponse(
                        ResponseMessages.Codes.FILE_DELETED_SUCCESS,
                        new { AttachmentId = attachmentId, DeletedBy = userId }
                    );
                    return Ok(response);
                }
                else
                {
                    var response = ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.FILE_UPLOAD_FAILED
                    );
                    return BadRequest(response);
                }
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseDto.ErrorResponse(ResponseMessages.Codes.FILE_NOT_FOUND);
                return NotFound(response);
            }
            catch (UnauthorizedAccessException)
            {
                var response = ApiResponseDto.ErrorResponse(
                    ResponseMessages.Codes.FILE_ACCESS_DENIED
                );
                return Forbid(response.Message);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        // ==================== COMMENTS ====================

        /// <summary>
        /// Add a comment to a goal
        /// </summary>
        [HttpPost("{id:int}/comments")]
        public async Task<IActionResult> AddComment(int id, [FromBody] CreateCommentDto dto)
        {
            try
            {
                var userId = GetEmpMasterId();
                var role = GetUserRole();

                var result = await _service.AddCommentAsync(id, dto, userId, role);

                if (result.Success)
                {
                    return Ok(result);
                }

                return result.Code switch
                {
                    ResponseMessages.Codes.GOAL_NOT_FOUND => NotFound(result),
                    ResponseMessages.Codes.COMMENT_ACCESS_DENIED => Forbid(result.Message),
                    _ => BadRequest(result),
                };
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// List all comments for a goal
        /// </summary>
        [HttpGet("{id:int}/comments")]
        public async Task<IActionResult> ListComments(int id)
        {
            try
            {
                var items = await _service.ListCommentsAsync(id);

                var response = ApiResponseDto<List<GoalCommentDto>>.SuccessResponse(
                    ResponseMessages.Codes.COMMENTS_RETRIEVED_SUCCESS,
                    items,
                    new { GoalId = id, CommentCount = items.Count }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseDto<List<GoalCommentDto>>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_NOT_FOUND
                );
                return NotFound(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<List<GoalCommentDto>>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );

                return StatusCode(500, response);
            }
        }

        // ==================== TIMELINE ====================

        /// <summary>
        /// Get timeline of all events for a goal (progress, approvals, comments, etc.)
        /// </summary>
        [HttpGet("{id:int}/timeline")]
        public async Task<IActionResult> GetTimeline(int id)
        {
            try
            {
                var userId = GetEmpMasterId();

                var timeline = await _service.GetGoalTimelineAsync(id, userId);

                var response = ApiResponseDto<List<TimelineEventDto>>.SuccessResponse(
                    ResponseMessages.Codes.TIMELINE_RETRIEVED_SUCCESS,
                    timeline,
                    new { GoalId = id, EventCount = timeline.Count }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseDto<List<TimelineEventDto>>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_NOT_FOUND
                );
                return NotFound(response);
            }
            catch (UnauthorizedAccessException)
            {
                var response = ApiResponseDto<List<TimelineEventDto>>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_ACCESS_DENIED
                );
                return Forbid(response.Message);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<List<TimelineEventDto>>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        // ==================== DASHBOARD ====================

        /// <summary>
        /// Get dashboard summary (completed, ongoing, pending counts)
        /// </summary>
        [HttpGet("dashboard/summary")]
        public async Task<IActionResult> DashboardSummary()
        {
            try
            {
                var userId = GetEmpMasterId();

                var summary = await _service.GetDashboardSummaryAsync(userId);

                var response = ApiResponseDto<GoalDashboardSummaryDto>.SuccessResponse(
                    ResponseMessages.Codes.DASHBOARD_RETRIEVED_SUCCESS,
                    summary,
                    new { UserId = userId }
                );

                return Ok(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<GoalDashboardSummaryDto>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Get ongoing goals filtered by type (self, team, org)
        /// </summary>
        [HttpGet("dashboard/ongoing")]
        public async Task<IActionResult> DashboardOngoing([FromQuery] string type)
        {
            try
            {
                var userId = GetEmpMasterId();

                var list = await _service.GetOngoingAsync(type, userId);

                var response = ApiResponseDto<List<GoalSummaryDto>>.SuccessResponse(
                    ResponseMessages.Codes.GOAL_RETRIEVED_SUCCESS,
                    list,
                    new
                    {
                        UserId = userId,
                        Type = type,
                        GoalCount = list.Count,
                    }
                );

                return Ok(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<List<GoalSummaryDto>>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        // ==================== PERMISSIONS & VALIDATION ====================

        /// <summary>
        /// Check if user can mark goal as complete
        /// </summary>
        [HttpGet("{id:int}/can-complete")]
        public async Task<IActionResult> CanMarkComplete(int id)
        {
            try
            {
                var userId = GetEmpMasterId();
                var role = GetUserRole();

                var canComplete = await _service.CanMarkCompleteAsync(id, userId);
                var goal = await _service.GetGoalAsync(id, userId, role);

                var isOverdue = goal.IsOverdue;
                var hasRequiredProgress = goal.ProgressPercent >= 100;
                var hasValidStatus =
                    goal.Status == GOAL_STATUS.OPEN
                    || goal.Status == GOAL_STATUS.IN_PROGRESS
                    || goal.Status == GOAL_STATUS.REOPENED;
                var isNotOverdue = !isOverdue || goal.Status == GOAL_STATUS.REOPENED;

                bool isCreator = goal.CreatedByEmployeeMasterId == userId;
                bool isAssignee = goal.Assignees?.Any(a => a.EmployeeMasterId == userId) ?? false;
                var isParticipant = isCreator || isAssignee;

                List<string> reasons = new List<string>();

                if (!hasRequiredProgress)
                {
                    reasons.Add($"Progress must be 100% (current: {goal.ProgressPercent}%)");
                }

                if (isOverdue && goal.Status != GOAL_STATUS.REOPENED)
                {
                    reasons.Add("Goal is overdue");
                }

                if (!hasValidStatus)
                {
                    reasons.Add($"Invalid status: {goal.Status}");
                }

                if (!isParticipant)
                {
                    reasons.Add("Not a participant");
                }

                var shouldRequestReopen = isOverdue && goal.Status != GOAL_STATUS.REOPENED;

                var result = new CanMarkCompleteDto
                {
                    CanComplete = canComplete,
                    Reason = reasons.Any() ? string.Join("; ", reasons) : null,
                    Reasons = reasons.Any() ? reasons : null,
                    IsOverdue = isOverdue,
                    ShouldRequestReopen = shouldRequestReopen,
                    Details = new CanMarkCompleteDetailsDto
                    {
                        HasRequiredProgress = hasRequiredProgress,
                        CurrentProgress = goal.ProgressPercent,
                        IsNotOverdue = isNotOverdue,
                        HasValidStatus = hasValidStatus,
                        CurrentStatus = goal.Status,
                        IsParticipant = isParticipant,
                    },
                };

                var response = ApiResponseDto<CanMarkCompleteDto>.SuccessResponse(
                    ResponseMessages.Codes.GOAL_RETRIEVED_SUCCESS,
                    result,
                    new { GoalId = id, UserId = userId }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseDto<CanMarkCompleteDto>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_NOT_FOUND
                );
                return NotFound(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<CanMarkCompleteDto>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Check if user can view a goal
        /// </summary>
        [HttpGet("{id:int}/can-view")]
        public async Task<IActionResult> CanViewGoal(int id)
        {
            try
            {
                var userId = GetEmpMasterId();

                var canView = await _service.CanViewGoalAsync(id, userId);

                var response = ApiResponseDto<object>.SuccessResponse(
                    ResponseMessages.Codes.GOAL_RETRIEVED_SUCCESS,
                    new { canView },
                    new { GoalId = id, UserId = userId }
                );

                return Ok(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<object>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Check if user can comment on a goal
        /// </summary>
        [HttpGet("{id:int}/can-comment")]
        public async Task<IActionResult> CanComment(int id)
        {
            try
            {
                var userId = GetEmpMasterId();
                var role = GetUserRole();

                var canComment = await _service.CanCommentOnGoalAsync(id, userId, role);

                var response = ApiResponseDto<object>.SuccessResponse(
                    ResponseMessages.Codes.GOAL_RETRIEVED_SUCCESS,
                    new { canComment },
                    new { GoalId = id, UserId = userId }
                );

                return Ok(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<object>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }
    }
}
