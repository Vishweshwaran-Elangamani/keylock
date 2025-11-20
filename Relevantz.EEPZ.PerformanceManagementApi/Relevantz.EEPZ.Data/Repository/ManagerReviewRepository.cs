using System.Collections.Generic;
using System.Data;
using Dapper;
using System.Linq;
using System.Threading.Tasks;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Implementations;
public partial class ManagerReviewRepository : IManagerReviewRepository
{
    private readonly EEPZDbContext _ctx;
    public ManagerReviewRepository(EEPZDbContext ctx) => _ctx = ctx;

    // =========================================================
    // L1 (Approver) — submitted forms list
    // =========================================================
    public async Task<IEnumerable<ApproverAssignmentRowDto>> GetApproverSubmittedFormsAsync(
        int approverUserId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 25;
        var offset = (page - 1) * pageSize;

        const string sql = @"
WITH l1 AS (
  SELECT e.EmployeeId AS L1EmployeeId
  FROM UserAuthentication ua
  JOIN Employee e ON e.EmployeeId = ua.EmployeeId
  WHERE ua.UserId = @approverUserId
),
scope_assessments AS (
  SELECT DISTINCT sa.assessment_id
  FROM SelfAssessment sa
  JOIN UserAuthentication emp_ua ON emp_ua.UserId = sa.employee_id
  JOIN Employee emp ON emp.EmployeeId = emp_ua.EmployeeId
  JOIN EmployeeDetailsMaster emp_edm ON emp_edm.EmployeeId = emp.EmployeeId
  JOIN ProjectEmployees pe ON pe.EmployeeId = emp_edm.EmployeeId AND pe.IsPrimary = 1
  JOIN Project p ON p.ProjectId = pe.ProjectId
  JOIN l1 ON p.L1ApproverEmployeeId = l1.L1EmployeeId
  WHERE sa.status = 'Submitted'
),
latest_l1 AS (
  SELECT ar.detail_id, MAX(ar.review_id) AS max_id
  FROM AssessmentReview ar
  WHERE ar.reviewer_role = 'Approver' AND ar.detail_id IS NOT NULL
  GROUP BY ar.detail_id
),
has_any_l1 AS (
  SELECT ad.assessment_id
  FROM AssessmentDetail ad
  JOIN latest_l1 t ON t.detail_id = ad.detail_id
  GROUP BY ad.assessment_id
),
latest_l2 AS (
  SELECT ar.detail_id, MAX(ar.review_id) AS max_id
  FROM AssessmentReview ar
  WHERE ar.reviewer_role = 'Reviewer' AND ar.detail_id IS NOT NULL
  GROUP BY ar.detail_id
),
l2_status AS (
  SELECT ar.detail_id, ar.review_status
  FROM AssessmentReview ar
  JOIN latest_l2 t ON t.max_id = ar.review_id
),
decided_assessments AS (
  SELECT ad.assessment_id
  FROM AssessmentDetail ad
  JOIN l2_status s ON s.detail_id = ad.detail_id
  WHERE s.review_status IN ('Approved','Rejected')
  GROUP BY ad.assessment_id
)
SELECT 
  sa.assessment_id        AS AssessmentId,
  COALESCE(NULLIF(CONCAT_WS(' ', up.FirstName, up.LastName), ''), emp_ua.Email, emp.EmployeeCompanyId) AS EmployeeName,
  f.name                  AS FormName,
  sa.submitted_at         AS SubmittedAt,
  sa.status               AS Status,
  GROUP_CONCAT(DISTINCT p.ProjectName ORDER BY p.ProjectName SEPARATOR ', ') AS Project
FROM scope_assessments s
JOIN SelfAssessment sa             ON sa.assessment_id = s.assessment_id
LEFT JOIN decided_assessments da   ON da.assessment_id = sa.assessment_id
LEFT JOIN has_any_l1 h1            ON h1.assessment_id = sa.assessment_id
JOIN AssessmentForm f              ON f.form_id = sa.form_id
JOIN UserAuthentication emp_ua     ON emp_ua.UserId = sa.employee_id
JOIN Employee emp                  ON emp.EmployeeId = emp_ua.EmployeeId
LEFT JOIN UserProfile up           ON up.EmployeeId = emp.EmployeeId
JOIN EmployeeDetailsMaster emp_edm ON emp_edm.EmployeeId = emp.EmployeeId
JOIN ProjectEmployees pe           ON pe.EmployeeId = emp_edm.EmployeeId AND pe.IsPrimary = 1
JOIN Project p                     ON p.ProjectId = pe.ProjectId
WHERE da.assessment_id IS NULL
  AND h1.assessment_id IS NULL
GROUP BY sa.assessment_id, EmployeeName, FormName, SubmittedAt, Status
ORDER BY sa.submitted_at DESC
LIMIT @pageSize OFFSET @offset;";

        var conn = _ctx.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open) await conn.OpenAsync();

