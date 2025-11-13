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

                // Check if user already has a pending request - ADDED
                var existingRequests = await _changeRequestRepository.GetByEmployeeIdAsync(user.EmployeeId);
                var hasPendingRequest = existingRequests.Any(r => r.Status == Constants.RequestStatuses.Pending);

                if (hasPendingRequest)
                {
                    return ApiResponseDto<ChangeRequestResponseDto>.FailureResponse("You already have a pending change request. Please wait for admin approval or cancel the existing request.");
                }

                string? currentValue = null;
                string? newValue = null;

                if (request.ChangeType == Constants.ChangeTypes.Email)
                {
                    currentValue = user.Email;
                    newValue = request.NewEmail;
                }
                else if (request.ChangeType == Constants.ChangeTypes.EmployeeCompanyId)
                {
                    currentValue = user.Employee.EmployeeCompanyId;
                    newValue = request.NewEmployeeCompanyId;
                }
                else
                {
                    newValue = request.NewValue;
                }

                var changeRequest = new Changerequest
                {
                    EmployeeId = user.EmployeeId,
                    ChangeType = request.ChangeType,
                    NewEmployeeCompanyId = request.NewEmployeeCompanyId,
                    NewEmail = request.NewEmail,
                    CurrentValue = currentValue,
                    NewValue = newValue,
                    Reason = request.Reason,
                    Status = Constants.RequestStatuses.Pending,
                    RequestedByUserId = userId,
                    RequestedAt = DateTime.UtcNow
                };

                await _changeRequestRepository.CreateAsync(changeRequest);

                // Send notification email
                var firstName = user.Employee?.Userprofile?.FirstName ?? "User";
                await _emailService.SendChangeRequestNotificationAsync(user.Email, firstName, request.ChangeType, newValue ?? string.Empty);

                var response = MapToChangeRequestResponse(changeRequest);
                EEPZBusinessLog.Information($"Change request submitted by UserId: {userId}");

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


                changeRequest.Status = request.Status;
                changeRequest.ApprovedByUserId = adminUserId;
                changeRequest.AdminRemarks = request.AdminRemarks;
                changeRequest.ProcessedAt = DateTime.UtcNow;


                // If approved, apply the changes
                if (request.Status == Constants.RequestStatuses.Approved)
                {
                    if (changeRequest.ChangeType == Constants.ChangeTypes.Email && !string.IsNullOrEmpty(changeRequest.NewEmail))
                    {
                        var user = await _userAuthRepository.GetByEmployeeIdAsync(changeRequest.EmployeeId);
                        if (user != null)
                        {
                            user.Email = changeRequest.NewEmail;
                            await _userAuthRepository.UpdateAsync(user);
                        }
                    }
                    else if (changeRequest.ChangeType == Constants.ChangeTypes.EmployeeCompanyId && !string.IsNullOrEmpty(changeRequest.NewEmployeeCompanyId))
                    {
                        var employee = await _employeeRepository.GetByIdAsync(changeRequest.EmployeeId);
                        if (employee != null)
                        {
                            employee.EmployeeCompanyId = changeRequest.NewEmployeeCompanyId;
                            await _employeeRepository.UpdateAsync(employee);
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

                // Filter to show only Pending status (exclude Cancelled)
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
    }
}
