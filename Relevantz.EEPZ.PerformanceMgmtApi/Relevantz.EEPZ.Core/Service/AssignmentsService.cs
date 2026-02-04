
using FluentValidation;

using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.DTOs.Response;

using Relevantz.EEPZ.Common.Validators; 




namespace Relevantz.EEPZ.Core.Services.Implementations
{
    
public class AssignmentsService : IAssignmentsService
{
    private readonly IAssignmentsRepository _repository;
    private readonly ILogger<AssignmentsService> _logger;
    private readonly IValidator<InitiateAppraisalRequestDto> _initiateValidator;

    public AssignmentsService(
        IAssignmentsRepository repository,
        ILogger<AssignmentsService> logger,
        IValidator<InitiateAppraisalRequestDto> initiateValidator)
    {
        _repository = repository;
        _logger = logger;
        _initiateValidator = initiateValidator;
    }


        
            

        public async Task<object> InitiateAppraisalAsync(InitiateAppraisalRequestDto request)
        {
            try
            {
                _logger.LogInformation("[INITIATE] Received {Count} employee IDs", request.UserIds?.Count ?? 0);

                var form = await _repository.GetFormByIdAsync(request.FormId);
                if (form == null)
                    return new { success = false, message = "Form not found." };

                var assigner = await _repository.GetUserByIdAsync(request.AssignedBy);
                if (assigner == null)
                    return new { success = false, message = "Assigning user not found." };

                var assignerDetails = await _repository.GetEmployeeDetailsByEmployeeIdAsync(assigner.EmployeeId);
                if (assignerDetails == null || assignerDetails.Role == null ||
                    !string.Equals(assignerDetails.Role.RoleCode, "HR", StringComparison.OrdinalIgnoreCase))
                {
                    return new { success = false, message = "Only HR users can initiate appraisals." };
                }

                var employeeIdsReceived = request.UserIds.ToList();
                _logger.LogInformation("[INITIATE] Converting employee IDs: {Ids}", string.Join(", ", employeeIdsReceived));

                var userIdMapping = new List<(int UserId, int EmployeeId)>();
                foreach (var empId in employeeIdsReceived)
                {
                    var user = await _repository.GetUserByEmployeeIdAsync(empId);
                    if (user != null)
                        userIdMapping.Add((user.UserId, user.EmployeeId));
                }

                if (userIdMapping.Count != employeeIdsReceived.Count)
                {
                    var foundEmpIds = userIdMapping.Select(m => m.EmployeeId).ToList();
                    var missing = employeeIdsReceived.Except(foundEmpIds).ToList();
                    return new { success = false, message = $"Some employee IDs not found: {string.Join(", ", missing)}" };
                }

                var userIds = userIdMapping.Select(m => m.UserId).ToList();
                _logger.LogInformation("[INITIATE] Mapped to user IDs: {Ids}", string.Join(", ", userIds));

                HashSet<int> eligibleUserIds = new HashSet<int>();

                if (form.Type == "Self")
                {
                    eligibleUserIds = await GetEligibleUserIdsForSelfFormAsync();
                }

                var allUserAuths = await _repository.GetUsersByIdsAsync(userIds);
                var userAuthDict = allUserAuths.ToDictionary(ua => ua.UserId);

                var allEmployeeIds = allUserAuths.Select(ua => ua.EmployeeId).ToList();
                var allUserDetails = await _repository.GetEmployeeDetailsByIdsAsync(allEmployeeIds);
                var userDetailsDict = allUserDetails.ToDictionary(ed => ed.EmployeeId);

                var responses = new List<object>();
                var skippedUsers = new List<object>();
                var deadlineDays = request.DeadlineInDays > 0 ? request.DeadlineInDays : 7;

                foreach (var userId in userIds)
                {
                    if (!userAuthDict.ContainsKey(userId))
                    {
                        skippedUsers.Add(new { UserId = userId, Reason = "User not found" });
                        continue;
                    }

                    var userAuth = userAuthDict[userId];
                    var userDetails = userDetailsDict.ContainsKey(userAuth.EmployeeId)
                        ? userDetailsDict[userAuth.EmployeeId]
                        : null;

                    var userRoleCode = userDetails?.Role?.RoleCode ?? string.Empty;

                    if (string.Equals(userRoleCode, "HR", StringComparison.OrdinalIgnoreCase))
                    {
                        skippedUsers.Add(new { EmployeeId = userAuth.EmployeeId, Reason = "HR cannot receive forms" });
                        continue;
                    }

                    if (form.Type == "Self")
                    {
                        if (string.Equals(userRoleCode, "ADMIN", StringComparison.OrdinalIgnoreCase))
                        {
                            skippedUsers.Add(new { EmployeeId = userAuth.EmployeeId, Reason = "Admin cannot receive Self forms" });
                            continue;
                        }

                        if (!eligibleUserIds.Contains(userId))
                        {
                            skippedUsers.Add(new { EmployeeId = userAuth.EmployeeId, Reason = "Not Eligible" });
                            continue;
                        }
                    }
                    else if (form.Type == "Manager")
                    {
                        if (!string.Equals(userRoleCode, "MGR", StringComparison.OrdinalIgnoreCase) &&
                            !string.Equals(userRoleCode, "MANAGER", StringComparison.OrdinalIgnoreCase))
                        {
                            skippedUsers.Add(new { EmployeeId = userAuth.EmployeeId, Reason = "Only managers can receive Manager forms" });
                            continue;
                        }
                    }

                    if (userId == request.AssignedBy)
                    {
                        skippedUsers.Add(new { EmployeeId = userAuth.EmployeeId, Reason = "Cannot assign to self" });
                        continue;
                    }

                    var alreadyAssigned = await _repository.AssignmentExistsAsync(request.FormId, userId, "Send");
                    if (alreadyAssigned)
                    {
                        skippedUsers.Add(new { EmployeeId = userAuth.EmployeeId, Reason = "Form already assigned" });
                        continue;
                    }

                    var assignment = new Assignment
                    {
                        FormId = request.FormId,
                        EmployeeId = userId,
                        AssignedBy = request.AssignedBy,
                        AssignedAt = DateTime.UtcNow,
                        Deadline = DateTime.UtcNow.AddDays(deadlineDays),
                        Action = request.Action
                    };

                    await _repository.AddAssignmentAsync(assignment);

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

                    await _repository.AddFormProgressTrackerAsync(progressTracker);

                    responses.Add(new
                    {
                        AssignmentId = assignment.AssignmentId,
                        EmployeeId = userAuth.EmployeeId,
                        Deadline = assignment.Deadline.HasValue
                            ? assignment.Deadline.Value.ToString("yyyy-MM-dd")
                            : string.Empty
                    });
                }

                var message = responses.Count > 0
                    ? $"Assignments created successfully for {responses.Count} employee(s)."
                    : "No assignments created. All selected employees were skipped.";

                return new
                {
                    success = true,
                    data = responses,
                    skipped = skippedUsers,
                    message
                };
            }
            catch (Exception ex)
            {
                _logger.LogError("[ERROR] InitiateAppraisal: {Message}", ex.Message);
                return new { success = false, message = $"Internal server error: {ex.Message}" };
            }
        }

