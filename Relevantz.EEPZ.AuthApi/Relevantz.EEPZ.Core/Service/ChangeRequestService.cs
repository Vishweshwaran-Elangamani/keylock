using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Constants;
namespace Relevantz.EEPZ.Core.Service
{
    public class ChangeRequestService : IChangeRequestService
    {
        private readonly IChangeRequestRepository _changeRequestRepository;
        private readonly IUserAuthenticationRepository _userAuthRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IEmailService _emailService;
        public ChangeRequestService(
            IChangeRequestRepository changeRequestRepository,
            IUserAuthenticationRepository userAuthRepository,
            IEmployeeRepository employeeRepository,
            IEmailService emailService)
        {
            _changeRequestRepository = changeRequestRepository;
            _userAuthRepository = userAuthRepository;
            _employeeRepository = employeeRepository;
            _emailService = emailService;
        }
        public async Task<ChangeRequestResponseDto> SubmitChangeRequestAsync(int userId, ChangeRequestDto request)
        {
            var user = await _userAuthRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new InvalidOperationException(Constants.Messages.UserNotFound);
            }
            // CHECK IF USER IS PROTECTED EMPLOYEE (EmployeeCompanyID = 1000)
            var employeeCompanyId = user.Employee?.EmployeeCompanyId;
            if (!string.IsNullOrEmpty(employeeCompanyId) && employeeCompanyId == "1000")
            {
                EEPZBusinessLog.Warning($"Change request blocked for protected employee: UserId {userId} (EmployeeCompanyID: {employeeCompanyId})");
                throw new InvalidOperationException(ChangeRequestMessages.ProtectedAccountChangeNotAllowed);
            }
            // Validate password
            if (string.IsNullOrWhiteSpace(request.CurrentPassword))
            {
                throw new ArgumentException(ChangeRequestMessages.CurrentPasswordRequired);
            }
            // Use PasswordHash instead of Password
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash);
            if (!isPasswordValid)
            {
                EEPZBusinessLog.Warning($"Invalid password attempt for change request by UserId: {userId}");
                throw new UnauthorizedAccessException(ChangeRequestMessages.InvalidPassword);
            }
            // Check if user already has a pending request
            var existingRequests = await _changeRequestRepository.GetByEmployeeIdAsync(user.EmployeeId);
            var hasPendingRequest = existingRequests.Any(r => r.Status == Constants.RequestStatuses.Pending);
            if (hasPendingRequest)
            {
                throw new InvalidOperationException(ChangeRequestMessages.PendingRequestExists);
            }
            string? currentValue = null;
            string? newValue = null;
            string? newEmail = null;
            string? newEmployeeCompanyId = null;
            if (request.ChangeType == Constants.ChangeTypes.Email)
            {
                if (string.IsNullOrWhiteSpace(request.NewEmail))
                {
                    throw new ArgumentException(ChangeRequestMessages.NewEmailRequired);
                }
                if (!ValidationHelper.IsValidEmail(request.NewEmail))
                {
                    throw new ArgumentException(ChangeRequestMessages.InvalidEmailFormat);
                }
                currentValue = user.Email;
                newValue = request.NewEmail;
                newEmail = request.NewEmail;
                if (user.Email?.ToLower() == request.NewEmail.ToLower())
                {
                    throw new InvalidOperationException(ChangeRequestMessages.EmailSameAsCurrent);
                }
                bool emailExists = await _changeRequestRepository.IsEmailAlreadyExistsAsync(request.NewEmail, userId);
                if (emailExists)
                {
                    throw new InvalidOperationException(ChangeRequestMessages.EmailAlreadyExists);
                }
            }
            else if (request.ChangeType == Constants.ChangeTypes.EmployeeCompanyId)
            {
                if (string.IsNullOrWhiteSpace(request.NewEmployeeCompanyId))
                {
                    throw new ArgumentException(ChangeRequestMessages.NewEmployeeCompanyIdRequired);
                }
                currentValue = user.Employee?.EmployeeCompanyId;
                newValue = request.NewEmployeeCompanyId;
                newEmployeeCompanyId = request.NewEmployeeCompanyId;
                if (user.Employee?.EmployeeCompanyId?.ToLower() == request.NewEmployeeCompanyId.ToLower())
                {
                    throw new InvalidOperationException(ChangeRequestMessages.EmployeeCompanyIdSameAsCurrent);
                }
                bool companyIdExists = await _changeRequestRepository.IsEmployeeCompanyIdExistsAsync(request.NewEmployeeCompanyId, user.EmployeeId);
                if (companyIdExists)
                {
                    throw new InvalidOperationException(ChangeRequestMessages.EmployeeCompanyIdAlreadyExists);
                }
            }
            else
            {
                throw new ArgumentException(string.Format(ChangeRequestMessages.InvalidChangeType, request.ChangeType));
            }
            var changeRequest = new Changerequest
            {
                EmployeeId = user.EmployeeId,
                ChangeType = request.ChangeType,
                NewEmployeeCompanyId = newEmployeeCompanyId,
                NewEmail = newEmail,
                CurrentValue = currentValue,
                NewValue = newValue,
                Reason = request.Reason,
                Status = Constants.RequestStatuses.Pending,
                RequestedByUserId = userId,
                RequestedAt = DateTime.UtcNow,
                CurrentPassword = user.PasswordHash
            };
            await _changeRequestRepository.CreateAsync(changeRequest);
            var firstName = user.Employee?.Userprofile?.FirstName ?? "User";
            await _emailService.SendChangeRequestNotificationAsync(user.Email ?? "", firstName, request.ChangeType, newValue ?? string.Empty);
            // Ad-hoc mapping
            var profile = changeRequest.Employee?.Userprofile;
            var response = new ChangeRequestResponseDto
            {
                RequestId = changeRequest.RequestId,
                EmployeeId = changeRequest.EmployeeId,
                EmployeeCompanyId = changeRequest.Employee?.EmployeeCompanyId ?? string.Empty,
                EmployeeName = profile != null ? $"{profile.FirstName} {profile.LastName}" : string.Empty,
                ChangeType = changeRequest.ChangeType,
                CurrentValue = changeRequest.CurrentValue,
                NewValue = changeRequest.NewValue,
                Reason = changeRequest.Reason,
                Status = changeRequest.Status,
                AdminRemarks = changeRequest.AdminRemarks,
                RequestedAt = changeRequest.RequestedAt,
                ProcessedAt = changeRequest.ProcessedAt
            };
            EEPZBusinessLog.Information($"Change request submitted by UserId: {userId}, ChangeType: {request.ChangeType}");
            return response;
        }
        public async Task<ChangeRequestResponseDto> ProcessChangeRequestAsync(ProcessChangeRequestDto request, int adminUserId)
        {
            var changeRequest = await _changeRequestRepository.GetByIdAsync(request.RequestId);
            if (changeRequest == null)
            {
                throw new KeyNotFoundException(ChangeRequestMessages.ChangeRequestNotFound);
            }
            if (changeRequest.Status != Constants.RequestStatuses.Pending)
            {
                throw new InvalidOperationException(ChangeRequestMessages.ChangeRequestAlreadyProcessed);
            }
            // Prevent processing for protected employees (EmployeeCompanyID = 1000)
            var employee = await _employeeRepository.GetByIdAsync(changeRequest.EmployeeId);
            if (employee != null && !string.IsNullOrEmpty(employee.EmployeeCompanyId) && employee.EmployeeCompanyId == "1000")
            {
                EEPZBusinessLog.Warning($"Attempt to process change request for protected employee: EmployeeId {changeRequest.EmployeeId} (EmployeeCompanyID: {employee.EmployeeCompanyId})");
                throw new InvalidOperationException(ChangeRequestMessages.ProtectedAccountProcessNotAllowed);
            }
            changeRequest.Status = request.Status;
            changeRequest.ApprovedByUserId = adminUserId;
            changeRequest.AdminRemarks = request.AdminRemarks;
            changeRequest.ProcessedAt = DateTime.UtcNow;
            if (request.Status == Constants.RequestStatuses.Approved)
            {
                if (changeRequest.ChangeType == Constants.ChangeTypes.Email && !string.IsNullOrEmpty(changeRequest.NewEmail))
                {
                    var user = await _userAuthRepository.GetByEmployeeIdAsync(changeRequest.EmployeeId);
                    if (user != null)
                    {
                        user.Email = changeRequest.NewEmail;
                        await _userAuthRepository.UpdateAsync(user);
                        EEPZBusinessLog.Information($"Email updated for EmployeeId: {changeRequest.EmployeeId}, New Email: {changeRequest.NewEmail}");
                    }
                }
                else if (changeRequest.ChangeType == Constants.ChangeTypes.EmployeeCompanyId && !string.IsNullOrEmpty(changeRequest.NewEmployeeCompanyId))
                {
                    var employeeToUpdate = await _employeeRepository.GetByIdAsync(changeRequest.EmployeeId);
                    if (employeeToUpdate != null)
                    {
                        employeeToUpdate.EmployeeCompanyId = changeRequest.NewEmployeeCompanyId;
                        await _employeeRepository.UpdateAsync(employeeToUpdate);
                        EEPZBusinessLog.Information($"EmployeeCompanyId updated for EmployeeId: {changeRequest.EmployeeId}, New ID: {changeRequest.NewEmployeeCompanyId}");
                    }
                }
            }
            await _changeRequestRepository.UpdateAsync(changeRequest);
            // Ad-hoc mapping
            var profile = changeRequest.Employee?.Userprofile;
            var response = new ChangeRequestResponseDto
            {
                RequestId = changeRequest.RequestId,
                EmployeeId = changeRequest.EmployeeId,
                EmployeeCompanyId = changeRequest.Employee?.EmployeeCompanyId ?? string.Empty,
                EmployeeName = profile != null ? $"{profile.FirstName} {profile.LastName}" : string.Empty,
                ChangeType = changeRequest.ChangeType,
                CurrentValue = changeRequest.CurrentValue,
                NewValue = changeRequest.NewValue,
                Reason = changeRequest.Reason,
                Status = changeRequest.Status,
                AdminRemarks = changeRequest.AdminRemarks,
                RequestedAt = changeRequest.RequestedAt,
                ProcessedAt = changeRequest.ProcessedAt
            };
            EEPZBusinessLog.Information($"Change request processed: RequestId {request.RequestId}, Status: {request.Status}");
            return response;
        }
        public async Task<List<ChangeRequestResponseDto>> GetPendingRequestsAsync()
        {
            var requests = await _changeRequestRepository.GetPendingRequestsAsync();
            var pendingOnly = requests.Where(r => r.Status == Constants.RequestStatuses.Pending).ToList();
            // Ad-hoc mapping for list
            var responses = pendingOnly.Select(changeRequest =>
            {
                var profile = changeRequest.Employee?.Userprofile;
                return new ChangeRequestResponseDto
                {
                    RequestId = changeRequest.RequestId,
                    EmployeeId = changeRequest.EmployeeId,
                    EmployeeCompanyId = changeRequest.Employee?.EmployeeCompanyId ?? string.Empty,
                    EmployeeName = profile != null ? $"{profile.FirstName} {profile.LastName}" : string.Empty,
                    ChangeType = changeRequest.ChangeType,
                    CurrentValue = changeRequest.CurrentValue,
                    NewValue = changeRequest.NewValue,
                    Reason = changeRequest.Reason,
                    Status = changeRequest.Status,
                    AdminRemarks = changeRequest.AdminRemarks,
                    RequestedAt = changeRequest.RequestedAt,
                    ProcessedAt = changeRequest.ProcessedAt
                };
            }).ToList();
            return responses;
        }
        public async Task<List<ChangeRequestResponseDto>> GetUserChangeRequestsAsync(int userId)
        {
            var user = await _userAuthRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException(Constants.Messages.UserNotFound);
            }
            var requests = await _changeRequestRepository.GetByEmployeeIdAsync(user.EmployeeId);
            // Ad-hoc mapping for list
            var responses = requests.Select(changeRequest =>
            {
                var profile = changeRequest.Employee?.Userprofile;
                return new ChangeRequestResponseDto
                {
                    RequestId = changeRequest.RequestId,
                    EmployeeId = changeRequest.EmployeeId,
                    EmployeeCompanyId = changeRequest.Employee?.EmployeeCompanyId ?? string.Empty,
                    EmployeeName = profile != null ? $"{profile.FirstName} {profile.LastName}" : string.Empty,
                    ChangeType = changeRequest.ChangeType,
                    CurrentValue = changeRequest.CurrentValue,
                    NewValue = changeRequest.NewValue,
                    Reason = changeRequest.Reason,
                    Status = changeRequest.Status,
                    AdminRemarks = changeRequest.AdminRemarks,
                    RequestedAt = changeRequest.RequestedAt,
                    ProcessedAt = changeRequest.ProcessedAt
                };
            }).ToList();
            return responses;
        }
        public async Task<List<ChangeRequestResponseDto>> GetAllChangeRequestsAsync()
        {
            var requests = await _changeRequestRepository.GetAllAsync();
            // Ad-hoc mapping for list
            var responses = requests.Select(changeRequest =>
            {
                var profile = changeRequest.Employee?.Userprofile;
                return new ChangeRequestResponseDto
                {
                    RequestId = changeRequest.RequestId,
                    EmployeeId = changeRequest.EmployeeId,
                    EmployeeCompanyId = changeRequest.Employee?.EmployeeCompanyId ?? string.Empty,
                    EmployeeName = profile != null ? $"{profile.FirstName} {profile.LastName}" : string.Empty,
                    ChangeType = changeRequest.ChangeType,
                    CurrentValue = changeRequest.CurrentValue,
                    NewValue = changeRequest.NewValue,
                    Reason = changeRequest.Reason,
                    Status = changeRequest.Status,
                    AdminRemarks = changeRequest.AdminRemarks,
                    RequestedAt = changeRequest.RequestedAt,
                    ProcessedAt = changeRequest.ProcessedAt
                };
            }).ToList();
            return responses;
        }
        public async Task<bool> CancelChangeRequestAsync(int userId, int requestId)
        {
            var changeRequest = await _changeRequestRepository.GetByIdAsync(requestId);
            if (changeRequest == null)
            {
                throw new KeyNotFoundException(ChangeRequestMessages.ChangeRequestNotFound);
            }
            if (changeRequest.RequestedByUserId != userId)
            {
                throw new UnauthorizedAccessException(ChangeRequestMessages.UnauthorizedToCancel);
            }
            if (changeRequest.Status != Constants.RequestStatuses.Pending)
            {
                throw new InvalidOperationException(ChangeRequestMessages.OnlyPendingCanBeCancelled);
            }
            changeRequest.Status = Constants.RequestStatuses.Cancelled;
            changeRequest.ProcessedAt = DateTime.UtcNow;
            await _changeRequestRepository.UpdateAsync(changeRequest);
            EEPZBusinessLog.Information($"Change request cancelled: RequestId {requestId}, UserId: {userId}");
            return true;
        }
        public async Task<ChangeRequestResponseDto?> HasPendingRequestAsync(int userId)
        {
            var user = await _userAuthRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException(Constants.Messages.UserNotFound);
            }
            var requests = await _changeRequestRepository.GetByEmployeeIdAsync(user.EmployeeId);
            var pendingRequest = requests.FirstOrDefault(r => r.Status == Constants.RequestStatuses.Pending);
            if (pendingRequest != null)
            {
                // Ad-hoc mapping
                var profile = pendingRequest.Employee?.Userprofile;
                return new ChangeRequestResponseDto
                {
                    RequestId = pendingRequest.RequestId,
                    EmployeeId = pendingRequest.EmployeeId,
                    EmployeeCompanyId = pendingRequest.Employee?.EmployeeCompanyId ?? string.Empty,
                    EmployeeName = profile != null ? $"{profile.FirstName} {profile.LastName}" : string.Empty,
                    ChangeType = pendingRequest.ChangeType,
                    CurrentValue = pendingRequest.CurrentValue,
                    NewValue = pendingRequest.NewValue,
                    Reason = pendingRequest.Reason,
                    Status = pendingRequest.Status,
                    AdminRemarks = pendingRequest.AdminRemarks,
                    RequestedAt = pendingRequest.RequestedAt,
                    ProcessedAt = pendingRequest.ProcessedAt
                };
            }
            return null;
        }
    }
}
