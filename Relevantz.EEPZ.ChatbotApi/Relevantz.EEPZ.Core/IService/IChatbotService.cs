using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.IService;

public interface IChatbotService
{
    // Message Processing
    Task<ApiResponseDto<ChatResponseDto>> ProcessMessageAsync(string message, string sessionId, int userId);
    Task<ApiResponseDto<List<ConversationHistoryDto>>> GetConversationHistoryAsync(string sessionId, int userId);
    
    // Pattern Management
    Task<ApiResponseDto<List<ChatPatternDto>>> GetAllPatternsAsync();
    Task<ApiResponseDto<ChatPatternDto>> GetPatternByIdAsync(int patternId);
    Task<ApiResponseDto<ChatPatternDto>> CreatePatternAsync(CreateChatPatternRequestDto request, int userId);
    Task<ApiResponseDto<ChatPatternDto>> UpdatePatternAsync(UpdateChatPatternRequestDto request);
    Task<ApiResponseDto<bool>> DeletePatternAsync(int patternId);
}
