using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Relevantz.EEPZ.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ChatbotController : ControllerBase
{
    private readonly IChatbotService _chatbotService;

    public ChatbotController(IChatbotService chatbotService)
    {
        _chatbotService = chatbotService;
    }

    // ==================== CHATBOT MESSAGE ENDPOINTS ====================

    /// <summary>
    /// Send a message to the chatbot and get response
    /// POST: api/Chatbot/message
    /// </summary>
    [HttpPost("message")]
    public async Task<IActionResult> SendMessage([FromBody] ChatMessageRequestDto request)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { success = false, message = "Invalid user token" });
            }

            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { success = false, message = "Message cannot be empty" });
            }

            if (string.IsNullOrWhiteSpace(request.SessionId))
            {
                return BadRequest(new { success = false, message = "Session ID is required" });
            }

            var result = await _chatbotService.ProcessMessageAsync(
                request.Message.Trim(),
                request.SessionId,
                userId
            );

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new 
            { 
                success = false, 
                message = "An error occurred while processing your message",
                error = ex.Message 
            });
        }
    }

    /// <summary>
    /// Get conversation history for current user session
    /// GET: api/Chatbot/history/{sessionId}
    /// </summary>
    [HttpGet("history/{sessionId}")]
    public async Task<IActionResult> GetHistory(string sessionId)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { success = false, message = "Invalid user token" });
            }

            if (string.IsNullOrWhiteSpace(sessionId))
            {
                return BadRequest(new { success = false, message = "Session ID is required" });
            }

            var result = await _chatbotService.GetConversationHistoryAsync(sessionId, userId);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new 
            { 
                success = false, 
                message = "An error occurred while fetching conversation history",
                error = ex.Message 
            });
        }
    }

    // ==================== PATTERN MANAGEMENT ENDPOINTS ====================

    /// <summary>
    /// Get all chatbot patterns (Admin only)
    /// GET: api/Chatbot/patterns
    /// </summary>
    [HttpGet("patterns")]
    public async Task<IActionResult> GetAllPatterns()
    {
        try
        {
            var result = await _chatbotService.GetAllPatternsAsync();

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new 
            { 
                success = false, 
                message = "An error occurred while fetching patterns",
                error = ex.Message 
            });
        }
    }

    /// <summary>
    /// Get pattern by ID
    /// GET: api/Chatbot/patterns/{patternId}
    /// </summary>
    [HttpGet("patterns/{patternId}")]
    public async Task<IActionResult> GetPatternById(int patternId)
    {
        try
        {
            if (patternId <= 0)
            {
                return BadRequest(new { success = false, message = "Invalid pattern ID" });
            }

            var result = await _chatbotService.GetPatternByIdAsync(patternId);

            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new 
            { 
                success = false, 
                message = "An error occurred while fetching pattern",
                error = ex.Message 
            });
        }
    }

    /// <summary>
    /// Create a new chatbot pattern
    /// POST: api/Chatbot/patterns
    /// </summary>
    [HttpPost("patterns")]
    public async Task<IActionResult> CreatePattern([FromBody] CreateChatPatternRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Invalid request data", errors = ModelState });
            }

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { success = false, message = "Invalid user token" });
            }

            if (string.IsNullOrWhiteSpace(request.Pattern))
            {
                return BadRequest(new { success = false, message = "Pattern is required" });
            }

            if (string.IsNullOrWhiteSpace(request.Response))
            {
                return BadRequest(new { success = false, message = "Response is required" });
            }

            var result = await _chatbotService.CreatePatternAsync(request, userId);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new 
            { 
                success = false, 
                message = "An error occurred while creating pattern",
                error = ex.Message 
            });
        }
    }

    /// <summary>
    /// Update an existing chatbot pattern
    /// PUT: api/Chatbot/patterns
    /// </summary>
    [HttpPut("patterns")]
    public async Task<IActionResult> UpdatePattern([FromBody] UpdateChatPatternRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Invalid request data", errors = ModelState });
            }

            if (request.PatternId <= 0)
            {
                return BadRequest(new { success = false, message = "Invalid pattern ID" });
            }

            if (string.IsNullOrWhiteSpace(request.Pattern))
            {
                return BadRequest(new { success = false, message = "Pattern is required" });
            }

            if (string.IsNullOrWhiteSpace(request.Response))
            {
                return BadRequest(new { success = false, message = "Response is required" });
            }

            var result = await _chatbotService.UpdatePatternAsync(request);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new 
            { 
                success = false, 
                message = "An error occurred while updating pattern",
                error = ex.Message 
            });
        }
    }

    /// <summary>
    /// Delete a chatbot pattern
    /// DELETE: api/Chatbot/patterns/{patternId}
    /// </summary>
    [HttpDelete("patterns/{patternId}")]
    public async Task<IActionResult> DeletePattern(int patternId)
    {
        try
        {
            if (patternId <= 0)
            {
                return BadRequest(new { success = false, message = "Invalid pattern ID" });
            }

            var result = await _chatbotService.DeletePatternAsync(patternId);

            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new 
            { 
                success = false, 
                message = "An error occurred while deleting pattern",
                error = ex.Message 
            });
        }
    }
}