        return await conn.QueryAsync<ApproverAssignmentRowDto>(sql, new { approverUserId, pageSize, offset });
    }

    // =========================================================
    // L2 (Reviewer) — submitted forms list with gating
    // =========================================================
    public async Task<IEnumerable<ApproverAssignmentRowDto>> GetReviewerSubmittedFormsAsync(
        int reviewerUserId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 25;
        var offset = (page - 1) * pageSize;

        const string sql = @"
WITH l2 AS (
  SELECT e.EmployeeId AS L2EmployeeId
  FROM UserAuthentication ua
  JOIN Employee e ON e.EmployeeId = ua.EmployeeId
  WHERE ua.UserId = @reviewerUserId
),
scope_assessments AS (
  SELECT DISTINCT sa.assessment_id, p.L1ApproverEmployeeId
  FROM SelfAssessment sa
  JOIN UserAuthentication emp_ua ON emp_ua.UserId = sa.employee_id
  JOIN Employee emp ON emp.EmployeeId = emp_ua.EmployeeId
  JOIN EmployeeDetailsMaster emp_edm ON emp_edm.EmployeeId = emp.EmployeeId
  JOIN ProjectEmployees pe ON pe.EmployeeId = emp_edm.EmployeeId AND pe.IsPrimary = 1
  JOIN Project p ON p.ProjectId = pe.ProjectId
  JOIN l2 ON p.L2ApproverEmployeeId = l2.L2EmployeeId
  WHERE sa.status = 'Submitted'
),
latest_l1 AS (
  SELECT ar.detail_id, MAX(ar.review_id) AS max_id
  FROM AssessmentReview ar
  WHERE ar.reviewer_role = 'Approver' AND ar.detail_id IS NOT NULL
  GROUP BY ar.detail_id
),
has_any_l1 AS (
  SELECT ad.assessment_id
  FROM AssessmentDetail ad
  JOIN latest_l1 t ON t.detail_id = ad.detail_id
  GROUP BY ad.assessment_id
),
latest_l2 AS (
  SELECT ar.detail_id, MAX(ar.review_id) AS max_id
  FROM AssessmentReview ar
  WHERE ar.reviewer_role = 'Reviewer' AND ar.detail_id IS NOT NULL
  GROUP BY ar.detail_id
),
l2_status AS (
  SELECT ar.detail_id, ar.review_status
  FROM AssessmentReview ar
  JOIN latest_l2 t ON t.max_id = ar.review_id
),
decided_assessments AS (
  SELECT ad.assessment_id
  FROM AssessmentDetail ad
  JOIN l2_status s ON s.detail_id = ad.detail_id
  WHERE s.review_status IN ('Approved','Rejected')
  GROUP BY ad.assessment_id
),
visible AS (
  SELECT sa.assessment_id
  FROM scope_assessments sa
  LEFT JOIN decided_assessments da ON da.assessment_id = sa.assessment_id
  WHERE da.assessment_id IS NULL
    AND (
      sa.L1ApproverEmployeeId IS NULL
      OR sa.assessment_id IN (SELECT assessment_id FROM has_any_l1)
    )
)
SELECT 
  sa.assessment_id        AS AssessmentId,
  COALESCE(NULLIF(CONCAT_WS(' ', up.FirstName, up.LastName), ''), emp_ua.Email, emp.EmployeeCompanyId) AS EmployeeName,
  f.name                  AS FormName,
  sa.submitted_at         AS SubmittedAt,
  sa.status               AS Status,
  GROUP_CONCAT(DISTINCT p.ProjectName ORDER BY p.ProjectName SEPARATOR ', ') AS Project
FROM visible v
JOIN SelfAssessment sa             ON sa.assessment_id = v.assessment_id
JOIN AssessmentForm f              ON f.form_id = sa.form_id
JOIN UserAuthentication emp_ua     ON emp_ua.UserId = sa.employee_id
JOIN Employee emp                  ON emp.EmployeeId = emp_ua.EmployeeId
LEFT JOIN UserProfile up           ON up.EmployeeId = emp.EmployeeId
JOIN EmployeeDetailsMaster emp_edm ON emp_edm.EmployeeId = emp.EmployeeId
JOIN ProjectEmployees pe           ON pe.EmployeeId = emp_edm.EmployeeId AND pe.IsPrimary = 1
JOIN Project p                     ON p.ProjectId = pe.ProjectId
GROUP BY sa.assessment_id, EmployeeName, FormName, SubmittedAt, Status
ORDER BY sa.submitted_at DESC
LIMIT @pageSize OFFSET @offset;";

        var conn = _ctx.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open) await conn.OpenAsync();

        return await conn.QueryAsync<ApproverAssignmentRowDto>(sql, new { reviewerUserId, pageSize, offset });
    }

    // =========================================================
    // L1 (Approver) — submit ratings & comments
    // =========================================================
    public async Task<int> SaveApproverReviewAsync(int approverUserId, SubmitReviewDto dto)
    {
        if (dto is null || dto.Items is null || dto.Items.Count == 0)
            return 0;

        const string validateSql = @"
WITH l1 AS (
  SELECT e.EmployeeId AS L1EmployeeId
  FROM UserAuthentication ua
  JOIN Employee e ON e.EmployeeId = ua.EmployeeId
  WHERE ua.UserId = @approverUserId
),
scope_assessment AS (
  SELECT DISTINCT sa.assessment_id
  FROM SelfAssessment sa
  JOIN UserAuthentication emp_ua ON emp_ua.UserId = sa.employee_id
  JOIN Employee emp ON emp.EmployeeId = emp_ua.EmployeeId
  JOIN EmployeeDetailsMaster emp_edm ON emp_edm.EmployeeId = emp.EmployeeId
  JOIN ProjectEmployees pe ON pe.EmployeeId = emp_edm.EmployeeId AND pe.IsPrimary = 1
  JOIN Project p ON p.ProjectId = pe.ProjectId
  JOIN l1 ON p.L1ApproverEmployeeId = l1.L1EmployeeId
  WHERE sa.assessment_id = @assessmentId
    AND sa.status = 'Submitted'
),
valid_details AS (
  SELECT ad.detail_id
  FROM AssessmentDetail ad
  JOIN scope_assessment s ON s.assessment_id = ad.assessment_id
)
SELECT 
  (SELECT COUNT(*) FROM scope_assessment)  AS IsAssessmentInScope,
  (SELECT COUNT(*) FROM valid_details)     AS ValidDetailCount;
";

        const string insertSql = @"
INSERT INTO AssessmentReview
  (detail_id, reviewer_id, reviewer_role, rating, comments, reviewed_at, review_status)
VALUES
  (@detailId, @approverUserId, 'Approver', @rating, @comments, NOW(), 'Pending');
";

        var conn = _ctx.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open) await conn.OpenAsync();

        using var tx = await conn.BeginTransactionAsync();

        var validate = await conn.QuerySingleAsync<(int IsAssessmentInScope, int ValidDetailCount)>(
            validateSql, new { approverUserId, assessmentId = dto.AssessmentId }, tx);

        if (validate.IsAssessmentInScope <= 0)
        {
            await tx.RollbackAsync();
            return 0;
        }

        var postedIds = dto.Items.Select(i => i.DetailId).Distinct().ToArray();
        if (postedIds.Length == 0)
        {
            await tx.RollbackAsync();
            return 0;
        }

        var validCount = await conn.ExecuteScalarAsync<int>(
            @"SELECT COUNT(*) FROM AssessmentDetail WHERE assessment_id=@aid AND detail_id IN @ids;",
            new { aid = dto.AssessmentId, ids = postedIds }, tx);

        if (validCount != postedIds.Length)
        {
            await tx.RollbackAsync();
            return 0;
        }

        var affected = 0;
        foreach (var item in dto.Items)
        {
            affected += await conn.ExecuteAsync(
                insertSql,
                new
                {
                    detailId = item.DetailId,
                    approverUserId,
                    rating = item.Rating,
                    comments = item.Comments
                },
                tx);
        }

        await conn.ExecuteAsync(@"
UPDATE AssessmentReview ar
JOIN AssessmentDetail ad ON ad.detail_id = ar.detail_id
SET ar.review_status = 'Pending'
WHERE ad.assessment_id = @assessmentId
  AND ar.reviewer_role = 'Reviewer'
  AND ar.review_status = 'Rejected';",
            new { assessmentId = dto.AssessmentId }, tx);

        await tx.CommitAsync();
        return affected;
    }

  // =========================================================
  // L2 READ: full assessment view
  // =========================================================
  public async Task<ReviewerAssessmentViewDto?> GetAssessmentForReviewerAsync(int reviewerUserId, int assessmentId)

  {

    const string sql = @"

WITH l2 AS (

  SELECT e.EmployeeId AS L2EmployeeId

  FROM UserAuthentication ua

  JOIN Employee e ON e.EmployeeId = ua.EmployeeId

  WHERE ua.UserId = @reviewerUserId

),

scope AS (

  SELECT DISTINCT sa.assessment_id

  FROM SelfAssessment sa

  JOIN UserAuthentication emp_ua ON emp_ua.UserId = sa.employee_id

  JOIN Employee emp ON emp.EmployeeId = emp_ua.EmployeeId

  JOIN EmployeeDetailsMaster emp_edm ON emp_edm.EmployeeId = emp.EmployeeId

  JOIN ProjectEmployees pe ON pe.EmployeeId = emp_edm.EmployeeId AND pe.IsPrimary = 1

  JOIN Project p ON p.ProjectId = pe.ProjectId

  JOIN l2 ON p.L2ApproverEmployeeId = l2.L2EmployeeId

  WHERE sa.assessment_id = @assessmentId

    AND sa.status = 'Submitted'

    AND (

         p.L1ApproverEmployeeId IS NULL

         OR EXISTS (

             SELECT 1

             FROM AssessmentReview ar

             JOIN AssessmentDetail ad2 ON ad2.detail_id = ar.detail_id

             WHERE ar.reviewer_role = 'Approver' AND ar.detail_id IS NOT NULL

               AND ad2.assessment_id = sa.assessment_id

         )

    )

),

latest_l1 AS (

  SELECT ar.*

  FROM AssessmentReview ar

  JOIN (

    SELECT detail_id, MAX(review_id) AS max_id

    FROM AssessmentReview

    WHERE reviewer_role = 'Approver'

      AND detail_id IS NOT NULL

      AND rating > 0

    GROUP BY detail_id

  ) t ON t.max_id = ar.review_id

),

latest_l2 AS (

  SELECT ar.*

  FROM AssessmentReview ar

  JOIN (

    SELECT detail_id, MAX(review_id) AS max_id

    FROM AssessmentReview

    WHERE reviewer_role = 'Reviewer'

      AND detail_id IS NOT NULL

      AND rating > 0  -- ✅ FIXED: Exclude decision records

    GROUP BY detail_id

  ) t ON t.max_id = ar.review_id

),

header AS (

  SELECT

    sa.assessment_id AS AssessmentId,

    COALESCE(NULLIF(CONCAT_WS(' ', up.FirstName, up.LastName), ''), emp_ua.Email, e.EmployeeCompanyId) AS EmployeeName,

    f.name AS FormName,

    sa.submitted_at AS SubmittedAt,

    GROUP_CONCAT(DISTINCT p.ProjectName ORDER BY p.ProjectName SEPARATOR ', ') AS Project

  FROM SelfAssessment sa

  JOIN scope s ON s.assessment_id = sa.assessment_id

  JOIN AssessmentForm f ON f.form_id = sa.form_id

  JOIN UserAuthentication emp_ua ON emp_ua.UserId = sa.employee_id

  JOIN Employee e ON e.EmployeeId = emp_ua.EmployeeId

  LEFT JOIN UserProfile up ON up.EmployeeId = e.EmployeeId

  JOIN EmployeeDetailsMaster emp_edm ON emp_edm.EmployeeId = e.EmployeeId

  JOIN ProjectEmployees pe ON pe.EmployeeId = emp_edm.EmployeeId AND pe.IsPrimary = 1

  JOIN Project p ON p.ProjectId = pe.ProjectId

  GROUP BY sa.assessment_id, EmployeeName, FormName, SubmittedAt

)

SELECT 

  h.AssessmentId,

  h.EmployeeName,

  h.FormName,

  h.SubmittedAt,

  h.Project,

  ad.detail_id       AS DetailId,

  c.name             AS CompetencyName,

  ad.employee_rating AS EmployeeRating,

  ad.employee_comments AS EmployeeComments,

  l1.rating          AS ApproverRating,

  l1.comments        AS ApproverComments,

  l2.rating          AS ReviewerRating,

  l2.comments        AS ReviewerComments

FROM header h

JOIN AssessmentDetail ad ON ad.assessment_id = h.AssessmentId

JOIN Competency c ON c.competency_id = ad.competency_id

LEFT JOIN latest_l1 l1 ON l1.detail_id = ad.detail_id

LEFT JOIN latest_l2 l2 ON l2.detail_id = ad.detail_id

ORDER BY c.display_order IS NULL, c.display_order, c.name;";

    var conn = _ctx.Database.GetDbConnection();

    if (conn.State != ConnectionState.Open) await conn.OpenAsync();

    var rows = (await conn.QueryAsync(sql, new { reviewerUserId, assessmentId }))

        .ToList();

    if (!rows.Any()) return null;

    var head = rows[0];

    var items = rows.Select(r => new CompetencyReviewRowDto(

        DetailId: (int)r.DetailId,

        CompetencyName: (string)r.CompetencyName,

        EmployeeRating: (int?)r.EmployeeRating,

        EmployeeComments: (string?)r.EmployeeComments,

        ApproverRating: (int?)r.ApproverRating,

        ApproverComments: (string?)r.ApproverComments,

        ReviewerRating: (int?)r.ReviewerRating,

        ReviewerComments: (string?)r.ReviewerComments

    )).ToList();

    return new ReviewerAssessmentViewDto(

        AssessmentId: (int)head.AssessmentId,

        EmployeeName: (string)head.EmployeeName,

        FormName: (string)head.FormName,

        SubmittedAt: (DateTime)head.SubmittedAt,

        Project: (string)head.Project,

        Items: items

    );

  }




  // =========================================================
  // L2 SAVE per-competency ratings/comments
  // =========================================================
  public async Task<int> SaveReviewerReviewAsync(int reviewerUserId, SubmitReviewDto dto)
  {
    if (dto is null || dto.Items is null || dto.Items.Count == 0) return 0;

    const string scopeSql = @"
WITH l2 AS (
  SELECT e.EmployeeId AS L2EmployeeId
  FROM UserAuthentication ua
  JOIN Employee e ON e.EmployeeId = ua.EmployeeId
  WHERE ua.UserId = @reviewerUserId
),
scope AS (
  SELECT DISTINCT sa.assessment_id
  FROM SelfAssessment sa
  JOIN UserAuthentication emp_ua ON emp_ua.UserId = sa.employee_id
  JOIN Employee emp ON emp.EmployeeId = emp_ua.EmployeeId
  JOIN EmployeeDetailsMaster emp_edm ON emp_edm.EmployeeId = emp.EmployeeId
  JOIN ProjectEmployees pe ON pe.EmployeeId = emp_edm.EmployeeId AND pe.IsPrimary = 1
  JOIN Project p ON p.ProjectId = pe.ProjectId
  JOIN l2 ON p.L2ApproverEmployeeId = l2.L2EmployeeId
  WHERE sa.assessment_id = @assessmentId
    AND sa.status = 'Submitted'
    AND (
         p.L1ApproverEmployeeId IS NULL
         OR EXISTS (
             SELECT 1
             FROM AssessmentReview ar
             JOIN AssessmentDetail ad2 ON ad2.detail_id = ar.detail_id
             WHERE ar.reviewer_role = 'Approver' AND ar.detail_id IS NOT NULL
               AND ad2.assessment_id = sa.assessment_id
         )
    )
)
SELECT COUNT(*) FROM scope;";

    const string validateDetails = @"SELECT COUNT(*) FROM AssessmentDetail WHERE assessment_id=@aid AND detail_id IN @ids;";
    const string insertSql = @"
INSERT INTO AssessmentReview
  (detail_id, reviewer_id, reviewer_role, rating, comments, reviewed_at, review_status)
VALUES
  (@detailId, @reviewerUserId, 'Reviewer', @rating, @comments, NOW(), 'Pending');";

    var conn = _ctx.Database.GetDbConnection();
    if (conn.State != ConnectionState.Open) await conn.OpenAsync();
    using var tx = await conn.BeginTransactionAsync();

    var inScope = await conn.ExecuteScalarAsync<int>(scopeSql,
        new { reviewerUserId, assessmentId = dto.AssessmentId }, tx);
    if (inScope <= 0) { await tx.RollbackAsync(); return 0; }

    var ids = dto.Items.Select(x => x.DetailId).Distinct().ToArray();
    var valid = await conn.ExecuteScalarAsync<int>(validateDetails,
        new { aid = dto.AssessmentId, ids }, tx);
    if (valid != ids.Length) { await tx.RollbackAsync(); return 0; }

    var saved = 0;
    foreach (var it in dto.Items)
    {
      saved += await conn.ExecuteAsync(insertSql, new
      {
        detailId = it.DetailId,
        reviewerUserId,
        rating = it.Rating,
        comments = it.Comments
      }, tx);
    }

    await tx.CommitAsync();
    return saved;
  }

  
  // =========================================================

