using System.Text.RegularExpressions;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.IRepository;

namespace Relevantz.EEPZ.Core.Service;

public class ChatbotService : IChatbotService
{
    private readonly IChatbotRepository _chatbotRepository;

    public ChatbotService(IChatbotRepository chatbotRepository)
    {
        _chatbotRepository = chatbotRepository;
    }

    // ==================== MESSAGE PROCESSING ====================

    public async Task<ApiResponseDto<ChatResponseDto>> ProcessMessageAsync(string message, string sessionId, int userId)
    {
        try
        {
            // Get or create conversation
            var conversation = await _chatbotRepository.GetConversationBySessionIdAsync(sessionId, userId);

            if (conversation == null)
            {
                conversation = await _chatbotRepository.CreateConversationAsync(new Chatconversation
                {
                    UserId = userId,
                    SessionId = sessionId,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                });
            }

            // Save user message
            var userMessage = await _chatbotRepository.AddMessageAsync(new Chatmessage
            {
                ConversationId = conversation.ConversationId,
                Message = message,
                IsUserMessage = true,
                CreatedAt = DateTime.UtcNow
            });

            // Get bot response using pattern matching
            var (botResponse, matchedPattern) = await GetBotResponseAsync(message);

            // Save bot response
            var botMessage = await _chatbotRepository.AddMessageAsync(new Chatmessage
            {
                ConversationId = conversation.ConversationId,
                Message = botResponse,
                IsUserMessage = false,
                CreatedAt = DateTime.UtcNow
            });

            // Log action
            await _chatbotRepository.LogActionAsync(new Chatactionlog
            {
                ConversationId = conversation.ConversationId,
                MessageId = botMessage.MessageId,
                ActionType = matchedPattern != null ? "Query" : "Error",
                ActionDetails = matchedPattern != null 
                    ? $"Matched Pattern: {matchedPattern.Pattern} (Category: {matchedPattern.Category})" 
                    : "No pattern matched",
                ExecutedAt = DateTime.UtcNow
            });

            var response = new ChatResponseDto
            {
                Response = botResponse,
                SessionId = sessionId,
                Timestamp = DateTime.UtcNow,
                ActionType = matchedPattern?.Category
            };

            EEPZBusinessLog.Information($"Chatbot processed message for UserId: {userId}, SessionId: {sessionId}");

            return ApiResponseDto<ChatResponseDto>.SuccessResponse(response, "Message processed successfully");
        }
        catch (Exception ex)
        {
            EEPZBusinessLog.Error("Error processing chatbot message", ex);
            return ApiResponseDto<ChatResponseDto>.FailureResponse("An error occurred while processing your message");
        }
    }

    private async Task<(string response, Chatpattern? pattern)> GetBotResponseAsync(string userMessage)
    {
        try
        {
            var patterns = await _chatbotRepository.GetActivePatternsAsync();
            var normalizedMessage = userMessage.ToLowerInvariant().Trim();

            // Strategy 1: Exact word matching (highest priority)
            foreach (var pattern in patterns)
            {
                var normalizedPattern = pattern.Pattern.ToLowerInvariant().Trim();

                // Split message into words
                var messageWords = Regex.Split(normalizedMessage, @"\W+")
                    .Where(w => !string.IsNullOrWhiteSpace(w))
                    .ToList();

                var patternWords = Regex.Split(normalizedPattern, @"\W+")
                    .Where(w => !string.IsNullOrWhiteSpace(w))
                    .ToList();

                // Check if all pattern words exist in message
                if (patternWords.All(pw => messageWords.Contains(pw)))
                {
                    return (pattern.Response, pattern);
                }
            }

            // Strategy 2: Contains matching (flexible)
            foreach (var pattern in patterns)
            {
                var normalizedPattern = pattern.Pattern.ToLowerInvariant().Trim();

                if (normalizedMessage.Contains(normalizedPattern))
                {
                    return (pattern.Response, pattern);
                }
            }

            // Strategy 3: Partial word matching
            foreach (var pattern in patterns)
            {
                var normalizedPattern = pattern.Pattern.ToLowerInvariant().Trim();
                var patternWords = normalizedPattern.Split(' ', StringSplitOptions.RemoveEmptyEntries);

                int matchCount = patternWords.Count(word => normalizedMessage.Contains(word));
                
                // If more than 60% of pattern words match
                if (patternWords.Length > 0 && (matchCount * 100.0 / patternWords.Length) >= 60)
                {
                    return (pattern.Response, pattern);
                }
            }

            // Default fallback response
            return ("I'm sorry, I didn't understand that. Could you rephrase your question?\n\n" +
                    "I can help you with:\n" +
                    "• User Management (create, update, activate, deactivate)\n" +
                    "• Bulk Operations (import, export)\n" +
                    "• Change Requests (view, approve, reject)\n" +
                    "• Role & Department Management\n" +
                    "• Data Exports\n\n" +
                    "Type 'help' for more commands.", null);
        }
        catch (Exception ex)
        {
            EEPZBusinessLog.Error("Error in GetBotResponseAsync", ex);
            return ("An error occurred while processing your request. Please try again.", null);
        }
    }

