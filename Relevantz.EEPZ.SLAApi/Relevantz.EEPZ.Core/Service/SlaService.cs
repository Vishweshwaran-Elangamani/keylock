
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.Entities;
using Microsoft.Extensions.Logging;


namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class SlaService : ISlaService
    {
        private readonly ISlaRepository _slaRepository;
        private readonly IEmailService _emailService;

        private readonly ILogger<SlaService> _logger;

        public SlaService(
          ISlaRepository slaRepository,
          IEmailService emailService,
          ILogger<SlaService> logger)

        {
            _slaRepository = slaRepository;
            _emailService = emailService;
            _logger = logger;
        }

        #region Employee Methods

        public async Task<List<SlaResponse>> GetEmployeeSlas(int employeeId)
        {
            _logger.LogInformation("Retrieving SLAs for employee {EmployeeId}", employeeId);

            var slas = await _slaRepository.GetSlasByEmployeeIdAsync(employeeId);

            return slas.Select(s => new SlaResponse
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
                CreatedAt = s.CreatedAt ?? DateTime.MinValue,
                UpdatedAt = s.UpdatedAt ?? DateTime.MinValue
            }).ToList();
        }
        public async Task<EscalationResponse> SubmitEscalation(
            SubmitSlaEscalationRequest request,
            int userId,
            string? level)
        {
            _logger.LogInformation(
                "Processing escalation for SLA {Slaid} by User {UserId} with Level {Level}",
                request.Slaid, userId, level);

            var sla = await _slaRepository.GetSlaByIdAsync(request.Slaid)
                ?? throw new KeyNotFoundException("SLA not found");

            // Determine escalation level
            var escalationLevel = level?.ToLower() == "dept-head" ? "L2" : "L1";

            var escalation = new Slaescalation
            {
                Slaid = request.Slaid,
                Reason = request.Reason,
                Description = request.Description ?? string.Empty,
                EscalationLevel = escalationLevel,
                EscalatedToEmployeeId =
                    request.EscalatedToEmployeeId
                    ?? sla.AssignedToEmployeeId
                    ?? throw new Exception("Escalation target not found"),
                SubmittedByEmployeeId = userId,
                EscalationStatus = "Pending",
                SubmittedAt = DateTime.Now
            };

            var created = await _slaRepository.CreateEscalationAsync(escalation);


            await _slaRepository.AddHistoryAsync(new Slahistory
            {
                Slaid = request.Slaid,
                ChangeType = "Escalated",
                ChangedTo = escalationLevel,
                ChangedByEmployeeId = userId,
                Reason = request.Reason,
                CreatedAt = DateTime.Now
            });

            // Update SLA status
            sla.Status = "InProgress";
            await _slaRepository.UpdateSlaAsync(sla);

            _logger.LogInformation(
                "Escalation {EscalationId} created for SLA {Slaid}",
                created.EscalationId, request.Slaid);

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



            return new EscalationResponse
            {
                EscalationId = created.EscalationId,
                Slaid = request.Slaid,
                EscalationLevel = escalationLevel,
                EscalationStatus = "Pending",
                Reason = request.Reason,
                Description = request.Description,
                SubmittedAt = created.SubmittedAt
            };
        }

        public async Task<List<TeamReviewTrackingResponse>> GetTeamReviewTracking(int managerId)
        {
            var reviews = await _slaRepository.GetReviewTrackingByReviewerIdAsync(managerId);

            return reviews
                .Where(r => r.Status != "Closed")
                .Select(r => new TeamReviewTrackingResponse
                {
                    ReviewTrackingId = r.ReviewTrackingId,
                    Slaid = r.Slaid,
                    EmployeeId = r.EmployeeId,
                    EmployeeName = GetEmployeeName(r.Employee),
                    ReviewCycle = r.ReviewCycle ?? string.Empty,
                    Deadline = r.Deadline,
                    Status = r.Status ?? string.Empty,
                    ComplianceStatus = r.ComplianceStatus ?? string.Empty
                }).ToList();
        }


        public async Task<DepartmentComplianceResponse> GetDepartmentCompliance(int departmentId, string? period)
        {
            var effectivePeriod = string.IsNullOrWhiteSpace(period)
                ? "Current"
                : period.Trim();

            var compliance = await _slaRepository
                .GetComplianceByDepartmentAndPeriodAsync(departmentId, effectivePeriod);

            if (compliance == null)
            {
                return new DepartmentComplianceResponse
                {
                    DepartmentId = departmentId,
                    Period = effectivePeriod,
                    TotalSlas = 0,
                    OnTimeSlas = 0,
                    BreachedSlas = 0,
                    CompliancePercentage = 0
                };
            }

            return new DepartmentComplianceResponse
            {
                ComplianceId = compliance.ComplianceId,
                DepartmentId = compliance.DepartmentId,
                DepartmentName = compliance.Department?.DepartmentName ?? string.Empty,
                Period = compliance.Period ?? effectivePeriod,
                TotalSlas = compliance.TotalSlas,
                OnTimeSlas = compliance.OnTimeSlas,
                BreachedSlas = compliance.BreachedSlas,
                CompliancePercentage = compliance.CompliancePercentage ?? 0
            };
        }

        public async Task<ReopenSlaResponse> ReopenSla(int slaId, int extensionDays, string reason, int userId)
        {
            var sla = await _slaRepository.GetSlaByIdAsync(slaId)
                ?? throw new Exception("SLA not found");

            var oldDeadline = sla.Deadline;

            var success = await _slaRepository.ReopenSlaAsync(slaId, extensionDays, reason, userId);
            if (!success) throw new Exception("Failed to reopen SLA");

            DateTime newDeadline = DateTime.Now.AddDays(extensionDays);

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

            return new ReopenSlaResponse
            {
                OldDeadline = oldDeadline,
                NewDeadline = newDeadline,
                ExtensionDays = extensionDays
            };
        }

        public async Task<EscalationResponse> EscalateToDeptHead(SubmitSlaEscalationRequest request, int userId)
        {
            _logger.LogInformation("Escalating SLA {Slaid} to department head by User {UserId}", request.Slaid, userId);

            var sla = await _slaRepository.GetSlaByIdAsync(request.Slaid)
                ?? throw new Exception("SLA not found");

            var escalation = new Slaescalation
            {
                Slaid = request.Slaid,
                Reason = request.Reason,
                Description = request.Description ?? string.Empty,
                EscalationLevel = "L2",
                EscalatedToEmployeeId = request.EscalatedToEmployeeId ?? sla.AssignedToEmployeeId ?? 0,
                SubmittedByEmployeeId = userId,
                EscalationStatus = "Pending",
                SubmittedAt = DateTime.Now
            };

            var created = await _slaRepository.CreateEscalationAsync(escalation);


            await _slaRepository.AddHistoryAsync(new Slahistory
            {
                Slaid = request.Slaid,
                ChangeType = "Escalated",
                ChangedTo = "L2",
                ChangedByEmployeeId = userId,
                Reason = request.Reason,
                CreatedAt = DateTime.Now
            });

            sla.Status = "InProgress";
            await _slaRepository.UpdateSlaAsync(sla);

            _logger.LogInformation("Escalation {EscalationId} created for SLA {Slaid}", created.EscalationId, request.Slaid);


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




            return new EscalationResponse
            {
                EscalationId = created.EscalationId,
                Slaid = request.Slaid,
                EscalationLevel = "L2",
                EscalationStatus = "Pending",
                Reason = request.Reason,
                Description = request.Description,
                SubmittedAt = created.SubmittedAt,
                SubmittedByEmployeeId = userId,
                EscalatedToEmployeeId = escalation.EscalatedToEmployeeId
            };
        }

        /// <summary>
        /// Retrieves SLA history records and maps Slahistory entities
        /// to SlaHistoryResponse DTOs for API consumption.
        /// </summary>
        /// <param name="slaid">SLA identifier</param>
        /// <returns>List of mapped SLA history response objects</returns>
        public async Task<List<SlaHistoryResponse>> GetSlaHistory(int slaid)
        {
            var history = await _slaRepository.GetSlaHistoryAsync(slaid);

            return history.Select(h => new SlaHistoryResponse
            {
                SlahistoryId = h.SlahistoryId,
                Slaid = h.Slaid,
                ChangeType = h.ChangeType ?? string.Empty,
                ChangedFrom = h.ChangedFrom,
                ChangedTo = h.ChangedTo,
                ChangedByEmployeeId = h.ChangedByEmployeeId,
                ChangedByName = GetEmployeeName(h.ChangedByEmployee),
                Reason = h.Reason,
                CreatedAt = h.CreatedAt
            }).ToList();
        }



        #endregion

        #region Department/HR Methods
        public async Task<List<EscalationResponse>> GetSlaEscalations(int slaId)
        {
            var escalations = await _slaRepository.GetEscalationsBySlaIdAsync(slaId);

            return escalations.Select(e => new EscalationResponse
            {
                EscalationId = e.EscalationId,
                Slaid = e.Slaid,
                EscalationLevel = e.EscalationLevel,
                EscalationStatus = e.EscalationStatus,
                Reason = e.Reason,
                Description = e.Description,
                SubmittedAt = e.SubmittedAt,

                SubmittedByEmployeeId = e.SubmittedByEmployeeId,
                SubmittedByName = GetEmployeeName(e.SubmittedByEmployee),

                EscalatedToEmployeeId = e.EscalatedToEmployeeId,
                EscalatedToName = GetEmployeeName(e.EscalatedToEmployee)
            }).ToList();
        }




        public async Task<string> ResolveEscalation(ResolveEscalationRequest request, int userId)
        {
            var escalation = await _slaRepository.GetEscalationByIdAsync(request.EscalationId)
                ?? throw new Exception("Escalation not found");

            escalation.EscalationStatus = request.EscalationStatus;
            escalation.ResolutionComments = request.ResolutionComments;
            escalation.ResolvedAt = DateTime.Now;
            escalation.ResolvedByEmployeeId = userId;

            await _slaRepository.UpdateEscalationAsync(escalation);

            return "Escalation resolved successfully";
        }
        public async Task<List<EscalationResponse>> GetManagerEscalations(int managerId)
        {
            var escalations = await _slaRepository.GetEscalationsByEscalatedToAsync(managerId);

            return escalations.Select(e => new EscalationResponse
            {
                EscalationId = e.EscalationId,
                Slaid = e.Slaid,
                EscalationLevel = e.EscalationLevel ?? string.Empty,
                EscalationStatus = e.EscalationStatus ?? string.Empty,
                Reason = e.Reason,
                Description = e.Description,
                SubmittedAt = e.SubmittedAt,

                EmployeeId = e.Sla?.EmployeeId ?? 0,
                EmployeeName = GetEmployeeName(e.Sla?.Employee),

                SubmittedByEmployeeId = e.SubmittedByEmployeeId,
                SubmittedByName = GetEmployeeName(e.SubmittedByEmployee),

                EscalatedToEmployeeId = e.EscalatedToEmployeeId,
                EscalatedToName = GetEmployeeName(e.EscalatedToEmployee)
            }).ToList();
        }



        public async Task<List<DepartmentComplianceResponse>> GetAllDepartmentCompliance(string? period)
        {
            var compliances = await _slaRepository.GetAllComplianceAsync(period);

            return compliances.Select(c => new DepartmentComplianceResponse
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
        }


        public async Task<DepartmentComplianceResponse> CalculateCompliance(CalculateComplianceRequest request)
        {
            if (string.IsNullOrEmpty(request.Period))
                request.Period = "Current";

            await _slaRepository.CalculateComplianceAsync(
                request.DepartmentId,
                request.Period,
                DateOnly.FromDateTime(request.PeriodStartDate),
                DateOnly.FromDateTime(request.PeriodEndDate)
            );

            var compliance = await _slaRepository.GetComplianceByDepartmentAndPeriodAsync(
                request.DepartmentId,
                request.Period
            );

            if (compliance == null)
            {
                return new DepartmentComplianceResponse
                {
                    DepartmentId = request.DepartmentId,
                    Period = request.Period,
                    TotalSlas = 0,
                    OnTimeSlas = 0,
                    BreachedSlas = 0,
                    CompliancePercentage = 0
                };
            }

            return new DepartmentComplianceResponse
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
        }
        public async Task<List<SlaResponse>> GetAllSlas()
        {
            var slas = await _slaRepository.GetAllSlasAsync();

            return slas.Select(s => new SlaResponse
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

                CreatedAt = s.CreatedAt ?? DateTime.MinValue,
                UpdatedAt = s.UpdatedAt ?? DateTime.MinValue
            }).ToList();
        }
        public async Task<CreateSlaResponse> CreateSla(CreateSlaRequest request, int userId)
        {
            var employee = await _slaRepository.GetEmployeeByIdAsync(request.EmployeeId)
                ?? throw new Exception("Employee not found");

            if (!employee.ReportingManagerEmployeeId.HasValue)
                throw new Exception("Employee has no reporting manager");

            var sla = new Sla
            {
                Slatype = request.Slatype,
                EmployeeId = request.EmployeeId,
                AssignedToEmployeeId = employee.ReportingManagerEmployeeId.Value, // ONLY MANAGER
                DepartmentId = request.DepartmentId,
                Deadline = request.Deadline,
                Status = "Open",
                ComplianceStatus = "OnTime",
                CreatedByEmployeeId = userId,
                CreatedAt = DateTime.Now
            };

            var created = await _slaRepository.CreateSlaAsync(sla);

            var employeeEmail = employee.Userprofile?.PersonalEmail;
            var employeeName = GetEmployeeName(employee);

            if (!string.IsNullOrEmpty(employeeEmail))
            {
                int daysUntilDeadline = (int)(request.Deadline - DateTime.Now).TotalDays;

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


            return new CreateSlaResponse
            {
                Slaid = created.Slaid,
                CreatedAt = created.CreatedAt ?? DateTime.Now
            };
        }



        #endregion

        #region Common Methods

public async Task<bool> DeleteSla(int slaId)
{
    return await _slaRepository.DeleteSlaAsync(slaId);
}



        public async Task<SlaResponse?> GetSlaById(int slaid)
        {
            var sla = await _slaRepository.GetSlaByIdAsync(slaid);
            if (sla == null) return null;

            return new SlaResponse
            {
                Slaid = sla.Slaid,
                Slatype = sla.Slatype ?? string.Empty,
                Status = sla.Status ?? string.Empty,
                EmployeeId = sla.EmployeeId,
                EmployeeName = GetEmployeeName(sla.Employee),
                DepartmentId = sla.DepartmentId,
                DepartmentName = sla.Department?.DepartmentName ?? string.Empty,
                AssignedToEmployeeId = sla.AssignedToEmployeeId,
                AssignedToName = GetEmployeeName(sla.AssignedToEmployee),
                Deadline = sla.Deadline,
                ClosedAt = sla.ClosedAt,
                ComplianceStatus = sla.ComplianceStatus ?? string.Empty,
                CreatedAt = sla.CreatedAt ?? DateTime.MinValue,
                UpdatedAt = sla.UpdatedAt ?? DateTime.MinValue
            };
        }


        public async Task CloseSla(int slaId, int userId)
        {
            var success = await _slaRepository.CloseSlaAsync(slaId, userId);
            if (!success) throw new Exception("Failed to close SLA");
        }

        public async Task UpdateSla(int slaid, UpdateSlaRequest request, int userId)
        {
            var sla = await _slaRepository.GetSlaByIdAsync(slaid)
                ?? throw new Exception("SLA not found");

            if (!string.IsNullOrEmpty(request.Slatype)) sla.Slatype = request.Slatype;
            if (request.Deadline.HasValue) sla.Deadline = request.Deadline.Value;
            if (!string.IsNullOrEmpty(request.Status)) sla.Status = request.Status;

            if (request.AssignedToEmployeeId.HasValue)
                sla.AssignedToEmployeeId = request.AssignedToEmployeeId.Value;

            await _slaRepository.UpdateSlaAsync(sla);
        }


        public async Task<BulkCreateSlaResponse> BulkCreateSla(
        List<CreateSlaRequest> requests,
        int userId)
        {
            try
            {
                var nowUtc = DateTime.UtcNow;
                var slas = new List<Sla>();

                foreach (var r in requests)
                {
                    var employee = await _slaRepository.GetEmployeeByIdAsync(r.EmployeeId)
                        ?? throw new KeyNotFoundException($"Employee {r.EmployeeId} not found");

                    int assigneeId = employee.ReportingManagerEmployeeId ?? userId;

                    slas.Add(new Sla
                    {
                        Slatype = r.Slatype,
                        EmployeeId = r.EmployeeId,
                        AssignedToEmployeeId = assigneeId,
                        DepartmentId = r.DepartmentId,
                        Deadline = r.Deadline,
                        Status = "Open",
                        ComplianceStatus = "OnTime",
                        CreatedByEmployeeId = userId,
                        CreatedAt = nowUtc
                    });
                }

                var count = await _slaRepository.BulkInsertSlasAsync(slas);

                return new BulkCreateSlaResponse
                {
                    TotalRequested = requests.Count,
                    SuccessfulInserts = count,
                    FailedInserts = requests.Count - count,
                    CreatedAt = nowUtc
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error during BulkCreateSla | UserId: {UserId}",
                    userId);

                throw;
            }
        }




        #endregion

        #region Helpers
        private string GetEmployeeName(Employee? employee)
        {
            if (employee == null)
                return "Unassigned";

            if (employee.Userprofile != null)
            {
                var first = employee.Userprofile.FirstName ?? "";
                var last = employee.Userprofile.LastName ?? "";
                var full = $"{first} {last}".Trim();
                if (!string.IsNullOrWhiteSpace(full))
                    return full;
            }

            return $"Employee #{employee.EmployeeId}";
        }



        #endregion
    }
}
