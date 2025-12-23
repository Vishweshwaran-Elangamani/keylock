using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Data.DBContexts;

namespace Relevantz.EEPZ.Data.Repository;

public class ChatbotRepository : IChatbotRepository
{
    private readonly EEPZDbContext _context;

    public ChatbotRepository(EEPZDbContext context)
    {
        _context = context;
    }

    // ==================== CONVERSATION METHODS ====================
    
    public async Task<Chatconversation?> GetConversationBySessionIdAsync(string sessionId, int userId)
    {
        return await _context.Chatconversations
            .Include(c => c.Chatmessages.OrderBy(m => m.CreatedAt))
            .FirstOrDefaultAsync(c => c.SessionId == sessionId 
                && c.UserId == userId 
                && c.IsActive == true);
    }

    public async Task<Chatconversation> CreateConversationAsync(Chatconversation conversation)
    {
        _context.Chatconversations.Add(conversation);
        await _context.SaveChangesAsync();
        return conversation;
    }

    public async Task<Chatconversation> UpdateConversationAsync(Chatconversation conversation)
    {
        conversation.UpdatedAt = DateTime.UtcNow;
        _context.Chatconversations.Update(conversation);
        await _context.SaveChangesAsync();
        return conversation;
    }

    // ==================== MESSAGE METHODS ====================
    
    public async Task<Chatmessage> AddMessageAsync(Chatmessage message)
    {
        _context.Chatmessages.Add(message);
        await _context.SaveChangesAsync();
        return message;
    }

    public async Task<List<Chatmessage>> GetConversationHistoryAsync(int conversationId)
    {
        return await _context.Chatmessages
            .Where(m => m.ConversationId == conversationId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Chatmessage>> GetRecentMessagesAsync(int conversationId, int count = 10)
    {
        return await _context.Chatmessages
            .Where(m => m.ConversationId == conversationId)
            .OrderByDescending(m => m.CreatedAt)
            .Take(count)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();
    }

    // ==================== PATTERN METHODS ====================
    
    public async Task<List<Chatpattern>> GetActivePatternsAsync()
    {
        return await _context.Chatpatterns
            .Where(p => p.IsActive == true)
            .OrderByDescending(p => p.Priority)
            .ThenBy(p => p.PatternId)
            .ToListAsync();
    }

    public async Task<List<Chatpattern>> GetAllPatternsAsync()
    {
        return await _context.Chatpatterns
            .OrderByDescending(p => p.Priority)
            .ThenBy(p => p.Category)
            .ToListAsync();
    }

    public async Task<Chatpattern?> GetPatternByIdAsync(int patternId)
    {
        return await _context.Chatpatterns
            .FirstOrDefaultAsync(p => p.PatternId == patternId);
    }

    public async Task<Chatpattern> CreatePatternAsync(Chatpattern pattern)
    {
        _context.Chatpatterns.Add(pattern);
        await _context.SaveChangesAsync();
        return pattern;
    }

    public async Task<Chatpattern> UpdatePatternAsync(Chatpattern pattern)
    {
        pattern.UpdatedAt = DateTime.UtcNow;
        _context.Chatpatterns.Update(pattern);
        await _context.SaveChangesAsync();
        return pattern;
    }

    public async Task<bool> DeletePatternAsync(int patternId)
    {
        var pattern = await _context.Chatpatterns.FindAsync(patternId);
        if (pattern == null)
            return false;

        _context.Chatpatterns.Remove(pattern);
        await _context.SaveChangesAsync();
        return true;
    }

    // ==================== ACTION LOG METHODS ====================
    
    public async Task<Chatactionlog> LogActionAsync(Chatactionlog actionLog)
    {
        _context.Chatactionlogs.Add(actionLog);
        await _context.SaveChangesAsync();
        return actionLog;
    }

    public async Task<List<Chatactionlog>> GetConversationActionsAsync(int conversationId)
    {
        return await _context.Chatactionlogs
            .Where(a => a.ConversationId == conversationId)
            .OrderByDescending(a => a.ExecutedAt)
            .ToListAsync();
    }
}