        public async Task<object> GetUpcomingEligibleEmployeesAsync(int? formId = null)
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                var reminderDays = 60;
                var reminderDate = today.AddDays(reminderDays);
                var targetMonth = reminderDate.Month;
                var currentYear = today.Year;

                var activeUsers = await _repository.GetAllActiveUsersAsync();
                var activeEmployees = await _repository.GetActiveEmployeesAsync();
                var allUserProfiles = new Dictionary<int, Userprofile>();
                var allEmployeeDetails = new Dictionary<int, Employeedetailsmaster>();

                foreach (var emp in activeEmployees)
                {
                    var profile = await _repository.GetUserProfileByEmployeeIdAsync(emp.EmployeeId);
                    if (profile != null)
                        allUserProfiles[emp.EmployeeId] = profile;

                    var details = await _repository.GetEmployeeDetailsByEmployeeIdAsync(emp.EmployeeId);
                    if (details != null)
                        allEmployeeDetails[emp.EmployeeId] = details;
                }

                var employeesWithRoles = activeUsers
                    .Join(activeEmployees, ua => ua.EmployeeId, e => e.EmployeeId, (ua, e) => new { ua, e })
                    .Select(x => new
                    {
                        UserId = x.ua.UserId,
                        EmployeeId = x.e.EmployeeId,
                        JoiningDate = x.e.JoiningDate,
                        FirstName = allUserProfiles.ContainsKey(x.e.EmployeeId) ? allUserProfiles[x.e.EmployeeId].FirstName : null,
                        LastName = allUserProfiles.ContainsKey(x.e.EmployeeId) ? allUserProfiles[x.e.EmployeeId].LastName : null,
                        RoleCode = allEmployeeDetails.ContainsKey(x.e.EmployeeId) ? allEmployeeDetails[x.e.EmployeeId].Role?.RoleCode : null
                    })
                    .Where(x => x.RoleCode != "HR" && x.RoleCode != "ADMIN" && x.RoleCode != "DEPT_HEAD" && x.RoleCode != "LEADERSHIP")
                    .ToList();

