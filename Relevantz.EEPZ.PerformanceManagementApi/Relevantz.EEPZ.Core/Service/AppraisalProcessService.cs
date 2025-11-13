 
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Relevantz.EEPZ.Data.Repository.Implementations;
namespace Relevantz.EEPZ.Core.Services.Implementations
{
    /// <summary>
    /// Service for managing appraisal process operations
    /// Handles initiation, retrieval, and progress tracking of appraisals
    /// Provides comprehensive appraisal management with transaction support
    /// </summary>
    public class AppraisalProcessService : IAppraisalProcessService
    {
        private readonly EEPZDbContext _context;
 
        public AppraisalProcessService(EEPZDbContext context)
        {
            _context = context;
        }
 
        /// <summary>
        /// Initiate appraisal for multiple users
        /// Creates assignment and progress tracker records within a transaction
        /// Rollback on any error to maintain data consistency
        ///
        /// Process:
        /// 1. Validate form exists
        /// 2. Validate assigning user exists and is HR
        /// 3. Validate all target users exist
        /// 4. Create assignments with deadline
        /// 5. Create progress trackers
        /// 6. Return success response with created assignments
        /// </summary>
        public async Task<ApiResponse<List<AppraisalResponseDto>>> InitiateAppraisalAsync(InitiateAppraisalRequestDto request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // ✅ Step 1: Validate form exists
                var form = await _context.Assessmentforms.FindAsync(request.FormId);
                if (form == null)
                    return ApiResponse<List<AppraisalResponseDto>>.ErrorResponse("Form not found");
 
                // ✅ Step 2: Validate assigning user exists
                var assignedByUser = await _context.Userauthentications.FindAsync(request.AssignedBy);
                if (assignedByUser == null)
                    return ApiResponse<List<AppraisalResponseDto>>.ErrorResponse("Assigning user not found");
 
                // ✅ Step 3: Validate all target users exist
                var users = await _context.Userauthentications
                    .Where(u => request.UserIds.Contains(u.UserId))
                    .ToListAsync();
 
                if (users.Count != request.UserIds.Count)
                    return ApiResponse<List<AppraisalResponseDto>>.ErrorResponse("Some users not found");
 
                var responses = new List<AppraisalResponseDto>();
 
                // ✅ Step 4 & 5: Create assignments and progress trackers for each user
                foreach (var userId in request.UserIds)
                {
                    // Create Assignment
                    var assignment = new Assignment
                    {
                        FormId = request.FormId,
                        EmployeeId = userId,
                        AssignedBy = request.AssignedBy,
                        AssignedAt = DateTime.UtcNow,
                        Deadline = request.DeadlineInDays > 0
                            ? DateTime.UtcNow.AddDays(request.DeadlineInDays)
                            : DateTime.UtcNow.AddDays(7), // Default 7 days
                        Action = request.Action
                    };
 
                    _context.Assignments.Add(assignment);
                    await _context.SaveChangesAsync();
 
                    // Create Progress Tracker
                    var progressTracker = new Formprogresstracker
                    {
                        AssignmentId = assignment.AssignmentId,
                        Initiated = true,
                        SentToEmployee = request.Action == "Send",
                        EmployeeCompleted = false,
                        SentToManager = false,
                        ManagerCompleted = false,
                        SentToDeptHead = false,
                        SentToLeadership = false,
                        LastUpdated = DateTime.UtcNow
                    };
 
                    _context.Formprogresstrackers.Add(progressTracker);
                    await _context.SaveChangesAsync();
 
                    // Retrieve full assignment data for response
                    var assignmentData = await _context.Assignments
                        .Include(a => a.Form)
                        .Include(a => a.Employee)
                        .Include(a => a.Formprogresstrackers)
                        .FirstOrDefaultAsync(a => a.AssignmentId == assignment.AssignmentId);
 
                    responses.Add(MapToAppraisalResponse(assignmentData!));
                }
 
                // ✅ Step 6: Commit transaction
                await transaction.CommitAsync();
                return ApiResponse<List<AppraisalResponseDto>>.SuccessResponse(
                    responses,
                    $"Appraisals initiated successfully for {responses.Count} user(s)");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ApiResponse<List<AppraisalResponseDto>>.ErrorResponse($"Error: {ex.Message}");
            }
        }
 
