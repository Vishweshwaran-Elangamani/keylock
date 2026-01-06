using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IOrgGoalFeedbackRepository
    {
        Task<int> CreateOrgGoalFeedbackAsync(Feedback feedback);
        Task<Feedback> GetOrgGoalFeedbackByIdAsync(int feedbackId);
        Task<List<Feedback>> GetFeedbackByOrgGoalAsync(int goalId);
        Task<List<Feedback>> GetFeedbackBySubmitterAsync(int employeeId);
        Task<List<Feedback>> GetAllOrgGoalFeedbackAsync(int pageNumber = 1, int pageSize = 20);
        Task<List<Feedback>> GetFeedbackByStatusAsync(string status);
        Task<List<Feedback>> GetAnonymousOrgGoalFeedbackAsync();
        Task<bool> UpdateOrgGoalFeedbackAsync(Feedback feedback);
        Task<bool> UpdateFeedbackStatusAsync(int feedbackId, string newStatus);
        Task<bool> DeleteOrgGoalFeedbackAsync(int feedbackId);
        Task<bool> OrgGoalFeedbackExistsAsync(int feedbackId);
    }
}
