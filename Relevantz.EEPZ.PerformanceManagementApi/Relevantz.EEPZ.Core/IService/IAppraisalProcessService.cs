
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

 
namespace Relevantz.EEPZ.Core.Services.Interfaces
{

    public interface IAppraisalProcessService

    {

        Task<ApiResponse<List<AppraisalResponseDto>>> InitiateAppraisalAsync(InitiateAppraisalRequestDto request);

        Task<ApiResponse<List<AppraisalResponseDto>>> GetAppraisalsByFormIdAsync(int formId);

        Task<ApiResponse<AppraisalResponseDto>> GetAppraisalByIdAsync(int assignmentId);

    }

}

 