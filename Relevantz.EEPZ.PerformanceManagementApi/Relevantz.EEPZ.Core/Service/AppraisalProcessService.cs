
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

    public class AppraisalProcessService : IAppraisalProcessService
    {
        private readonly EEPZDbContext _context;

        public AppraisalProcessService(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<ApiResponse<List<AppraisalResponseDto>>> InitiateAppraisalAsync(InitiateAppraisalRequestDto request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {

                var form = await _context.Assessmentforms.FindAsync(request.FormId);
                if (form == null)
                    return ApiResponse<List<AppraisalResponseDto>>.ErrorResponse("Form not found");

                var assignedByUser = await _context.Userauthentications.FindAsync(request.AssignedBy);
                if (assignedByUser == null)
                    return ApiResponse<List<AppraisalResponseDto>>.ErrorResponse("Assigning user not found");

                var users = await _context.Userauthentications
                    .Where(u => request.UserIds.Contains(u.UserId))
                    .ToListAsync();

                if (users.Count != request.UserIds.Count)
                    return ApiResponse<List<AppraisalResponseDto>>.ErrorResponse("Some users not found");

                var responses = new List<AppraisalResponseDto>();

                foreach (var userId in request.UserIds)
                {

                    var assignment = new Assignment
                    {
                        FormId = request.FormId,
                        EmployeeId = userId,
                        AssignedBy = request.AssignedBy,
                        AssignedAt = DateTime.UtcNow,
                        Deadline = request.DeadlineInDays > 0
                            ? DateTime.UtcNow.AddDays(request.DeadlineInDays)
                            : DateTime.UtcNow.AddDays(7), 
                        Action = request.Action
                    };

                    _context.Assignments.Add(assignment);
                    await _context.SaveChangesAsync();

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

                    var assignmentData = await _context.Assignments
                        .Include(a => a.Form)
                        .Include(a => a.Employee)
                        .Include(a => a.Formprogresstrackers)
                        .FirstOrDefaultAsync(a => a.AssignmentId == assignment.AssignmentId);

                    responses.Add(MapToAppraisalResponse(assignmentData!));
                }

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

        public async Task<ApiResponse<List<AppraisalResponseDto>>> GetAppraisalsByFormIdAsync(int formId)
        {
            try
            {

                var form = await _context.Assessmentforms.FindAsync(formId);
                if (form == null)
                    return ApiResponse<List<AppraisalResponseDto>>.ErrorResponse("Form not found");

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

        public async Task<ApiResponse<List<AppraisalResponseDto>>> GetAppraisalsByUserIdAsync(int userId)
        {
            try
            {

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

        public async Task<ApiResponse<List<AppraisalResponseDto>>> GetAppraisalsByStatusAsync(string status)
        {
            try
            {
                List<Assignment> list = new();

                switch (status?.ToLower())
                {
                    case "pending":

                        list = await _context.Assignments
                            .Include(a => a.Form)
                            .Include(a => a.Employee)
                            .Include(a => a.Formprogresstrackers)
                            .Where(a => a.Formprogresstrackers.Any(p => !(p.EmployeeCompleted ?? false)))
                            .OrderByDescending(a => a.AssignedAt)
                            .ToListAsync();
                        break;

                    case "completed":

                        list = await _context.Assignments
                            .Include(a => a.Form)
                            .Include(a => a.Employee)
                            .Include(a => a.Formprogresstrackers)
                            .Where(a => a.Formprogresstrackers.Any(p => p.EmployeeCompleted ?? false))
                            .OrderByDescending(a => a.AssignedAt)
                            .ToListAsync();
                        break;

                    case "overdue":

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

        public async Task<ApiResponse<bool>> UpdateProgressAsync(int assignmentId, UpdateProgressDto updateDto)
        {
            try
            {
                var tracker = await _context.Formprogresstrackers
                    .FirstOrDefaultAsync(t => t.AssignmentId == assignmentId);

                if (tracker == null)
                    return ApiResponse<bool>.ErrorResponse("Progress tracker not found");

                if (updateDto.EmployeeCompleted.HasValue)
                    tracker.EmployeeCompleted = updateDto.EmployeeCompleted.Value;

                if (updateDto.SentToManager.HasValue)
                    tracker.SentToManager = updateDto.SentToManager.Value;

                if (updateDto.ManagerCompleted.HasValue)
                    tracker.ManagerCompleted = updateDto.ManagerCompleted.Value;

                if (updateDto.SentToDeptHead.HasValue)
                    tracker.SentToDeptHead = updateDto.SentToDeptHead.Value;

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

        public async Task<ApiResponse<AppraisalStatisticsDto>> GetAppraisalStatisticsAsync()
        {
            try
            {

                var totalAssignments = await _context.Assignments.CountAsync();

                var totalCompleted = await _context.Assignments
                    .Include(a => a.Formprogresstrackers)
                    .CountAsync(a => a.Formprogresstrackers.Any(p => p.EmployeeCompleted ?? false));

                var totalForms = await _context.Assessmentforms.CountAsync();

                var overdueCount = await _context.Assignments
                    .Include(a => a.Formprogresstrackers)
                    .CountAsync(a => a.Deadline < DateTime.UtcNow &&
                               a.Formprogresstrackers.Any(p => !(p.EmployeeCompleted ?? false)));

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

    public class UpdateProgressDto
    {

        public bool? EmployeeCompleted { get; set; }

        public bool? SentToManager { get; set; }

        public bool? ManagerCompleted { get; set; }

        public bool? SentToDeptHead { get; set; }
    }

    public class AppraisalStatisticsDto
    {

        public int TotalAssignments { get; set; }

        public int CompletedAssignments { get; set; }

        public int PendingAssignments { get; set; }

        public int TotalForms { get; set; }

        public int OverdueAssignments { get; set; }

        public int CompletionPercentage { get; set; }
    }
}
 