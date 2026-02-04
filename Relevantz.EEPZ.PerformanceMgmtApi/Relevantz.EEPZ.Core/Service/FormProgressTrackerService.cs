using FluentValidation;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class FormProgressTrackerService : IFormProgressTrackerService
    {
        private readonly IFormProgressTrackerRepository _repository;
        private readonly ILogger<FormProgressTrackerService> _logger;
        private readonly IValidator<FormProgressTrackerUpdateDto> _validator;

       public FormProgressTrackerService(
    IFormProgressTrackerRepository repository,
    ILogger<FormProgressTrackerService> logger,
    IValidator<FormProgressTrackerUpdateDto> validator)
{
    _repository = repository;
    _logger = logger;
    _validator = validator;
}

        public async Task<object> GetAllAsync()
        {
            try
            {
                var trackers = await _repository.GetAllTrackersWithAssignmentsAsync();

                var assignmentIds = trackers
                    .Where(t => t.Assignment != null)
                    .Select(t => t.Assignment.AssignmentId)
                    .Distinct()
                    .ToList();

                var assignments = trackers
                    .Where(t => t.Assignment != null)
                    .Select(t => t.Assignment)
                    .Distinct()
                    .ToList();

                var userIds = assignments
                    .Select(a => a.EmployeeId)
                    .Where(id => id != 0)
                    .Distinct()
                    .ToList();

                var users = await _repository.GetUsersByUserIdsAsync(userIds);

                var employeeMasterIds = users
                    .Where(u => u.Employee != null)
                    .Select(u => u.Employee.EmployeeId)
                    .Distinct()
                    .ToList();

                var userProfiles = await _repository.GetUserProfilesByEmployeeIdsAsync(employeeMasterIds);

                var l1EmployeeIds = users
                    .Where(u => u.Employee != null && u.Employee.ReportingManagerEmployeeId != null)
                    .Select(u => u.Employee.ReportingManagerEmployeeId.Value)
                    .Distinct()
                    .ToList();

                var l1Employees = await _repository.GetEmployeesByEmployeeIdsAsync(l1EmployeeIds);
                var l1Profiles = await _repository.GetUserProfilesByEmployeeIdsAsync(l1EmployeeIds);

                var l2EmployeeIds = l1Employees
                    .Where(e => e.ReportingManagerEmployeeId != null)
                    .Select(e => e.ReportingManagerEmployeeId.Value)
                    .Distinct()
                    .ToList();

                var l2Profiles = await _repository.GetUserProfilesByEmployeeIdsAsync(l2EmployeeIds);

                var relevantUserIds = assignments.Select(a => a.EmployeeId).Distinct().ToList();
                var relevantFormIds = assignments.Select(a => a.FormId).Distinct().ToList();

                var selfAssessments = await _repository.GetLatestSelfAssessmentsAsync(relevantUserIds, relevantFormIds);
                var latestAssessmentLookup = selfAssessments
                    .GroupBy(sa => new { sa.EmployeeId, sa.FormId })
                    .Select(g => g.OrderByDescending(x => x.SubmittedAt).First())
                    .ToDictionary(sa => (sa.EmployeeId, sa.FormId), sa => sa);

                var assessmentIds = latestAssessmentLookup.Values.Select(sa => sa.AssessmentId).Distinct().ToList();
                var deptApprovals = await _repository.GetDeptApprovalsByAssessmentIdsAsync(assessmentIds);
                var approvalsByAssessment = deptApprovals
                    .GroupBy(a => a.AssessmentId)
                    .ToDictionary(g => g.Key, g => g.ToList());

                var result = trackers.Select(t =>
                {
                    var assignment = t.Assignment;

                    bool deptHeadApproved = false;
                    bool empAcknowledged = false;

                    var user = assignment != null ? users.FirstOrDefault(u => u.UserId == assignment.EmployeeId) : null;
                    var employee = user?.Employee;
                    var userProfile = employee != null ? userProfiles.FirstOrDefault(up => up.EmployeeId == employee.EmployeeId) : null;

                    var l1EmployeeId = employee?.ReportingManagerEmployeeId;
                    var l1Profile = l1EmployeeId != null ? l1Profiles.FirstOrDefault(up => up.EmployeeId == l1EmployeeId) : null;

                    var l1Employee = l1EmployeeId != null ? l1Employees.FirstOrDefault(e => e.EmployeeId == l1EmployeeId) : null;
                    var l2EmployeeId = l1Employee?.ReportingManagerEmployeeId;
                    var l2Profile = l2EmployeeId != null ? l2Profiles.FirstOrDefault(up => up.EmployeeId == l2EmployeeId) : null;

                    if (assignment != null)
                    {
                        var key = (EmployeeId: assignment.EmployeeId, FormId: assignment.FormId);
                        if (latestAssessmentLookup.TryGetValue(key, out var latestAssessment))
                        {
                            if (approvalsByAssessment.TryGetValue(latestAssessment.AssessmentId, out var approvals))
                            {
                                var approved = approvals.FirstOrDefault(a => string.Equals(a.Status, "Approved", StringComparison.OrdinalIgnoreCase));
                                if (approved != null)
                                {
                                    deptHeadApproved = true;
                                    empAcknowledged = approved.AcknowledgedByEmployee;
                                }
                            }
                        }
                    }

                    return new
                    {
                        t.TrackerId,
                        t.AssignmentId,
                        t.Initiated,
                        t.SentToEmployee,
                        t.EmployeeCompleted,
                        t.SentToManager,
                        t.ManagerCompleted,
                        DeptHeadApproved = deptHeadApproved,
                        EmpAcknowledged = empAcknowledged,
                        t.SentToDeptHead,
                        t.SentToLeadership,
                        t.LastUpdated,
                        EmployeeId = user?.UserId,
                        EmployeeName = userProfile != null ? $"{userProfile.FirstName} {userProfile.LastName}".Trim() : "N/A",
                        L1Id = l1EmployeeId,
                        L1Name = l1Profile != null ? $"{l1Profile.FirstName} {l1Profile.LastName}".Trim() : "N/A",
                        L2Id = l2EmployeeId,
                        L2Name = l2Profile != null ? $"{l2Profile.FirstName} {l2Profile.LastName}".Trim() : "N/A"
                    };
                }).ToList();

                return new { success = true, data = result };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching all form progress trackers");
                return new { success = false, message = $"Error: {ex.Message}" };
            }
        }

        public async Task<object> GetByIdAsync(int id)
        {
            try
            {
                var tracker = await _repository.GetTrackerByIdAsync(id);
                if (tracker == null)
                    return new { success = false, message = "Form progress tracker not found." };

                return new { success = true, data = tracker };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching tracker by ID: {TrackerId}", id);
                return new { success = false, message = $"Error: {ex.Message}" };
            }
        }

        public async Task<object> GetByAssignmentAsync(int assignmentId)
        {
            try
            {
                var tracker = await _repository.GetTrackerByAssignmentIdAsync(assignmentId);
                if (tracker == null)
                    return new { success = false, message = "Form progress tracker not found for assignment." };

                return new { success = true, data = tracker };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching tracker by assignment: {AssignmentId}", assignmentId);
                return new { success = false, message = $"Error: {ex.Message}" };
            }
        }

        public async Task<object> UpsertAsync(FormProgressTrackerUpdateDto dto)
        {
            if (dto == null)
                return new { success = false, message = "Invalid data." };

            
var validationResult = await _validator.ValidateAsync(dto);
    if (!validationResult.IsValid)
    {
        return new
        {
            success = false,
            message = "Validation failed.",
            errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList()
        };
    }


            try
            {
                var tracker = await _repository.GetTrackerForUpsertAsync(dto.AssignmentId);

                if (tracker == null)
                {
                    tracker = new Formprogresstracker
                    {
                        AssignmentId = dto.AssignmentId,
                        Initiated = dto.Initiated ?? false,
                        SentToEmployee = dto.SentToEmployee ?? false,
                        EmployeeCompleted = dto.EmployeeCompleted ?? false,
                        SentToManager = dto.SentToManager ?? false,
                        ManagerCompleted = dto.ManagerCompleted ?? false,
                        SentToDeptHead = dto.SentToDeptHead ?? false,
                        SentToLeadership = dto.SentToLeadership ?? false,
                        LastUpdated = DateTime.UtcNow
                    };

                    await _repository.UpsertTrackerAsync(tracker);
                }
                else
                {
                    tracker.Initiated = dto.Initiated ?? tracker.Initiated;
                    tracker.SentToEmployee = dto.SentToEmployee ?? tracker.SentToEmployee;
                    tracker.EmployeeCompleted = dto.EmployeeCompleted ?? tracker.EmployeeCompleted;
                    tracker.SentToManager = dto.SentToManager ?? tracker.SentToManager;
                    tracker.ManagerCompleted = dto.ManagerCompleted ?? tracker.ManagerCompleted;
                    tracker.SentToDeptHead = dto.SentToDeptHead ?? tracker.SentToDeptHead;
                    tracker.SentToLeadership = dto.SentToLeadership ?? tracker.SentToLeadership;
                    tracker.LastUpdated = DateTime.UtcNow;

                    await _repository.UpsertTrackerAsync(tracker);
                }

                await _repository.ReloadTrackerAsync(tracker);

                return new { success = true, message = "Form progress tracker saved successfully.", data = tracker };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error upserting tracker for assignment: {AssignmentId}", dto.AssignmentId);
                return new { success = false, message = $"Save failed: {ex.Message}" };
            }
        }
    }
}