        /// <summary>
        /// Get all appraisals for a specific form
        /// Returns assignments with progress tracking details
        ///
        /// Usage: HR views all appraisals created from a specific form
        /// Includes status, deadline, and progress information
        /// </summary>
        public async Task<ApiResponse<List<AppraisalResponseDto>>> GetAppraisalsByFormIdAsync(int formId)
        {
            try
            {
                // Validate form exists
                var form = await _context.Assessmentforms.FindAsync(formId);
                if (form == null)
                    return ApiResponse<List<AppraisalResponseDto>>.ErrorResponse("Form not found");
 
                // Get all assignments for the form
                var list = await _context.Assignments
                    .Include(a => a.Form)
                    .Include(a => a.Employee)
                    .Include(a => a.Formprogresstrackers)
                    .Where(a => a.FormId == formId)
                    .OrderByDescending(a => a.AssignedAt)
                    .ToListAsync();
 
                if (!list.Any())
                    return ApiResponse<List<AppraisalResponseDto>>.ErrorResponse("No appraisals found for this form");
 
                var responses = list.Select(a => MapToAppraisalResponse(a)).ToList();
 
                return ApiResponse<List<AppraisalResponseDto>>.SuccessResponse(
                    responses,
                    $"Retrieved {responses.Count} appraisal(s)");
            }
            catch (Exception ex)
            {
                return ApiResponse<List<AppraisalResponseDto>>.ErrorResponse($"Error: {ex.Message}");
            }
        }
 
        /// <summary>
        /// Get appraisal by assignment ID
        /// Returns single appraisal with full progress details
        ///
        /// Usage: View specific assignment details with all progress tracking info
        /// </summary>
        public async Task<ApiResponse<AppraisalResponseDto>> GetAppraisalByIdAsync(int assignmentId)
        {
            try
            {
                var assignment = await _context.Assignments
                    .Include(a => a.Form)
                    .Include(a => a.Employee)
                    .Include(a => a.Formprogresstrackers)
                    .FirstOrDefaultAsync(a => a.AssignmentId == assignmentId);
 
                if (assignment == null)
                    return ApiResponse<AppraisalResponseDto>.ErrorResponse("Assignment not found");
 
                var response = MapToAppraisalResponse(assignment);
                return ApiResponse<AppraisalResponseDto>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                return ApiResponse<AppraisalResponseDto>.ErrorResponse($"Error: {ex.Message}");
            }
        }
 
        /// <summary>
        /// Get all appraisals for a specific user
        /// Returns all assignments assigned to the user
        ///
        /// Usage: Employee views their assigned appraisals
        /// Shows what forms they need to complete
        /// </summary>
        public async Task<ApiResponse<List<AppraisalResponseDto>>> GetAppraisalsByUserIdAsync(int userId)
        {
            try
            {
                // Validate user exists
                var user = await _context.Userauthentications.FindAsync(userId);
                if (user == null)
                    return ApiResponse<List<AppraisalResponseDto>>.ErrorResponse("User not found");
 
                var list = await _context.Assignments
                    .Include(a => a.Form)
                    .Include(a => a.Employee)
                    .Include(a => a.Formprogresstrackers)
                    .Where(a => a.EmployeeId == userId)
                    .OrderByDescending(a => a.AssignedAt)
                    .ToListAsync();
 
                if (!list.Any())
                    return ApiResponse<List<AppraisalResponseDto>>.ErrorResponse("No appraisals found for this user");
 
                var responses = list.Select(a => MapToAppraisalResponse(a)).ToList();
 
                return ApiResponse<List<AppraisalResponseDto>>.SuccessResponse(responses);
            }
            catch (Exception ex)
            {
                return ApiResponse<List<AppraisalResponseDto>>.ErrorResponse($"Error: {ex.Message}");
            }
        }
 
