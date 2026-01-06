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

        public async Task<ApiResponseDto<ChangeRequestResponseDto>> SubmitChangeRequestAsync(int userId, ChangeRequestDto request)
        {
            try
            {
                var user = await _userAuthRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return ApiResponseDto<ChangeRequestResponseDto>.FailureResponse(Constants.Messages.UserNotFound);
                }

                // CHECK IF USER IS PROTECTED EMPLOYEE (EmployeeCompanyID = 1000)
                var employeeCompanyId = user.Employee?.EmployeeCompanyId;
                if (!string.IsNullOrEmpty(employeeCompanyId) && employeeCompanyId == "1000")
                {
                    EEPZBusinessLog.Warning($"Change request blocked for protected employee: UserId {userId} (EmployeeCompanyID: {employeeCompanyId})");
                    return ApiResponseDto<ChangeRequestResponseDto>.FailureResponse(
                        "Change requests are not allowed for this account. Please contact system administrator for assistance."
                    );
                }

                // Validate password
                if (string.IsNullOrWhiteSpace(request.CurrentPassword))
                {
                    return ApiResponseDto<ChangeRequestResponseDto>.FailureResponse("Current password is required for verification");
                }

                // Use PasswordHash instead of Password
                bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash);
                if (!isPasswordValid)
                {
                    EEPZBusinessLog.Warning($"Invalid password attempt for change request by UserId: {userId}");
                    return ApiResponseDto<ChangeRequestResponseDto>.FailureResponse("Invalid password. Please enter your correct current password.");
                }

                // Check if user already has a pending request
                var existingRequests = await _changeRequestRepository.GetByEmployeeIdAsync(user.EmployeeId);
                var hasPendingRequest = existingRequests.Any(r => r.Status == Constants.RequestStatuses.Pending);

                if (hasPendingRequest)
                {
                    return ApiResponseDto<ChangeRequestResponseDto>.FailureResponse("You already have a pending change request. Please wait for admin approval or cancel the existing request.");
                }
                string? currentValue = null;
                string? newValue = null;
                string? newEmail = null;
                string? newEmployeeCompanyId = null;

                if (request.ChangeType == Constants.ChangeTypes.Email)
                {
                    if (string.IsNullOrWhiteSpace(request.NewEmail))
                    {
                        return ApiResponseDto<ChangeRequestResponseDto>.FailureResponse("New email is required");
                    }

                    if (!IsValidEmail(request.NewEmail))
                    {
                        return ApiResponseDto<ChangeRequestResponseDto>.FailureResponse("Invalid email format");
                    }

                    currentValue = user.Email;
                    newValue = request.NewEmail;
                    newEmail = request.NewEmail;

                    if (user.Email?.ToLower() == request.NewEmail.ToLower())
                    {
                        return ApiResponseDto<ChangeRequestResponseDto>.FailureResponse("New email is same as current email");
                    }

                    bool emailExists = await _changeRequestRepository.IsEmailAlreadyExistsAsync(request.NewEmail, userId);
                    if (emailExists)
                    {
                        return ApiResponseDto<ChangeRequestResponseDto>.FailureResponse("Email already exists in the system");
                    }
                }
                else if (request.ChangeType == Constants.ChangeTypes.EmployeeCompanyId)
                {
                    if (string.IsNullOrWhiteSpace(request.NewEmployeeCompanyId))
                    {
                        return ApiResponseDto<ChangeRequestResponseDto>.FailureResponse("New Employee Company ID is required");
                    }

                    currentValue = user.Employee?.EmployeeCompanyId;
                    newValue = request.NewEmployeeCompanyId;
                    newEmployeeCompanyId = request.NewEmployeeCompanyId;

                    if (user.Employee?.EmployeeCompanyId?.ToLower() == request.NewEmployeeCompanyId.ToLower())
                    {
                        return ApiResponseDto<ChangeRequestResponseDto>.FailureResponse("New Employee Company ID is same as current ID");
                    }

                    bool companyIdExists = await _changeRequestRepository.IsEmployeeCompanyIdExistsAsync(request.NewEmployeeCompanyId, user.EmployeeId);
                    if (companyIdExists)
                    {
                        return ApiResponseDto<ChangeRequestResponseDto>.FailureResponse("Employee Company ID already exists in the system");
                    }
                }
                else
                {
                    return ApiResponseDto<ChangeRequestResponseDto>.FailureResponse($"Invalid change type: {request.ChangeType}. Only 'Email' and 'EmployeeCompanyId' are supported.");
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

                var response = MapToChangeRequestResponse(changeRequest);
                EEPZBusinessLog.Information($"Change request submitted by UserId: {userId}, ChangeType: {request.ChangeType}");

                return ApiResponseDto<ChangeRequestResponseDto>.SuccessResponse(response, Constants.Messages.ChangeRequestSubmitted);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error submitting change request for UserId: {userId}", ex);
                return ApiResponseDto<ChangeRequestResponseDto>.FailureResponse("An error occurred while submitting change request");
            }
        }

        public async Task<ApiResponseDto<ChangeRequestResponseDto>> ProcessChangeRequestAsync(ProcessChangeRequestDto request, int adminUserId)
        {
            try
            {
                var changeRequest = await _changeRequestRepository.GetByIdAsync(request.RequestId);
                if (changeRequest == null)
                {
                    return ApiResponseDto<ChangeRequestResponseDto>.FailureResponse("Change request not found");
                }

                if (changeRequest.Status != Constants.RequestStatuses.Pending)
                {
                    return ApiResponseDto<ChangeRequestResponseDto>.FailureResponse("Change request already processed");
                }

                // Prevent processing for protected employees (EmployeeCompanyID = 1000)
                var employee = await _employeeRepository.GetByIdAsync(changeRequest.EmployeeId);
                if (employee != null && !string.IsNullOrEmpty(employee.EmployeeCompanyId) && employee.EmployeeCompanyId == "1000")
                {
                    EEPZBusinessLog.Warning($"Attempt to process change request for protected employee: EmployeeId {changeRequest.EmployeeId} (EmployeeCompanyID: {employee.EmployeeCompanyId})");
                    return ApiResponseDto<ChangeRequestResponseDto>.FailureResponse(
                        "Cannot process change request for this protected account. Please contact system administrator."
                    );
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

                var response = MapToChangeRequestResponse(changeRequest);
                EEPZBusinessLog.Information($"Change request processed: RequestId {request.RequestId}, Status: {request.Status}");

                return ApiResponseDto<ChangeRequestResponseDto>.SuccessResponse(response, Constants.Messages.ChangeRequestProcessed);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error processing change request: RequestId {request.RequestId}", ex);
                return ApiResponseDto<ChangeRequestResponseDto>.FailureResponse("An error occurred while processing change request");
            }
        }

        public async Task<ApiResponseDto<List<ChangeRequestResponseDto>>> GetPendingRequestsAsync()
        {
            try
            {
                var requests = await _changeRequestRepository.GetPendingRequestsAsync();
                var pendingOnly = requests.Where(r => r.Status == Constants.RequestStatuses.Pending).ToList();
                var responses = pendingOnly.Select(MapToChangeRequestResponse).ToList();
                return ApiResponseDto<List<ChangeRequestResponseDto>>.SuccessResponse(responses, "Pending requests retrieved successfully");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error("Error retrieving pending change requests", ex);
                return ApiResponseDto<List<ChangeRequestResponseDto>>.FailureResponse("An error occurred while retrieving pending requests");
            }
        }

        public async Task<ApiResponseDto<List<ChangeRequestResponseDto>>> GetUserChangeRequestsAsync(int userId)
        {
            try
            {
                var user = await _userAuthRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return ApiResponseDto<List<ChangeRequestResponseDto>>.FailureResponse(Constants.Messages.UserNotFound);
                }

                var requests = await _changeRequestRepository.GetByEmployeeIdAsync(user.EmployeeId);
                var responses = requests.Select(MapToChangeRequestResponse).ToList();
                return ApiResponseDto<List<ChangeRequestResponseDto>>.SuccessResponse(responses, "User change requests retrieved successfully");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error retrieving change requests for UserId: {userId}", ex);
                return ApiResponseDto<List<ChangeRequestResponseDto>>.FailureResponse("An error occurred while retrieving user change requests");
            }
        }

        public async Task<ApiResponseDto<List<ChangeRequestResponseDto>>> GetAllChangeRequestsAsync()
        {
            try
            {
                var requests = await _changeRequestRepository.GetAllAsync();
                var responses = requests.Select(MapToChangeRequestResponse).ToList();
                return ApiResponseDto<List<ChangeRequestResponseDto>>.SuccessResponse(responses, "All change requests retrieved successfully");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error("Error retrieving all change requests", ex);
                return ApiResponseDto<List<ChangeRequestResponseDto>>.FailureResponse("An error occurred while retrieving change requests");
            }
        }

        public async Task<ApiResponseDto<bool>> CancelChangeRequestAsync(int userId, int requestId)
        {
            try
            {
                var changeRequest = await _changeRequestRepository.GetByIdAsync(requestId);

                if (changeRequest == null)
                {
                    return ApiResponseDto<bool>.FailureResponse("Change request not found");
                }

                if (changeRequest.RequestedByUserId != userId)
                {
                    return ApiResponseDto<bool>.FailureResponse("You are not authorized to cancel this request");
                }

                if (changeRequest.Status != Constants.RequestStatuses.Pending)
                {
                    return ApiResponseDto<bool>.FailureResponse("Only pending requests can be cancelled");
                }

                changeRequest.Status = Constants.RequestStatuses.Cancelled;
                changeRequest.ProcessedAt = DateTime.UtcNow;
                await _changeRequestRepository.UpdateAsync(changeRequest);

                EEPZBusinessLog.Information($"Change request cancelled: RequestId {requestId}, UserId: {userId}");
                return ApiResponseDto<bool>.SuccessResponse(true, "Change request cancelled successfully");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error cancelling change request: RequestId {requestId}, UserId: {userId}", ex);
                return ApiResponseDto<bool>.FailureResponse("An error occurred while cancelling the request");
            }
        }

        public async Task<ApiResponseDto<ChangeRequestResponseDto?>> HasPendingRequestAsync(int userId)
        {
            try
            {
                var user = await _userAuthRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return ApiResponseDto<ChangeRequestResponseDto?>.FailureResponse(Constants.Messages.UserNotFound);
                }

                var requests = await _changeRequestRepository.GetByEmployeeIdAsync(user.EmployeeId);
                var pendingRequest = requests.FirstOrDefault(r => r.Status == Constants.RequestStatuses.Pending);

                if (pendingRequest != null)
                {
                    var response = MapToChangeRequestResponse(pendingRequest);
                    return ApiResponseDto<ChangeRequestResponseDto?>.SuccessResponse(response, "Pending request found");
                }

                return ApiResponseDto<ChangeRequestResponseDto?>.SuccessResponse(null, "No pending request found");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error checking pending request for UserId: {userId}", ex);
                return ApiResponseDto<ChangeRequestResponseDto?>.FailureResponse("An error occurred while checking pending request");
            }
        }

        private ChangeRequestResponseDto MapToChangeRequestResponse(Changerequest changeRequest)
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
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
    }
}
