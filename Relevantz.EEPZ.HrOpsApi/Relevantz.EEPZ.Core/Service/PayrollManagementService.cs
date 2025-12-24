using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Microsoft.EntityFrameworkCore;

namespace Relevantz.EEPZ.Core.Service
{
    public class PayrollManagementService : IPayrollManagementService
    {
        private readonly IPayrollManagementRepository _payrollRepository;
        private readonly EEPZDbContext _context;

        public PayrollManagementService(
            IPayrollManagementRepository payrollRepository,
            EEPZDbContext context)
        {
            _payrollRepository = payrollRepository;
            _context = context;
        }

        public async Task<ApiResponseDto<PayrollResponseDto>> CreatePayrollAsync(CreatePayrollRequestDto request)
        {
            try
            {
                Console.WriteLine($"Creating payroll for EmployeeUserId: {request.EmployeeUserId}");


                var hasPending = await _payrollRepository.HasPendingPayrollAsync(request.EmployeeUserId);
                if (hasPending)
                {
                    Console.WriteLine($"Employee {request.EmployeeUserId} already has a pending payroll");
                    return ApiResponseDto<PayrollResponseDto>.FailureResponse(
                        "Employee already has a pending payroll. Please wait for approval.");
                }

                decimal incrementPercentage = 0;
                if (request.OldSalary > 0)
                {
                    incrementPercentage = ((request.NewSalary - request.OldSalary) / request.OldSalary) * 100;
                }

                var payroll = new Payroll
                {
                    EmployeeUserId = request.EmployeeUserId,
                    DepartmentId = request.DepartmentId,
                    PayrollPeriod = request.PayrollPeriod,
                    OldSalary = request.OldSalary,
                    NewSalary = request.NewSalary,
                    IncrementPercentage = incrementPercentage,
                    EffectiveDate = request.EffectiveDate,
                    Status = "Pending",
                    Notes = request.Notes,
                    CreatedAt = DateTime.UtcNow
                };

                var createdPayroll = await _payrollRepository.CreateAsync(payroll);

                var response = await BuildPayrollResponse(createdPayroll.PayrollId);

                Console.WriteLine($"Payroll created successfully with PayrollId: {createdPayroll.PayrollId}");
                return ApiResponseDto<PayrollResponseDto>.SuccessResponse(
                    response,
                    "Payroll created successfully and awaiting approval");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating payroll: {ex.Message}");
                return ApiResponseDto<PayrollResponseDto>.FailureResponse(
                    "An error occurred while creating payroll");
            }
        }

        public async Task<ApiResponseDto<PayrollResponseDto>> UpdatePayrollAsync(UpdatePayrollRequestDto request)
        {
            try
            {
                Console.WriteLine($"Updating payroll with PayrollId: {request.PayrollId}");

                var payroll = await _payrollRepository.GetByIdAsync(request.PayrollId);
                if (payroll == null)
                {
                    Console.WriteLine($"Payroll not found: {request.PayrollId}");
                    return ApiResponseDto<PayrollResponseDto>.FailureResponse("Payroll not found");
                }

                if (payroll.Status != "Pending")
                {
                    Console.WriteLine($"Cannot update payroll with status: {payroll.Status}");
                    return ApiResponseDto<PayrollResponseDto>.FailureResponse(
                        "Only pending payrolls can be updated");
                }

                payroll.NewSalary = request.NewSalary;
                payroll.EffectiveDate = request.EffectiveDate;
                payroll.Notes = request.Notes;

                if (payroll.OldSalary > 0)
                {
                    payroll.IncrementPercentage = ((payroll.NewSalary - payroll.OldSalary) / payroll.OldSalary) * 100;
                }

                var updatedPayroll = await _payrollRepository.UpdateAsync(payroll);

                // Build response
                var response = await BuildPayrollResponse(updatedPayroll.PayrollId);

                Console.WriteLine($"Payroll updated successfully: {request.PayrollId}");
                return ApiResponseDto<PayrollResponseDto>.SuccessResponse(
                    response,
                    "Payroll updated successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating payroll: {ex.Message}");
                return ApiResponseDto<PayrollResponseDto>.FailureResponse(
                    "An error occurred while updating payroll");
            }
        }