                var eligibleEmployees = employeesWithRoles
                    .Select(e =>
                    {
                        var joiningDateTime = e.JoiningDate.ToDateTime(TimeOnly.MinValue);
                        var joiningMonth = joiningDateTime.Month;
                        var firstAppraisalMonth = joiningMonth <= 4 ? 4 : joiningMonth;
                        var eligibleMonth = (joiningDateTime.AddYears(1) < today) ? 4 : firstAppraisalMonth;

                        return new
                        {
                            e.UserId,
                            e.EmployeeId,
                            JoiningDate = joiningDateTime.ToString("yyyy-MM-dd"),
                            e.FirstName,
                            e.LastName,
                            Role = e.RoleCode,
                            EligibleMonth = new DateTime(currentYear, eligibleMonth, 1).ToString("MMMM"),
                            EligibleMonthNumber = eligibleMonth,
                            IsAprilAppraisalGroup = eligibleMonth == 4
                        };
                    })
                    .Where(x => x.EligibleMonthNumber == targetMonth)
                    .ToList();

                if (formId.HasValue)
                {
                    _logger.LogInformation("[ELIGIBLE] Filtering for formId: {FormId}", formId.Value);

                    var assignedUserIds = (await _repository.GetAssignmentsByFormIdAsync(formId.Value))
                        .Select(a => a.EmployeeId)
                        .ToList();

                    _logger.LogInformation("[ELIGIBLE] {Count} users already have form {FormId}", assignedUserIds.Count, formId.Value);

                    eligibleEmployees = eligibleEmployees
                        .Where(e => !assignedUserIds.Contains(e.UserId))
                        .ToList();

                    _logger.LogInformation("[ELIGIBLE] After filtering: {Count} employees available", eligibleEmployees.Count);
                }

                var sortedEmployees = eligibleEmployees
                    .OrderBy(x => x.FirstName)
                    .ToList();

                return new
                {
                    success = true,
                    data = sortedEmployees,
                    metadata = new
                    {
                        currentDate = today.ToString("yyyy-MM-dd"),
                        reminderDate = reminderDate.ToString("yyyy-MM-dd"),
                        targetMonth = new DateTime(currentYear, targetMonth, 1).ToString("MMMM yyyy"),
                        totalEligible = sortedEmployees.Count,
                        formId = formId,
                        filteredByForm = formId.HasValue
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError("[ERROR] GetUpcomingEligibleEmployees: {Message}", ex.Message);
                return new { success = false, message = $"Error: {ex.Message}" };
            }
        }