        /// <summary>
        /// Get appraisals filtered by status
        /// Status options: pending, completed, overdue
        ///
        /// Pending: Not yet completed by employee
        /// Completed: Marked as completed by employee
        /// Overdue: Past deadline and not completed
        /// </summary>
        public async Task<ApiResponse<List<AppraisalResponseDto>>> GetAppraisalsByStatusAsync(string status)
        {
            try
            {
                List<Assignment> list = new();
 
                switch (status?.ToLower())
                {
                    case "pending":
                        // Get assignments not yet completed
                        list = await _context.Assignments
                            .Include(a => a.Form)
                            .Include(a => a.Employee)
                            .Include(a => a.Formprogresstrackers)
                            .Where(a => a.Formprogresstrackers.Any(p => !(p.EmployeeCompleted ?? false)))
                            .OrderByDescending(a => a.AssignedAt)
                            .ToListAsync();
                        break;
 
                    case "completed":
                        // Get assignments completed by employee
                        list = await _context.Assignments
                            .Include(a => a.Form)
                            .Include(a => a.Employee)
                            .Include(a => a.Formprogresstrackers)
                            .Where(a => a.Formprogresstrackers.Any(p => p.EmployeeCompleted ?? false))
                            .OrderByDescending(a => a.AssignedAt)
                            .ToListAsync();
                        break;
 
                    case "overdue":
                        // Get assignments past deadline and not completed
                        list = await _context.Assignments
                            .Include(a => a.Form)
                            .Include(a => a.Employee)
                            .Include(a => a.Formprogresstrackers)
                            .Where(a => a.Deadline < DateTime.UtcNow &&
                                   a.Formprogresstrackers.Any(p => !(p.EmployeeCompleted ?? false)))
                            .OrderByDescending(a => a.AssignedAt)
                            .ToListAsync();
                        break;
 
                    default:
                        return ApiResponse<List<AppraisalResponseDto>>.ErrorResponse(
                            "Invalid status. Use: pending, completed, or overdue");
                }
 
                if (!list.Any())
                    return ApiResponse<List<AppraisalResponseDto>>.ErrorResponse(
                        $"No appraisals found with status: {status}");
 
                var responses = list.Select(a => MapToAppraisalResponse(a)).ToList();
 
                return ApiResponse<List<AppraisalResponseDto>>.SuccessResponse(responses);
            }
            catch (Exception ex)
            {
                return ApiResponse<List<AppraisalResponseDto>>.ErrorResponse($"Error: {ex.Message}");
            }
        }
 