        public async Task<ApiResponseDto<PayrollResponseDto>> ApprovePayrollAsync(ApprovePayrollRequestDto request)
        {
            try
            {
                Console.WriteLine($"Approving payroll with PayrollId: {request.PayrollId}");

                var payroll = await _payrollRepository.GetByIdAsync(request.PayrollId);
                if (payroll == null)
                {
                    Console.WriteLine($"Payroll not found: {request.PayrollId}");
                    return ApiResponseDto<PayrollResponseDto>.FailureResponse("Payroll not found");
                }

                if (payroll.Status != "Pending")
                {
                    Console.WriteLine($"Payroll already {payroll.Status}");
                    return ApiResponseDto<PayrollResponseDto>.FailureResponse(
                        $"Payroll is already {payroll.Status.ToLower()}");
                }

                payroll.Status = "Approved";
                payroll.ApprovedByUserId = request.ApprovedByUserId;
                payroll.ApprovedAt = DateTime.UtcNow;
                if (!string.IsNullOrEmpty(request.Notes))
                {
                    payroll.Notes = request.Notes;
                }

                var approvedPayroll = await _payrollRepository.UpdateAsync(payroll);

                var response = await BuildPayrollResponse(approvedPayroll.PayrollId);

                Console.WriteLine($"Payroll approved successfully: {request.PayrollId}");
                return ApiResponseDto<PayrollResponseDto>.SuccessResponse(
                    response,
                    "Payroll approved successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error approving payroll: {ex.Message}");
                return ApiResponseDto<PayrollResponseDto>.FailureResponse(
                    "An error occurred while approving payroll");
            }
        }

        public async Task<ApiResponseDto<PayrollResponseDto>> ProcessPayrollAsync(int payrollId)
        {
            try
            {
                Console.WriteLine($"Processing payroll with PayrollId: {payrollId}");

                var payroll = await _payrollRepository.GetByIdAsync(payrollId);
                if (payroll == null)
                {
                    Console.WriteLine($"Payroll not found: {payrollId}");
                    return ApiResponseDto<PayrollResponseDto>.FailureResponse("Payroll not found");
                }

                if (payroll.Status != "Approved")
                {
                    Console.WriteLine($"Payroll status is {payroll.Status}, not Approved");
                    return ApiResponseDto<PayrollResponseDto>.FailureResponse(
                        "Only approved payrolls can be processed");
                }

                payroll.Status = "Processed";

                var processedPayroll = await _payrollRepository.UpdateAsync(payroll);

                var response = await BuildPayrollResponse(processedPayroll.PayrollId);

                Console.WriteLine($"Payroll processed successfully: {payrollId}");
                return ApiResponseDto<PayrollResponseDto>.SuccessResponse(
                    response,
                    "Payroll processed successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error processing payroll: {ex.Message}");
                return ApiResponseDto<PayrollResponseDto>.FailureResponse(
                    "An error occurred while processing payroll");
            }
        }

        public async Task<ApiResponseDto<PayrollResponseDto>> GetPayrollByIdAsync(int payrollId)
        {
            try
            {
                Console.WriteLine($"Fetching payroll with PayrollId: {payrollId}");

                var payroll = await _payrollRepository.GetByIdAsync(payrollId);
                if (payroll == null)
                {
                    Console.WriteLine($"Payroll not found: {payrollId}");
                    return ApiResponseDto<PayrollResponseDto>.FailureResponse("Payroll not found");
                }

                var response = await BuildPayrollResponse(payrollId);
                return ApiResponseDto<PayrollResponseDto>.SuccessResponse(
                    response,
                    "Payroll retrieved successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching payroll: {ex.Message}");
                return ApiResponseDto<PayrollResponseDto>.FailureResponse(
                    "An error occurred while fetching payroll");
            }
        }

        public async Task<ApiResponseDto<List<PayrollResponseDto>>> GetAllPayrollsAsync()
        {
            try
            {
                Console.WriteLine("Fetching all payrolls");

                var payrolls = await _payrollRepository.GetAllAsync();
                var response = new List<PayrollResponseDto>();

                foreach (var payroll in payrolls)
                {
                    response.Add(await BuildPayrollResponse(payroll.PayrollId));
                }

                return ApiResponseDto<List<PayrollResponseDto>>.SuccessResponse(
                    response,
                    $"Retrieved {response.Count} payrolls");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching all payrolls: {ex.Message}");
                return ApiResponseDto<List<PayrollResponseDto>>.FailureResponse(
                    "An error occurred while fetching payrolls");
            }
        }

