using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{

    public interface IMentorFeedbackRepository
    {

        Task<int> CreateMentorFeedbackAsync(Mentorfeedbacktracking feedback);

        Task<Mentorfeedbacktracking> GetMentorFeedbackByIdAsync(int trackingId);


        Task<List<Mentorfeedbacktracking>> GetFeedbackByMentorAsync(int mentorEmployeeId);

        Task<List<Mentorfeedbacktracking>> GetFeedbackByMenteeAsync(int menteeEmployeeId);

        Task<List<Mentorfeedbacktracking>> GetFeedbackBySmeAsync(int smeId);

        Task<List<Mentorfeedbacktracking>> GetPendingHRReviewAsync();

        Task<List<Mentorfeedbacktracking>> GetAllMentorFeedbackAsync(int pageNumber = 1, int pageSize = 20);

        Task<List<Mentorfeedbacktracking>> GetFeedbackByStatusAsync(string status);

        Task<List<Mentorfeedbacktracking>> GetFeedbackBySourceAsync(string feedbackFrom);

        Task<List<Mentorfeedbacktracking>> GetAnonymousMentorFeedbackAsync();


        Task<bool> UpdateMentorFeedbackAsync(Mentorfeedbacktracking feedback);
        Task<bool> UpdateFeedbackStatusAsync(int trackingId, string newStatus);

        Task<bool> SetHRReviewAsync(int trackingId, string hrComments, int reviewedByHRId);

        Task<bool> DeleteMentorFeedbackAsync(int trackingId);

        Task<bool> MentorFeedbackExistsAsync(int trackingId);
    }
}
