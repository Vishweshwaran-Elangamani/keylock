using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class EmployeesService : IEmployeesService
    {
        private readonly IEmployeesRepository _repository;
        private readonly ILogger<EmployeesService> _logger;

        public EmployeesService(IEmployeesRepository repository, ILogger<EmployeesService> logger)
        {
            _repository = repository;
            _logger = logger;
        }

/// <summary>
/// Retrieves the complete list of managers across the organization.
/// </summary>
/// <returns>
/// A standardized <see cref="ApiResponse{T}"/> containing a list of manager records,
/// or an error response if the retrieval fails.
/// </returns>
public async Task<ApiResponse<List<object>>> GetAllManagersAsync()
{
    var managers = await _repository.GetAllManagersAsync();
    return ApiResponse<List<object>>.SuccessResponse(managers);
}

        /// <summary>
/// Retrieves the role information for the specified user.
/// </summary>
/// <param name="userId">The unique identifier of the user.</param>
/// <returns>
/// A standardized <see cref="ApiResponse{T}"/> containing the user's role,
/// or an error response if the user is not found.
/// </returns>
public async Task<ApiResponse<object>> GetUserRoleAsync(int userId)
{
    var role = await _repository.GetUserRoleAsync(userId);
    if (role == null) 
        return ApiResponse<object>.ErrorResponse("User not found");

    return ApiResponse<object>.SuccessResponse(role);
}
    }
}