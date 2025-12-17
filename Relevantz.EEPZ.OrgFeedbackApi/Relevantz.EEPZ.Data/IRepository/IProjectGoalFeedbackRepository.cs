using Relevantz.EEPZ.Common.Entities;
namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IProjectGoalFeedbackRepository
    {

        Task<Projectgoalfeedback> SubmitFeedbackAsync(Projectgoalfeedback feedback);

 
        Task<List<Projectgoalfeedback>> GetFeedbackByProjectAndGoalAsync(int projectId, int goalId);
        Task<List<Projectgoalfeedback>> GetFeedbackByProjectAsync(int projectId);
        Task<List<Projectgoalfeedback>> GetFeedbackByEmployeeAsync(int employeeId);
        Task<Projectgoalfeedback> GetFeedbackByIdAsync(int feedbackId);


        Task<bool> EmployeeExistsAsync(int employeeId);
        Task<bool> ProjectExistsAsync(int projectId);
        Task<bool> GoalExistsAsync(int goalId);
        Task<bool> IsEmployeeInProjectAsync(int employeeId, int projectId);
    }
}