// L1 (Approver) — SUBMIT REVIEW RATINGS

// =========================================================

  public async Task SubmitApproverReviewsAsync(
        int approverId,
        int assessmentId,
        List<ReviewItemDto> items)
    {
        foreach (var item in items)
        {
            var entry = new Assessmentreview
            {
                DetailId = item.DetailId,
                ReviewerId = approverId,
                ReviewerRole = "Approver",
                Rating = item.Rating,
                Comments = item.Comments,
                ReviewedAt = DateTime.Now,
                ReviewStatus = "Pending"  // ✅ FIXED: Set to Pending for L1
            };

            _ctx.Assessmentreviews.Add(entry);
        }
    
        await _ctx.SaveChangesAsync();
    }
 
// =========================================================

// L2 (Reviewer) — SUBMIT REVIEW RATINGS (WITHOUT AUTO-DECISION)

// =========================================================

// =========================================================
// L2 (Reviewer) — SUBMIT REVIEW RATINGS (CLEAN APPROACH)
// =========================================================
public async Task SubmitReviewerReviewsAsync(
    int reviewerUserId,
    int assessmentId,
    List<ReviewItemDto> items)
{
    var detailIds = items.Select(i => i.DetailId).ToList();
    var conn = _ctx.Database.GetDbConnection();
    
    if (conn.State != ConnectionState.Open) await conn.OpenAsync();

    // ✅ Strategy: Update existing L2 records, don't delete and recreate
    const string updateExistingSql = @"
UPDATE AssessmentReview
SET rating = @rating, 
    comments = @comments, 
    reviewed_at = NOW(),
    review_status = NULL
WHERE reviewer_role = 'Reviewer'
  AND reviewer_id = @reviewerUserId
  AND detail_id = @detailId
  AND rating > 0;";  // Only update rating records

    // ✅ Insert only if no record exists for this detail
    const string insertNewSql = @"
INSERT INTO AssessmentReview 
  (detail_id, reviewer_id, reviewer_role, rating, comments, reviewed_at, review_status)
VALUES 
  (@detailId, @reviewerUserId, 'Reviewer', @rating, @comments, NOW(), NULL)
WHERE NOT EXISTS (
  SELECT 1 FROM AssessmentReview ar
  WHERE ar.detail_id = @detailId
    AND ar.reviewer_id = @reviewerUserId
    AND ar.reviewer_role = 'Reviewer'
    AND ar.rating > 0
);";

    using var tx = await conn.BeginTransactionAsync();

    try
    {
        foreach (var item in items)
        {
            // Try to update existing record
            var updateCount = await conn.ExecuteAsync(updateExistingSql,
                new
                {
                    rating = item.Rating,
                    comments = item.Comments,
                    reviewerUserId,
                    detailId = item.DetailId
                }, tx);

            // If no existing record, insert new one
            if (updateCount == 0)
            {
                await conn.ExecuteAsync(@"
INSERT INTO AssessmentReview 
  (detail_id, reviewer_id, reviewer_role, rating, comments, reviewed_at, review_status)
VALUES 
  (@detailId, @reviewerUserId, 'Reviewer', @rating, @comments, NOW(), NULL);",
                    new
                    {
                        detailId = item.DetailId,
                        reviewerUserId,
                        rating = item.Rating,
                        comments = item.Comments
                    }, tx);
            }
        }

        await tx.CommitAsync();
    }
    catch
    {
        await tx.RollbackAsync();
        throw;
    }
}




 
    
    
    // =========================================================

  // L2 DECISION: approve / reject

  // =========================================================

