using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
 
namespace Relevantz.EEPZ.Core.Services.Interfaces
{

    public interface ISelfAssessmentService

    {

        Task<ApiResponse<SelfAssessmentResponseDto>> SubmitSelfAssessmentAsync(SubmitSelfAssessmentRequestDto request);

        Task<ApiResponse<SelfAssessmentResponseDto>> GetSelfAssessmentAsync(int assessmentId);

        Task<ApiResponse<SelfAssessmentResponseDto>> GetSelfAssessmentByFormAndUserAsync(int formId, int userId);

        Task<ApiResponse<ViewSubmittedFormsResponseDto>> GetAllSubmittedFormsAsync(string? status = null);

        Task<ApiResponse<bool>> UpdateAssessmentStatusAsync(int assessmentId, string status);

        Task<ApiResponse<List<SelfAssessmentResponseDto>>> GetAssessmentsByUserAsync(int userId);


    }

}