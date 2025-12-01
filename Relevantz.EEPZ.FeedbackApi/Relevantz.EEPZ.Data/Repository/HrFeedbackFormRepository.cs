
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    /// <summary>
    /// Repository implementation for HrFeedbackForm and HrFeedbackFormResponse entities
    /// Manages HR form templates and employee responses
    /// </summary>
    public class HrFeedbackFormRepository : IHrFeedbackFormRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<HrFeedbackFormRepository> _logger;

        public HrFeedbackFormRepository(EEPZDbContext context, ILogger<HrFeedbackFormRepository> logger)
        {
            _context = context;
            _logger = logger;
        }
        public async Task<int> CreateFormAsync(Hrfeedbackform form)
        {
            try
            {
                form.CreatedAt = DateTime.UtcNow;
                form.Status = "Draft"; 
                
                _context.Hrfeedbackforms.Add(form);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"HR feedback form created: {form.FormId}");
                return form.FormId;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating HR form: {ex.Message}");
                throw;
            }
        }

        public async Task<Hrfeedbackform> GetFormByIdAsync(int formId)
        {
            try
            {
                return await _context.Hrfeedbackforms
                    .Include(f => f.CreatedByHr)
                    .FirstOrDefaultAsync(f => f.FormId == formId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting form by ID: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Hrfeedbackform>> GetAllFormsAsync()
        {
            try
            {
                return await _context.Hrfeedbackforms
                    .Include(f => f.CreatedByHr)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting all forms: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Hrfeedbackform>> GetActiveFormsAsync()
{
    try
    {
        var forms = await _context.Hrfeedbackforms
            .Where(f => f.Status == "Active")
            .Include(f => f.CreatedByHr)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();
        
        return forms;
    }
    catch (Exception ex)
    {
        _logger.LogError($"Error getting active forms: {ex.Message}");
        throw;
    }
}

        public async Task<List<Hrfeedbackform>> GetFormsByTypeAsync(string formType)
        {
            try
            {
                return await _context.Hrfeedbackforms
                    .Where(f => f.FormType == formType)
                    .Include(f => f.CreatedByHr)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting forms by type: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Hrfeedbackform>> GetFormsByCreatorAsync(int hrUserId)
        {
            try
            {
                return await _context.Hrfeedbackforms
                    .Where(f => f.CreatedByHrid == hrUserId)
                    .Include(f => f.CreatedByHr)
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting forms by creator: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> UpdateFormAsync(Hrfeedbackform form)
        {
            try
            {
                _context.Hrfeedbackforms.Update(form);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"HR form updated: {form.FormId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating form: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> UpdateFormStatusAsync(int formId, string newStatus)
        {
            try
            {
                var form = await _context.Hrfeedbackforms.FindAsync(formId);
                if (form == null)
                    return false;

                form.Status = newStatus;

                _context.Hrfeedbackforms.Update(form);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"HR form status updated: {formId} → {newStatus}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating form status: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteFormAsync(int formId)
        {
            try
            {
                var form = await _context.Hrfeedbackforms.FindAsync(formId);
                if (form == null)
                    return false;

                if (form.Status != "Draft")
                    throw new InvalidOperationException($"Cannot delete form in {form.Status} status. Only Draft forms can be deleted.");

                _context.Hrfeedbackforms.Remove(form);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"HR form deleted: {formId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting form: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> FormExistsAsync(int formId)
        {
            try
            {
                return await _context.Hrfeedbackforms.AnyAsync(f => f.FormId == formId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error checking form existence: {ex.Message}");
                throw;
            }
        }

        public async Task<int> CreateFormResponseAsync(Hrfeedbackformresponse response)
        {
            try
            {
                response.CreatedAt = DateTime.UtcNow;
                response.Status = "Draft"; 
                
                _context.Hrfeedbackformresponses.Add(response);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Form response created: {response.ResponseId}");
                return response.ResponseId;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating form response: {ex.Message}");
                throw;
            }
        }

        public async Task<Hrfeedbackformresponse> GetFormResponseByIdAsync(int responseId)
        {
            try
            {
                return await _context.Hrfeedbackformresponses
                    .Include(r => r.Form)
                    .Include(r => r.SubmittedByEmployee)
                    .Include(r => r.ReviewedByHr)
                    .FirstOrDefaultAsync(r => r.ResponseId == responseId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting form response by ID: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Hrfeedbackformresponse>> GetResponsesByFormAsync(int formId)
        {
            try
            {
                return await _context.Hrfeedbackformresponses
                    .Where(r => r.FormId == formId)
                    .Include(r => r.SubmittedByEmployee)
                    .Include(r => r.ReviewedByHr)
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting responses by form: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Hrfeedbackformresponse>> GetResponsesBySubmitterAsync(int employeeId)
        {
            try
            {
                return await _context.Hrfeedbackformresponses
                    .Where(r => r.SubmittedByEmployeeId == employeeId)
                    .Include(r => r.Form)
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting responses by submitter: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Hrfeedbackformresponse>> GetResponsesByStatusAsync(string status)
        {
            try
            {
                return await _context.Hrfeedbackformresponses
                    .Where(r => r.Status == status)
                    .Include(r => r.Form)
                    .Include(r => r.SubmittedByEmployee)
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting responses by status: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Hrfeedbackformresponse>> GetSubmittedResponsesAsync()
        {
            try
            {
                return await _context.Hrfeedbackformresponses
                    .Where(r => r.Status == "Submitted")
                    .Include(r => r.Form)
                    .Include(r => r.SubmittedByEmployee)
                    .OrderByDescending(r => r.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting submitted responses: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Hrfeedbackformresponse>> GetPendingReviewResponsesAsync()
        {
            try
            {
                return await _context.Hrfeedbackformresponses
                    .Where(r => r.Status == "Submitted")
                    .Include(r => r.Form)
                    .Include(r => r.SubmittedByEmployee)
                    .OrderByDescending(r => r.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting pending review responses: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> UpdateFormResponseAsync(Hrfeedbackformresponse response)
        {
            try
            {
                _context.Hrfeedbackformresponses.Update(response);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Form response updated: {response.ResponseId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating form response: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> UpdateResponseStatusAsync(int responseId, string newStatus)
        {
            try
            {
                var response = await _context.Hrfeedbackformresponses.FindAsync(responseId);
                if (response == null)
                    return false;

                response.Status = newStatus;

                if (newStatus == "Submitted" && response.SubmittedAt == null)
                    response.SubmittedAt = DateTime.UtcNow;

                _context.Hrfeedbackformresponses.Update(response);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Form response status updated: {responseId} → {newStatus}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating response status: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> SetHRReviewAsync(int responseId, string hrComments, int reviewedByHRId)
        {
            try
            {
                var response = await _context.Hrfeedbackformresponses.FindAsync(responseId);
                if (response == null)
                    return false;

                response.HrreviewComments = hrComments;
                response.ReviewedByHrid = reviewedByHRId;
                response.Status = "Reviewed";
                response.ReviewedAt = DateTime.UtcNow;

                _context.Hrfeedbackformresponses.Update(response);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"HR review set for form response: {responseId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error setting HR review: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteFormResponseAsync(int responseId)
        {
            try
            {
                var response = await _context.Hrfeedbackformresponses.FindAsync(responseId);
                if (response == null)
                    return false;

                _context.Hrfeedbackformresponses.Remove(response);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Form response deleted: {responseId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting form response: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> ResponseExistsAsync(int responseId)
        {
            try
            {
                return await _context.Hrfeedbackformresponses.AnyAsync(r => r.ResponseId == responseId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error checking response existence: {ex.Message}");
                throw;
            }
        }
public async Task<bool> DistributeFormAsync(int formId, List<int> employeeIds)
{
    try
    {
        var form = await _context.Hrfeedbackforms.FindAsync(formId);
        if (form == null)
            return false;

        form.DistributedToEmployeeIds = JsonSerializer.Serialize(employeeIds);
        form.Status = "Active";

        _context.Hrfeedbackforms.Update(form);
        await _context.SaveChangesAsync();

        _logger.LogInformation($"Form {formId} distributed to {employeeIds.Count} employees");
        return true;
    }
    catch (Exception ex)
    {
        _logger.LogError($"Error distributing form: {ex.Message}");
        return false;
    }
}
public async Task<List<int>> GetFormDistributionAsync(int formId)
{
    try
    {
        var form = await _context.Hrfeedbackforms.FindAsync(formId);
        if (form == null)
            return new List<int>();

        var employeeIds = JsonSerializer.Deserialize<List<int>>(
            form.DistributedToEmployeeIds ?? "[]"
        ) ?? new List<int>();

        return employeeIds;
    }
    catch (Exception ex)
    {
        _logger.LogError($"Error getting form distribution: {ex.Message}");
        return new List<int>();
    }
}

    }
}