public async Task<bool> SetReviewerDecisionAsync(
    int reviewerUserId,
    int assessmentId,
    string decision,
    string? reviewerComment)
{
    decision = (decision ?? "").Trim();
    var approved = string.Equals(decision, "Approved", StringComparison.OrdinalIgnoreCase);
    var rejected = string.Equals(decision, "Rejected", StringComparison.OrdinalIgnoreCase);
    
    if (!approved && !rejected) return false;

    const string scopeSql = @"
WITH l2 AS (
  SELECT e.EmployeeId AS L2EmployeeId
  FROM UserAuthentication ua
  JOIN Employee e ON e.EmployeeId = ua.EmployeeId
  WHERE ua.UserId = @reviewerUserId
)
SELECT COUNT(*)
FROM SelfAssessment sa
JOIN UserAuthentication emp_ua ON emp_ua.UserId = sa.employee_id
JOIN Employee emp ON emp.EmployeeId = emp_ua.EmployeeId
JOIN EmployeeDetailsMaster emp_edm ON emp_edm.EmployeeId = emp.EmployeeId
JOIN ProjectEmployees pe ON pe.EmployeeId = emp_edm.EmployeeId AND pe.IsPrimary = 1
JOIN Project p ON p.ProjectId = pe.ProjectId
JOIN l2 ON p.L2ApproverEmployeeId = l2.L2EmployeeId
WHERE sa.assessment_id = @assessmentId
  AND sa.status = 'Submitted'
  AND (
       p.L1ApproverEmployeeId IS NULL
       OR EXISTS (
           SELECT 1
           FROM AssessmentReview ar
           JOIN AssessmentDetail ad2 ON ad2.detail_id = ar.detail_id
           WHERE ar.reviewer_role = 'Approver'
             AND ad2.assessment_id = sa.assessment_id
       )
  );";

    const string detailsSql = @"SELECT detail_id FROM AssessmentDetail WHERE assessment_id=@aid;";

    // ✅ Update rating records with decision
    const string updateRatingsSql = @"
UPDATE AssessmentReview
SET review_status = @decision, reviewed_at = NOW()
WHERE reviewer_role = 'Reviewer'
  AND reviewer_id = @reviewerUserId
  AND detail_id IN @detailIds
  AND rating > 0;";

    // ✅ For REJECTION: Insert one decision note (rating = -1) OR UPDATE if exists
    const string updateOrInsertDecisionNoteSql = @"
UPDATE AssessmentReview
SET rating = -1, 
    comments = @note, 
    review_status = @decision,
    reviewed_at = NOW()
WHERE reviewer_role = 'Reviewer'
  AND reviewer_id = @reviewerUserId
  AND detail_id = @firstDetailId
  AND rating = -1
LIMIT 1;

-- If not updated, insert new
INSERT INTO AssessmentReview
  (detail_id, reviewer_id, reviewer_role, rating, comments, reviewed_at, review_status)
SELECT @firstDetailId, @reviewerUserId, 'Reviewer', -1, @note, NOW(), @decision
WHERE NOT EXISTS (
  SELECT 1 FROM AssessmentReview
  WHERE detail_id = @firstDetailId
    AND reviewer_id = @reviewerUserId
    AND reviewer_role = 'Reviewer'
    AND rating = -1
);";

    var conn = _ctx.Database.GetDbConnection();
    if (conn.State != ConnectionState.Open) await conn.OpenAsync();

    var inScope = await conn.ExecuteScalarAsync<int>(scopeSql, new { reviewerUserId, assessmentId });
    if (inScope <= 0) return false;

    using var tx = await conn.BeginTransactionAsync();

    try
    {
        var detailIds = (await conn.QueryAsync<int>(detailsSql, new { aid = assessmentId }, tx)).ToArray();
        if (detailIds.Length == 0) 
        { 
            await tx.RollbackAsync(); 
            return false; 
        }

        var finalDecision = approved ? "Approved" : "Rejected";

        // ✅ Update rating records
        await conn.ExecuteAsync(updateRatingsSql,
            new { decision = finalDecision, reviewerUserId, detailIds }, tx);

        // ✅ For REJECTION: Update or insert decision note
        if (rejected)
        {
            var note = reviewerComment ?? "Reviewer Rejected";
            await conn.ExecuteAsync(updateOrInsertDecisionNoteSql,
                new
                {
                    firstDetailId = detailIds[0],
                    reviewerUserId,
                    note,
                    decision = finalDecision
                }, tx);
        }
        // ✅ For APPROVAL: Delete any existing -1 decision records (cleanup)
        else
        {
            await conn.ExecuteAsync(@"
DELETE FROM AssessmentReview
WHERE reviewer_role = 'Reviewer'
  AND reviewer_id = @reviewerUserId
  AND detail_id IN @detailIds
  AND rating = -1;",
                new { reviewerUserId, detailIds }, tx);
        }

        await tx.CommitAsync();
    }
    catch
    {
        await tx.RollbackAsync();
        throw;
    }

    try
    {
        var assessment = await _ctx.Selfassessments
            .FirstOrDefaultAsync(a => a.AssessmentId == assessmentId);
        if (assessment != null)
        {
            var tracker = await _ctx.Formprogresstrackers
                .Include(t => t.Assignment)
                .FirstOrDefaultAsync(t => t.Assignment.EmployeeId == assessment.EmployeeId
                                       && t.Assignment.FormId == assessment.FormId);
            if (tracker != null)
            {
                tracker.ManagerCompleted = true;
                tracker.LastUpdated = DateTime.UtcNow;
                await _ctx.SaveChangesAsync();
            }
        }
    }
    catch
    {
        // Log if needed
    }

    return true;
}



 

    // =========================================================
  // L1 (Approver) — rework forms (rejected by L2)
  // =========================================================
  public async Task<IEnumerable<ApproverAssignmentRowDto>> GetApproverReworkFormsAsync(
      int approverUserId, int page, int pageSize)
  {
    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 25;
    var offset = (page - 1) * pageSize;

    const string sql = @"
WITH l1 AS (
  SELECT e.EmployeeId AS L1EmployeeId
  FROM UserAuthentication ua
  JOIN Employee e ON e.EmployeeId = ua.EmployeeId
  WHERE ua.UserId = @approverUserId
),
scope_assessments AS (
  SELECT DISTINCT sa.assessment_id
  FROM SelfAssessment sa
  JOIN UserAuthentication emp_ua ON emp_ua.UserId = sa.employee_id
  JOIN Employee emp ON emp.EmployeeId = emp_ua.EmployeeId
  JOIN EmployeeDetailsMaster emp_edm ON emp_edm.EmployeeId = emp.EmployeeId
  JOIN ProjectEmployees pe ON pe.EmployeeId = emp_edm.EmployeeId AND pe.IsPrimary = 1
  JOIN Project p ON p.ProjectId = pe.ProjectId
  JOIN l1 ON p.L1ApproverEmployeeId = l1.L1EmployeeId
),
latest_l2 AS (
  SELECT ar.detail_id, MAX(ar.review_id) AS max_id
  FROM AssessmentReview ar
  WHERE ar.reviewer_role = 'Reviewer' AND ar.detail_id IS NOT NULL
  GROUP BY ar.detail_id
),
l2_status AS (
  SELECT ar.detail_id, ar.review_status
  FROM AssessmentReview ar
  JOIN latest_l2 t ON t.max_id = ar.review_id
)
SELECT 
  sa.assessment_id        AS AssessmentId,
  COALESCE(NULLIF(CONCAT_WS(' ', up.FirstName, up.LastName), ''), emp_ua.Email, emp.EmployeeCompanyId) AS EmployeeName,
  f.name                  AS FormName,
  sa.submitted_at         AS SubmittedAt,
  sa.status               AS Status,
  GROUP_CONCAT(DISTINCT p.ProjectName ORDER BY p.ProjectName SEPARATOR ', ') AS Project
FROM scope_assessments s
JOIN SelfAssessment sa             ON sa.assessment_id = s.assessment_id
JOIN AssessmentDetail ad           ON ad.assessment_id = sa.assessment_id
JOIN l2_status ls                  ON ls.detail_id = ad.detail_id
JOIN AssessmentForm f              ON f.form_id = sa.form_id
JOIN UserAuthentication emp_ua     ON emp_ua.UserId = sa.employee_id
JOIN Employee emp                  ON emp.EmployeeId = emp_ua.EmployeeId
LEFT JOIN UserProfile up           ON up.EmployeeId = emp.EmployeeId
JOIN EmployeeDetailsMaster emp_edm ON emp_edm.EmployeeId = emp.EmployeeId
JOIN ProjectEmployees pe           ON pe.EmployeeId = emp_edm.EmployeeId AND pe.IsPrimary = 1
JOIN Project p                     ON p.ProjectId = pe.ProjectId
WHERE ls.review_status = 'Rejected'
GROUP BY sa.assessment_id, EmployeeName, FormName, SubmittedAt, Status
ORDER BY sa.submitted_at DESC
LIMIT @pageSize OFFSET @offset;";

    var conn = _ctx.Database.GetDbConnection();
    if (conn.State != ConnectionState.Open) await conn.OpenAsync();

    return await conn.QueryAsync<ApproverAssignmentRowDto>(
        sql, new { approverUserId, pageSize, offset });
  }

    // =========================================================
    // L1 (Approver) — get single assessment for review
    // =========================================================
    public async Task<ReviewerAssessmentViewDto?> GetAssessmentForApproverAsync(int approverUserId, int assessmentId)
    {
        const string sql = @"
WITH l1 AS (
  SELECT e.EmployeeId AS L1EmployeeId
  FROM UserAuthentication ua
  JOIN Employee e ON e.EmployeeId = ua.EmployeeId
  WHERE ua.UserId = @approverUserId
),
scope AS (
  SELECT DISTINCT sa.assessment_id
  FROM SelfAssessment sa
  JOIN UserAuthentication emp_ua ON emp_ua.UserId = sa.employee_id
  JOIN Employee emp ON emp.EmployeeId = emp_ua.EmployeeId
  JOIN EmployeeDetailsMaster emp_edm ON emp_edm.EmployeeId = emp.EmployeeId
  JOIN ProjectEmployees pe ON pe.EmployeeId = emp_edm.EmployeeId AND pe.IsPrimary = 1
  JOIN Project p ON p.ProjectId = pe.ProjectId
  JOIN l1 ON p.L1ApproverEmployeeId = l1.L1EmployeeId
  WHERE sa.assessment_id = @assessmentId
    AND sa.status = 'Submitted'
),
latest_l1 AS (
  SELECT ar.*
  FROM AssessmentReview ar
  JOIN (
    SELECT detail_id, MAX(review_id) AS max_id
    FROM AssessmentReview
    WHERE reviewer_role = 'Approver'
    GROUP BY detail_id
  ) t ON t.max_id = ar.review_id
),
latest_l2 AS (
  SELECT ar.*
  FROM AssessmentReview ar
  JOIN (
    SELECT detail_id, MAX(review_id) AS max_id
    FROM AssessmentReview
    WHERE reviewer_role = 'Reviewer'
      AND detail_id IS NOT NULL
      AND rating >= 0
    GROUP BY detail_id
  ) t ON t.max_id = ar.review_id
),
header AS (
  SELECT
    sa.assessment_id AS AssessmentId,
    COALESCE(NULLIF(CONCAT_WS(' ', up.FirstName, up.LastName), ''), emp_ua.Email, e.EmployeeCompanyId) AS EmployeeName,
    f.name AS FormName,
    sa.submitted_at AS SubmittedAt,
    GROUP_CONCAT(DISTINCT p.ProjectName ORDER BY p.ProjectName SEPARATOR ', ') AS Project
  FROM SelfAssessment sa
  JOIN scope s ON s.assessment_id = sa.assessment_id
  JOIN AssessmentForm f ON f.form_id = sa.form_id
  JOIN UserAuthentication emp_ua ON emp_ua.UserId = sa.employee_id
  JOIN Employee e ON e.EmployeeId = emp_ua.EmployeeId
  LEFT JOIN UserProfile up ON up.EmployeeId = e.EmployeeId
  JOIN EmployeeDetailsMaster emp_edm ON emp_edm.EmployeeId = e.EmployeeId
  JOIN ProjectEmployees pe ON pe.EmployeeId = emp_edm.EmployeeId AND pe.IsPrimary = 1
  JOIN Project p ON p.ProjectId = pe.ProjectId
  GROUP BY sa.assessment_id, EmployeeName, FormName, SubmittedAt
)
SELECT 
  h.AssessmentId,
  h.EmployeeName,
  h.FormName,
  h.SubmittedAt,
  h.Project,
  ad.detail_id       AS DetailId,
  c.name             AS CompetencyName,
  ad.employee_rating AS EmployeeRating,
  ad.employee_comments AS EmployeeComments,
  l1.rating          AS ApproverRating,
  l1.comments        AS ApproverComments,
  l2.rating          AS ReviewerRating,
  l2.comments        AS ReviewerComments
FROM header h
JOIN AssessmentDetail ad ON ad.assessment_id = h.AssessmentId
JOIN Competency c ON c.competency_id = ad.competency_id
LEFT JOIN latest_l1 l1 ON l1.detail_id = ad.detail_id
LEFT JOIN latest_l2 l2 ON l2.detail_id = ad.detail_id
ORDER BY c.display_order IS NULL, c.display_order, c.name;";

        var conn = _ctx.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open) await conn.OpenAsync();

        var rows = (await conn.QueryAsync(sql, new { approverUserId, assessmentId })).ToList();
        if (!rows.Any()) return null;

        var head = rows[0];
        var items = rows.Select(r => new CompetencyReviewRowDto(
            DetailId: (int)r.DetailId,
            CompetencyName: (string)r.CompetencyName,
            EmployeeRating: (int?)r.EmployeeRating,
            EmployeeComments: (string?)r.EmployeeComments,
            ApproverRating: (int?)r.ApproverRating,
            ApproverComments: (string?)r.ApproverComments,
            ReviewerRating: (int?)r.ReviewerRating,
            ReviewerComments: (string?)r.ReviewerComments
        )).ToList();

        return new ReviewerAssessmentViewDto(
            AssessmentId: (int)head.AssessmentId,
            EmployeeName: (string)head.EmployeeName,
            FormName: (string)head.FormName,
            SubmittedAt: (DateTime)head.SubmittedAt,
            Project: (string)head.Project,
            Items: items
        );
    }

    // =========================================================
    // L1 (Approver) — get assessments with details (FIXED)
    // =========================================================
    public async Task<IEnumerable<ReviewerAssessmentViewDto>> GetApproverAssessmentsWithDetailsAsync(
        int approverUserId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 25;
        var offset = (page - 1) * pageSize;

        const string sql = @"
WITH l1 AS (
  SELECT e.EmployeeId AS L1EmployeeId
  FROM UserAuthentication ua
  JOIN Employee e ON e.EmployeeId = ua.EmployeeId
  WHERE ua.UserId = @approverUserId
),
scope_assessments AS (
  SELECT DISTINCT sa.assessment_id
  FROM SelfAssessment sa
  JOIN UserAuthentication emp_ua ON emp_ua.UserId = sa.employee_id
  JOIN Employee emp ON emp.EmployeeId = emp_ua.EmployeeId
  JOIN EmployeeDetailsMaster emp_edm ON emp_edm.EmployeeId = emp.EmployeeId
  JOIN ProjectEmployees pe ON pe.EmployeeId = emp_edm.EmployeeId AND pe.IsPrimary = 1
  JOIN Project p ON p.ProjectId = pe.ProjectId
  JOIN l1 ON p.L1ApproverEmployeeId = l1.L1EmployeeId
  WHERE sa.status = 'Submitted'
),
latest_l1_check AS (
  SELECT ar.detail_id, MAX(ar.review_id) AS max_id
  FROM AssessmentReview ar
  WHERE ar.reviewer_role = 'Approver' AND ar.detail_id IS NOT NULL
  GROUP BY ar.detail_id
),
has_any_l1 AS (
  SELECT ad.assessment_id
  FROM AssessmentDetail ad
  JOIN latest_l1_check t ON t.detail_id = ad.detail_id
  GROUP BY ad.assessment_id
),
latest_l2_check AS (
  SELECT ar.detail_id, MAX(ar.review_id) AS max_id
  FROM AssessmentReview ar
  WHERE ar.reviewer_role = 'Reviewer' AND ar.detail_id IS NOT NULL
  GROUP BY ar.detail_id
),
l2_status AS (
  SELECT ar.detail_id, ar.review_status
  FROM AssessmentReview ar
  JOIN latest_l2_check t ON t.max_id = ar.review_id
),
decided_assessments AS (
  SELECT ad.assessment_id
  FROM AssessmentDetail ad
  JOIN l2_status s ON s.detail_id = ad.detail_id
  WHERE s.review_status IN ('Approved','Rejected')
  GROUP BY ad.assessment_id
),
visible_assessments AS (
  SELECT sa.assessment_id
  FROM scope_assessments sa
  LEFT JOIN decided_assessments da ON da.assessment_id = sa.assessment_id
  LEFT JOIN has_any_l1 h1 ON h1.assessment_id = sa.assessment_id
  WHERE da.assessment_id IS NULL
    AND h1.assessment_id IS NULL
),
latest_l1 AS (
  SELECT ar.*
  FROM AssessmentReview ar
  JOIN (
    SELECT detail_id, MAX(review_id) AS max_id
    FROM AssessmentReview
    WHERE reviewer_role = 'Approver'
    GROUP BY detail_id
  ) t ON t.max_id = ar.review_id
),
latest_l2 AS (
  SELECT ar.*
  FROM AssessmentReview ar
  JOIN (
    SELECT detail_id, MAX(review_id) AS max_id
    FROM AssessmentReview
    WHERE reviewer_role = 'Reviewer'
    GROUP BY detail_id
  ) t ON t.max_id = ar.review_id
),
headers AS (
  SELECT 
    sa.assessment_id AS AssessmentId,
    COALESCE(NULLIF(CONCAT_WS(' ', up.FirstName, up.LastName), ''), emp_ua.Email, emp.EmployeeCompanyId) AS EmployeeName,
    f.name AS FormName,
    sa.submitted_at AS SubmittedAt,
    GROUP_CONCAT(DISTINCT p.ProjectName ORDER BY p.ProjectName SEPARATOR ', ') AS Project
  FROM visible_assessments v
  JOIN SelfAssessment sa             ON sa.assessment_id = v.assessment_id
  JOIN AssessmentForm f              ON f.form_id = sa.form_id
  JOIN UserAuthentication emp_ua     ON emp_ua.UserId = sa.employee_id
  JOIN Employee emp                  ON emp.EmployeeId = emp_ua.EmployeeId
  LEFT JOIN UserProfile up           ON up.EmployeeId = emp.EmployeeId
  JOIN EmployeeDetailsMaster emp_edm ON emp_edm.EmployeeId = emp.EmployeeId
  JOIN ProjectEmployees pe           ON pe.EmployeeId = emp_edm.EmployeeId AND pe.IsPrimary = 1
  JOIN Project p                     ON p.ProjectId = pe.ProjectId
  GROUP BY sa.assessment_id, EmployeeName, FormName, SubmittedAt
  ORDER BY sa.submitted_at DESC
  LIMIT @pageSize OFFSET @offset
)
SELECT 
  h.AssessmentId,
  h.EmployeeName,
  h.FormName,
  h.SubmittedAt,
  h.Project,
  ad.detail_id        AS DetailId,
  c.name              AS CompetencyName,
  ad.employee_rating  AS EmployeeRating,
  ad.employee_comments AS EmployeeComments,
  l1.rating           AS ApproverRating,
  l1.comments         AS ApproverComments,
  l2.rating           AS ReviewerRating,
  l2.comments         AS ReviewerComments
FROM headers h
JOIN AssessmentDetail ad ON ad.assessment_id = h.AssessmentId
JOIN Competency c        ON c.competency_id = ad.competency_id
LEFT JOIN latest_l1 l1   ON l1.detail_id = ad.detail_id
LEFT JOIN latest_l2 l2   ON l2.detail_id = ad.detail_id
ORDER BY h.SubmittedAt DESC, c.display_order IS NULL, c.display_order, c.name;";

        var conn = _ctx.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open) await conn.OpenAsync();

        var rows = (await conn.QueryAsync(sql, new { approverUserId, pageSize, offset })).ToList();
        if (rows.Count == 0) return Enumerable.Empty<ReviewerAssessmentViewDto>();

        var groups = rows.GroupBy(r => (int)r.AssessmentId);
        var result = new List<ReviewerAssessmentViewDto>();
        foreach (var g in groups)
        {
            var head = g.First();
            var items = g.Select(r => new CompetencyReviewRowDto(
                DetailId: (int)r.DetailId,
                CompetencyName: (string)r.CompetencyName,
                EmployeeRating: (int?)r.EmployeeRating,
                EmployeeComments: (string?)r.EmployeeComments,
                ApproverRating: (int?)r.ApproverRating,
                ApproverComments: (string?)r.ApproverComments,
                ReviewerRating: (int?)r.ReviewerRating,
                ReviewerComments: (string?)r.ReviewerComments
            )).ToList();

            result.Add(new ReviewerAssessmentViewDto(
                AssessmentId: (int)head.AssessmentId,
                EmployeeName: (string)head.EmployeeName,
                FormName: (string)head.FormName,
                SubmittedAt: (DateTime)head.SubmittedAt,
                Project: (string)head.Project,
                Items: items
            ));
        }

        return result;
    }

    // =========================================================
    // L2 (Reviewer) — get assessments with details
    // =========================================================
    public async Task<IEnumerable<ReviewerAssessmentViewDto>> GetReviewerAssessmentsWithDetailsAsync(
        int reviewerUserId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 25;
        var offset = (page - 1) * pageSize;

        const string sql = @"
WITH l2 AS (
  SELECT e.EmployeeId AS L2EmployeeId
  FROM UserAuthentication ua
  JOIN Employee e ON e.EmployeeId = ua.EmployeeId
  WHERE ua.UserId = @reviewerUserId
),
scope_assessments AS (
  SELECT DISTINCT sa.assessment_id, p.L1ApproverEmployeeId
  FROM SelfAssessment sa
  JOIN UserAuthentication emp_ua ON emp_ua.UserId = sa.employee_id
  JOIN Employee emp ON emp.EmployeeId = emp_ua.EmployeeId
  JOIN EmployeeDetailsMaster emp_edm ON emp_edm.EmployeeId = emp.EmployeeId
  JOIN ProjectEmployees pe ON pe.EmployeeId = emp_edm.EmployeeId AND pe.IsPrimary = 1
  JOIN Project p ON p.ProjectId = pe.ProjectId
  JOIN l2 ON p.L2ApproverEmployeeId = l2.L2EmployeeId
  WHERE sa.status = 'Submitted'
),
latest_l1 AS (
  SELECT ar.detail_id, MAX(ar.review_id) AS max_id
  FROM AssessmentReview ar
  WHERE ar.reviewer_role = 'Approver' AND ar.detail_id IS NOT NULL
  GROUP BY ar.detail_id
),
has_any_l1 AS (
  SELECT ad.assessment_id
  FROM AssessmentDetail ad
  JOIN latest_l1 t ON t.detail_id = ad.detail_id
  GROUP BY ad.assessment_id
),
latest_l1_rows AS (
  SELECT ar.*
  FROM AssessmentReview ar
  JOIN (
    SELECT detail_id, MAX(review_id) AS max_id
    FROM AssessmentReview
    WHERE reviewer_role = 'Approver'
    GROUP BY detail_id
  ) t ON t.max_id = ar.review_id
),
latest_l2_rows AS (
  SELECT ar.*
  FROM AssessmentReview ar
  JOIN (
    SELECT detail_id, MAX(review_id) AS max_id
    FROM AssessmentReview
    WHERE reviewer_role = 'Reviewer'
    GROUP BY detail_id
  ) t ON t.max_id = ar.review_id
),
latest_l2_status AS (
  SELECT ar.detail_id, ar.review_status
  FROM latest_l2_rows ar
),
decided AS (
  SELECT ad.assessment_id
  FROM AssessmentDetail ad
  JOIN latest_l2_status s ON s.detail_id = ad.detail_id
  WHERE s.review_status IN ('Approved','Rejected')
  GROUP BY ad.assessment_id
),
visible AS (
  SELECT sa.assessment_id
  FROM scope_assessments sa
  LEFT JOIN decided d ON d.assessment_id = sa.assessment_id
  WHERE d.assessment_id IS NULL
    AND (
      sa.L1ApproverEmployeeId IS NULL
      OR sa.assessment_id IN (SELECT assessment_id FROM has_any_l1)
    )
),
headers AS (
  SELECT
    sa.assessment_id AS AssessmentId,
    COALESCE(NULLIF(CONCAT_WS(' ', up.FirstName, up.LastName), ''), emp_ua.Email, emp.EmployeeCompanyId) AS EmployeeName,
    f.name AS FormName,
    sa.submitted_at AS SubmittedAt,
    GROUP_CONCAT(DISTINCT p.ProjectName ORDER BY p.ProjectName SEPARATOR ', ') AS Project
  FROM visible v
  JOIN SelfAssessment sa             ON sa.assessment_id = v.assessment_id
  JOIN AssessmentForm f              ON f.form_id = sa.form_id
  JOIN UserAuthentication emp_ua     ON emp_ua.UserId = sa.employee_id
  JOIN Employee emp                  ON emp.EmployeeId = emp_ua.EmployeeId
  LEFT JOIN UserProfile up           ON up.EmployeeId = emp.EmployeeId
  JOIN EmployeeDetailsMaster emp_edm ON emp_edm.EmployeeId = emp.EmployeeId
  JOIN ProjectEmployees pe           ON pe.EmployeeId = emp_edm.EmployeeId AND pe.IsPrimary = 1
  JOIN Project p                     ON p.ProjectId = pe.ProjectId
  GROUP BY sa.assessment_id, EmployeeName, FormName, SubmittedAt
  ORDER BY sa.submitted_at DESC
  LIMIT @pageSize OFFSET @offset
)
SELECT 
  h.AssessmentId,
  h.EmployeeName,
  h.FormName,
  h.SubmittedAt,
  h.Project,
  ad.detail_id         AS DetailId,
  c.name               AS CompetencyName,
  ad.employee_rating   AS EmployeeRating,
  ad.employee_comments AS EmployeeComments,
  l1.rating            AS ApproverRating,
  l1.comments          AS ApproverComments,
  l2.rating            AS ReviewerRating,
  l2.comments          AS ReviewerComments
FROM headers h
JOIN AssessmentDetail ad  ON ad.assessment_id = h.AssessmentId
JOIN Competency c         ON c.competency_id = ad.competency_id
LEFT JOIN latest_l1_rows l1 ON l1.detail_id = ad.detail_id
LEFT JOIN latest_l2_rows l2 ON l2.detail_id = ad.detail_id
ORDER BY h.SubmittedAt DESC, c.display_order IS NULL, c.display_order, c.name;";

        var conn = _ctx.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open) await conn.OpenAsync();

        var rows = (await conn.QueryAsync(sql, new { reviewerUserId, pageSize, offset })).ToList();
        if (rows.Count == 0) return Enumerable.Empty<ReviewerAssessmentViewDto>();

        var grouped = rows.GroupBy(r => (int)r.AssessmentId);
        var list = new List<ReviewerAssessmentViewDto>();
        foreach (var g in grouped)
        {
            var head = g.First();
            var items = g.Select(r => new CompetencyReviewRowDto(
                DetailId: (int)r.DetailId,
                CompetencyName: (string)r.CompetencyName,
                EmployeeRating: (int?)r.EmployeeRating,
                EmployeeComments: (string?)r.EmployeeComments,
                ApproverRating: (int?)r.ApproverRating,
                ApproverComments: (string?)r.ApproverComments,
                ReviewerRating: (int?)r.ReviewerRating,
                ReviewerComments: (string?)r.ReviewerComments
            )).ToList();

            list.Add(new ReviewerAssessmentViewDto(
                AssessmentId: (int)head.AssessmentId,
                EmployeeName: (string)head.EmployeeName,
                FormName: (string)head.FormName,
                SubmittedAt: (DateTime)head.SubmittedAt,
                Project: (string)head.Project,
                Items: items
            ));
        }

        return list;
    }

    // =========================================================
    // Get latest L2 decision for an assessment
    // =========================================================
    public async Task<ReviewerDecisionDto?> GetLatestReviewerDecisionAsync(int assessmentId)
    {
        const string sql = @"
SELECT
  ar.review_status   AS Decision,
  ar.comments        AS Note,
  ar.reviewed_at     AS DecidedAt
FROM AssessmentReview ar
JOIN AssessmentDetail ad ON ad.detail_id = ar.detail_id
WHERE ad.assessment_id = @assessmentId
  AND ar.reviewer_role = 'Reviewer'
  AND (ar.rating IS NULL OR ar.rating = -1)
ORDER BY ar.review_id DESC
LIMIT 1;";

        var conn = _ctx.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open) await conn.OpenAsync();

        var row = await conn.QueryFirstOrDefaultAsync(sql, new { assessmentId });
        if (row == null) return null;

        return new ReviewerDecisionDto(
            AssessmentId: assessmentId,
            Decision:  (string?)row.Decision,
            Note:      (string?)row.Note,
            DecidedAt: (DateTime?)row.DecidedAt
        );
    }
}
