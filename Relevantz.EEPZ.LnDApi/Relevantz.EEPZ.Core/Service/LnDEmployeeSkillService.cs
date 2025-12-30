using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repositories.Interface;
using Serilog;


using Microsoft.EntityFrameworkCore;
namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class LnDEmployeeSkillService : ILnDEmployeeSkillService
    {
        #region Dependencies

        private readonly ILnDEmployeeSkillRepository _repository;
        private readonly ILnDSmeRepository _smeRepository;
        private readonly ILnDBaseRepository _baseRepository;
       

        public LnDEmployeeSkillService(
            ILnDEmployeeSkillRepository repository,
            ILnDSmeRepository smeRepository,
            ILnDBaseRepository baseRepository

        )
        {
            _repository = repository;
            _smeRepository = smeRepository;
            _baseRepository = baseRepository;

        }

        #endregion

        #region Employee Queries

        /// <summary>Gets paginated list of subordinate employees with department information.</summary>
        public async Task<
            ApiResponse<PaginatedResponse<SubordinateEmployeeDto>>
        > GetSubordinateEmployees(int managerId, string? searchTerm, int pageNumber, int pageSize)
        {
            Log.Information(
                "GetSubordinateEmployees started. ManagerId={ManagerId}, SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                managerId, searchTerm ?? "none", pageNumber, pageSize
            );

            try
            {
                var manager = await _repository.GetEmployeeByIdAsync(managerId);

                if (manager == null)
                {
                    Log.Warning("GetSubordinateEmployees: Manager not found. ManagerId={ManagerId}", managerId);

                    return new ApiResponse<PaginatedResponse<SubordinateEmployeeDto>>
                    {
                        Success = false,
                        Message = "Manager not found",
                    };
                }

                var (items, totalCount) = await _repository.GetSubordinateEmployeesAsync(
                    managerId,
                    searchTerm,
                    pageNumber,
                    pageSize
                );

                Log.Debug(
                    "GetSubordinateEmployees: Retrieved {ItemCount} employees. TotalCount={TotalCount}",
                    items.Count, totalCount
                );

                var employeeDtos = items
                    .Select(e => new SubordinateEmployeeDto
                    {
                        EmployeeId = e.EmployeeId,
                        EmployeeName = $"{e.Userprofile?.FirstName} {e.Userprofile?.LastName}",
                        Email = e.Userauthentication?.Email,
                        DepartmentName = e
                            .Employeedetailsmasters.FirstOrDefault()
                            ?.Department?.DepartmentName,
                    })
                    .ToList();

                var paginatedResponse = new PaginatedResponse<SubordinateEmployeeDto>
                {
                    Items = employeeDtos,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                };

                Log.Information(
                    "GetSubordinateEmployees succeeded. ManagerId={ManagerId}, ReturnedCount={Count}, TotalCount={TotalCount}",
                    managerId, employeeDtos.Count, totalCount
                );

                return new ApiResponse<PaginatedResponse<SubordinateEmployeeDto>>
                {
                    Success = true,
                    Message = $"Found {totalCount} subordinate(s)",
                    Data = paginatedResponse,
                };
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "GetSubordinateEmployees failed. ManagerId={ManagerId}, Error={ErrorMessage}",
                    managerId, ex.Message
                );

                return new ApiResponse<PaginatedResponse<SubordinateEmployeeDto>>
                {
                    Success = false,
                    Message = $"Error retrieving subordinates: {ex.Message}",
                };
            }
        }

        #endregion

        #region Skill Queries

        /// <summary>Gets all available skills for dropdown selection.</summary>
        public async Task<ApiResponse<List<SkillDto>>> GetAllSkills()
        {
            Log.Information("GetAllSkills started");

            try
            {
                var skills = await _repository.GetAllSkillsAsync();

                var skillDtos = skills
                    .Select(s => new SkillDto { SkillId = s.SkillId, SkillName = s.SkillName })
                    .ToList();

                Log.Information("GetAllSkills succeeded. SkillCount={Count}", skillDtos.Count);

                return new ApiResponse<List<SkillDto>>
                {
                    Success = true,
                    Message = $"Found {skillDtos.Count} skill(s)",
                    Data = skillDtos,
                };
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetAllSkills failed. Error={ErrorMessage}", ex.Message);

                return new ApiResponse<List<SkillDto>>
                {
                    Success = false,
                    Message = $"Error retrieving skills: {ex.Message}",
                };
            }
        }

        /// <summary>Gets paginated skills for subordinate employees with optional employee filter.</summary>
        public async Task<ApiResponse<PaginatedResponse<EmployeeSkillDto>>> GetSubordinateSkills(
            int managerId,
            int? employeeId,
            string? searchTerm,
            string? sortBy,
            int pageNumber,
            int pageSize = 1_000_000
        )
        {
            Log.Information(
                "GetSubordinateSkills started. ManagerId={ManagerId}, EmployeeId={EmployeeId}, SearchTerm={SearchTerm}, SortBy={SortBy}, Page={PageNumber}",
                managerId, employeeId?.ToString() ?? "all", searchTerm ?? "none", sortBy ?? "default", pageNumber
            );

            try
            {
                var manager = await _repository.GetEmployeeByIdAsync(managerId);

                if (manager == null)
                {
                    Log.Warning("GetSubordinateSkills: Manager not found. ManagerId={ManagerId}", managerId);

                    return new ApiResponse<PaginatedResponse<EmployeeSkillDto>>
                    {
                        Success = false,
                        Message = "Manager not found",
                    };
                }

                var (items, totalCount) = await _repository.GetSubordinateSkillsAsync(
                    managerId,
                    employeeId,
                    searchTerm,
                    sortBy,
                    pageNumber,
                    pageSize
                );

                Log.Debug(
                    "GetSubordinateSkills: Retrieved {ItemCount} skills. TotalCount={TotalCount}",
                    items.Count, totalCount
                );

                var skillDtos = items
                    .Select(m => new EmployeeSkillDto
                    {
                        MapperId = m.MapperId,
                        EmployeeId = m.EmployeeId,
                        EmployeeName =
                            $"{m.Employee.Userprofile.FirstName} {m.Employee.Userprofile.LastName}",
                        SkillId = m.SkillId,
                        SkillName = m.Skill.SkillName,
                        Rating = m.Rating,
                        CreatedOn = m.CreatedOn,
                        UpdatedOn = m.UpdatedOn,
                        CanBecomeSme = m.Rating >= LnDConstants.MIN_SME_RATING,
                        IsSme = m.Skill.Lndsmes.Any(s =>
                            s.EmployeeId == m.EmployeeId && s.IsActive == true
                        ),
                    })
                    .ToList();

                Log.Information(
                    "GetSubordinateSkills succeeded. ManagerId={ManagerId}, ReturnedCount={Count}, TotalCount={TotalCount}",
                    managerId, skillDtos.Count, totalCount
                );

                return new ApiResponse<PaginatedResponse<EmployeeSkillDto>>
                {
                    Success = true,
                    Data = new PaginatedResponse<EmployeeSkillDto>
                    {
                        Items = skillDtos,
                        TotalCount = totalCount,
                        PageNumber = pageNumber,
                        PageSize = pageSize,
                    },
                };
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "GetSubordinateSkills failed. ManagerId={ManagerId}, Error={ErrorMessage}",
                    managerId, ex.Message
                );

                return new ApiResponse<PaginatedResponse<EmployeeSkillDto>>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        /// <summary>Gets paginated skills for the logged-in employee.</summary>
        public async Task<ApiResponse<PaginatedResponse<EmployeeSkillDto>>> GetMySkills(
            int employeeId,
            string searchTerm,
            int pageNumber,
            int pageSize
        )
        {
            Log.Information(
                "GetMySkills started. EmployeeId={EmployeeId}, SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                employeeId, searchTerm ?? "none", pageNumber, pageSize
            );

            try
            {
                var (items, totalCount) = await _repository.GetMySkillsAsync(
                    employeeId,
                    searchTerm,
                    pageNumber,
                    pageSize
                );

                Log.Debug("GetMySkills: Retrieved {ItemCount} skills. TotalCount={TotalCount}", items.Count, totalCount);

                var skillDtos = items
                    .Select(m => new EmployeeSkillDto
                    {
                        MapperId = m.MapperId,
                        EmployeeId = m.EmployeeId,
                        EmployeeName =
                            $"{m.Employee.Userprofile.FirstName} {m.Employee.Userprofile.LastName}",
                        SkillId = m.SkillId,
                        SkillName = m.Skill.SkillName,
                        Rating = m.Rating,
                        CreatedOn = m.CreatedOn,
                        UpdatedOn = m.UpdatedOn,
                        CanBecomeSme = m.Rating >= LnDConstants.MIN_SME_RATING,
                        IsSme = m.Skill.Lndsmes.Any(s =>
                            s.EmployeeId == m.EmployeeId && s.IsActive == true
                        ),
                    })
                    .ToList();

                Log.Information(
                    "GetMySkills succeeded. EmployeeId={EmployeeId}, ReturnedCount={Count}, TotalCount={TotalCount}",
                    employeeId, skillDtos.Count, totalCount
                );

                return new ApiResponse<PaginatedResponse<EmployeeSkillDto>>
                {
                    Success = true,
                    Data = new PaginatedResponse<EmployeeSkillDto>
                    {
                        Items = skillDtos,
                        TotalCount = totalCount,
                        PageNumber = pageNumber,
                        PageSize = pageSize,
                    },
                };
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "GetMySkills failed. EmployeeId={EmployeeId}, Error={ErrorMessage}",
                    employeeId, ex.Message
                );

                return new ApiResponse<PaginatedResponse<EmployeeSkillDto>>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        #endregion

        #region Skill Operations

        /// <summary>Records a single skill rating for an employee.</summary>
        public async Task<ApiResponse<EmployeeSkillDto>> RecordEmployeeSkill(
            int managerId,
            RecordSkillRequest request
        )
        {
            Log.Information(
                "RecordEmployeeSkill started. ManagerId={ManagerId}, EmployeeId={EmployeeId}, SkillId={SkillId}, Rating={Rating}",
                managerId, request.EmployeeId, request.SkillId, request.Rating
            );

            try
            {
                var employee = await _repository.GetEmployeeByIdAsync(request.EmployeeId);

                if (employee == null || employee.ReportingManagerEmployeeId != managerId)
                {
                    Log.Warning(
                        "RecordEmployeeSkill: Employee validation failed. EmployeeId={EmployeeId}, ManagerId={ManagerId}",
                        request.EmployeeId, managerId
                    );

                    return new ApiResponse<EmployeeSkillDto>
                    {
                        Success = false,
                        Message = "Employee not found or not your subordinate",
                    };
                }

                var skill = await _repository.GetSkillByIdAsync(request.SkillId);

                if (skill == null)
                {
                    Log.Warning("RecordEmployeeSkill: Skill not found. SkillId={SkillId}", request.SkillId);

                    return new ApiResponse<EmployeeSkillDto>
                    {
                        Success = false,
                        Message = "Skill not found",
                    };
                }

                var existingMapping = await _repository.GetEmployeeSkillMappingAsync(
                    request.EmployeeId,
                    request.SkillId
                );

                if (existingMapping != null)
                {
                    Log.Warning(
                        "RecordEmployeeSkill: Skill already exists. EmployeeId={EmployeeId}, SkillId={SkillId}",
                        request.EmployeeId, request.SkillId
                    );

                    return new ApiResponse<EmployeeSkillDto>
                    {
                        Success = false,
                        Message = "Skill already recorded for this employee",
                    };
                }

                var mapper = new Lndemployeeskillmapper
                {
                    EmployeeId = request.EmployeeId,
                    SkillId = request.SkillId,
                    Rating = request.Rating,
                    CreatedByEmployeeId = managerId,
                    UpdatedByEmployeeId = managerId,
                    CreatedOn = DateOnly.FromDateTime(DateTime.Now),
                    UpdatedOn = DateOnly.FromDateTime(DateTime.Now),
                };

                var savedMapper = await _repository.AddEmployeeSkillAsync(mapper);
                await _baseRepository.SaveChangesAsync();

                Log.Information(
                    "RecordEmployeeSkill succeeded. MapperId={MapperId}, EmployeeId={EmployeeId}, SkillId={SkillId}, Rating={Rating}",
                    savedMapper.MapperId, request.EmployeeId, request.SkillId, request.Rating
                );

                return new ApiResponse<EmployeeSkillDto>
                {
                    Success = true,
                    Message = "Skill recorded successfully",
                    Data = new EmployeeSkillDto
                    {
                        MapperId = savedMapper.MapperId,
                        EmployeeId = savedMapper.EmployeeId,
                        EmployeeName =
                            $"{employee.Userprofile.FirstName} {employee.Userprofile.LastName}",
                        SkillId = savedMapper.SkillId,
                        SkillName = skill.SkillName,
                        Rating = savedMapper.Rating,
                        CreatedOn = savedMapper.CreatedOn,
                        UpdatedOn = savedMapper.UpdatedOn,
                        CanBecomeSme = savedMapper.Rating >= LnDConstants.MIN_SME_RATING,
                        IsSme = false,
                    },
                };
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "RecordEmployeeSkill failed. ManagerId={ManagerId}, EmployeeId={EmployeeId}, SkillId={SkillId}, Error={ErrorMessage}",
                    managerId, request.EmployeeId, request.SkillId, ex.Message
                );

                return new ApiResponse<EmployeeSkillDto>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        /// <summary>Records multiple skill ratings for an employee in a single transaction.</summary>
        public async Task<ApiResponse<List<EmployeeSkillDto>>> BulkRecordEmployeeSkills(
            int managerId,
            BulkRecordSkillRequest request
        )
        {
            Log.Information(
                "BulkRecordEmployeeSkills started. ManagerId={ManagerId}, EmployeeId={EmployeeId}, SkillCount={Count}",
                managerId, request.EmployeeId, request.Skills?.Count ?? 0
            );

            try
            {
                var employee = await _repository.GetEmployeeByIdAsync(request.EmployeeId);

                if (employee == null || employee.ReportingManagerEmployeeId != managerId)
                {
                    Log.Warning(
                        "BulkRecordEmployeeSkills: Employee validation failed. EmployeeId={EmployeeId}, ManagerId={ManagerId}",
                        request.EmployeeId, managerId
                    );

                    return new ApiResponse<List<EmployeeSkillDto>>
                    {
                        Success = false,
                        Message = "Employee not found or not your subordinate",
                    };
                }

                var skillIds = request.Skills.Select(s => s.SkillId).ToList();
                var skills = await _repository.GetAllSkillsAsync();
                var relevantSkills = skills.Where(s => skillIds.Contains(s.SkillId)).ToList();

                var existingMappings = await _repository.GetExistingSkillMappingsAsync(
                    request.EmployeeId,
                    skillIds
                );

                Log.Debug(
                    "BulkRecordEmployeeSkills: ExistingMappings={ExistingCount}, RequestedSkills={RequestedCount}",
                    existingMappings.Count, request.Skills.Count
                );

                var newMappings = new List<Lndemployeeskillmapper>();
                var results = new List<EmployeeSkillDto>();

                foreach (var skillRating in request.Skills)
                {
                    if (existingMappings.Contains(skillRating.SkillId))
                        continue;

                    var skill = relevantSkills.FirstOrDefault(s =>
                        s.SkillId == skillRating.SkillId
                    );
                    if (skill == null)
                        continue;

                    var mapper = new Lndemployeeskillmapper
                    {
                        EmployeeId = request.EmployeeId,
                        SkillId = skillRating.SkillId,
                        Rating = skillRating.Rating,
                        CreatedByEmployeeId = managerId,
                        UpdatedByEmployeeId = managerId,
                        CreatedOn = DateOnly.FromDateTime(DateTime.Now),
                        UpdatedOn = DateOnly.FromDateTime(DateTime.Now),
                    };

                    newMappings.Add(mapper);
                }

                if (newMappings.Any())
                {
                    await _repository.AddEmployeeSkillsAsync(newMappings);
                    await _baseRepository.SaveChangesAsync();

                    results = newMappings
                        .Select(m => new EmployeeSkillDto
                        {
                            MapperId = m.MapperId,
                            EmployeeId = m.EmployeeId,
                            EmployeeName =
                                $"{employee.Userprofile.FirstName} {employee.Userprofile.LastName}",
                            SkillId = m.SkillId,
                            SkillName = relevantSkills.First(s => s.SkillId == m.SkillId).SkillName,
                            Rating = m.Rating,
                            CreatedOn = m.CreatedOn,
                            UpdatedOn = m.UpdatedOn,
                            CanBecomeSme = m.Rating >= LnDConstants.MIN_SME_RATING,
                            IsSme = false,
                        })
                        .ToList();
                }

                Log.Information(
                    "BulkRecordEmployeeSkills succeeded. ManagerId={ManagerId}, EmployeeId={EmployeeId}, RecordedCount={Count}",
                    managerId, request.EmployeeId, results.Count
                );

                return new ApiResponse<List<EmployeeSkillDto>>
                {
                    Success = true,
                    Message = $"{results.Count} skills recorded successfully",
                    Data = results,
                };
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "BulkRecordEmployeeSkills failed. ManagerId={ManagerId}, EmployeeId={EmployeeId}, Error={ErrorMessage}",
                    managerId, request.EmployeeId, ex.Message
                );

                return new ApiResponse<List<EmployeeSkillDto>>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        /// <summary>Updates an existing employee skill rating and deactivates SME status if rating drops below threshold.</summary>
        public async Task<ApiResponse<EmployeeSkillDto>> UpdateEmployeeSkillRating(
            int managerId,
            UpdateSkillRatingRequest request
        )
        {
            Log.Information(
                "UpdateEmployeeSkillRating started. ManagerId={ManagerId}, MapperId={MapperId}, NewRating={NewRating}",
                managerId, request.MapperId, request.Rating
            );

            try
            {
                var mapper = await _repository.GetEmployeeSkillMappingByIdAsync(request.MapperId);

                if (mapper == null || mapper.Employee.ReportingManagerEmployeeId != managerId)
                {
                    Log.Warning(
                        "UpdateEmployeeSkillRating: Mapper validation failed. MapperId={MapperId}, ManagerId={ManagerId}",
                        request.MapperId, managerId
                    );

                    return new ApiResponse<EmployeeSkillDto>
                    {
                        Success = false,
                        Message = "Skill mapping not found or employee not your subordinate",
                    };
                }

                var oldRating = mapper.Rating;
                mapper.Rating = request.Rating;
                mapper.UpdatedByEmployeeId = managerId;
                mapper.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);

                var smeRecord = await _smeRepository.GetActiveSmeAsync(
                    mapper.EmployeeId,
                    mapper.SkillId
                );

                if (smeRecord != null && request.Rating < LnDConstants.MIN_SME_RATING)
                {
                    Log.Information(
                        "UpdateEmployeeSkillRating: Deactivating SME. SmeId={SmeId}, EmployeeId={EmployeeId}, SkillId={SkillId}, OldRating={OldRating}, NewRating={NewRating}",
                        smeRecord.SmeId, mapper.EmployeeId, mapper.SkillId, oldRating, request.Rating
                    );

                    smeRecord.IsActive = false;
                    await _smeRepository.UpdateSmeAsync(smeRecord);
                }

                await _repository.UpdateEmployeeSkillAsync(mapper);
                await _baseRepository.SaveChangesAsync();

                Log.Information(
                    "UpdateEmployeeSkillRating succeeded. MapperId={MapperId}, EmployeeId={EmployeeId}, SkillId={SkillId}, OldRating={OldRating}, NewRating={NewRating}",
                    request.MapperId, mapper.EmployeeId, mapper.SkillId, oldRating, request.Rating
                );

                return new ApiResponse<EmployeeSkillDto>
                {
                    Success = true,
                    Message = "Skill rating updated successfully",
                    Data = new EmployeeSkillDto
                    {
                        MapperId = mapper.MapperId,
                        EmployeeId = mapper.EmployeeId,
                        EmployeeName =
                            $"{mapper.Employee.Userprofile.FirstName} {mapper.Employee.Userprofile.LastName}",
                        SkillId = mapper.SkillId,
                        SkillName = mapper.Skill.SkillName,
                        Rating = mapper.Rating,
                        CreatedOn = mapper.CreatedOn,
                        UpdatedOn = mapper.UpdatedOn,
                        CanBecomeSme = mapper.Rating >= LnDConstants.MIN_SME_RATING,
                        IsSme = smeRecord != null && smeRecord.IsActive == true,
                    },
                };
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "UpdateEmployeeSkillRating failed. ManagerId={ManagerId}, MapperId={MapperId}, Error={ErrorMessage}",
                    managerId, request.MapperId, ex.Message
                );

                return new ApiResponse<EmployeeSkillDto>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        /// <summary>Deletes an employee skill mapping and deactivates associated SME status if active.</summary>
        public async Task<ApiResponse<bool>> DeleteEmployeeSkill(int managerId, int mapperId)
        {
            Log.Information(
                "DeleteEmployeeSkill started. ManagerId={ManagerId}, MapperId={MapperId}",
                managerId, mapperId
            );

            try
            {
                // Validation
                var mapper = await _repository.GetEmployeeSkillMappingByIdAsync(mapperId);

                if (mapper == null || mapper.Employee.ReportingManagerEmployeeId != managerId)
                {
                    Log.Warning(
                        "DeleteEmployeeSkill: Mapper validation failed. MapperId={MapperId}, ManagerId={ManagerId}",
                        mapperId, managerId
                    );

                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Skill mapping not found or employee not your subordinate",
                    };
                }


                var pendingSkillApprovals = await _repository.GetPendingSkillApprovalsAsync(
                    mapper.EmployeeId,
                    mapper.SkillId
                );

                if (pendingSkillApprovals.Any())
                {
                    Log.Information(
                        "DeleteEmployeeSkill: Deleting {Count} pending skill approvals. EmployeeId={EmployeeId}, SkillId={SkillId}",
                        pendingSkillApprovals.Count, mapper.EmployeeId, mapper.SkillId
                    );
                    await _repository.DeleteApprovalsAsync(pendingSkillApprovals);
                }

                // Step 2: Get related active assignments
                var relatedAssignments = await _repository.GetActiveAssignmentsForSkillAsync(
                    mapper.EmployeeId,
                    mapper.SkillId
                );

                // Step 3: Delete pending assignment approvals (child records first)
                if (relatedAssignments.Any())
                {
                    var assignmentIds = relatedAssignments.Select(a => a.AssignmentId).ToList();

                    var assignmentApprovals = await _repository.GetPendingAssignmentApprovalsAsync(assignmentIds);

                    if (assignmentApprovals.Any())
                    {
                        Log.Information(
                            "DeleteEmployeeSkill: Deleting {Count} pending assignment approvals",
                            assignmentApprovals.Count
                        );
                        await _repository.DeleteApprovalsAsync(assignmentApprovals);
                    }


                    Log.Information(
                        "DeleteEmployeeSkill: Deleting {Count} related assignments. EmployeeId={EmployeeId}, SkillId={SkillId}",
                        relatedAssignments.Count, mapper.EmployeeId, mapper.SkillId
                    );
                    await _repository.DeleteAssignmentsAsync(relatedAssignments);
                }


                var smeRecord = await _smeRepository.GetActiveSmeAsync(
                    mapper.EmployeeId,
                    mapper.SkillId
                );

                if (smeRecord != null)
                {
                    Log.Information(
                        "DeleteEmployeeSkill: Deactivating SME. SmeId={SmeId}, EmployeeId={EmployeeId}, SkillId={SkillId}",
                        smeRecord.SmeId, mapper.EmployeeId, mapper.SkillId
                    );

                    smeRecord.IsActive = false;
                    await _smeRepository.UpdateSmeAsync(smeRecord);
                }


                await _repository.DeleteEmployeeSkillAsync(mapper);


                await _baseRepository.SaveChangesAsync();

                Log.Information(
                    "DeleteEmployeeSkill succeeded. MapperId={MapperId}, EmployeeId={EmployeeId}, SkillId={SkillId}, DeletedAssignments={AssignmentCount}",
                    mapperId, mapper.EmployeeId, mapper.SkillId, relatedAssignments.Count
                );

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = $"Skill deleted successfully. {relatedAssignments.Count} active assignment(s) removed. SME status deactivated if applicable.",
                    Data = true,
                };
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "DeleteEmployeeSkill failed. ManagerId={ManagerId}, MapperId={MapperId}, Error={ErrorMessage}",
                    managerId, mapperId, ex.Message
                );

                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        #endregion
    }
}
