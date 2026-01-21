using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    /// <summary>
    /// Repository interface for Project Goal Feedback operations.
    /// </summary>
    public interface IProjectGoalFeedbackRepository
    {
        /// <summary>
        /// Submits (creates) a project goal feedback entry.
        /// </summary>
        Task<Projectgoalfeedback> SubmitFeedbackAsync(Projectgoalfeedback feedback);

        /// <summary>
        /// Retrieves feedback entries for a specific project and goal.
        /// </summary>
        Task<List<Projectgoalfeedback>> GetFeedbackByProjectAndGoalAsync(int projectId, int goalId);

        /// <summary>
        /// Retrieves feedback entries for a specific project.
        /// </summary>
        Task<List<Projectgoalfeedback>> GetFeedbackByProjectAsync(int projectId);

        /// <summary>
        /// Retrieves feedback entries submitted by a specific employee.
        /// </summary>
        Task<List<Projectgoalfeedback>> GetFeedbackByEmployeeAsync(int employeeId);

        /// <summary>
        /// Retrieves a feedback entry by feedback identifier.
        /// </summary>
        Task<Projectgoalfeedback?> GetFeedbackByIdAsync(int feedbackId);

        /// <summary>
        /// Checks whether an employee exists.
        /// </summary>
        Task<bool> EmployeeExistsAsync(int employeeId);

        /// <summary>
        /// Checks whether a project exists.
        /// </summary>
        Task<bool> ProjectExistsAsync(int projectId);

        /// <summary>
        /// Checks whether a goal exists.
        /// </summary>
        Task<bool> GoalExistsAsync(int goalId);

        /// <summary>
        /// Checks whether an employee is part of the project.
        /// </summary>
        Task<bool> IsEmployeeInProjectAsync(int employeeId, int projectId);
    }
}
