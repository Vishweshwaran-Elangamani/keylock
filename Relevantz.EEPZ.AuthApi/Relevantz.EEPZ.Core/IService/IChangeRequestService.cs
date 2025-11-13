using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;


namespace Relevantz.EEPZ.Core.IService
{
    public interface IChangeRequestService
    {
        Task<ApiResponseDto<ChangeRequestResponseDto>> SubmitChangeRequestAsync(int userId, ChangeRequestDto request);
        Task<ApiResponseDto<ChangeRequestResponseDto>> ProcessChangeRequestAsync(ProcessChangeRequestDto request, int adminUserId);
        Task<ApiResponseDto<List<ChangeRequestResponseDto>>> GetPendingRequestsAsync();
        Task<ApiResponseDto<List<ChangeRequestResponseDto>>> GetUserChangeRequestsAsync(int userId);
        Task<ApiResponseDto<List<ChangeRequestResponseDto>>> GetAllChangeRequestsAsync();
        Task<ApiResponseDto<bool>> CancelChangeRequestAsync(int userId, int requestId);
        Task<ApiResponseDto<ChangeRequestResponseDto?>> HasPendingRequestAsync(int userId);
    }
}