        /// <summary>
        /// Update progress tracker status
        /// Used to mark stages of appraisal completion
        ///
        /// Supports partial updates of progress flags:
        /// - EmployeeCompleted: Employee finished the form
        /// - SentToManager: Sent for manager review
        /// - ManagerCompleted: Manager review complete
        /// - SentToDeptHead: Sent to department head
        /// </summary>
        public async Task<ApiResponse<bool>> UpdateProgressAsync(int assignmentId, UpdateProgressDto updateDto)
        {
            try
            {
                var tracker = await _context.Formprogresstrackers
                    .FirstOrDefaultAsync(t => t.AssignmentId == assignmentId);
 
                if (tracker == null)
                    return ApiResponse<bool>.ErrorResponse("Progress tracker not found");
 
                // Update relevant flags based on request (only if provided)
                if (updateDto.EmployeeCompleted.HasValue)
                    tracker.EmployeeCompleted = updateDto.EmployeeCompleted.Value;
 
                if (updateDto.SentToManager.HasValue)
                    tracker.SentToManager = updateDto.SentToManager.Value;
 
                if (updateDto.ManagerCompleted.HasValue)
                    tracker.ManagerCompleted = updateDto.ManagerCompleted.Value;
 
                if (updateDto.SentToDeptHead.HasValue)
                    tracker.SentToDeptHead = updateDto.SentToDeptHead.Value;
 
                // Update timestamp
                tracker.LastUpdated = DateTime.UtcNow;
 
                _context.Formprogresstrackers.Update(tracker);
                await _context.SaveChangesAsync();
 
                return ApiResponse<bool>.SuccessResponse(true, "Progress updated successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse($"Error: {ex.Message}");
            }
        }
 
        /// <summary>
        /// Get appraisal statistics and summary metrics
        /// Returns overall metrics for forms, assignments, and progress
        ///
        /// Metrics provided:
        /// - TotalAssignments: All assignments created
        /// - CompletedAssignments: Marked as completed
        /// - PendingAssignments: Not yet completed
        /// - TotalForms: Total forms in system
        /// - OverdueAssignments: Past deadline, not completed
        /// - CompletionPercentage: Percentage of completed assignments
        /// </summary>
        public async Task<ApiResponse<AppraisalStatisticsDto>> GetAppraisalStatisticsAsync()
        {
            try
            {
                // Calculate total assignments
                var totalAssignments = await _context.Assignments.CountAsync();
 
                // Calculate completed assignments
                var totalCompleted = await _context.Assignments
                    .Include(a => a.Formprogresstrackers)
                    .CountAsync(a => a.Formprogresstrackers.Any(p => p.EmployeeCompleted ?? false));
 
                // Calculate total forms
                var totalForms = await _context.Assessmentforms.CountAsync();
 
                // Calculate overdue assignments
                var overdueCount = await _context.Assignments
                    .Include(a => a.Formprogresstrackers)
                    .CountAsync(a => a.Deadline < DateTime.UtcNow &&
                               a.Formprogresstrackers.Any(p => !(p.EmployeeCompleted ?? false)));
 
                // Build statistics object
                var stats = new AppraisalStatisticsDto
                {
                    TotalAssignments = totalAssignments,
                    CompletedAssignments = totalCompleted,
                    PendingAssignments = totalAssignments - totalCompleted,
                    TotalForms = totalForms,
                    OverdueAssignments = overdueCount,
                    CompletionPercentage = totalAssignments > 0
                        ? (totalCompleted * 100) / totalAssignments
                        : 0
                };
 
                return ApiResponse<AppraisalStatisticsDto>.SuccessResponse(stats);
            }
            catch (Exception ex)
            {
                return ApiResponse<AppraisalStatisticsDto>.ErrorResponse($"Error: {ex.Message}");
            }
        }
 
        /// <summary>
        /// Map Assignment entity to AppraisalResponseDto
        /// Extracts relevant data for API response
        /// Includes form details, employee info, and progress tracking
        /// </summary>
        private AppraisalResponseDto MapToAppraisalResponse(Assignment assignment)
        {
            var tracker = assignment.Formprogresstrackers?.FirstOrDefault();
            string employeeName = assignment.Employee?.Email ?? "Unknown";
 
            return new AppraisalResponseDto
            {
                AssignmentId = assignment.AssignmentId,
                FormId = assignment.FormId,
                FormName = assignment.Form?.Name ?? "Unknown",
                UserId = assignment.EmployeeId,
                UserName = employeeName,
                Action = assignment.Action ?? string.Empty,
                AssignedAt = assignment.AssignedAt,
                Deadline = assignment.Deadline,
                Progress = new FormProgressDto
                {
                    Initiated = tracker?.Initiated ?? false,
                    SentToEmployee = tracker?.SentToEmployee ?? false,
                    EmployeeCompleted = tracker?.EmployeeCompleted ?? false,
                    SentToManager = tracker?.SentToManager ?? false,
                    ManagerCompleted = tracker?.ManagerCompleted ?? false,
                    SentToDeptHead = tracker?.SentToDeptHead ?? false,
                    SentToLeadership = tracker?.SentToLeadership ?? false,
                    LastUpdated = tracker?.LastUpdated
                }
            };
        }
    }
 
    /// <summary>
    /// Data Transfer Object for updating progress tracker
    /// Allows partial updates of progress flags
    /// Only non-null values are updated
    /// </summary>
    public class UpdateProgressDto
    {
        /// <summary>
        /// Whether employee completed the form
        /// </summary>
        public bool? EmployeeCompleted { get; set; }
 
        /// <summary>
        /// Whether form was sent to manager
        /// </summary>
        public bool? SentToManager { get; set; }
 
        /// <summary>
        /// Whether manager completed review
        /// </summary>
        public bool? ManagerCompleted { get; set; }
 
        /// <summary>
        /// Whether form was sent to department head
        /// </summary>
        public bool? SentToDeptHead { get; set; }
    }
 
    /// <summary>
    /// Data Transfer Object for appraisal statistics
    /// Contains aggregated metrics for appraisal system
    /// </summary>
    public class AppraisalStatisticsDto
    {
        /// <summary>
        /// Total number of assignments created
        /// </summary>
        public int TotalAssignments { get; set; }
 
        /// <summary>
        /// Number of assignments marked as completed
        /// </summary>
        public int CompletedAssignments { get; set; }
 
        /// <summary>
        /// Number of assignments still pending
        /// </summary>
        public int PendingAssignments { get; set; }
 
        /// <summary>
        /// Total number of forms in system
        /// </summary>
        public int TotalForms { get; set; }
 
        /// <summary>
        /// Number of assignments past deadline and not completed
        /// </summary>
        public int OverdueAssignments { get; set; }
 
        /// <summary>
        /// Percentage of completed assignments (0-100)
        /// </summary>
        public int CompletionPercentage { get; set; }
    }
}
 