    public async Task<ApiResponseDto<List<ConversationHistoryDto>>> GetConversationHistoryAsync(string sessionId, int userId)
    {
        try
        {
            var conversation = await _chatbotRepository.GetConversationBySessionIdAsync(sessionId, userId);

            if (conversation == null)
            {
                return ApiResponseDto<List<ConversationHistoryDto>>.SuccessResponse(
                    new List<ConversationHistoryDto>(),
                    "No conversation found"
                );
            }

            var messages = await _chatbotRepository.GetConversationHistoryAsync(conversation.ConversationId);

            var history = messages.Select(m => new ConversationHistoryDto
            {
                MessageId = m.MessageId,
                Message = m.Message,
                IsUserMessage = m.IsUserMessage,
                CreatedAt = m.CreatedAt
            }).ToList();

            return ApiResponseDto<List<ConversationHistoryDto>>.SuccessResponse(history, "Conversation history retrieved");
        }
        catch (Exception ex)
        {
            EEPZBusinessLog.Error("Error retrieving conversation history", ex);
            return ApiResponseDto<List<ConversationHistoryDto>>.FailureResponse("Error retrieving conversation history");
        }
    }

    // ==================== PATTERN MANAGEMENT ====================

    public async Task<ApiResponseDto<List<ChatPatternDto>>> GetAllPatternsAsync()
    {
        try
        {
            var patterns = await _chatbotRepository.GetAllPatternsAsync();

            var patternDtos = patterns.Select(p => new ChatPatternDto
            {
                PatternId = p.PatternId,
                Pattern = p.Pattern,
                Response = p.Response,
                Category = p.Category,
                Priority = p.Priority ?? 0,
                IsActive = p.IsActive ?? true,
                CreatedAt = p.CreatedAt
            }).ToList();

            return ApiResponseDto<List<ChatPatternDto>>.SuccessResponse(patternDtos, "Patterns retrieved successfully");
        }
        catch (Exception ex)
        {
            EEPZBusinessLog.Error("Error retrieving patterns", ex);
            return ApiResponseDto<List<ChatPatternDto>>.FailureResponse("Error retrieving patterns");
        }
    }

    public async Task<ApiResponseDto<ChatPatternDto>> GetPatternByIdAsync(int patternId)
    {
        try
        {
            var pattern = await _chatbotRepository.GetPatternByIdAsync(patternId);

            if (pattern == null)
            {
                return ApiResponseDto<ChatPatternDto>.FailureResponse("Pattern not found");
            }

            var patternDto = new ChatPatternDto
            {
                PatternId = pattern.PatternId,
                Pattern = pattern.Pattern,
                Response = pattern.Response,
                Category = pattern.Category,
                Priority = pattern.Priority ?? 0,
                IsActive = pattern.IsActive ?? true,
                CreatedAt = pattern.CreatedAt
            };

            return ApiResponseDto<ChatPatternDto>.SuccessResponse(patternDto, "Pattern retrieved successfully");
        }
        catch (Exception ex)
        {
            EEPZBusinessLog.Error($"Error retrieving pattern {patternId}", ex);
            return ApiResponseDto<ChatPatternDto>.FailureResponse("Error retrieving pattern");
        }
    }

