using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class HrFeedbackFormRepository : IHrFeedbackFormRepository
    {
        private readonly EEPZDbContext _context;
        private readonly IMemoryCache _cache;

        public HrFeedbackFormRepository(EEPZDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        #region Forms

        public async Task<int> CreateFormAsync(Hrfeedbackform form, CancellationToken ct)
        {
            form.CreatedAt = DateTime.UtcNow;
            form.Status = FormStatuses.Draft;

            _context.Hrfeedbackforms.Add(form);
            await _context.SaveChangesAsync(ct);

            _cache.Remove($"Form_{form.FormId}");
            return form.FormId;
        }

        public async Task<Hrfeedbackform> GetFormByIdAsync(int formId, CancellationToken ct) =>
            await _cache.GetOrCreateAsync($"Form_{formId}", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);

                return await _context.Hrfeedbackforms
                    .AsNoTrackingWithIdentityResolution()
                    .AsSplitQuery()
                    .Include(f => f.CreatedByHr)
                    .Include(f => f.Hrfeedbackformresponses)
                    .FirstOrDefaultAsync(f => f.FormId == formId, ct);
            });

        public async Task<List<Hrfeedbackform>> GetAllFormsAsync(CancellationToken ct) =>
            await _context.Hrfeedbackforms
                .AsNoTrackingWithIdentityResolution()
                .AsSplitQuery()
                .Include(f => f.CreatedByHr)
                .Include(f => f.Hrfeedbackformresponses)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync(ct);

        public async Task<List<Hrfeedbackform>> GetActiveFormsAsync(CancellationToken ct) =>
            await _context.Hrfeedbackforms
                .AsNoTrackingWithIdentityResolution()
                .AsSplitQuery()
                .Where(f => f.Status == FormStatuses.Active)
                .Include(f => f.CreatedByHr)
                .Include(f => f.Hrfeedbackformresponses)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync(ct);

        public async Task<List<Hrfeedbackform>> GetFormsByTypeAsync(string formType, CancellationToken ct) =>
            await _context.Hrfeedbackforms
                .AsNoTrackingWithIdentityResolution()
                .AsSplitQuery()
                .Where(f => f.FormType == formType)
                .Include(f => f.CreatedByHr)
                .Include(f => f.Hrfeedbackformresponses)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync(ct);

        public async Task<List<Hrfeedbackform>> GetFormsByCreatorAsync(int hrUserId, CancellationToken ct) =>
            await _context.Hrfeedbackforms
                .AsNoTrackingWithIdentityResolution()
                .AsSplitQuery()
                .Where(f => f.CreatedByHrid == hrUserId)
                .Include(f => f.CreatedByHr)
                .Include(f => f.Hrfeedbackformresponses)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync(ct);

        public async Task<bool> UpdateFormAsync(Hrfeedbackform form, CancellationToken ct)
        {
            var existing = await _context.Hrfeedbackforms
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.FormId == form.FormId, ct);

            if (existing == null)
                throw new KeyNotFoundException($"HR Feedback Form with ID {form.FormId} was not found.");

            if (existing.CreatedAt != form.CreatedAt)
                throw new InvalidOperationException($"HR Feedback Form {form.FormId} was modified by another process.");

            _context.Entry(form).Property(x => x.CreatedAt).IsModified = false;
            _context.Entry(form).State = EntityState.Modified;

            await _context.SaveChangesAsync(ct);

            _cache.Remove($"Form_{form.FormId}");
            return true;
        }

        public async Task<bool> UpdateFormStatusAsync(int formId, string newStatus, CancellationToken ct)
        {
            var form = await _context.Hrfeedbackforms.FindAsync(new object[] { formId }, ct);
            if (form == null)
                throw new KeyNotFoundException($"HR Feedback Form with ID {formId} was not found.");

            form.Status = newStatus;
            await _context.SaveChangesAsync(ct);

            _cache.Remove($"Form_{formId}");
            return true;
        }

        public async Task<bool> DeleteFormAsync(int formId, CancellationToken ct)
        {
            var form = await _context.Hrfeedbackforms.FindAsync(new object[] { formId }, ct);
            if (form == null)
                throw new KeyNotFoundException($"HR Feedback Form with ID {formId} was not found.");

            if (form.Status != FormStatuses.Draft)
                throw new InvalidOperationException("Only Draft HR Feedback Forms can be deleted.");

            _context.Hrfeedbackforms.Remove(form);
            await _context.SaveChangesAsync(ct);

            _cache.Remove($"Form_{formId}");
            return true;
        }

        public async Task<bool> FormExistsAsync(int formId, CancellationToken ct) =>
            await _context.Hrfeedbackforms.AsNoTracking().AnyAsync(f => f.FormId == formId, ct);

        #endregion

        #region Responses

        public async Task<int> CreateFormResponseAsync(Hrfeedbackformresponse response, CancellationToken ct)
        {
            response.CreatedAt = DateTime.UtcNow;
            response.Status = FormStatuses.Draft;

            _context.Hrfeedbackformresponses.Add(response);
            await _context.SaveChangesAsync(ct);

            return response.ResponseId;
        }

        public async Task<Hrfeedbackformresponse> GetFormResponseByIdAsync(int responseId, CancellationToken ct) =>
            await _context.Hrfeedbackformresponses
                .AsNoTrackingWithIdentityResolution()
                .AsSplitQuery()
                .Include(r => r.Form)
                .Include(r => r.SubmittedByEmployee)
                .Include(r => r.ReviewedByHr)
                .FirstOrDefaultAsync(r => r.ResponseId == responseId, ct);

        public async Task<List<Hrfeedbackformresponse>> GetResponsesByFormAsync(int formId, CancellationToken ct) =>
            await _context.Hrfeedbackformresponses
                .AsNoTrackingWithIdentityResolution()
                .AsSplitQuery()
                .Where(r => r.FormId == formId)
                .Include(r => r.Form)
                .Include(r => r.SubmittedByEmployee)
                .Include(r => r.ReviewedByHr)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync(ct);

        public async Task<List<Hrfeedbackformresponse>> GetResponsesBySubmitterAsync(int employeeId, CancellationToken ct) =>
            await _context.Hrfeedbackformresponses
                .AsNoTrackingWithIdentityResolution()
                .Where(r => r.SubmittedByEmployeeId == employeeId)
                .Include(r => r.Form)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync(ct);

        public async Task<List<Hrfeedbackformresponse>> GetResponsesByStatusAsync(string status, CancellationToken ct) =>
            await _context.Hrfeedbackformresponses
                .AsNoTrackingWithIdentityResolution()
                .AsSplitQuery()
                .Where(r => r.Status == status)
                .Include(r => r.Form)
                .Include(r => r.SubmittedByEmployee)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync(ct);

        public async Task<bool> UpdateFormResponseAsync(Hrfeedbackformresponse response, CancellationToken ct)
        {
            var existing = await _context.Hrfeedbackformresponses
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.ResponseId == response.ResponseId, ct);

            if (existing == null)
                throw new KeyNotFoundException($"HR Feedback Form Response with ID {response.ResponseId} was not found.");

            if (existing.CreatedAt != response.CreatedAt)
                throw new InvalidOperationException($"HR Feedback Form Response {response.ResponseId} was modified.");

            _context.Entry(response).Property(x => x.CreatedAt).IsModified = false;
            _context.Entry(response).State = EntityState.Modified;

            await _context.SaveChangesAsync(ct);
            return true;
        }

        public async Task<bool> DeleteFormResponseAsync(int responseId, CancellationToken ct)
        {
            var response = await _context.Hrfeedbackformresponses.FindAsync(new object[] { responseId }, ct);
            if (response == null)
                throw new KeyNotFoundException($"HR Feedback Form Response with ID {responseId} was not found.");

            _context.Hrfeedbackformresponses.Remove(response);
            await _context.SaveChangesAsync(ct);
            return true;
        }

        public async Task<bool> ResponseExistsAsync(int responseId, CancellationToken ct) =>
            await _context.Hrfeedbackformresponses.AsNoTracking().AnyAsync(r => r.ResponseId == responseId, ct);

        #endregion

        #region Distribution

        public async Task<bool> DistributeFormAsync(int formId, List<int> employeeIds, CancellationToken ct)
        {
            var form = await _context.Hrfeedbackforms.FindAsync(new object[] { formId }, ct);
            if (form == null)
                throw new KeyNotFoundException($"HR Feedback Form with ID {formId} was not found.");

            form.DistributedToEmployeeIds = JsonSerializer.Serialize(employeeIds);
            form.Status = FormStatuses.Active;

            await _context.SaveChangesAsync(ct);
            _cache.Remove($"Form_{formId}");
            return true;
        }

        public async Task<List<int>> GetFormDistributionAsync(int formId, CancellationToken ct)
        {
            var form = await _context.Hrfeedbackforms.FindAsync(new object[] { formId }, ct);
            if (form == null)
                throw new KeyNotFoundException($"HR Feedback Form with ID {formId} was not found.");

            return JsonSerializer.Deserialize<List<int>>(form.DistributedToEmployeeIds ?? "[]") ?? new List<int>();
        }

        #endregion

        public async Task<List<Hrfeedbackformresponse>> GetSubmittedResponsesAsync(CancellationToken ct) =>
            await _context.Hrfeedbackformresponses
                .AsNoTrackingWithIdentityResolution()
                .AsSplitQuery()
                .Where(r => r.Status == FormStatuses.Submitted)
                .Include(r => r.Form)
                .Include(r => r.SubmittedByEmployee)
                .OrderByDescending(r => r.SubmittedAt)
                .ToListAsync(ct);

        public async Task<List<Hrfeedbackformresponse>> GetPendingReviewResponsesAsync(CancellationToken ct) =>
            await _context.Hrfeedbackformresponses
                .AsNoTrackingWithIdentityResolution()
                .AsSplitQuery()
                .Where(r => r.Status == FormStatuses.Submitted)
                .Include(r => r.Form)
                .Include(r => r.SubmittedByEmployee)
                .OrderByDescending(r => r.SubmittedAt)
                .ToListAsync(ct);

        public async Task<bool> UpdateResponseStatusAsync(int responseId, string newStatus, CancellationToken ct)
        {
            var response = await _context.Hrfeedbackformresponses.FindAsync(new object[] { responseId }, ct);
            if (response == null)
                throw new KeyNotFoundException($"HR Feedback Form Response with ID {responseId} was not found.");

            response.Status = newStatus;

            if (newStatus == FormStatuses.Submitted && response.SubmittedAt == null)
                response.SubmittedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(ct);
            return true;
        }

        public async Task<bool> SetHRReviewAsync(int responseId, string hrComments, int reviewedByHRId, CancellationToken ct)
        {
            var response = await _context.Hrfeedbackformresponses.FindAsync(new object[] { responseId }, ct);
            if (response == null)
                throw new KeyNotFoundException($"HR Feedback Form Response with ID {responseId} was not found.");

            response.HrreviewComments = hrComments;
            response.ReviewedByHrid = reviewedByHRId;
            response.Status = FormStatuses.Reviewed;
            response.ReviewedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(ct);
            return true;
        }

        public IQueryable<Hrfeedbackform> Query() =>
            _context.Hrfeedbackforms.AsNoTracking();

    }
}
