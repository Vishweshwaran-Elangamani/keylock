using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repositories.Interface;


namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class LnDEmployeeSkillService : ILnDEmployeeSkillService
    {
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

        public async Task<
            ApiResponse<PaginatedResponse<SubordinateEmployeeDto>>
        > GetSubordinateEmployees(int managerId, string? searchTerm, int pageNumber, int pageSize)
        {
            try
            {
                var manager = await _repository.GetEmployeeByIdAsync(managerId);

                if (manager == null)
                {
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

                return new ApiResponse<PaginatedResponse<SubordinateEmployeeDto>>
                {
                    Success = true,
                    Message = $"Found {totalCount} subordinate(s)",
                    Data = paginatedResponse,
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<PaginatedResponse<SubordinateEmployeeDto>>
                {
                    Success = false,
                    Message = $"Error retrieving subordinates: {ex.Message}",
                };
            }
        }

        public async Task<ApiResponse<List<SkillDto>>> GetAllSkills()
        {
            try
            {
                var skills = await _repository.GetAllSkillsAsync();

                var skillDtos = skills
                    .Select(s => new SkillDto { SkillId = s.SkillId, SkillName = s.SkillName })
                    .ToList();

                return new ApiResponse<List<SkillDto>>
                {
                    Success = true,
                    Message = $"Found {skillDtos.Count} skill(s)",
                    Data = skillDtos,
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<SkillDto>>
                {
                    Success = false,
                    Message = $"Error retrieving skills: {ex.Message}",
                };
            }
        }

        public async Task<ApiResponse<PaginatedResponse<EmployeeSkillDto>>> GetSubordinateSkills(
            int managerId,
            int? employeeId,
            string? searchTerm,
            string? sortBy,
            int pageNumber,
            int pageSize = 1_000_000
        )
        {
            try
            {
                var manager = await _repository.GetEmployeeByIdAsync(managerId);

                if (manager == null)
                    return new ApiResponse<PaginatedResponse<EmployeeSkillDto>>
                    {
                        Success = false,
                        Message = "Manager not found",
                    };

                var (items, totalCount) = await _repository.GetSubordinateSkillsAsync(
                    managerId,
                    employeeId,
                    searchTerm,
                    sortBy,
                    pageNumber,
                    pageSize
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
                return new ApiResponse<PaginatedResponse<EmployeeSkillDto>>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        public async Task<ApiResponse<EmployeeSkillDto>> RecordEmployeeSkill(
            int managerId,
            RecordSkillRequest request
        )
        {
            try
            {
                var employee = await _repository.GetEmployeeByIdAsync(request.EmployeeId);

                if (employee == null || employee.ReportingManagerEmployeeId != managerId)
                    return new ApiResponse<EmployeeSkillDto>
                    {
                        Success = false,
                        Message = "Employee not found or not your subordinate",
                    };

                var skill = await _repository.GetSkillByIdAsync(request.SkillId);

                if (skill == null)
                    return new ApiResponse<EmployeeSkillDto>
                    {
                        Success = false,
                        Message = "Skill not found",
                    };

                var existingMapping = await _repository.GetEmployeeSkillMappingAsync(
                    request.EmployeeId,
                    request.SkillId
                );

                if (existingMapping != null)
                    return new ApiResponse<EmployeeSkillDto>
                    {
                        Success = false,
                        Message = "Skill already recorded for this employee",
                    };

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
                return new ApiResponse<EmployeeSkillDto>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        public async Task<ApiResponse<List<EmployeeSkillDto>>> BulkRecordEmployeeSkills(
            int managerId,
            BulkRecordSkillRequest request
        )
        {
            try
            {
                var employee = await _repository.GetEmployeeByIdAsync(request.EmployeeId);

                if (employee == null || employee.ReportingManagerEmployeeId != managerId)
                    return new ApiResponse<List<EmployeeSkillDto>>
                    {
                        Success = false,
                        Message = "Employee not found or not your subordinate",
                    };

                var skillIds = request.Skills.Select(s => s.SkillId).ToList();
                var skills = await _repository.GetAllSkillsAsync();
                var relevantSkills = skills.Where(s => skillIds.Contains(s.SkillId)).ToList();

                var existingMappings = await _repository.GetExistingSkillMappingsAsync(
                    request.EmployeeId,
                    skillIds
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

                return new ApiResponse<List<EmployeeSkillDto>>
                {
                    Success = true,
                    Message = $"{results.Count} skills recorded successfully",
                    Data = results,
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<EmployeeSkillDto>>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        public async Task<ApiResponse<EmployeeSkillDto>> UpdateEmployeeSkillRating(
            int managerId,
            UpdateSkillRatingRequest request
        )   
        {
            try
            {
                var mapper = await _repository.GetEmployeeSkillMappingByIdAsync(request.MapperId);

                if (mapper == null || mapper.Employee.ReportingManagerEmployeeId != managerId)
                    return new ApiResponse<EmployeeSkillDto>
                    {
                        Success = false,
                        Message = "Skill mapping not found or employee not your subordinate",
                    };

                mapper.Rating = request.Rating;
                mapper.UpdatedByEmployeeId = managerId;
                mapper.UpdatedOn = DateOnly.FromDateTime(DateTime.Now);

                var smeRecord = await _smeRepository.GetActiveSmeAsync(
                    mapper.EmployeeId,
                    mapper.SkillId
                );

                if (smeRecord != null && request.Rating < LnDConstants.MIN_SME_RATING)
                {
                    smeRecord.IsActive = false;
                    await _smeRepository.UpdateSmeAsync(smeRecord);
                }

                await _repository.UpdateEmployeeSkillAsync(mapper);
                await _baseRepository.SaveChangesAsync();

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
                return new ApiResponse<EmployeeSkillDto>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteEmployeeSkill(int managerId, int mapperId)
        {
            try
            {
                var mapper = await _repository.GetEmployeeSkillMappingByIdAsync(mapperId);

                if (mapper == null || mapper.Employee.ReportingManagerEmployeeId != managerId)
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Skill mapping not found or employee not your subordinate",
                    };

                var smeRecord = await _smeRepository.GetActiveSmeAsync(
                    mapper.EmployeeId,
                    mapper.SkillId
                );

                if (smeRecord != null)
                {
                    smeRecord.IsActive = false;
                    await _smeRepository.UpdateSmeAsync(smeRecord);
                }

                await _repository.DeleteEmployeeSkillAsync(mapper);
                await _baseRepository.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Skill deleted successfully. SME status deactivated if applicable.",
                    Data = true,
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }

        public async Task<ApiResponse<PaginatedResponse<EmployeeSkillDto>>> GetMySkills(
            int employeeId,
            string searchTerm,
            int pageNumber,
            int pageSize
        )
        {
            try
            {
                var (items, totalCount) = await _repository.GetMySkillsAsync(
                    employeeId,
                    searchTerm,
                    pageNumber,
                    pageSize
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
                return new ApiResponse<PaginatedResponse<EmployeeSkillDto>>
                {
                    Success = false,
                    Message = "An error occurred",
                    Errors = new List<string> { ex.Message },
                };
            }
        }
    }
}