    public async Task<ApiResponseDto<ChatPatternDto>> CreatePatternAsync(CreateChatPatternRequestDto request, int userId)
    {
        try
        {
            var pattern = new Chatpattern
            {
                Pattern = request.Pattern.Trim(),
                Response = request.Response.Trim(),
                Category = request.Category?.Trim(),
                Priority = request.Priority,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = userId
            };

            var createdPattern = await _chatbotRepository.CreatePatternAsync(pattern);

            var patternDto = new ChatPatternDto
            {
                PatternId = createdPattern.PatternId,
                Pattern = createdPattern.Pattern,
                Response = createdPattern.Response,
                Category = createdPattern.Category,
                Priority = createdPattern.Priority ?? 0,
                IsActive = createdPattern.IsActive ?? true,
                CreatedAt = createdPattern.CreatedAt
            };

            EEPZBusinessLog.Information($"Chat pattern created: {createdPattern.PatternId} by UserId: {userId}");

            return ApiResponseDto<ChatPatternDto>.SuccessResponse(patternDto, "Pattern created successfully");
        }
        catch (Exception ex)
        {
            EEPZBusinessLog.Error("Error creating pattern", ex);
            return ApiResponseDto<ChatPatternDto>.FailureResponse("Error creating pattern");
        }
    }

    public async Task<ApiResponseDto<ChatPatternDto>> UpdatePatternAsync(UpdateChatPatternRequestDto request)
    {
        try
        {
            var existingPattern = await _chatbotRepository.GetPatternByIdAsync(request.PatternId);

            if (existingPattern == null)
            {
                return ApiResponseDto<ChatPatternDto>.FailureResponse("Pattern not found");
            }

            existingPattern.Pattern = request.Pattern.Trim();
            existingPattern.Response = request.Response.Trim();
            existingPattern.Category = request.Category?.Trim();
            existingPattern.Priority = request.Priority;
            existingPattern.IsActive = request.IsActive;

            var updatedPattern = await _chatbotRepository.UpdatePatternAsync(existingPattern);

            var patternDto = new ChatPatternDto
            {
                PatternId = updatedPattern.PatternId,
                Pattern = updatedPattern.Pattern,
                Response = updatedPattern.Response,
                Category = updatedPattern.Category,
                Priority = updatedPattern.Priority ?? 0,
                IsActive = updatedPattern.IsActive ?? true,
                CreatedAt = updatedPattern.CreatedAt
            };

            EEPZBusinessLog.Information($"Chat pattern updated: {updatedPattern.PatternId}");

            return ApiResponseDto<ChatPatternDto>.SuccessResponse(patternDto, "Pattern updated successfully");
        }
        catch (Exception ex)
        {
            EEPZBusinessLog.Error("Error updating pattern", ex);
            return ApiResponseDto<ChatPatternDto>.FailureResponse("Error updating pattern");
        }
    }

    public async Task<ApiResponseDto<bool>> DeletePatternAsync(int patternId)
    {
        try
        {
            var result = await _chatbotRepository.DeletePatternAsync(patternId);

            if (!result)
            {
                return ApiResponseDto<bool>.FailureResponse("Pattern not found");
            }

            EEPZBusinessLog.Information($"Chat pattern deleted: {patternId}");

            return ApiResponseDto<bool>.SuccessResponse(true, "Pattern deleted successfully");
        }
        catch (Exception ex)
        {
            EEPZBusinessLog.Error($"Error deleting pattern {patternId}", ex);
            return ApiResponseDto<bool>.FailureResponse("Error deleting pattern");
        }
    }
}
