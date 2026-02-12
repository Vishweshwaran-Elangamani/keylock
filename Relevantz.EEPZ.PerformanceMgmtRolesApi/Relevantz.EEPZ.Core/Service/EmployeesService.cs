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

        public async Task<ApiResponse<List<object>>> GetAllManagersAsync()
        {
            var managers = await _repository.GetAllManagersAsync();
            return ApiResponse<List<object>>.SuccessResponse(managers);
        }

        public async Task<ApiResponse<object>> GetUserRoleAsync(int userId)
        {
            var role = await _repository.GetUserRoleAsync(userId);
            if (role == null) 
                return ApiResponse<object>.ErrorResponse("User not found");

            return ApiResponse<object>.SuccessResponse(role);
        }
    }
}