        public async Task<object> GetAvailableEmployeesForFormAsync(int formId)
        {
            try
            {
                _logger.LogInformation("[AVAILABLE] Getting available employees for formId: {FormId}", formId);

                var form = await _repository.GetFormByIdAsync(formId);
                if (form == null)
                {
                    return new { success = false, message = "Form not found" };
                }

                var activeUsers = await _repository.GetAllActiveUsersAsync();
                var activeEmployees = await _repository.GetActiveEmployeesAsync();

                var allUserProfiles = new Dictionary<int, Userprofile>();
                var allEmployeeDetails = new Dictionary<int, Employeedetailsmaster>();

                foreach (var emp in activeEmployees)
                {
                    var profile = await _repository.GetUserProfileByEmployeeIdAsync(emp.EmployeeId);
                    if (profile != null)
                        allUserProfiles[emp.EmployeeId] = profile;

                    var details = await _repository.GetEmployeeDetailsByEmployeeIdAsync(emp.EmployeeId);
                    if (details != null)
                        allEmployeeDetails[emp.EmployeeId] = details;
                }

                var allActiveEmployees = activeUsers
                    .Join(activeEmployees, ua => ua.EmployeeId, e => e.EmployeeId, (ua, e) => new { ua, e })
                    .Where(x => allEmployeeDetails.ContainsKey(x.e.EmployeeId) && 
                                x.e.EmploymentStatus == "Active" && 
                                x.e.IsActive == true)
                    .Select(x => new
                    {
                        UserId = x.ua.UserId,
                        EmployeeId = x.e.EmployeeId,
                        FirstName = allUserProfiles.ContainsKey(x.e.EmployeeId) ? allUserProfiles[x.e.EmployeeId].FirstName : null,
                        LastName = allUserProfiles.ContainsKey(x.e.EmployeeId) ? allUserProfiles[x.e.EmployeeId].LastName : null,
                        RoleCode = allEmployeeDetails[x.e.EmployeeId].Role?.RoleCode,
                        JoiningDate = x.e.JoiningDate.ToDateTime(TimeOnly.MinValue)
                    })
                    .Where(e => e.RoleCode != "HR" && e.RoleCode != "ADMIN")
                    .ToList();

                _logger.LogInformation("[AVAILABLE] Found {Count} total active employees", allActiveEmployees.Count);

                var assignedUserIds = (await _repository.GetAssignmentsByFormIdAsync(formId))
                    .Select(a => a.EmployeeId)
                    .ToList();

                _logger.LogInformation("[AVAILABLE] {Count} employees already have form {FormId}", assignedUserIds.Count, formId);

                var availableEmployees = allActiveEmployees
                    .Where(e => !assignedUserIds.Contains(e.UserId))
                    .Select(e => new
                    {
                        e.EmployeeId,
                        e.UserId,
                        EmployeeName = $"{e.FirstName} {e.LastName}".Trim(),
                        e.FirstName,
                        e.LastName,
                        e.RoleCode,
                        JoiningDate = e.JoiningDate.ToString("yyyy-MM-dd")
                    })
                    .OrderBy(e => e.FirstName)
                    .ToList();

                _logger.LogInformation("[AVAILABLE] {Count} employees available for form {FormId}", availableEmployees.Count, formId);

                return new
                {
                    success = true,
                    data = availableEmployees,
                    metadata = new
                    {
                        formId = formId,
                        formName = form.Name,
                        totalAvailable = availableEmployees.Count,
                        totalAlreadyAssigned = assignedUserIds.Count
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError("[ERROR] GetAvailableEmployeesForForm: {Message}", ex.Message);
                return new { success = false, message = $"Error: {ex.Message}" };
            }
        }

        public async Task<object> GetAssignmentsByEmployeeIdAsync(int employeeId)
        {
            try
            {
                _logger.LogInformation("[DEBUG] Fetching assignments for employeeId: {EmployeeId}", employeeId);

                var userAuth = await _repository.GetUserByEmployeeIdAsync(employeeId);
                if (userAuth == null)
                {
                    return new
                    {
                        success = true,
                        data = new List<object>(),
                        message = $"No user found for employee ID {employeeId}"
                    };
                }

                var userId = userAuth.UserId;
                _logger.LogInformation("[DEBUG] Mapped employeeId {EmployeeId} to userId {UserId}", employeeId, userId);

                var assignments = await _repository.GetAssignmentsByUserIdAsync(userId);

                _logger.LogInformation("[DEBUG] Found {Count} assignments", assignments.Count);

                if (!assignments.Any())
                {
                    return new
                    {
                        success = true,
                        data = new List<object>(),
                        message = "0 assignment(s) found."
                    };
                }

                var profile = await _repository.GetUserProfileByEmployeeIdAsync(employeeId);
                string employeeName = profile != null
                    ? $"{profile.FirstName} {profile.LastName}".Trim()
                    : $"Employee {employeeId}";

                var result = new List<object>();
                foreach (var assignment in assignments)
                {
                    var isCompleted = await _repository.GetSelfAssessmentByFormAndEmployeeAsync(
                        assignment.FormId, userId) != null;

                    var competenciesList = assignment.Form?.Competencies?.Select(c => new
                    {
                        c.CompetencyId,
                        c.Name,
                        c.Description
                    }).ToList();

                    result.Add(new
                    {
                        assignment.AssignmentId,
                        assignment.FormId,
                        FormName = assignment.Form?.Name ?? "Unknown Form",
                        FormType = assignment.Form?.Type ?? "Unknown",
                        EmployeeId = employeeId,
                        EmployeeName = employeeName,
                        assignment.AssignedAt,
                        Deadline = assignment.Deadline?.ToString("yyyy-MM-dd"),
                        Competencies = competenciesList,
                        isCompleted = isCompleted
                    });
                }

                return new
                {
                    success = true,
                    data = result,
                    message = $"{result.Count} assignment(s) found."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError("[ERROR] GetAssignmentsByEmployeeId: {Message}", ex.Message);
                return new { success = false, message = $"Error: {ex.Message}" };
            }
        }

        public async Task<object> GetAllAssignmentsAsync()
        {
            try
            {
                var assignments = await _repository.GetAllAssignmentsAsync();

                var result = new List<object>();

                foreach (var assignment in assignments)
                {
                    var isSubmitted = await _repository.GetSelfAssessmentByFormAndEmployeeAsync(
                        assignment.FormId, assignment.EmployeeId) != null;

                    var profile = await _repository.GetUserProfileByEmployeeIdAsync(assignment.EmployeeId);

                    result.Add(new
                    {
                        assignment.AssignmentId,
                        assignment.FormId,
                        FormName = assignment.Form?.Name,
                        FormType = assignment.Form?.Type,
                        assignment.EmployeeId,
                        EmployeeName = profile != null ? $"{profile.FirstName} {profile.LastName}".Trim() : "Unknown",
                        assignment.Action,
                        assignment.AssignedAt,
                        IsSubmitted = isSubmitted
                    });
                }

                return new
                {
                    success = true,
                    data = result
                };
            }
            catch (Exception ex)
            {
                _logger.LogError("[ERROR] GetAllAssignments: {Message}", ex.Message);
                return new { success = false, message = $"Error: {ex.Message}" };
            }
        }

        public async Task<object> GetDraftAssignmentsAsync()
{
    try
    {
        var draftAssignments = await _repository.GetDraftAssignmentsAsync();

        var result = new List<object>();
        
        foreach (var a in draftAssignments)
        {
           var profile = await _repository.GetUserProfileByEmployeeIdAsync(a.EmployeeId);

            
            result.Add(new
            {
                a.AssignmentId,
                a.FormId,
                FormName = a.Form?.Name,
                a.EmployeeId,
                EmployeeName = profile != null ? $"{profile.FirstName} {profile.LastName}".Trim() : "Unknown"
            });
        }

        return new { success = true, data = result };
    }
    catch (Exception ex)
    {
        _logger.LogError("[ERROR] GetDraftAssignments: {Message}", ex.Message);
        return new { success = false, message = $"Error: {ex.Message}" };
    }
}


        public async Task<object> UpdateDraftAsync(int assignmentId, UpdateDraftRequestDto request)
        {
            try
            {
                var assignment = await _repository.GetAssignmentByIdAsync(assignmentId);
                if (assignment == null)
                    return new { success = false, message = "Assignment not found", data = false };

                assignment.Action = request.Action;
                assignment.AssignedAt = DateTime.UtcNow;

                await _repository.UpdateAssignmentAsync(assignment);

                return new { success = true, message = "Assignment updated successfully", data = true };
            }
            catch (Exception ex)
            {
                _logger.LogError("[ERROR] UpdateDraft: {Message}", ex.Message);
                return new { success = false, message = $"Error updating assignment: {ex.Message}", data = false };
            }
        }

        public async Task<object> GetAssignmentsByFormIdAsync(int formId)
        {
            try
            {
                var assignments = await _repository.GetAssignmentsByFormIdAsync(formId);

                return new
                {
                    success = true,
                    data = assignments
                };
            }
            catch (Exception ex)
            {
                _logger.LogError("[ERROR] GetAssignmentsByFormId: {Message}", ex.Message);
                return new { success = false, message = $"Error: {ex.Message}" };
            }
        }

        public async Task<object> DeleteAssignmentAsync(int assignmentId)
        {
            try
            {
                var assignment = await _repository.GetAssignmentByIdAsync(assignmentId);
                if (assignment == null)
                    return new { success = false, message = "Assignment not found" };

                await _repository.DeleteAssignmentAsync(assignmentId);

                return new { success = true, message = "Assignment deleted successfully" };
            }
            catch (Exception ex)
            {
                _logger.LogError("[ERROR] DeleteAssignment: {Message}", ex.Message);
                return new { success = false, message = $"Error: {ex.Message}" };
            }
        }

        public async Task<object> GetAssignmentDetailsAsync(int assignmentId)
        {
            try
            {
                var assignment = await _repository.GetAssignmentByIdAsync(assignmentId);
                if (assignment == null)
                    return new { success = false, message = "Assignment not found" };

                return new { success = true, data = assignment };
            }
            catch (Exception ex)
            {
                _logger.LogError("[ERROR] GetAssignmentDetails: {Message}", ex.Message);
                return new { success = false, message = $"Error: {ex.Message}" };
            }
        }

        private async Task<HashSet<int>> GetEligibleUserIdsForSelfFormAsync()
        {
            var today = DateTime.UtcNow.Date;
            var reminderDays = 60;
            var reminderDate = today.AddDays(reminderDays);
            var targetMonth = reminderDate.Month;

            var activeUsers = await _repository.GetAllActiveUsersAsync();
            var activeEmployees = await _repository.GetActiveEmployeesAsync();
            var allEmployeeDetails = await _repository.GetEmployeeDetailsByIdsAsync(
                activeEmployees.Select(e => e.EmployeeId).ToList());
            var detailsDict = allEmployeeDetails.ToDictionary(ed => ed.EmployeeId);

            var allEmployeesData = activeUsers
                .Join(activeEmployees, ua => ua.EmployeeId, e => e.EmployeeId, (ua, e) => new { ua, e })
                .Where(x => detailsDict.ContainsKey(x.e.EmployeeId) && 
                            detailsDict[x.e.EmployeeId].Role?.RoleCode != "HR" &&
                            detailsDict[x.e.EmployeeId].Role?.RoleCode != "ADMIN")
                .Select(x => new
                {
                    x.ua.UserId,
                    JoiningDate = x.e.JoiningDate.ToDateTime(TimeOnly.MinValue)
                })
                .ToList();

            return allEmployeesData
                .Where(e =>
                {
                    var joiningMonth = e.JoiningDate.Month;
                    var firstAppraisalMonth = joiningMonth <= 4 ? 4 : joiningMonth;
                    var eligibleMonth = (e.JoiningDate.AddYears(1) < today) ? 4 : firstAppraisalMonth;
                    return eligibleMonth == targetMonth;
                })
                .Select(e => e.UserId)
                .ToHashSet();
        }
    }
}
