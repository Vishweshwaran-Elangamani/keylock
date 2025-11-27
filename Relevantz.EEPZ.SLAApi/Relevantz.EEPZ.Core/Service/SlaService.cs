using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Core.Services.Implementations;
using Relevantz.EEPZ.Common.Entities;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Data.DBContexts;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class SlaService : ISlaService
    {
        private readonly ISlaRepository _slaRepository;
        private readonly EmailService _emailService;
        private readonly ILogger<SlaService> _logger;

        public SlaService(
            ISlaRepository slaRepository,
            EmailService emailService,
            ILogger<SlaService> logger)
        {
            _slaRepository = slaRepository;
            _emailService = emailService;
            _logger = logger;
        }

        #region Employee Methods

        public async Task<ApiResponse<List<SlaResponse>>> GetEmployeeSlas(int employeeId)
        {
            try
            {
                _logger.LogInformation("Retrieving SLAs for employee {EmployeeId}", employeeId);
                var slas = await _slaRepository.GetSlasByEmployeeIdAsync(employeeId);

                var responses = slas.Select(s => new SlaResponse
                {
                    Slaid = s.Slaid,
                    Slatype = s.Slatype ?? string.Empty,
                    Status = s.Status ?? string.Empty,
                    EmployeeId = s.EmployeeId,
                    EmployeeName = GetEmployeeName(s.Employee),
                    DepartmentId = s.DepartmentId,
                    DepartmentName = s.Department?.DepartmentName ?? string.Empty,
                    AssignedToEmployeeId = s.AssignedToEmployeeId,
                    AssignedToName = GetEmployeeName(s.AssignedToEmployee),
                    Deadline = s.Deadline,
                    ClosedAt = s.ClosedAt,
                    ComplianceStatus = s.ComplianceStatus ?? string.Empty,
                    RelatedEntityType = s.RelatedEntityType,
                    RelatedEntityId = s.RelatedEntityId,
                    ReopenedAt = s.ReopenedAt,
                    ReopenExtensionDays = s.ReopenExtensionDays,
                    ReopenReason = s.ReopenReason,
                    DaysUntilDeadline = (s.Deadline - DateTime.Now).Days,
                    CreatedAt = s.CreatedAt ?? DateTime.MinValue,
                    UpdatedAt = s.UpdatedAt ?? DateTime.MinValue
                }).ToList();

                return new ApiResponse<List<SlaResponse>> { Success = true, Message = "Success", Data = responses };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetEmployeeSlas");
                return new ApiResponse<List<SlaResponse>> { Success = false, Message = ex.Message };
            }
        }

        // ===== NEW: Submit Escalation with Email Notification =====
        public async Task<ApiResponse<EscalationResponse>> SubmitEscalation(SubmitSlaEscalationRequest request)
        {
            try
            {
                _logger.LogInformation("Submitting escalation for SLA {Slaid}", request.Slaid);
                var sla = await _slaRepository.GetSlaByIdAsync(request.Slaid);
                if (sla == null)
                    return new ApiResponse<EscalationResponse> { Success = false, Message = "SLA not found" };

                int escalatedId = request.EscalatedToEmployeeId ?? 0;
                int submittedId = request.SubmittedByEmployeeId ?? 0;

                await _slaRepository.CallSubmitEscalationProcedureAsync(
                    request.Slaid,
                    request.Reason,
                    request.Description ?? string.Empty,
                    request.EscalationLevel ?? "L1",
                    escalatedId,
                    submittedId
                );

                var escalations = await _slaRepository.GetEscalationsBySlaIdAsync(request.Slaid);
                var escalation = escalations.FirstOrDefault();

                // EMAIL: Send acknowledgment to employee
                var employeeEmail = sla.Employee?.Userprofile?.PersonalEmail;
                var employeeName = GetEmployeeName(sla.Employee);
               
                if (!string.IsNullOrEmpty(employeeEmail))
                {
                    await _emailService.SendEmployeeEscalationEmailAsync(
                        employeeEmail,
                        employeeName,
                        sla.Slatype,
                        request.Reason
                    );
                    _logger.LogInformation("Escalation acknowledgment email sent to {Email}", employeeEmail);
                }

                //  EMAIL: Notify Manager of escalation
                var manager = sla.AssignedToEmployee;
                var managerEmail = manager?.Userprofile?.PersonalEmail;
               
                if (!string.IsNullOrEmpty(managerEmail))
                {
                    int daysOverdue = (int)(DateTime.Now - sla.Deadline).TotalDays;
                    await _emailService.SendManagerEscalationEmailAsync(
                        managerEmail,
                        GetEmployeeName(manager),
                        employeeName,
                        sla.Slatype,
                        sla.Deadline,
                        daysOverdue
                    );
                    _logger.LogInformation("Manager escalation email sent to {Email}", managerEmail);
                }

                return new ApiResponse<EscalationResponse>
                {
                    Success = true,
                    Message = "Escalation submitted successfully",
                    Data = new EscalationResponse
                    {
                        EscalationId = escalation?.EscalationId ?? 0,
                        Slaid = request.Slaid,
                        Reason = request.Reason,
                        Description = request.Description,
                        EscalationLevel = request.EscalationLevel ?? "L1",
                        Message = "Escalation submitted successfully"
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SubmitEscalation");
                return new ApiResponse<EscalationResponse> { Success = false, Message = ex.Message };
            }
        }

        #endregion

        #region Manager Methods

        public async Task<ApiResponse<List<TeamReviewTrackingResponse>>> GetTeamReviewTracking(int managerId)
        {
            try
            {
                var reviews = await _slaRepository.GetReviewTrackingByReviewerIdAsync(managerId);

                // Only return OPEN reviews (exclude Closed)
                var filtered = reviews.Where(r => r.Status != "Closed").ToList();

                var responses = filtered.Select(r => new TeamReviewTrackingResponse
                {
                    ReviewTrackingId = r.ReviewTrackingId,
                    Slaid = r.Slaid,
                    EmployeeId = r.EmployeeId,
                    EmployeeName = GetEmployeeName(r.Employee),
                    ReviewCycle = r.ReviewCycle ?? string.Empty,
                    Deadline = r.Deadline,
                    Status = r.Status ?? string.Empty,
                    DaysUntilDeadline = (r.Deadline - DateTime.Now).Days,
                    ComplianceStatus = r.ComplianceStatus ?? string.Empty
                }).ToList();

                return new ApiResponse<List<TeamReviewTrackingResponse>> { Success = true, Data = responses };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetTeamReviewTracking");
                return new ApiResponse<List<TeamReviewTrackingResponse>> { Success = false, Message = ex.Message };
            }
        }

        public async Task<ApiResponse<DepartmentComplianceResponse>> GetDepartmentCompliance(int departmentId, string? period = null)
        {
            try
            {
                string p = period ?? "Current";
                var compliance = await _slaRepository.GetComplianceByDepartmentAndPeriodAsync(departmentId, p);

                if (compliance == null)
                    return new ApiResponse<DepartmentComplianceResponse>
                    {
                        Success = true,
                        Data = new DepartmentComplianceResponse
                        {
                            DepartmentId = departmentId,
                            Period = p,
                            TotalSlas = 0,
                            OnTimeSlas = 0,
                            BreachedSlas = 0,
                            CompliancePercentage = 0
                        }
                    };

                var data = new DepartmentComplianceResponse
                {
                    ComplianceId = compliance.ComplianceId,
                    DepartmentId = compliance.DepartmentId,
                    DepartmentName = compliance.Department?.DepartmentName ?? string.Empty,
                    Period = compliance.Period ?? string.Empty,
                    TotalSlas = compliance.TotalSlas,
                    OnTimeSlas = compliance.OnTimeSlas,
                    BreachedSlas = compliance.BreachedSlas,
                    CompliancePercentage = compliance.CompliancePercentage ?? 0
                };

                return new ApiResponse<DepartmentComplianceResponse> { Success = true, Data = data };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetDepartmentCompliance");
                return new ApiResponse<DepartmentComplianceResponse> { Success = false, Message = ex.Message };
            }
        }

        // ===== NEW: Reopen SLA with Email Notification =====
        public async Task<ApiResponse<ReopenSlaResponse>> ReopenSla(ReopenSlaRequest request)
        {
            try
            {
                var sla = await _slaRepository.GetSlaByIdAsync(request.Slaid);
                if (sla == null)
                    return new ApiResponse<ReopenSlaResponse> { Success = false, Message = "SLA not found" };

                DateTime oldDeadline = sla.Deadline;

                await _slaRepository.CallReopenSlaProcedureAsync(
                    request.Slaid,
                    request.ExtensionDays,
                    request.ReopenReason,
                    request.ReopenedByEmployeeId
                );

                DateTime newDeadline = DateTime.Now.AddDays(request.ExtensionDays);

                // EMAIL: Notify employee of SLA reopen
                var employeeEmail = sla.Employee?.Userprofile?.PersonalEmail;
                var employeeName = GetEmployeeName(sla.Employee);
               
                if (!string.IsNullOrEmpty(employeeEmail))
                {
                    await _emailService.SendSlaReopenEmailAsync(
                        employeeEmail,
                        employeeName,
                        sla.Slatype,
                        newDeadline
                    );
                    _logger.LogInformation("SLA reopen email sent to {Email}", employeeEmail);
                }

                return new ApiResponse<ReopenSlaResponse>
                {
                    Success = true,
                    Data = new ReopenSlaResponse
                    {
                        Message = "SLA reopened successfully",
                        OldDeadline = oldDeadline,
                        NewDeadline = newDeadline,
                        ExtensionDays = request.ExtensionDays
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ReopenSla");
                return new ApiResponse<ReopenSlaResponse> { Success = false, Message = ex.Message };
            }
        }

        // ===== NEW: Escalate to Dept Head with Email =====
        public async Task<ApiResponse<EscalationResponse>> EscalateToDeptHead(SubmitSlaEscalationRequest request)
        {
            try
            {
                _logger.LogInformation("Escalating to dept head for SLA {Slaid}", request.Slaid);

                var sla = await _slaRepository.GetSlaByIdAsync(request.Slaid);
                if (sla == null)
                    return new ApiResponse<EscalationResponse> { Success = false, Message = "SLA not found" };

                var escalation = new Slaescalation
                {
                    Slaid = request.Slaid,
                    Reason = request.Reason,
                    Description = request.Description ?? string.Empty,
                    EscalationLevel = "L2",
                    EscalatedToEmployeeId = request.EscalatedToEmployeeId ?? 0,
                    SubmittedByEmployeeId = request.SubmittedByEmployeeId ?? 0,
                    EscalationStatus = "Pending",
                    SubmittedAt = DateTime.Now
                };

                var created = await _slaRepository.CreateEscalationAsync(escalation);

                // EMAIL: Notify Dept Head of escalation
                var deptHead = await _slaRepository.GetEmployeeByIdAsync(request.EscalatedToEmployeeId ?? 0);
                var deptHeadEmail = deptHead?.Userprofile?.PersonalEmail;
                var manager = sla.AssignedToEmployee;
               
                if (!string.IsNullOrEmpty(deptHeadEmail))
                {
                    int daysOverdue = (int)(DateTime.Now - sla.Deadline).TotalDays;
                    await _emailService.SendDeptHeadEscalationEmailAsync(
                        deptHeadEmail,
                        GetEmployeeName(deptHead),
                        GetEmployeeName(sla.Employee),
                        GetEmployeeName(manager),
                        sla.Slatype,
                        sla.Deadline,
                        daysOverdue
                    );
                    _logger.LogInformation("Dept head escalation email sent to {Email}", deptHeadEmail);
                }

                return new ApiResponse<EscalationResponse>
                {
                    Success = true,
                    Message = "SLA escalated to department head successfully",
                    Data = new EscalationResponse
                    {
                        EscalationId = created.EscalationId,
                        Slaid = request.Slaid,
                        EscalationLevel = "L2",
                        Reason = request.Reason,
                        Message = "Escalation submitted successfully"
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in EscalateToDeptHead");
                return new ApiResponse<EscalationResponse> { Success = false, Message = ex.Message };
            }
        }

        public async Task<ApiResponse<List<SlaHistoryResponse>>> GetSlaHistory(int slaid)
        {
            try
            {
                var history = await _slaRepository.GetSlaHistoryAsync(slaid);
                var responses = history.Select(h => new SlaHistoryResponse
                {
                    SlahistoryId = h.SlahistoryId,
                    Slaid = h.Slaid,
                    ChangeType = h.ChangeType ?? string.Empty,
                    ChangedFrom = h.ChangedFrom,
                    ChangedTo = h.ChangedTo,
                    ChangedByEmployeeId = h.ChangedByEmployeeId,
                    Reason = h.Reason,
                    CreatedAt = h.CreatedAt
                }).ToList();

                return new ApiResponse<List<SlaHistoryResponse>> { Success = true, Data = responses };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetSlaHistory");
                return new ApiResponse<List<SlaHistoryResponse>> { Success = false, Message = ex.Message };
            }
        }

        #endregion

        #region Department/HR Methods

        public async Task<ApiResponse<List<DepartmentComplianceResponse>>> GetAllDepartmentCompliance(string? period = null)
        {
            try
            {
                var compliances = await _slaRepository.GetAllComplianceAsync(period);
                var responses = compliances.Select(c => new DepartmentComplianceResponse
                {
                    ComplianceId = c.ComplianceId,
                    DepartmentId = c.DepartmentId,
                    DepartmentName = c.Department?.DepartmentName ?? string.Empty,
                    Period = c.Period ?? string.Empty,
                    TotalSlas = c.TotalSlas,
                    OnTimeSlas = c.OnTimeSlas,
                    BreachedSlas = c.BreachedSlas,
                    CompliancePercentage = c.CompliancePercentage ?? 0
                }).ToList();

                return new ApiResponse<List<DepartmentComplianceResponse>> { Success = true, Data = responses };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetAllDepartmentCompliance");
                return new ApiResponse<List<DepartmentComplianceResponse>> { Success = false, Message = ex.Message };
            }
        }

        public async Task<ApiResponse<DepartmentComplianceResponse>> CalculateCompliance(CalculateComplianceRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Period))
                    request.Period = "Current";

                DateOnly startDate = DateOnly.FromDateTime(request.PeriodStartDate);
                DateOnly endDate = DateOnly.FromDateTime(request.PeriodEndDate);

                await _slaRepository.CallCalculateComplianceProcedureAsync(
                    request.DepartmentId,
                    request.Period,
                    startDate,
                    endDate
                );

                var compliance = await _slaRepository.GetComplianceByDepartmentAndPeriodAsync(
                    request.DepartmentId,
                    request.Period
                );

                if (compliance == null)
                {
                    return new ApiResponse<DepartmentComplianceResponse>
                    {
                        Success = true,
                        Message = "Compliance calculated (no SLAs in period)",
                        Data = new DepartmentComplianceResponse
                        {
                            ComplianceId = 0,
                            DepartmentId = request.DepartmentId,
                            DepartmentName = "Department",
                            Period = request.Period,
                            TotalSlas = 0,
                            OnTimeSlas = 0,
                            BreachedSlas = 0,
                            CompliancePercentage = 0,
                            CalculatedAt = DateTime.Now
                        }
                    };
                }

                return new ApiResponse<DepartmentComplianceResponse>
                {
                    Success = true,
                    Message = "Compliance calculated successfully",
                    Data = new DepartmentComplianceResponse
                    {
                        ComplianceId = compliance.ComplianceId,
                        DepartmentId = compliance.DepartmentId,
                        DepartmentName = compliance.Department?.DepartmentName ?? "Department",
                        Period = compliance.Period,
                        TotalSlas = compliance.TotalSlas,
                        OnTimeSlas = compliance.OnTimeSlas,
                        BreachedSlas = compliance.BreachedSlas,
                        CompliancePercentage = compliance.CompliancePercentage ?? 0,
                        CalculatedAt = DateTime.Now
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in CalculateCompliance");
                return new ApiResponse<DepartmentComplianceResponse>
                {
                    Success = false,
                    Message = $"Failed to calculate compliance: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<List<SlaResponse>>> GetAllSlas()
        {
            try
            {
                var slas = await _slaRepository.GetAllSlasAsync();
                var responses = slas.Select(s => new SlaResponse
                {
                    Slaid = s.Slaid,
                    Slatype = s.Slatype ?? string.Empty,
                    Status = s.Status ?? string.Empty,

                    //  Employee info
                    EmployeeId = s.EmployeeId,
                    EmployeeName = GetEmployeeName(s.Employee),
                    EmployeeEmail = s.Employee?.Userprofile?.PersonalEmail ?? string.Empty,

                    // Department
                    DepartmentId = s.DepartmentId,
                    DepartmentName = s.Department?.DepartmentName ?? string.Empty,

                    // Assigned to
                    AssignedToEmployeeId = s.AssignedToEmployeeId,
                    AssignedToName = GetEmployeeName(s.AssignedToEmployee),

                    // Dates & Status
                    Deadline = s.Deadline,
                    ClosedAt = s.ClosedAt,
                    ComplianceStatus = s.ComplianceStatus ?? string.Empty,
                    RelatedEntityType = s.RelatedEntityType,
                    RelatedEntityId = s.RelatedEntityId,
                    ReopenedAt = s.ReopenedAt,
                    ReopenExtensionDays = s.ReopenExtensionDays,
                    ReopenReason = s.ReopenReason,

                    // Timestamps
                    CreatedAt = s.CreatedAt ?? DateTime.MinValue,
                    UpdatedAt = s.UpdatedAt ?? DateTime.MinValue
                }).ToList();

                return new ApiResponse<List<SlaResponse>> { Success = true, Data = responses };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetAllSlas");
                return new ApiResponse<List<SlaResponse>> { Success = false, Message = ex.Message };
            }
        }

       // ===== FIXED: Create SLA with Reporting Manager Assignment =====
public async Task<ApiResponse<CreateSlaResponse>> CreateSla(CreateSlaRequest request)
{
    try
    {
        //  FIX: Fetch employee to get their reporting manager
        var employee = await _slaRepository.GetEmployeeByIdAsync(request.EmployeeId);
        if (employee == null)
        {
            return new ApiResponse<CreateSlaResponse>
            {
                Success = false,
                Message = $"Employee with ID {request.EmployeeId} not found"
            };
        }

        // FIX: Get the reporting manager ID from the employee record
        int? reportingManagerId = employee.ReportingManagerEmployeeId;
       
        if (reportingManagerId == null || reportingManagerId == 0)
        {
            return new ApiResponse<CreateSlaResponse>
            {
                Success = false,
                Message = $"Employee {employee.Userprofile?.FirstName} {employee.Userprofile?.LastName} does not have a reporting manager assigned"
            };
        }

        _logger.LogInformation(
            "Creating SLA for Employee {EmployeeId} ({EmployeeName}) - Assigned to Manager {ManagerId}",
            request.EmployeeId,
            GetEmployeeName(employee),
            reportingManagerId
        );

        var sla = new Sla
        {
            Slatype = request.Slatype,
            EmployeeId = request.EmployeeId,
            AssignedToEmployeeId = reportingManagerId.Value, 
            DepartmentId = request.DepartmentId,
            Deadline = request.Deadline,
            Status = "Open",
            ComplianceStatus = "OnTime",
            CreatedByEmployeeId = request.CreatedByEmployeeId,
            CreatedAt = DateTime.Now,
            RelatedEntityType = string.IsNullOrWhiteSpace(request.RelatedEntityType) ? null : request.RelatedEntityType,
            RelatedEntityId = request.RelatedEntityId.HasValue && request.RelatedEntityId.Value > 0 ? request.RelatedEntityId : null,
        };

        var created = await _slaRepository.CreateSlaAsync(sla);

        //EMAIL: Notify employee of new SLA assignment
        var employeeEmail = employee.Userprofile?.PersonalEmail;
        var employeeName = GetEmployeeName(employee);

        if (!string.IsNullOrEmpty(employeeEmail))
        {
            int daysUntilDeadline = (int)(request.Deadline - DateTime.Now).TotalDays;
           
            // For Day 0 (today), send reminder instead
            if (daysUntilDeadline == 0)
            {
                await _emailService.SendSlaReminderEmailAsync(
                    employeeEmail,
                    employeeName,
                    request.Slatype,
                    request.Deadline,
                    0
                );
            }
            else
            {
                // Send initial reminder (generic notification about new SLA)
                await _emailService.SendSlaReminderEmailAsync(
                    employeeEmail,
                    employeeName,
                    request.Slatype,
                    request.Deadline,
                    daysUntilDeadline
                );
            }
            _logger.LogInformation("SLA assignment email sent to {Email}", employeeEmail);
        }

        return new ApiResponse<CreateSlaResponse>
        {
            Success = true,
            Data = new CreateSlaResponse
            {
                Slaid = created.Slaid,
                Message = $"SLA created successfully and assigned to {GetEmployeeName(await _slaRepository.GetEmployeeByIdAsync(reportingManagerId.Value))}",
                CreatedAt = created.CreatedAt ?? DateTime.Now
            }
        };
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error in CreateSla");
        return new ApiResponse<CreateSlaResponse> { Success = false, Message = ex.Message };
    }
}

        #endregion

        #region Common Methods

        public async Task<ApiResponse<SlaResponse>> GetSlaById(int slaid)
        {
            try
            {
                var sla = await _slaRepository.GetSlaByIdAsync(slaid);
                if (sla == null)
                    return new ApiResponse<SlaResponse> { Success = false, Message = "SLA not found" };

                _logger.LogInformation($"🔍 SLA from repo - EmployeeId: {sla.EmployeeId}, Employee: {sla.Employee?.EmployeeId}, Userprofile: {sla.Employee?.Userprofile?.FirstName}");

                var employeeName = GetEmployeeName(sla.Employee);
                var departmentName = sla.Department?.DepartmentName ?? string.Empty;

                _logger.LogInformation($"📝 Mapped - EmployeeName: '{employeeName}', DepartmentName: '{departmentName}'");

                return new ApiResponse<SlaResponse>
                {
                    Success = true,
                    Data = new SlaResponse
                    {
                        Slaid = sla.Slaid,
                        Slatype = sla.Slatype ?? string.Empty,
                        Status = sla.Status ?? string.Empty,

                        // Employee info
                        EmployeeId = sla.EmployeeId,
                        EmployeeName = employeeName,
                        EmployeeEmail = sla.Employee?.Userprofile?.PersonalEmail ?? string.Empty,

                        // Department info
                        DepartmentId = sla.DepartmentId,
                        DepartmentName = departmentName,

                        // Assigned to info
                        AssignedToEmployeeId = sla.AssignedToEmployeeId,
                        AssignedToName = GetEmployeeName(sla.AssignedToEmployee),

                        // SLA details
                        Deadline = sla.Deadline,
                        ClosedAt = sla.ClosedAt,
                        ComplianceStatus = sla.ComplianceStatus ?? string.Empty,

                        // Reopen info
                        ReopenedAt = sla.ReopenedAt,
                        ReopenExtensionDays = sla.ReopenExtensionDays,
                        ReopenReason = sla.ReopenReason,

                        // Related entity
                        RelatedEntityType = sla.RelatedEntityType,
                        RelatedEntityId = sla.RelatedEntityId,

                        // Calculated fields
                        UrgencyStatus = sla.Status == "Closed" ? "Completed" :
                                       (sla.Deadline < DateTime.Now) ? "Overdue" : "OnTrack",
                        DaysUntilDeadline = (int)(sla.Deadline - DateTime.Now).TotalDays,

                        // Timestamps
                        CreatedAt = sla.CreatedAt ?? DateTime.MinValue,
                        UpdatedAt = sla.UpdatedAt ?? DateTime.MinValue
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetSlaById");
                return new ApiResponse<SlaResponse> { Success = false, Message = ex.Message };
            }
        }

        public async Task<ApiResponse<List<EscalationResponse>>> GetSlaEscalations(int slaid)
        {
            try
            {
                var escalations = await _slaRepository.GetEscalationsBySlaIdAsync(slaid);
                var responses = escalations.Select(e => new EscalationResponse
                {
                    EscalationId = e.EscalationId,
                    Slaid = e.Slaid,
                    EscalationLevel = e.EscalationLevel ?? string.Empty,
                    EscalationStatus = e.EscalationStatus ?? string.Empty,
                    Description = e.Description,
                    Reason = e.Reason,
                    SubmittedAt = e.SubmittedAt,

                    //  Submitted by
                    SubmittedByName = GetEmployeeName(e.SubmittedByEmployee),
                    SubmittedByEmployeeId = e.SubmittedByEmployeeId,
                    EmployeeEmail = e.SubmittedByEmployee?.Userprofile?.PersonalEmail ?? string.Empty,

                    //  Escalated to
                    EscalatedToName = GetEmployeeName(e.EscalatedToEmployee),
                    EscalatedToEmployeeId = e.EscalatedToEmployeeId,

                    // Resolved by
                    ResolvedByName = GetEmployeeName(e.ResolvedByEmployee),
                    ResolvedByEmployeeId = e.ResolvedByEmployeeId,

                    ResolutionComments = e.ResolutionComments,
                    ResolvedAt = e.ResolvedAt,

                    Message = e.Description ?? string.Empty
                }).ToList();

                return new ApiResponse<List<EscalationResponse>> { Success = true, Data = responses };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetSlaEscalations");
                return new ApiResponse<List<EscalationResponse>> { Success = false, Message = ex.Message };
            }
        }

        // ===== NEW: Close SLA with Email Notification =====
        public async Task<ApiResponse<string>> CloseSla(CloseSlaRequest request)
        {
            try
            {
                var sla = await _slaRepository.GetSlaByIdAsync(request.Slaid);
                if (sla == null)
                    return new ApiResponse<string> { Success = false, Message = "SLA not found" };

                var result = await _slaRepository.CloseSlaAsync(request.Slaid, request.ClosedByEmployeeId);
                if (!result)
                    return new ApiResponse<string> { Success = false, Message = "Failed to close SLA" };

                // EMAIL: Notify employee of SLA completion
                var employeeEmail = sla.Employee?.Userprofile?.PersonalEmail;
                var employeeName = GetEmployeeName(sla.Employee);

                if (!string.IsNullOrEmpty(employeeEmail))
                {
                    await _emailService.SendSlaCompletionEmailAsync(
                        employeeEmail,
                        employeeName,
                        sla.Slatype,
                        DateTime.Now
                    );
                    _logger.LogInformation("SLA completion email sent to {Email}", employeeEmail);
                }

                return new ApiResponse<string> { Success = true, Data = "SLA closed successfully" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in CloseSla");
                return new ApiResponse<string> { Success = false, Message = ex.Message };
            }
        }

        // ===== NEW: Resolve Escalation with Email Notification =====
        public async Task<ApiResponse<string>> ResolveEscalation(ResolveEscalationRequest request)
        {
            try
            {
                var escalation = await _slaRepository.GetEscalationByIdAsync(request.EscalationId);
                if (escalation == null)
                    return new ApiResponse<string> { Success = false, Message = "Escalation not found" };

                escalation.EscalationStatus = request.EscalationStatus;
                escalation.ResolutionComments = request.ResolutionComments;
                escalation.ResolvedAt = DateTime.Now;
                escalation.ResolvedByEmployeeId = request.ResolvedByEmployeeId;

                await _slaRepository.UpdateEscalationAsync(escalation);

                // EMAIL: Notify submitter of resolution
                var submittedByEmployee = escalation.SubmittedByEmployee;
                var submittedByEmail = submittedByEmployee?.Userprofile?.PersonalEmail;

                if (!string.IsNullOrEmpty(submittedByEmail))
                {
                    // You could send a resolution notification here
                    _logger.LogInformation("Escalation resolution notification prepared for {Email}", submittedByEmail);
                }

                return new ApiResponse<string> { Success = true, Data = "Escalation resolved successfully" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ResolveEscalation");
                return new ApiResponse<string> { Success = false, Message = ex.Message };
            }
        }

        public async Task<ApiResponse<List<EscalationResponse>>> GetManagerEscalations(int managerId)
        {
            try
            {
                var escalations = await _slaRepository.GetEscalationsByEscalatedToAsync(managerId);
                var responses = escalations.Select(e => new EscalationResponse
                {
                    EscalationId = e.EscalationId,
                    Slaid = e.Slaid,
                    Reason = e.Reason ?? string.Empty,
                    Description = e.Description,
                    EscalationLevel = e.EscalationLevel ?? string.Empty,
                    EscalationStatus = e.EscalationStatus ?? string.Empty,
                    SubmittedAt = e.SubmittedAt ?? DateTime.Now,

                    // Employee being reviewed
                    EmployeeId = e.Sla?.EmployeeId,
                    EmployeeName = GetEmployeeName(e.Sla?.Employee),
                    EmployeeEmail = e.Sla?.Employee?.Userprofile?.PersonalEmail ?? string.Empty,

                    // Manager who escalated
                    SubmittedByName = GetEmployeeName(e.SubmittedByEmployee),
                    SubmittedByEmployeeId = e.SubmittedByEmployeeId,

                    // Dept Head (you)
                    EscalatedToName = GetEmployeeName(e.EscalatedToEmployee),
                    EscalatedToEmployeeId = e.EscalatedToEmployeeId,

                    // Resolution
                    ResolvedByName = GetEmployeeName(e.ResolvedByEmployee),
                    ResolvedByEmployeeId = e.ResolvedByEmployeeId,
                    ResolvedAt = e.ResolvedAt,
                    ResolutionComments = e.ResolutionComments,

                    Message = e.Description ?? string.Empty
                }).ToList();

                return new ApiResponse<List<EscalationResponse>> { Success = true, Data = responses };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetManagerEscalations");
                return new ApiResponse<List<EscalationResponse>> { Success = false, Message = ex.Message };
            }
        }

        public async Task<ApiResponse<SlaResponse>> UpdateSla(int slaid, UpdateSlaRequest request)
        {
            try
            {
                var sla = await _slaRepository.GetSlaByIdAsync(slaid);
                if (sla == null)
                    return new ApiResponse<SlaResponse> { Success = false, Message = "SLA not found" };

                if (!string.IsNullOrEmpty(request.Slatype))
                    sla.Slatype = request.Slatype;
                if (request.AssignedToEmployeeId.HasValue)
                    sla.AssignedToEmployeeId = request.AssignedToEmployeeId.Value;
                if (request.Deadline.HasValue)
                    sla.Deadline = request.Deadline.Value;
                if (!string.IsNullOrEmpty(request.Status))
                    sla.Status = request.Status;
                if (!string.IsNullOrEmpty(request.ComplianceStatus))
                    sla.ComplianceStatus = request.ComplianceStatus;

                await _slaRepository.UpdateSlaAsync(sla);
                return new ApiResponse<SlaResponse> { Success = true, Message = "SLA updated successfully" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in UpdateSla");
                return new ApiResponse<SlaResponse> { Success = false, Message = ex.Message };
            }
        }

        public async Task<ApiResponse<string>> DeleteSla(int slaid)
        {
            try
            {
                await _slaRepository.DeleteSlaAsync(slaid);
                return new ApiResponse<string> { Success = true, Data = "SLA deleted successfully" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in DeleteSla");
                return new ApiResponse<string> { Success = false, Message = ex.Message };
            }
        }
        public async Task<ApiResponse<BulkCreateSlaResponse>> BulkCreateSla(List<CreateSlaRequest> requests)
        {
            try
            {
                _logger.LogInformation("Starting bulk SLA creation for {Count} records", requests.Count);

                // Validate input
                if (requests == null || !requests.Any())
                {
                    return new ApiResponse<BulkCreateSlaResponse>
                    {
                        Success = false,
                        Message = "No SLA requests provided"
                    };
                }

                if (requests.Count > 10000)
                {
                    return new ApiResponse<BulkCreateSlaResponse>
                    {
                        Success = false,
                        Message = "Maximum 10,000 SLAs allowed per bulk operation"
                    };
                }

                // Get all unique employee IDs and fetch employee data
                var employeeIds = requests.Select(r => r.EmployeeId).Distinct().ToList();
                var employees = await _slaRepository.GetEmployeesByIdsAsync(employeeIds);
                var employeeDict = employees.ToDictionary(e => e.EmployeeId, e => e);

                var slasToInsert = new List<Sla>();
                var failedRecords = new List<string>();
                var now = DateTime.Now;

                // Build list of SLA entities
                foreach (var request in requests)
                {
                    // Validate employee exists
                    if (!employeeDict.TryGetValue(request.EmployeeId, out var employee))
                    {
                        failedRecords.Add($"Employee {request.EmployeeId} not found");
                        continue;
                    }

                    // Validate reporting manager exists
                    var reportingManagerId = employee.ReportingManagerEmployeeId;
                    if (reportingManagerId == null || reportingManagerId == 0)
                    {
                        failedRecords.Add($"Employee {request.EmployeeId} ({GetEmployeeName(employee)}) has no reporting manager");
                        continue;
                    }

                    // Create SLA entity
                    slasToInsert.Add(new Sla
                    {
                        Slatype = request.Slatype,
                        EmployeeId = request.EmployeeId,
                        AssignedToEmployeeId = reportingManagerId.Value,
                        DepartmentId = request.DepartmentId,
                        Deadline = request.Deadline,
                        Status = "Open",
                        ComplianceStatus = "OnTime",
                        CreatedByEmployeeId = request.CreatedByEmployeeId,
                        CreatedAt = now,
                        UpdatedAt = now,
                        RelatedEntityType = string.IsNullOrWhiteSpace(request.RelatedEntityType) 
                            ? null : request.RelatedEntityType,
                        RelatedEntityId = request.RelatedEntityId.HasValue && request.RelatedEntityId.Value > 0 
                            ? request.RelatedEntityId : null
                    });
                }

                // Perform bulk insert using AddRange
                var insertedCount = 0;
                if (slasToInsert.Any())
                {
                    insertedCount = await _slaRepository.BulkInsertSlasAsync(slasToInsert);
                    _logger.LogInformation("Bulk insert completed: {Count} records inserted", insertedCount);
                }

                // Send email notifications in background (fire-and-forget)
                _ = Task.Run(async () =>
                {
                    try
                    {
                        foreach (var request in requests)
                        {
                            if (employeeDict.TryGetValue(request.EmployeeId, out var emp))
                            {
                                var email = emp.Userprofile?.PersonalEmail;
                                if (!string.IsNullOrEmpty(email))
                                {
                                    var daysUntilDeadline = (int)(request.Deadline - DateTime.Now).TotalDays;
                                    await _emailService.SendSlaReminderEmailAsync(
                                        email,
                                        GetEmployeeName(emp),
                                        request.Slatype,
                                        request.Deadline,
                                        daysUntilDeadline
                                    );
                                }
                            }
                        }
                        _logger.LogInformation("Bulk SLA email notifications sent successfully");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error sending bulk SLA email notifications");
                    }
                });

                return new ApiResponse<BulkCreateSlaResponse>
                {
                    Success = true,
                    Message = $"Bulk insert completed: {insertedCount} successful, {failedRecords.Count} failed",
                    Data = new BulkCreateSlaResponse
                    {
                        TotalRequested = requests.Count,
                        SuccessfulInserts = insertedCount,
                        FailedInserts = failedRecords.Count,
                        FailedRecords = failedRecords,
                        CreatedAt = now,
                        Message = failedRecords.Any() 
                            ? "Bulk creation completed with some failures" 
                            : "All SLAs created successfully"
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in BulkCreateSla");
                return new ApiResponse<BulkCreateSlaResponse>
                {
                    Success = false,
                    Message = $"Bulk insert failed: {ex.Message}"
                };
            }
        }

        #endregion

        #region Helpers


        private string GetEmployeeName(Employee employee)
        {
            if (employee?.Userprofile != null)
            {
                var firstName = employee.Userprofile.FirstName ?? string.Empty;
                var lastName = employee.Userprofile.LastName ?? string.Empty;
                return $"{firstName} {lastName}".Trim();
            }
            return "Employee";
        }

        #endregion
    }
}
