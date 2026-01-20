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
            ApiResponse<PaginatedResponse<SubordinateEmployeeResponseModel>>
        > GetSubordinateEmployees(int managerId, SubordinateEmployeesRequestModel request)
        {
            Log.Information(
                "GetSubordinateEmployees started. ManagerId={ManagerId}, SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                managerId, request.SearchTerm ?? "none", request.PageNumber, request.PageSize
            );

            var manager = await _repository.GetEmployeeById(managerId);

            if (manager == null)
            {
                Log.Warning("GetSubordinateEmployees: Manager not found. ManagerId={ManagerId}", managerId);

                return new ApiResponse<PaginatedResponse<SubordinateEmployeeResponseModel>>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.MANAGER_NOT_FOUND,

                };
            }

            var (items, totalCount) = await _repository.GetSubordinateEmployees(
                managerId,
                request
            );

            Log.Debug(
                "GetSubordinateEmployees: Retrieved {ItemCount} employees. TotalCount={TotalCount}",
                items.Count, totalCount
            );

            var employeeDtos = items
                .Select(e => new SubordinateEmployeeResponseModel
                {
                    EmployeeId = e.EmployeeId,
                    EmployeeName = $"{e.Userprofile?.FirstName} {e.Userprofile?.LastName}",
                    Email = e.Userauthentication?.Email,
                    DepartmentName = e
                        .Employeedetailsmasters.FirstOrDefault()
                        ?.Department?.DepartmentName,
                })
                .ToList();

            var paginatedResponse = new PaginatedResponse<SubordinateEmployeeResponseModel>
            {
                Items = employeeDtos,
                TotalCount = totalCount,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
            };

            Log.Information(
                "GetSubordinateEmployees succeeded. ManagerId={ManagerId}, ReturnedCount={Count}, TotalCount={TotalCount}",
                managerId, employeeDtos.Count, totalCount
            );

            return new ApiResponse<PaginatedResponse<SubordinateEmployeeResponseModel>>
            {
                Success = true,
                Message = string.Format(
    LnDConstants.RESPONSE_MESSAGES.SUBORDINATES_FOUND,
    totalCount
),

                Data = paginatedResponse,
            };
        }

        #endregion

        #region Skill Queries

        /// <summary>Gets all available skills for dropdown selection.</summary>
        public async Task<ApiResponse<List<SkillResponseModel>>> GetAllSkills()
        {
            Log.Information("GetAllSkills started");

            var skills = await _repository.GetAllSkills();

            var skillResponseModels = skills
                .Select(s => new SkillResponseModel { SkillId = s.SkillId, SkillName = s.SkillName })
                .ToList();

            Log.Information("GetAllSkills succeeded. SkillCount={Count}", skillResponseModels.Count);

            return new ApiResponse<List<SkillResponseModel>>
            {
                Success = true,
                Message = string.Format(
    LnDConstants.RESPONSE_MESSAGES.SKILLS_FOUND,
    skillResponseModels.Count
),

                Data = skillResponseModels,
            };
        }

        /// <summary>Gets paginated skills for subordinate employees with optional employee filter.</summary>
        public async Task<ApiResponse<PaginatedResponse<EmployeeSkillResponseModel>>> GetSubordinateSkills(
            int managerId,
            SubordinateSkillsRequestModel request
        )
        {
            Log.Information(
                "GetSubordinateSkills started. ManagerId={ManagerId}, EmployeeId={EmployeeId}, SearchTerm={SearchTerm}, SortBy={SortBy}, Page={PageNumber}",
                managerId, request.EmployeeId?.ToString() ?? "all", request.SearchTerm ?? "none", request.SortBy ?? "default", request.PageNumber
            );

            var manager = await _repository.GetEmployeeById(managerId);

            if (manager == null)
            {
                Log.Warning("GetSubordinateSkills: Manager not found. ManagerId={ManagerId}", managerId);

                return new ApiResponse<PaginatedResponse<EmployeeSkillResponseModel>>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.MANAGER_NOT_FOUND,

                };
            }

            var (items, totalCount) = await _repository.GetSubordinateSkills(
                managerId,
                request
            );

            Log.Debug(
                "GetSubordinateSkills: Retrieved {ItemCount} skills. TotalCount={TotalCount}",
                items.Count, totalCount
            );

            var skillResponseModels = items
                .Select(m => new EmployeeSkillResponseModel
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
                managerId, skillResponseModels.Count, totalCount
            );

            return new ApiResponse<PaginatedResponse<EmployeeSkillResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<EmployeeSkillResponseModel>
                {
                    Items = skillResponseModels,
                    TotalCount = totalCount,
                    PageNumber = request.PageNumber,
                    PageSize = 1_000_000,
                },
            };
        }

        /// <summary>Gets paginated skills for the logged-in employee.</summary>
        public async Task<ApiResponse<PaginatedResponse<EmployeeSkillResponseModel>>> GetMySkills(
            int employeeId,
            MySkillsRequestModel request
        )
        {
            Log.Information(
                "GetMySkills started. EmployeeId={EmployeeId}, SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                employeeId, request.SearchTerm ?? "none", request.PageNumber, request.PageSize
            );

            var (items, totalCount) = await _repository.GetMySkills(employeeId, request);

            Log.Debug("GetMySkills: Retrieved {ItemCount} skills. TotalCount={TotalCount}", items.Count, totalCount);

            var skillResponseModels = items
                .Select(m => new EmployeeSkillResponseModel
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
                employeeId, skillResponseModels.Count, totalCount
            );

            return new ApiResponse<PaginatedResponse<EmployeeSkillResponseModel>>
            {
                Success = true,
                Data = new PaginatedResponse<EmployeeSkillResponseModel>
                {
                    Items = skillResponseModels,
                    TotalCount = totalCount,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize,
                },
            };
        }

        #endregion

        #region Skill Operations

        /// <summary>Records a single skill rating for an employee.</summary>
        public async Task<ApiResponse<EmployeeSkillResponseModel>> RecordEmployeeSkill(
            int managerId,
            RecordSkillRequestModel request
        )
        {
            Log.Information(
                "RecordEmployeeSkill started. ManagerId={ManagerId}, EmployeeId={EmployeeId}, SkillId={SkillId}, Rating={Rating}",
                managerId, request.EmployeeId, request.SkillId, request.Rating
            );

            var employee = await _repository.GetEmployeeById(request.EmployeeId);

            if (employee == null || employee.ReportingManagerEmployeeId != managerId)
            {
                Log.Warning(
                    "RecordEmployeeSkill: Employee validation failed. EmployeeId={EmployeeId}, ManagerId={ManagerId}",
                    request.EmployeeId, managerId
                );

                return new ApiResponse<EmployeeSkillResponseModel>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.EMPLOYEE_NOT_FOUND_OR_NOT_SUBORDINATE,

                };
            }

            var skill = await _repository.GetSkillById(request.SkillId);

            if (skill == null)
            {
                Log.Warning("RecordEmployeeSkill: Skill not found. SkillId={SkillId}", request.SkillId);

                return new ApiResponse<EmployeeSkillResponseModel>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.SKILL_NOT_FOUND,

                };
            }

            var existingMapping = await _repository.GetEmployeeSkillMapping(
                request.EmployeeId,
                request.SkillId
            );

            if (existingMapping != null)
            {
                Log.Warning(
                    "RecordEmployeeSkill: Skill already exists. EmployeeId={EmployeeId}, SkillId={SkillId}",
                    request.EmployeeId, request.SkillId
                );

                return new ApiResponse<EmployeeSkillResponseModel>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.SKILL_ALREADY_RECORDED,

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

            var savedMapper = await _repository.AddEmployeeSkill(mapper);
            await _baseRepository.SaveChangesAsync();

            Log.Information(
                "RecordEmployeeSkill succeeded. MapperId={MapperId}, EmployeeId={EmployeeId}, SkillId={SkillId}, Rating={Rating}",
                savedMapper.MapperId, request.EmployeeId, request.SkillId, request.Rating
            );

            return new ApiResponse<EmployeeSkillResponseModel>
            {
                Success = true,
                Message = LnDConstants.RESPONSE_MESSAGES.SKILL_RECORDED_SUCCESS,

                Data = new EmployeeSkillResponseModel
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

        /// <summary>Records multiple skill ratings for an employee in a single transaction.</summary>
        public async Task<ApiResponse<List<EmployeeSkillResponseModel>>> BulkRecordEmployeeSkills(
            int managerId,
            BulkRecordSkillRequestModel request
        )
        {
            Log.Information(
                "BulkRecordEmployeeSkills started. ManagerId={ManagerId}, EmployeeId={EmployeeId}, SkillCount={Count}",
                managerId, request.EmployeeId, request.Skills?.Count ?? 0
            );

            var employee = await _repository.GetEmployeeById(request.EmployeeId);

            if (employee == null || employee.ReportingManagerEmployeeId != managerId)
            {
                Log.Warning(
                    "BulkRecordEmployeeSkills: Employee validation failed. EmployeeId={EmployeeId}, ManagerId={ManagerId}",
                    request.EmployeeId, managerId
                );

                return new ApiResponse<List<EmployeeSkillResponseModel>>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.EMPLOYEE_NOT_FOUND_OR_NOT_SUBORDINATE,

                };
            }

            var skillIds = request.Skills.Select(s => s.SkillId).ToList();
            var skills = await _repository.GetAllSkills();
            var relevantSkills = skills.Where(s => skillIds.Contains(s.SkillId)).ToList();

            var existingMappings = await _repository.GetExistingSkillMappings(
                request.EmployeeId,
                skillIds
            );

            Log.Debug(
                "BulkRecordEmployeeSkills: ExistingMappings={ExistingCount}, RequestedSkills={RequestedCount}",
                existingMappings.Count, request.Skills.Count
            );

            var newMappings = new List<Lndemployeeskillmapper>();
            var results = new List<EmployeeSkillResponseModel>();

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
                await _repository.AddEmployeeSkills(newMappings);
                await _baseRepository.SaveChangesAsync();

                results = newMappings
                    .Select(m => new EmployeeSkillResponseModel
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

            return new ApiResponse<List<EmployeeSkillResponseModel>>
            {
                Success = true,
                Message = LnDConstants.RESPONSE_MESSAGES.SKILL_RECORDED_SUCCESS,

                Data = results,
            };
        }

        /// <summary>Updates an existing employee skill rating and deactivates SME status if rating drops below threshold.</summary>
        public async Task<ApiResponse<EmployeeSkillResponseModel>> UpdateEmployeeSkillRating(
            int managerId,
            UpdateSkillRatingRequestModel request
        )
        {
            Log.Information(
                "UpdateEmployeeSkillRating started. ManagerId={ManagerId}, MapperId={MapperId}, NewRating={NewRating}",
                managerId, request.MapperId, request.Rating
            );

            var mapper = await _repository.GetEmployeeSkillMappingById(request.MapperId);

            if (mapper == null || mapper.Employee.ReportingManagerEmployeeId != managerId)
            {
                Log.Warning(
                    "UpdateEmployeeSkillRating: Mapper validation failed. MapperId={MapperId}, ManagerId={ManagerId}",
                    request.MapperId, managerId
                );

                return new ApiResponse<EmployeeSkillResponseModel>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.SKILL_MAPPING_NOT_FOUND_OR_UNAUTHORIZED,

                };
            }

            var oldRating = mapper.Rating;
            mapper.Rating = request.Rating;
            mapper.UpdatedByEmployeeId = managerId;
            mapper.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);

            var smeRecord = await _smeRepository.GetActiveSme(
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
                await _smeRepository.UpdateSme(smeRecord);
            }

            await _repository.UpdateEmployeeSkill(mapper);
            await _baseRepository.SaveChangesAsync();

            Log.Information(
                "UpdateEmployeeSkillRating succeeded. MapperId={MapperId}, EmployeeId={EmployeeId}, SkillId={SkillId}, OldRating={OldRating}, NewRating={NewRating}",
                request.MapperId, mapper.EmployeeId, mapper.SkillId, oldRating, request.Rating
            );

            return new ApiResponse<EmployeeSkillResponseModel>
            {
                Success = true,
                Message = LnDConstants.RESPONSE_MESSAGES.SKILL_RATING_UPDATED_SUCCESS,

                Data = new EmployeeSkillResponseModel
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

        /// <summary>Deletes an employee skill mapping and deactivates associated SME status if active.</summary>
        public async Task<ApiResponse<bool>> DeleteEmployeeSkill(int managerId, int mapperId)
        {
            Log.Information(
                "DeleteEmployeeSkill started. ManagerId={ManagerId}, MapperId={MapperId}",
                managerId, mapperId
            );

            var mapper = await _repository.GetEmployeeSkillMappingById(mapperId);

            if (mapper == null || mapper.Employee.ReportingManagerEmployeeId != managerId)
            {
                Log.Warning(
                    "DeleteEmployeeSkill: Mapper validation failed. MapperId={MapperId}, ManagerId={ManagerId}",
                    mapperId, managerId
                );

                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = LnDConstants.RESPONSE_MESSAGES.SKILL_MAPPING_NOT_FOUND_OR_UNAUTHORIZED,

                };
            }

            var pendingSkillApprovals = await _repository.GetPendingSkillApprovals(
                mapper.EmployeeId,
                mapper.SkillId
            );

            if (pendingSkillApprovals.Any())
            {
                Log.Information(
                    "DeleteEmployeeSkill: Deleting {Count} pending skill approvals. EmployeeId={EmployeeId}, SkillId={SkillId}",
                    pendingSkillApprovals.Count, mapper.EmployeeId, mapper.SkillId
                );
                await _repository.DeleteApprovals(pendingSkillApprovals);
            }

            var relatedAssignments = await _repository.GetActiveAssignmentsForSkill(
                mapper.EmployeeId,
                mapper.SkillId
            );

            if (relatedAssignments.Any())
            {
                var assignmentIds = relatedAssignments.Select(a => a.AssignmentId).ToList();

                var assignmentApprovals = await _repository.GetPendingAssignmentApprovals(assignmentIds);

                if (assignmentApprovals.Any())
                {
                    Log.Information(
                        "DeleteEmployeeSkill: Deleting {Count} pending assignment approvals",
                        assignmentApprovals.Count
                    );
                    await _repository.DeleteApprovals(assignmentApprovals);
                }

                Log.Information(
                    "DeleteEmployeeSkill: Deleting {Count} related assignments. EmployeeId={EmployeeId}, SkillId={SkillId}",
                    relatedAssignments.Count, mapper.EmployeeId, mapper.SkillId
                );
                await _repository.DeleteAssignments(relatedAssignments);
            }

            var smeRecord = await _smeRepository.GetActiveSme(
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
                await _smeRepository.UpdateSme(smeRecord);
            }

            await _repository.DeleteEmployeeSkill(mapper);

            await _baseRepository.SaveChangesAsync();

            Log.Information(
                "DeleteEmployeeSkill succeeded. MapperId={MapperId}, EmployeeId={EmployeeId}, SkillId={SkillId}, DeletedAssignments={AssignmentCount}",
                mapperId, mapper.EmployeeId, mapper.SkillId, relatedAssignments.Count
            );

            return new ApiResponse<bool>
            {
                Success = true,
                Message = string.Format(
    LnDConstants.RESPONSE_MESSAGES.SKILL_DELETE_WITH_ASSIGNMENTS,
    relatedAssignments.Count
),

                Data = true,
            };
        }

        #endregion
    }
}
