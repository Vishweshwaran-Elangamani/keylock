using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.ViewModels.Common;
using Relevantz.EEPZ.Common.ViewModels.Nomination.Request;
using Relevantz.EEPZ.Common.ViewModels.Nomination.Response;

namespace Relevantz.EEPZ.Core.IService
{
public interface INominationService
{
Task<NominationResponseDto> CreateSelfNominationAsync(int employeeId, CreateSelfNominationRequestDto request);
Task<NominationResponseDto> CreateManagerNominationAsync(int managerId, CreateManagerNominationRequestDto request);
Task<NominationDetailResponseDto> GetNominationByIdAsync(int id);
Task<List<NominationResponseDto>> GetMyNominationsAsync(int employeeId);
Task<NominationListResponseDto> GetPendingManagerReviewAsync(int managerId);
Task<NominationListResponseDto> GetPendingDeptHeadReviewAsync(int deptHeadId);
Task<NominationListResponseDto> GetAllNominationsAsync(string? status);
Task<NominationResponseDto> ManagerReviewNominationAsync(int nominationId, int managerId, ManagerReviewRequestDto request);
Task<NominationResponseDto> DepartmentHeadReviewAsync(int nominationId, int deptHeadId, DepartmentHeadReviewRequestDto request);
Task<EligibilityCheckResponseDto> CheckEligibilityAsync(int employeeId, int opportunityId);
}
}