        public async Task<ApiResponseDto<List<PayrollResponseDto>>> GetPayrollsByEmployeeAsync(int EmployeeUserId)
        {
            try
            {
                Console.WriteLine($"Fetching payrolls for EmployeeUserId: {EmployeeUserId}");

                var payrolls = await _payrollRepository.GetByEmployeeUserIdAsync(EmployeeUserId);
                var response = new List<PayrollResponseDto>();

                foreach (var payroll in payrolls)
                {
                    response.Add(await BuildPayrollResponse(payroll.PayrollId));
                }

                return ApiResponseDto<List<PayrollResponseDto>>.SuccessResponse(
                    response,
                    $"Retrieved {response.Count} payrolls for employee");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching payrolls by employee: {ex.Message}");
                return ApiResponseDto<List<PayrollResponseDto>>.FailureResponse(
                    "An error occurred while fetching payrolls");
            }
        }

        public async Task<ApiResponseDto<List<PayrollResponseDto>>> GetPayrollsByStatusAsync(string status)
        {
            try
            {
                Console.WriteLine($"Fetching payrolls with Status: {status}");

                var payrolls = await _payrollRepository.GetByStatusAsync(status);
                var response = new List<PayrollResponseDto>();

                foreach (var payroll in payrolls)
                {
                    response.Add(await BuildPayrollResponse(payroll.PayrollId));
                }

                return ApiResponseDto<List<PayrollResponseDto>>.SuccessResponse(
                    response,
                    $"Retrieved {response.Count} payrolls with status: {status}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching payrolls by status: {ex.Message}");
                return ApiResponseDto<List<PayrollResponseDto>>.FailureResponse(
                    "An error occurred while fetching payrolls");
            }
        }

        private async Task<PayrollResponseDto> BuildPayrollResponse(int payrollId)
        {
            var payroll = await _context.Payrolls
                .Where(p => p.PayrollId == payrollId)
                .Select(p => new
                {
                    p.PayrollId,
                    p.EmployeeUserId,
                    EmployeeEmail = _context.Userauthentications
                        .Where(u => u.UserId == p.EmployeeUserId)
                        .Select(u => u.Email)
                        .FirstOrDefault() ?? "Unknown",
                    p.DepartmentId,
                    DepartmentName = _context.Departments
                        .Where(d => d.DepartmentId == p.DepartmentId)
                        .Select(d => d.DepartmentName)
                        .FirstOrDefault() ?? "Unknown",
                    p.PayrollPeriod,
                    p.OldSalary,
                    p.NewSalary,
                    p.IncrementPercentage,
                    p.EffectiveDate,
                    p.Status,
                    p.ApprovedByUserId,
                    ApprovedByEmail = p.ApprovedByUserId.HasValue
                        ? _context.Userauthentications
                            .Where(u => u.UserId == p.ApprovedByUserId)
                            .Select(u => u.Email)
                            .FirstOrDefault()
                        : null,
                    p.Notes,
                    p.CreatedAt,
                    p.ApprovedAt
                })
                .FirstOrDefaultAsync();

            return new PayrollResponseDto
            {
                PayrollId = payroll.PayrollId,
                EmployeeUserId = payroll.EmployeeUserId,
                EmployeeEmail = payroll.EmployeeEmail,
                DepartmentId = payroll.DepartmentId,
                DepartmentName = payroll.DepartmentName,
                PayrollPeriod = payroll.PayrollPeriod,
                OldSalary = payroll.OldSalary,
                NewSalary = payroll.NewSalary,
                IncrementPercentage = payroll.IncrementPercentage,
                EffectiveDate = payroll.EffectiveDate,
                Status = payroll.Status,
                ApprovedByUserId = payroll.ApprovedByUserId,
                ApprovedByEmail = payroll.ApprovedByEmail,
                Notes = payroll.Notes,
                CreatedAt = payroll.CreatedAt,
                ApprovedAt = payroll.ApprovedAt
            };
        }
    }


}

