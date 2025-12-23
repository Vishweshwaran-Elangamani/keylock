using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.IRepository;

public interface IChatbotRepository
{
    // Conversation Methods
    Task<Chatconversation?> GetConversationBySessionIdAsync(string sessionId, int userId);
    Task<Chatconversation> CreateConversationAsync(Chatconversation conversation);
    Task<Chatconversation> UpdateConversationAsync(Chatconversation conversation);
    
    // Message Methods
    Task<Chatmessage> AddMessageAsync(Chatmessage message);
    Task<List<Chatmessage>> GetConversationHistoryAsync(int conversationId);
    Task<List<Chatmessage>> GetRecentMessagesAsync(int conversationId, int count = 10);
    
    // Pattern Methods
    Task<List<Chatpattern>> GetActivePatternsAsync();
    Task<List<Chatpattern>> GetAllPatternsAsync();
    Task<Chatpattern?> GetPatternByIdAsync(int patternId);
    Task<Chatpattern> CreatePatternAsync(Chatpattern pattern);
    Task<Chatpattern> UpdatePatternAsync(Chatpattern pattern);
    Task<bool> DeletePatternAsync(int patternId);
    
    // Action Log Methods
    Task<Chatactionlog> LogActionAsync(Chatactionlog actionLog);
    Task<List<Chatactionlog>> GetConversationActionsAsync(int conversationId);
}
