using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Pomelo.EntityFrameworkCore.MySql.Scaffolding.Internal;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.DBContexts;

public partial class EEPZDbContext : DbContext
{
    public EEPZDbContext()
    {
    }

    public EEPZDbContext(DbContextOptions<EEPZDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Address> Addresses { get; set; }

    public virtual DbSet<Assessmentdetail> Assessmentdetails { get; set; }

    public virtual DbSet<Assessmentform> Assessmentforms { get; set; }

    public virtual DbSet<Assessmentreview> Assessmentreviews { get; set; }

    public virtual DbSet<Assignment> Assignments { get; set; }

    public virtual DbSet<Auditlog> Auditlogs { get; set; }

    public virtual DbSet<Budgetallocation> Budgetallocations { get; set; }

    public virtual DbSet<Bulkoperationlog> Bulkoperationlogs { get; set; }

    public virtual DbSet<Changerequest> Changerequests { get; set; }

    public virtual DbSet<Competency> Competencies { get; set; }

    public virtual DbSet<Department> Departments { get; set; }

    public virtual DbSet<Departmentbudget> Departmentbudgets { get; set; }

    public virtual DbSet<Employee> Employees { get; set; }

    public virtual DbSet<Employeedetailsmaster> Employeedetailsmasters { get; set; }

    public virtual DbSet<Feedback> Feedbacks { get; set; }

    public virtual DbSet<Formprogresstracker> Formprogresstrackers { get; set; }

    public virtual DbSet<Goal> Goals { get; set; }

    public virtual DbSet<GoalApproval> GoalApprovals { get; set; }

    public virtual DbSet<GoalAssignment> GoalAssignments { get; set; }

    public virtual DbSet<GoalAttachment> GoalAttachments { get; set; }

    public virtual DbSet<GoalChecklist> GoalChecklists { get; set; }

    public virtual DbSet<GoalComment> GoalComments { get; set; }

    public virtual DbSet<Goalchecklistprogress> Goalchecklistprogresses { get; set; }

    public virtual DbSet<Goalprogresslog> Goalprogresslogs { get; set; }

    public virtual DbSet<Internalopportunity> Internalopportunities { get; set; }

    public virtual DbSet<Loginattempt> Loginattempts { get; set; }

    public virtual DbSet<Managernominationtracking> Managernominationtrackings { get; set; }

    public virtual DbSet<Meetingmom> Meetingmoms { get; set; }

    public virtual DbSet<Mentorfeedback> Mentorfeedbacks { get; set; }

    public virtual DbSet<Nomination> Nominations { get; set; }

    public virtual DbSet<Nominationreviewmetric> Nominationreviewmetrics { get; set; }

    public virtual DbSet<Oneononediscussion> Oneononediscussions { get; set; }

    public virtual DbSet<Organizationalpolicy> Organizationalpolicies { get; set; }

    public virtual DbSet<Otp> Otps { get; set; }

    public virtual DbSet<Payroll> Payrolls { get; set; }

    public virtual DbSet<Peerfeedback> Peerfeedbacks { get; set; }

    public virtual DbSet<Policyviolation> Policyviolations { get; set; }

    public virtual DbSet<Profilechangerequest> Profilechangerequests { get; set; }

    public virtual DbSet<Project> Projects { get; set; }

    public virtual DbSet<Projectemployee> Projectemployees { get; set; }

    public virtual DbSet<Promotion> Promotions { get; set; }

    public virtual DbSet<Promotionhistory> Promotionhistories { get; set; }

    public virtual DbSet<Refreshtoken> Refreshtokens { get; set; }

    public virtual DbSet<Review> Reviews { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<Selfassessment> Selfassessments { get; set; }

    public virtual DbSet<Sla> Slas { get; set; }

    public virtual DbSet<Slaescalation> Slaescalations { get; set; }

    public virtual DbSet<Slahistory> Slahistories { get; set; }

    public virtual DbSet<Teamworkload> Teamworkloads { get; set; }

    public virtual DbSet<Userauthentication> Userauthentications { get; set; }

    public virtual DbSet<Userprofile> Userprofiles { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseMySql("server=localhost;database=eepzdb;uid=root;pwd=Password@12345", Microsoft.EntityFrameworkCore.ServerVersion.Parse("8.0.41-mysql"));

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .UseCollation("utf8mb4_unicode_ci")
            .HasCharSet("utf8mb4");

        modelBuilder.Entity<Address>(entity =>
        {
            entity.HasKey(e => e.AddressId).HasName("PRIMARY");

            entity.ToTable("address");

            entity.HasIndex(e => e.AddressType, "idx_address_type");

            entity.HasIndex(e => e.EmployeeId, "idx_employee");

            entity.Property(e => e.AddressType)
                .HasMaxLength(50)
                .HasComment("Current or Permanent");
            entity.Property(e => e.Area).HasMaxLength(100);
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.Country)
                .HasMaxLength(100)
                .HasDefaultValueSql("'India'");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.DoorNumber).HasMaxLength(50);
            entity.Property(e => e.Landmark).HasMaxLength(200);
            entity.Property(e => e.PinCode).HasMaxLength(20);
            entity.Property(e => e.State).HasMaxLength(100);
            entity.Property(e => e.Street).HasMaxLength(200);
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasColumnType("datetime");

            entity.HasOne(d => d.Employee).WithMany(p => p.Addresses)
                .HasForeignKey(d => d.EmployeeId)
                .HasConstraintName("fk_address_employee");
        });

        modelBuilder.Entity<Assessmentdetail>(entity =>
        {
            entity.HasKey(e => e.DetailId).HasName("PRIMARY");

            entity.ToTable("assessmentdetail");

            entity.HasIndex(e => e.CompetencyId, "competency_id");

            entity.HasIndex(e => e.AssessmentId, "idx_assessment");

            entity.Property(e => e.DetailId).HasColumnName("detail_id");
            entity.Property(e => e.AssessmentId).HasColumnName("assessment_id");
            entity.Property(e => e.CompetencyId).HasColumnName("competency_id");
            entity.Property(e => e.EmployeeComments)
                .HasColumnType("text")
                .HasColumnName("employee_comments");
            entity.Property(e => e.EmployeeRating)
                .HasComment("Rating 1-5")
                .HasColumnName("employee_rating");

            entity.HasOne(d => d.Assessment).WithMany(p => p.Assessmentdetails)
                .HasForeignKey(d => d.AssessmentId)
                .HasConstraintName("assessmentdetail_ibfk_1");

            entity.HasOne(d => d.Competency).WithMany(p => p.Assessmentdetails)
                .HasForeignKey(d => d.CompetencyId)
                .HasConstraintName("assessmentdetail_ibfk_2");
        });

        modelBuilder.Entity<Assessmentform>(entity =>
        {
            entity.HasKey(e => e.FormId).HasName("PRIMARY");

            entity.ToTable("assessmentform");

            entity.HasIndex(e => e.CreatedBy, "created_by");

            entity.HasIndex(e => e.Type, "idx_type");

            entity.Property(e => e.FormId).HasColumnName("form_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DeliveryEnablement)
                .HasColumnType("enum('Delivery','Enablement')")
                .HasColumnName("delivery_enablement");
            entity.Property(e => e.Name)
                .HasMaxLength(200)
                .HasComment("Self Assessment, etc")
                .HasColumnName("name");
            entity.Property(e => e.Type)
                .HasColumnType("enum('Self','Manager','HR Summary')")
                .HasColumnName("type");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.Assessmentforms)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("assessmentform_ibfk_1");
        });

        modelBuilder.Entity<Assessmentreview>(entity =>
        {
            entity.HasKey(e => e.ReviewId).HasName("PRIMARY");

            entity.ToTable("assessmentreview");

            entity.HasIndex(e => e.DetailId, "idx_detail");

            entity.HasIndex(e => e.ReviewerId, "idx_reviewer");

            entity.Property(e => e.ReviewId).HasColumnName("review_id");
            entity.Property(e => e.Comments)
                .HasColumnType("text")
                .HasColumnName("comments");
            entity.Property(e => e.DetailId).HasColumnName("detail_id");
            entity.Property(e => e.Rating).HasColumnName("rating");
            entity.Property(e => e.ReviewStatus)
                .HasColumnType("enum('Approved','Rejected','Pending')")
                .HasColumnName("review_status");
            entity.Property(e => e.ReviewedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("reviewed_at");
            entity.Property(e => e.ReviewerId).HasColumnName("reviewer_id");
            entity.Property(e => e.ReviewerRole)
                .HasColumnType("enum('Approver','Reviewer')")
                .HasColumnName("reviewer_role");

            entity.HasOne(d => d.Detail).WithMany(p => p.Assessmentreviews)
                .HasForeignKey(d => d.DetailId)
                .HasConstraintName("assessmentreview_ibfk_1");

            entity.HasOne(d => d.Reviewer).WithMany(p => p.Assessmentreviews)
                .HasForeignKey(d => d.ReviewerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("assessmentreview_ibfk_2");
        });

        modelBuilder.Entity<Assignment>(entity =>
        {
            entity.HasKey(e => e.AssignmentId).HasName("PRIMARY");

            entity.ToTable("assignment");

            entity.HasIndex(e => e.AssignedBy, "assigned_by");

            entity.HasIndex(e => e.EmployeeId, "idx_employee");

            entity.HasIndex(e => e.FormId, "idx_form");

            entity.Property(e => e.AssignmentId).HasColumnName("assignment_id");
            entity.Property(e => e.Action)
                .HasColumnType("enum('Send','Save as Draft')")
                .HasColumnName("action");
            entity.Property(e => e.AssignedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("assigned_at");
            entity.Property(e => e.AssignedBy).HasColumnName("assigned_by");
            entity.Property(e => e.EmployeeId).HasColumnName("employee_id");
            entity.Property(e => e.FormId).HasColumnName("form_id");

            entity.HasOne(d => d.AssignedByNavigation).WithMany(p => p.AssignmentAssignedByNavigations)
                .HasForeignKey(d => d.AssignedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("assignment_ibfk_3");

            entity.HasOne(d => d.Employee).WithMany(p => p.AssignmentEmployees)
                .HasForeignKey(d => d.EmployeeId)
                .HasConstraintName("assignment_ibfk_2");

            entity.HasOne(d => d.Form).WithMany(p => p.Assignments)
                .HasForeignKey(d => d.FormId)
                .HasConstraintName("assignment_ibfk_1");
        });

        modelBuilder.Entity<Auditlog>(entity =>
        {
            entity.HasKey(e => e.LogId).HasName("PRIMARY");

            entity.ToTable("auditlogs");

            entity.HasIndex(e => e.Timestamp, "idx_timestamp");

            entity.HasIndex(e => new { e.UserId, e.Action }, "idx_user_action");

            entity.Property(e => e.Action).HasMaxLength(100);
            entity.Property(e => e.Details).HasMaxLength(1000);
            entity.Property(e => e.IpAddress).HasMaxLength(50);
            entity.Property(e => e.Timestamp)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");

            entity.HasOne(d => d.User).WithMany(p => p.Auditlogs)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("auditlogs_ibfk_1");
        });

        modelBuilder.Entity<Budgetallocation>(entity =>
        {
            entity.HasKey(e => e.AllocationId).HasName("PRIMARY");

            entity.ToTable("budgetallocations");

            entity.HasIndex(e => e.AllocatedByUserId, "AllocatedByUserId");

            entity.HasIndex(e => e.EmployeeUserId, "EmployeeUserId");

            entity.HasIndex(e => e.AllocationType, "idx_allocation_type");

            entity.HasIndex(e => e.DepartmentId, "idx_department");

            entity.Property(e => e.AllocatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.AllocationType).HasColumnType("enum('Bonus','Promotion','Training','Other')");
            entity.Property(e => e.Amount).HasPrecision(15, 2);
            entity.Property(e => e.GoalStatus).HasMaxLength(100);
            entity.Property(e => e.Notes).HasMaxLength(500);

            entity.HasOne(d => d.AllocatedByUser).WithMany(p => p.BudgetallocationAllocatedByUsers)
                .HasForeignKey(d => d.AllocatedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("budgetallocations_ibfk_3");

            entity.HasOne(d => d.Department).WithMany(p => p.Budgetallocations)
                .HasForeignKey(d => d.DepartmentId)
                .HasConstraintName("budgetallocations_ibfk_1");

            entity.HasOne(d => d.EmployeeUser).WithMany(p => p.BudgetallocationEmployeeUsers)
                .HasForeignKey(d => d.EmployeeUserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("budgetallocations_ibfk_2");
        });

        modelBuilder.Entity<Bulkoperationlog>(entity =>
        {
            entity.HasKey(e => e.LogId).HasName("PRIMARY");

            entity.ToTable("bulkoperationlogs");

            entity.HasIndex(e => e.OperationType, "idx_operation_type");

            entity.HasIndex(e => e.PerformedAt, "idx_performed_at");

            entity.HasIndex(e => e.PerformedByUserId, "idx_performed_by");

            entity.Property(e => e.ErrorDetails).HasColumnType("text");
            entity.Property(e => e.FileName).HasMaxLength(500);
            entity.Property(e => e.OperationType).HasMaxLength(100);
            entity.Property(e => e.PerformedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");

            entity.HasOne(d => d.PerformedByUser).WithMany(p => p.Bulkoperationlogs)
                .HasForeignKey(d => d.PerformedByUserId)
                .HasConstraintName("bulkoperationlogs_ibfk_1");
        });

        modelBuilder.Entity<Changerequest>(entity =>
        {
            entity.HasKey(e => e.RequestId).HasName("PRIMARY");

            entity.ToTable("changerequests");

            entity.HasIndex(e => e.EmployeeId, "IX_ChangeRequests_EmployeeId");

            entity.Property(e => e.AdminRemarks).HasMaxLength(500);
            entity.Property(e => e.ChangeType).HasMaxLength(50);
            entity.Property(e => e.CurrentValue).HasMaxLength(500);
            entity.Property(e => e.NewEmail).HasMaxLength(255);
            entity.Property(e => e.NewEmployeeCompanyId).HasMaxLength(50);
            entity.Property(e => e.NewValue).HasMaxLength(500);
            entity.Property(e => e.ProcessedAt).HasMaxLength(6);
            entity.Property(e => e.Reason).HasMaxLength(1000);
            entity.Property(e => e.RequestedAt).HasMaxLength(6);
            entity.Property(e => e.Status).HasMaxLength(50);

            entity.HasOne(d => d.Employee).WithMany(p => p.Changerequests)
                .HasForeignKey(d => d.EmployeeId)
                .HasConstraintName("FK_ChangeRequests_Employee");
        });

        modelBuilder.Entity<Competency>(entity =>
        {
            entity.HasKey(e => e.CompetencyId).HasName("PRIMARY");

            entity.ToTable("competency");

            entity.HasIndex(e => e.FormId, "idx_form");

            entity.Property(e => e.CompetencyId).HasColumnName("competency_id");
            entity.Property(e => e.Description)
                .HasColumnType("text")
                .HasColumnName("description");
            entity.Property(e => e.DisplayOrder).HasColumnName("display_order");
            entity.Property(e => e.FormId).HasColumnName("form_id");
            entity.Property(e => e.Name)
                .HasMaxLength(200)
                .HasColumnName("name");

            entity.HasOne(d => d.Form).WithMany(p => p.Competencies)
                .HasForeignKey(d => d.FormId)
                .HasConstraintName("competency_ibfk_1");
        });

        modelBuilder.Entity<Department>(entity =>
        {
            entity.HasKey(e => e.DepartmentId).HasName("PRIMARY");

            entity.ToTable("department");

            entity.HasIndex(e => e.DepartmentName, "DepartmentName").IsUnique();

            entity.Property(e => e.BudgetAllocated).HasPrecision(15, 2);
            entity.Property(e => e.CostCenter)
                .HasMaxLength(50)
                .HasComment("Cost center code for financial tracking");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.DepartmentName).HasMaxLength(100);
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasColumnType("datetime");
        });

        modelBuilder.Entity<Departmentbudget>(entity =>
        {
            entity.HasKey(e => e.BudgetId).HasName("PRIMARY");

            entity.ToTable("departmentbudgets");

            entity.HasIndex(e => new { e.DepartmentId, e.FiscalYear }, "idx_department_year").IsUnique();

            entity.Property(e => e.AllocatedAmount)
                .HasPrecision(15, 2)
                .HasDefaultValueSql("'0.00'");
            entity.Property(e => e.AvgCostPerEmployee)
                .HasPrecision(15, 2)
                .HasComputedColumnSql("case when (`Headcount` > 0) then (`UtilizedAmount` / `Headcount`) else 0 end", true);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.Headcount).HasDefaultValueSql("'0'");
            entity.Property(e => e.TotalBudget).HasPrecision(15, 2);
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasColumnType("datetime");
            entity.Property(e => e.UtilizationPercentage)
                .HasPrecision(5, 2)
                .HasComputedColumnSql("(`UtilizedAmount` / nullif(`TotalBudget`,0)) * 100", true);
            entity.Property(e => e.UtilizedAmount)
                .HasPrecision(15, 2)
                .HasDefaultValueSql("'0.00'");

            entity.HasOne(d => d.Department).WithMany(p => p.Departmentbudgets)
                .HasForeignKey(d => d.DepartmentId)
                .HasConstraintName("departmentbudgets_ibfk_1");
        });

        modelBuilder.Entity<Employee>(entity =>
        {
            entity.HasKey(e => e.EmployeeId).HasName("PRIMARY");

            entity.ToTable("employee");

            entity.HasIndex(e => e.EmployeeCompanyId, "EmployeeCompanyId").IsUnique();

            entity.HasIndex(e => e.ReportingManagerEmployeeId, "ReportingManagerEmployeeId");

            entity.HasIndex(e => e.EmploymentStatus, "idx_employment_status");

            entity.HasIndex(e => e.IsActive, "idx_is_active");

            entity.Property(e => e.ConfirmationDate).HasComment("Date of confirmation after probation");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.EmployeeCompanyId)
                .HasMaxLength(50)
                .HasComment("Company-assigned employee ID (e.g., EMP001)");
            entity.Property(e => e.EmployeeType).HasColumnType("enum('FullTime','PartTime')");
            entity.Property(e => e.EmploymentStatus).HasColumnType("enum('Active','Inactive','Terminated','Resigned','Retired')");
            entity.Property(e => e.EmploymentType).HasColumnType("enum('Permanent','Contract','Temporary','Intern','Probation')");
            entity.Property(e => e.ExitDate).HasComment("Last working day");
            entity.Property(e => e.IsActive).HasDefaultValueSql("'1'");
            entity.Property(e => e.NoticePeriodDays).HasDefaultValueSql("'30'");
            entity.Property(e => e.ReportingManagerEmployeeId).HasComment("Self-referencing FK to Employee");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasColumnType("datetime");
            entity.Property(e => e.WorkLocation).HasMaxLength(100);

            entity.HasOne(d => d.ReportingManagerEmployee).WithMany(p => p.InverseReportingManagerEmployee)
                .HasForeignKey(d => d.ReportingManagerEmployeeId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("employee_ibfk_1");
        });

        modelBuilder.Entity<Employeedetailsmaster>(entity =>
        {
            entity.HasKey(e => e.EmployeeMasterId).HasName("PRIMARY");

            entity.ToTable("employeedetailsmaster");

            entity.HasIndex(e => e.DepartmentId, "idx_department");

            entity.HasIndex(e => e.EmployeeId, "idx_employee");

            entity.HasIndex(e => e.RoleId, "idx_role");

            entity.HasOne(d => d.Department).WithMany(p => p.Employeedetailsmasters)
                .HasForeignKey(d => d.DepartmentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("employeedetailsmaster_ibfk_3");

            entity.HasOne(d => d.Employee).WithMany(p => p.Employeedetailsmasters)
                .HasForeignKey(d => d.EmployeeId)
                .HasConstraintName("employeedetailsmaster_ibfk_1");

            entity.HasOne(d => d.Role).WithMany(p => p.Employeedetailsmasters)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("employeedetailsmaster_ibfk_2");
        });

        modelBuilder.Entity<Feedback>(entity =>
        {
            entity.HasKey(e => e.FeedbackId).HasName("PRIMARY");

            entity.ToTable("feedback");

            entity.HasIndex(e => e.EmployeeId, "idx_employee");

            entity.HasIndex(e => e.FeedbackType, "idx_feedback_type");

            entity.HasIndex(e => e.ManagerEmployeeId, "idx_manager");

            entity.Property(e => e.Comments).HasColumnType("text");
            entity.Property(e => e.Context)
                .HasMaxLength(100)
                .HasComment("Performance, OKR, etc");
            entity.Property(e => e.EmployeeId).HasComment("Submitter (NULL if anonymous)");
            entity.Property(e => e.FeedbackType)
                .HasMaxLength(100)
                .HasComment("Team, Self, Org");
            entity.Property(e => e.ManagerReviewedAt).HasColumnType("datetime");
            entity.Property(e => e.SubmittedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");

            entity.HasOne(d => d.Employee).WithMany(p => p.FeedbackEmployees)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("feedback_ibfk_1");

            entity.HasOne(d => d.ManagerEmployee).WithMany(p => p.FeedbackManagerEmployees)
                .HasForeignKey(d => d.ManagerEmployeeId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("feedback_ibfk_2");
        });

        modelBuilder.Entity<Formprogresstracker>(entity =>
        {
            entity.HasKey(e => e.TrackerId).HasName("PRIMARY");

            entity.ToTable("formprogresstracker");

            entity.HasIndex(e => e.AssignmentId, "idx_assignment");

            entity.Property(e => e.TrackerId).HasColumnName("tracker_id");
            entity.Property(e => e.AssignmentId).HasColumnName("assignment_id");
            entity.Property(e => e.EmployeeCompleted)
                .HasDefaultValueSql("'0'")
                .HasColumnName("employee_completed");
            entity.Property(e => e.Initiated)
                .HasDefaultValueSql("'0'")
                .HasColumnName("initiated");
            entity.Property(e => e.LastUpdated)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("last_updated");
            entity.Property(e => e.ManagerCompleted)
                .HasDefaultValueSql("'0'")
                .HasColumnName("manager_completed");
            entity.Property(e => e.SentToDeptHead)
                .HasDefaultValueSql("'0'")
                .HasColumnName("sent_to_dept_head");
            entity.Property(e => e.SentToEmployee)
                .HasDefaultValueSql("'0'")
                .HasColumnName("sent_to_employee");
            entity.Property(e => e.SentToLeadership)
                .HasDefaultValueSql("'0'")
                .HasColumnName("sent_to_leadership");
            entity.Property(e => e.SentToManager)
                .HasDefaultValueSql("'0'")
                .HasColumnName("sent_to_manager");

            entity.HasOne(d => d.Assignment).WithMany(p => p.Formprogresstrackers)
                .HasForeignKey(d => d.AssignmentId)
                .HasConstraintName("formprogresstracker_ibfk_1");
        });

        modelBuilder.Entity<Goal>(entity =>
        {
            entity.HasKey(e => e.GoalId).HasName("PRIMARY");

            entity.ToTable("goals");

            entity.HasIndex(e => e.CreatedBy, "idx_created_by");

            entity.HasIndex(e => e.Goalstatus, "idx_goal_status");

            entity.HasIndex(e => e.ProjectId, "project_id");

            entity.HasIndex(e => e.ReopenedBy, "reopened_by");

            entity.Property(e => e.GoalId).HasColumnName("goal_id");
            entity.Property(e => e.CreatedBy)
                .HasComment("FK to EmployeeDetailsMaster(EmployeeMasterId)")
                .HasColumnName("created_by");
            entity.Property(e => e.GoalDescription)
                .HasColumnType("text")
                .HasColumnName("goal_description");
            entity.Property(e => e.GoalTitle)
                .HasMaxLength(200)
                .HasColumnName("goal_title");
            entity.Property(e => e.GoalType)
                .HasMaxLength(100)
                .HasColumnName("goal_type");
            entity.Property(e => e.Goalcreatedat)
                .HasColumnType("datetime")
                .HasColumnName("goalcreatedat");
            entity.Property(e => e.Goalendat)
                .HasColumnType("datetime")
                .HasColumnName("goalendat");
            entity.Property(e => e.Goalstatus)
                .HasColumnType("enum('pending','open','inprogress','completed','closed','expired','reopened')")
                .HasColumnName("goalstatus");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.ReopenUntil)
                .HasColumnType("timestamp")
                .HasColumnName("reopen_until");
            entity.Property(e => e.ReopenedBy).HasColumnName("reopened_by");
            entity.Property(e => e.ReopenedOn)
                .HasColumnType("timestamp")
                .HasColumnName("reopened_on");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.GoalCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("goals_ibfk_2");

            entity.HasOne(d => d.Project).WithMany(p => p.Goals)
                .HasForeignKey(d => d.ProjectId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("goals_ibfk_1");

            entity.HasOne(d => d.ReopenedByNavigation).WithMany(p => p.GoalReopenedByNavigations)
                .HasForeignKey(d => d.ReopenedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("goals_ibfk_3");
        });

        modelBuilder.Entity<GoalApproval>(entity =>
        {
            entity.HasKey(e => e.ApprovalId).HasName("PRIMARY");

            entity.ToTable("goal_approvals");

            entity.HasIndex(e => e.ApprovedBy, "approved_by");

            entity.HasIndex(e => e.GoalId, "idx_goal");

            entity.HasIndex(e => e.ApprovalStatus, "idx_status");

            entity.HasIndex(e => e.RequestedBy, "requested_by");

            entity.Property(e => e.ApprovalId).HasColumnName("approval_id");
            entity.Property(e => e.ApprovalStatus)
                .HasColumnType("enum('pending','approved','rejected')")
                .HasColumnName("approval_status");
            entity.Property(e => e.ApprovalType)
                .HasColumnType("enum('creation','completion','reopening','delegation','selfgoalactivation')")
                .HasColumnName("approval_type");
            entity.Property(e => e.ApprovedBy).HasColumnName("approved_by");
            entity.Property(e => e.ApprovedOn)
                .HasColumnType("timestamp")
                .HasColumnName("approved_on");
            entity.Property(e => e.GoalId).HasColumnName("goal_id");
            entity.Property(e => e.RequestedBy).HasColumnName("requested_by");
            entity.Property(e => e.RequestedOn)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("requested_on");

            entity.HasOne(d => d.ApprovedByNavigation).WithMany(p => p.GoalApprovalApprovedByNavigations)
                .HasForeignKey(d => d.ApprovedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("goal_approvals_ibfk_3");

            entity.HasOne(d => d.Goal).WithMany(p => p.GoalApprovals)
                .HasForeignKey(d => d.GoalId)
                .HasConstraintName("goal_approvals_ibfk_1");

            entity.HasOne(d => d.RequestedByNavigation).WithMany(p => p.GoalApprovalRequestedByNavigations)
                .HasForeignKey(d => d.RequestedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("goal_approvals_ibfk_2");
        });

        modelBuilder.Entity<GoalAssignment>(entity =>
        {
            entity.HasKey(e => e.AssignmentId).HasName("PRIMARY");

            entity.ToTable("goal_assignment");

            entity.HasIndex(e => e.AssignedBy, "assigned_by");

            entity.HasIndex(e => e.AssignedTo, "idx_assigned_to");

            entity.HasIndex(e => e.GoalId, "idx_goal");

            entity.Property(e => e.AssignmentId).HasColumnName("assignment_id");
            entity.Property(e => e.AssignedBy).HasColumnName("assigned_by");
            entity.Property(e => e.AssignedOn)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("assigned_on");
            entity.Property(e => e.AssignedTo).HasColumnName("assigned_to");
            entity.Property(e => e.GoalId).HasColumnName("goal_id");

            entity.HasOne(d => d.AssignedByNavigation).WithMany(p => p.GoalAssignmentAssignedByNavigations)
                .HasForeignKey(d => d.AssignedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("goal_assignment_ibfk_2");

            entity.HasOne(d => d.AssignedToNavigation).WithMany(p => p.GoalAssignmentAssignedToNavigations)
                .HasForeignKey(d => d.AssignedTo)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("goal_assignment_ibfk_3");

            entity.HasOne(d => d.Goal).WithMany(p => p.GoalAssignments)
                .HasForeignKey(d => d.GoalId)
                .HasConstraintName("goal_assignment_ibfk_1");
        });

        modelBuilder.Entity<GoalAttachment>(entity =>
        {
            entity.HasKey(e => e.Goalattachmentsid).HasName("PRIMARY");

            entity.ToTable("goal_attachments");

            entity.HasIndex(e => e.AttachedBy, "attached_by");

            entity.HasIndex(e => e.GoalId, "idx_goal");

            entity.Property(e => e.Goalattachmentsid).HasColumnName("goalattachmentsid");
            entity.Property(e => e.AttachedBy).HasColumnName("attached_by");
            entity.Property(e => e.AttachedOn)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("attached_on");
            entity.Property(e => e.AttachmentTitle)
                .HasMaxLength(200)
                .HasColumnName("attachment_title");
            entity.Property(e => e.Attachments)
                .HasMaxLength(500)
                .HasComment("File path or blob reference")
                .HasColumnName("attachments");
            entity.Property(e => e.GoalId).HasColumnName("goal_id");

            entity.HasOne(d => d.AttachedByNavigation).WithMany(p => p.GoalAttachments)
                .HasForeignKey(d => d.AttachedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("goal_attachments_ibfk_2");

            entity.HasOne(d => d.Goal).WithMany(p => p.GoalAttachments)
                .HasForeignKey(d => d.GoalId)
                .HasConstraintName("goal_attachments_ibfk_1");
        });

        modelBuilder.Entity<GoalChecklist>(entity =>
        {
            entity.HasKey(e => e.ChecklistId).HasName("PRIMARY");

            entity.ToTable("goal_checklist");

            entity.HasIndex(e => e.AddedBy, "added_by");

            entity.HasIndex(e => e.AddedFor, "added_for");

            entity.HasIndex(e => e.GoalId, "idx_goal");

            entity.Property(e => e.ChecklistId).HasColumnName("checklist_id");
            entity.Property(e => e.AddedBy).HasColumnName("added_by");
            entity.Property(e => e.AddedFor).HasColumnName("added_for");
            entity.Property(e => e.GoalId).HasColumnName("goal_id");
            entity.Property(e => e.IsShared)
                .HasDefaultValueSql("'0'")
                .HasColumnName("is_shared");
            entity.Property(e => e.ItemDescription)
                .HasColumnType("text")
                .HasColumnName("item_description");
            entity.Property(e => e.ItemTitle)
                .HasMaxLength(200)
                .HasColumnName("item_title");

            entity.HasOne(d => d.AddedByNavigation).WithMany(p => p.GoalChecklistAddedByNavigations)
                .HasForeignKey(d => d.AddedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("goal_checklist_ibfk_2");

            entity.HasOne(d => d.AddedForNavigation).WithMany(p => p.GoalChecklistAddedForNavigations)
                .HasForeignKey(d => d.AddedFor)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("goal_checklist_ibfk_3");

            entity.HasOne(d => d.Goal).WithMany(p => p.GoalChecklists)
                .HasForeignKey(d => d.GoalId)
                .HasConstraintName("goal_checklist_ibfk_1");
        });

        modelBuilder.Entity<GoalComment>(entity =>
        {
            entity.HasKey(e => e.Goalcommentid).HasName("PRIMARY");

            entity.ToTable("goal_comments");

            entity.HasIndex(e => e.CommentedBy, "commented_by");

            entity.HasIndex(e => e.GoalId, "idx_goal");

            entity.Property(e => e.Goalcommentid).HasColumnName("goalcommentid");
            entity.Property(e => e.CommentedBy).HasColumnName("commented_by");
            entity.Property(e => e.CommentedOn)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("commented_on");
            entity.Property(e => e.GoalComment1)
                .HasColumnType("text")
                .HasColumnName("goal_comment");
            entity.Property(e => e.GoalId).HasColumnName("goal_id");

            entity.HasOne(d => d.CommentedByNavigation).WithMany(p => p.GoalComments)
                .HasForeignKey(d => d.CommentedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("goal_comments_ibfk_2");

            entity.HasOne(d => d.Goal).WithMany(p => p.GoalComments)
                .HasForeignKey(d => d.GoalId)
                .HasConstraintName("goal_comments_ibfk_1");
        });

        modelBuilder.Entity<Goalchecklistprogress>(entity =>
        {
            entity.HasKey(e => e.ChecklistProgressId).HasName("PRIMARY");

            entity.ToTable("goalchecklistprogress");

            entity.HasIndex(e => e.ChecklistId, "idx_checklist");

            entity.HasIndex(e => e.UserId, "idx_user");

            entity.Property(e => e.ChecklistProgressId).HasColumnName("checklist_progress_id");
            entity.Property(e => e.ChecklistId).HasColumnName("checklist_id");
            entity.Property(e => e.CompletedOn)
                .HasColumnType("timestamp")
                .HasColumnName("completed_on");
            entity.Property(e => e.IsCompleted)
                .HasDefaultValueSql("'0'")
                .HasColumnName("is_completed");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Checklist).WithMany(p => p.Goalchecklistprogresses)
                .HasForeignKey(d => d.ChecklistId)
                .HasConstraintName("goalchecklistprogress_ibfk_1");

            entity.HasOne(d => d.User).WithMany(p => p.Goalchecklistprogresses)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("goalchecklistprogress_ibfk_2");
        });

        modelBuilder.Entity<Goalprogresslog>(entity =>
        {
            entity.HasKey(e => e.ProgressId).HasName("PRIMARY");

            entity.ToTable("goalprogresslog");

            entity.HasIndex(e => e.GoalId, "idx_goal");

            entity.HasIndex(e => e.UpdatedOn, "idx_updated_on");

            entity.HasIndex(e => e.UpdatedBy, "updated_by");

            entity.Property(e => e.ProgressId).HasColumnName("progress_id");
            entity.Property(e => e.GoalId).HasColumnName("goal_id");
            entity.Property(e => e.ProgressPercent).HasColumnName("progress_percent");
            entity.Property(e => e.Source)
                .HasColumnType("enum('manual','auto')")
                .HasColumnName("source");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            entity.Property(e => e.UpdatedOn)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("updated_on");

            entity.HasOne(d => d.Goal).WithMany(p => p.Goalprogresslogs)
                .HasForeignKey(d => d.GoalId)
                .HasConstraintName("goalprogresslog_ibfk_1");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.Goalprogresslogs)
                .HasForeignKey(d => d.UpdatedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("goalprogresslog_ibfk_2");
        });

        modelBuilder.Entity<Internalopportunity>(entity =>
        {
            entity.HasKey(e => e.OpportunityId).HasName("PRIMARY");

            entity.ToTable("internalopportunities");

            entity.HasIndex(e => e.DepartmentId, "DepartmentId");

            entity.HasIndex(e => e.PostedByUserId, "PostedByUserId");

            entity.HasIndex(e => e.Deadline, "idx_deadline");

            entity.HasIndex(e => e.Status, "idx_status");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.Description).HasColumnType("text");
            entity.Property(e => e.EligibilityCriteria).HasColumnType("text");
            entity.Property(e => e.OpportunityName).HasMaxLength(200);
            entity.Property(e => e.Requirements).HasColumnType("text");
            entity.Property(e => e.Status).HasColumnType("enum('Active','Closed','Draft')");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasColumnType("datetime");

            entity.HasOne(d => d.Department).WithMany(p => p.Internalopportunities)
                .HasForeignKey(d => d.DepartmentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("internalopportunities_ibfk_1");

            entity.HasOne(d => d.PostedByUser).WithMany(p => p.Internalopportunities)
                .HasForeignKey(d => d.PostedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("internalopportunities_ibfk_2");
        });

        modelBuilder.Entity<Loginattempt>(entity =>
        {
            entity.HasKey(e => e.AttemptId).HasName("PRIMARY");

            entity.ToTable("loginattempts");

            entity.HasIndex(e => e.AttemptTime, "idx_attempt_time");

            entity.HasIndex(e => e.Email, "idx_email");

            entity.HasIndex(e => e.IpAddress, "idx_ip_address");

            entity.HasIndex(e => e.IsSuccessful, "idx_is_successful");

            entity.HasIndex(e => e.UserId, "idx_user_id");

            entity.Property(e => e.AttemptTime)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.FailureReason).HasMaxLength(500);
            entity.Property(e => e.IpAddress).HasMaxLength(50);
            entity.Property(e => e.UserAgent).HasMaxLength(500);

            entity.HasOne(d => d.User).WithMany(p => p.Loginattempts)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("loginattempts_ibfk_1");
        });

        modelBuilder.Entity<Managernominationtracking>(entity =>
        {
            entity.HasKey(e => e.TrackingId).HasName("PRIMARY");

            entity.ToTable("managernominationtracking");

            entity.HasIndex(e => e.NominationId, "idx_nomination");

            entity.HasIndex(e => e.ViewedByUserId, "idx_viewed_by");

            entity.Property(e => e.ActionTaken).HasMaxLength(100);
            entity.Property(e => e.ViewedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");

            entity.HasOne(d => d.Nomination).WithMany(p => p.Managernominationtrackings)
                .HasForeignKey(d => d.NominationId)
                .HasConstraintName("managernominationtracking_ibfk_1");

            entity.HasOne(d => d.ViewedByUser).WithMany(p => p.Managernominationtrackings)
                .HasForeignKey(d => d.ViewedByUserId)
                .HasConstraintName("managernominationtracking_ibfk_2");
        });

        modelBuilder.Entity<Meetingmom>(entity =>
        {
            entity.HasKey(e => e.Momid).HasName("PRIMARY");

            entity.ToTable("meetingmom");

            entity.HasIndex(e => e.EmployeeId, "idx_employee");

            entity.HasIndex(e => e.MeetingDate, "idx_meeting_date");

            entity.Property(e => e.Momid).HasColumnName("MOMId");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.CreatedBy).HasComment("Legacy creator id");
            entity.Property(e => e.MeetingTitle).HasMaxLength(200);
            entity.Property(e => e.Notes)
                .HasComment("Minutes / notes")
                .HasColumnType("text");

            entity.HasOne(d => d.Employee).WithMany(p => p.Meetingmoms)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("meetingmom_ibfk_1");
        });

        modelBuilder.Entity<Mentorfeedback>(entity =>
        {
            entity.HasKey(e => e.MentorFeedbackId).HasName("PRIMARY");

            entity.ToTable("mentorfeedback");

            entity.HasIndex(e => e.MentorEmployeeId, "idx_mentor");

            entity.HasIndex(e => e.SubmittedByEmployeeId, "idx_submitted_by");

            entity.Property(e => e.Comments).HasColumnType("text");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.MentorEmployeeId).HasComment("FK to internal mentor");
            entity.Property(e => e.MentorName)
                .HasMaxLength(150)
                .HasComment("Legacy free-text name");
            entity.Property(e => e.SubmittedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.SubmittedByLegacyId).HasComment("Legacy submitter id");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasColumnType("datetime");

            entity.HasOne(d => d.SubmittedByEmployee).WithMany(p => p.Mentorfeedbacks)
                .HasForeignKey(d => d.SubmittedByEmployeeId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("mentorfeedback_ibfk_1");
        });

        modelBuilder.Entity<Nomination>(entity =>
        {
            entity.HasKey(e => e.NominationId).HasName("PRIMARY");

            entity.ToTable("nominations");

            entity.HasIndex(e => e.NominatedByUserId, "NominatedByUserId");

            entity.HasIndex(e => e.NomineeUserId, "NomineeUserId");

            entity.HasIndex(e => e.ReviewedByUserId, "ReviewedByUserId");

            entity.HasIndex(e => e.OpportunityId, "idx_opportunity");

            entity.HasIndex(e => e.Status, "idx_status");

            entity.Property(e => e.Justification).HasColumnType("text");
            entity.Property(e => e.NominationType).HasColumnType("enum('SelfNomination','ManagerNomination')");
            entity.Property(e => e.ReviewRemarks).HasMaxLength(500);
            entity.Property(e => e.ReviewedAt).HasColumnType("datetime");
            entity.Property(e => e.Status).HasColumnType("enum('Pending','UnderReview','Approved','Rejected')");
            entity.Property(e => e.SubmittedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");

            entity.HasOne(d => d.NominatedByUser).WithMany(p => p.NominationNominatedByUsers)
                .HasForeignKey(d => d.NominatedByUserId)
                .HasConstraintName("nominations_ibfk_3");

            entity.HasOne(d => d.NomineeUser).WithMany(p => p.NominationNomineeUsers)
                .HasForeignKey(d => d.NomineeUserId)
                .HasConstraintName("nominations_ibfk_2");

            entity.HasOne(d => d.Opportunity).WithMany(p => p.Nominations)
                .HasForeignKey(d => d.OpportunityId)
                .HasConstraintName("nominations_ibfk_1");

            entity.HasOne(d => d.ReviewedByUser).WithMany(p => p.NominationReviewedByUsers)
                .HasForeignKey(d => d.ReviewedByUserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("nominations_ibfk_4");
        });

        modelBuilder.Entity<Nominationreviewmetric>(entity =>
        {
            entity.HasKey(e => e.MetricId).HasName("PRIMARY");

            entity.ToTable("nominationreviewmetrics");

            entity.HasIndex(e => e.ReviewedByUserId, "ReviewedByUserId");

            entity.HasIndex(e => e.NominationId, "idx_nomination");

            entity.Property(e => e.ConflictOfInterest).HasDefaultValueSql("'0'");
            entity.Property(e => e.DiversityScore)
                .HasPrecision(5, 2)
                .HasComment("Diversity score (0-100)");
            entity.Property(e => e.MeritScore)
                .HasPrecision(5, 2)
                .HasComment("Merit score (0-100)");
            entity.Property(e => e.ReviewNotes).HasColumnType("text");
            entity.Property(e => e.ReviewedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");

            entity.HasOne(d => d.Nomination).WithMany(p => p.Nominationreviewmetrics)
                .HasForeignKey(d => d.NominationId)
                .HasConstraintName("nominationreviewmetrics_ibfk_1");

            entity.HasOne(d => d.ReviewedByUser).WithMany(p => p.Nominationreviewmetrics)
                .HasForeignKey(d => d.ReviewedByUserId)
                .HasConstraintName("nominationreviewmetrics_ibfk_2");
        });

        modelBuilder.Entity<Oneononediscussion>(entity =>
        {
            entity.HasKey(e => e.DiscussionId).HasName("PRIMARY");

            entity.ToTable("oneononediscussion");

            entity.HasIndex(e => e.CreatedBy, "CreatedBy");

            entity.HasIndex(e => e.ParticipantEmployeeId, "ParticipantEmployeeId");

            entity.HasIndex(e => e.HostEmployeeId, "idx_host");

            entity.HasIndex(e => e.ScheduledAt, "idx_scheduled_at");

            entity.HasIndex(e => e.Status, "idx_status");

            entity.Property(e => e.Agenda).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.IsPrivate)
                .IsRequired()
                .HasDefaultValueSql("'1'");
            entity.Property(e => e.MeetingLink)
                .HasMaxLength(1000)
                .HasComment("Teams/Zoom/etc URL");
            entity.Property(e => e.Notes)
                .HasComment("Post-meeting notes / MOM")
                .HasColumnType("text");
            entity.Property(e => e.RecordingLink).HasMaxLength(1000);
            entity.Property(e => e.ScheduledAt).HasColumnType("datetime");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'Scheduled'")
                .HasColumnType("enum('Scheduled','Completed','Cancelled')");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasColumnType("datetime");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.OneononediscussionCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("oneononediscussion_ibfk_3");

            entity.HasOne(d => d.HostEmployee).WithMany(p => p.OneononediscussionHostEmployees)
                .HasForeignKey(d => d.HostEmployeeId)
                .HasConstraintName("oneononediscussion_ibfk_1");

            entity.HasOne(d => d.ParticipantEmployee).WithMany(p => p.OneononediscussionParticipantEmployees)
                .HasForeignKey(d => d.ParticipantEmployeeId)
                .HasConstraintName("oneononediscussion_ibfk_2");
        });

        modelBuilder.Entity<Organizationalpolicy>(entity =>
        {
            entity.HasKey(e => e.PolicyId).HasName("PRIMARY");

            entity.ToTable("organizationalpolicies");

            entity.HasIndex(e => e.CreatedByUserId, "CreatedByUserId");

            entity.HasIndex(e => e.PolicyName, "PolicyName").IsUnique();

            entity.HasIndex(e => e.Category, "idx_category");

            entity.HasIndex(e => e.Status, "idx_status");

            entity.Property(e => e.Category)
                .HasMaxLength(100)
                .HasComment("HR, IT, Finance, Operations");
            entity.Property(e => e.ComplianceGuidance).HasColumnType("text");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.Description).HasColumnType("text");
            entity.Property(e => e.PolicyName).HasMaxLength(200);
            entity.Property(e => e.Status).HasColumnType("enum('Active','Inactive','Draft')");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasColumnType("datetime");

            entity.HasOne(d => d.CreatedByUser).WithMany(p => p.Organizationalpolicies)
                .HasForeignKey(d => d.CreatedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("organizationalpolicies_ibfk_1");
        });

        modelBuilder.Entity<Otp>(entity =>
        {
            entity.HasKey(e => e.OtpId).HasName("PRIMARY");

            entity.ToTable("otp");

            entity.HasIndex(e => new { e.Email, e.OtpCode }, "idx_email_otp");

            entity.HasIndex(e => e.ExpiresAt, "idx_expires_at");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.ExpiresAt)
                .HasComment("Expiration timestamp (typically 5-10 minutes)")
                .HasColumnType("datetime");
            entity.Property(e => e.IpAddress).HasMaxLength(50);
            entity.Property(e => e.IsUsed).HasDefaultValueSql("'0'");
            entity.Property(e => e.OtpCode).HasMaxLength(10);
            entity.Property(e => e.OtpType).HasColumnType("enum('Login2FA','ForgotPassword','EmailVerification')");
            entity.Property(e => e.UsedAt).HasColumnType("datetime");
        });

        modelBuilder.Entity<Payroll>(entity =>
        {
            entity.HasKey(e => e.PayrollId).HasName("PRIMARY");

            entity.ToTable("payroll");

            entity.HasIndex(e => e.ApprovedByUserId, "ApprovedByUserId");

            entity.HasIndex(e => e.DepartmentId, "DepartmentId");

            entity.HasIndex(e => e.EmployeeUserId, "idx_employee");

            entity.HasIndex(e => e.PayrollPeriod, "idx_period");

            entity.HasIndex(e => e.Status, "idx_status");

            entity.Property(e => e.ApprovedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.IncrementPercentage).HasPrecision(5, 2);
            entity.Property(e => e.NewSalary).HasPrecision(15, 2);
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.OldSalary).HasPrecision(15, 2);
            entity.Property(e => e.PayrollPeriod)
                .HasMaxLength(50)
                .HasComment("e.g., Jan-2025");
            entity.Property(e => e.Status).HasColumnType("enum('Pending','Approved','Processed')");

            entity.HasOne(d => d.ApprovedByUser).WithMany(p => p.PayrollApprovedByUsers)
                .HasForeignKey(d => d.ApprovedByUserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("payroll_ibfk_3");

            entity.HasOne(d => d.Department).WithMany(p => p.Payrolls)
                .HasForeignKey(d => d.DepartmentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("payroll_ibfk_2");

            entity.HasOne(d => d.EmployeeUser).WithMany(p => p.PayrollEmployeeUsers)
                .HasForeignKey(d => d.EmployeeUserId)
                .HasConstraintName("payroll_ibfk_1");
        });

        modelBuilder.Entity<Peerfeedback>(entity =>
        {
            entity.HasKey(e => e.PeerFeedbackId).HasName("PRIMARY");

            entity.ToTable("peerfeedback");

            entity.HasIndex(e => e.PeerEmployeeId, "idx_peer");

            entity.HasIndex(e => e.SubmittedByEmployeeId, "idx_submitted_by");

            entity.Property(e => e.Comments).HasColumnType("text");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.PeerName)
                .HasMaxLength(150)
                .HasComment("Legacy free-text name");
            entity.Property(e => e.SubmittedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasColumnType("datetime");

            entity.HasOne(d => d.PeerEmployee).WithMany(p => p.PeerfeedbackPeerEmployees)
                .HasForeignKey(d => d.PeerEmployeeId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("peerfeedback_ibfk_1");

            entity.HasOne(d => d.SubmittedByEmployee).WithMany(p => p.PeerfeedbackSubmittedByEmployees)
                .HasForeignKey(d => d.SubmittedByEmployeeId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("peerfeedback_ibfk_2");
        });

        modelBuilder.Entity<Policyviolation>(entity =>
        {
            entity.HasKey(e => e.ViolationId).HasName("PRIMARY");

            entity.ToTable("policyviolations");

            entity.HasIndex(e => e.EscalatedToUserId, "EscalatedToUserId");

            entity.HasIndex(e => e.PolicyId, "PolicyId");

            entity.HasIndex(e => e.ReportedByUserId, "ReportedByUserId");

            entity.HasIndex(e => e.EmployeeUserId, "idx_employee");

            entity.HasIndex(e => e.Severity, "idx_severity");

            entity.HasIndex(e => e.Status, "idx_status");

            entity.Property(e => e.Description).HasColumnType("text");
            entity.Property(e => e.ResolutionNotes).HasColumnType("text");
            entity.Property(e => e.ResolvedAt).HasColumnType("datetime");
            entity.Property(e => e.Severity).HasColumnType("enum('Low','Medium','High','Critical')");
            entity.Property(e => e.Status).HasColumnType("enum('Reported','UnderReview','Resolved','Escalated')");
            entity.Property(e => e.ViolationType).HasMaxLength(100);

            entity.HasOne(d => d.EmployeeUser).WithMany(p => p.PolicyviolationEmployeeUsers)
                .HasForeignKey(d => d.EmployeeUserId)
                .HasConstraintName("policyviolations_ibfk_1");

            entity.HasOne(d => d.EscalatedToUser).WithMany(p => p.PolicyviolationEscalatedToUsers)
                .HasForeignKey(d => d.EscalatedToUserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("policyviolations_ibfk_4");

            entity.HasOne(d => d.Policy).WithMany(p => p.Policyviolations)
                .HasForeignKey(d => d.PolicyId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("policyviolations_ibfk_2");

            entity.HasOne(d => d.ReportedByUser).WithMany(p => p.PolicyviolationReportedByUsers)
                .HasForeignKey(d => d.ReportedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("policyviolations_ibfk_3");
        });

        modelBuilder.Entity<Profilechangerequest>(entity =>
        {
            entity.HasKey(e => e.RequestId).HasName("PRIMARY");

            entity.ToTable("profilechangerequests");

            entity.HasIndex(e => e.ApprovedByUserId, "ApprovedByUserId");

            entity.HasIndex(e => e.Status, "idx_status");

            entity.HasIndex(e => e.UserId, "idx_user");

            entity.Property(e => e.AdminRemarks).HasMaxLength(500);
            entity.Property(e => e.NewEmail).HasMaxLength(255);
            entity.Property(e => e.NewEmployeeCompanyId).HasMaxLength(50);
            entity.Property(e => e.ProcessedAt).HasColumnType("datetime");
            entity.Property(e => e.Reason).HasMaxLength(1000);
            entity.Property(e => e.RequestedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.Status).HasColumnType("enum('Pending','Approved','Rejected')");

            entity.HasOne(d => d.ApprovedByUser).WithMany(p => p.ProfilechangerequestApprovedByUsers)
                .HasForeignKey(d => d.ApprovedByUserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("profilechangerequests_ibfk_2");

            entity.HasOne(d => d.User).WithMany(p => p.ProfilechangerequestUsers)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("profilechangerequests_ibfk_1");
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.ProjectId).HasName("PRIMARY");

            entity.ToTable("project");

            entity.HasIndex(e => e.L1approverEmployeeId, "L1ApproverEmployeeId");

            entity.HasIndex(e => e.L2approverEmployeeId, "L2ApproverEmployeeId");

            entity.HasIndex(e => e.ResourceOwnerEmployeeId, "ResourceOwnerEmployeeId");

            entity.HasIndex(e => e.ProjectName, "idx_project_name");

            entity.HasIndex(e => e.Status, "idx_status");

            entity.Property(e => e.BusinessUnit).HasMaxLength(100);
            entity.Property(e => e.ClientName).HasMaxLength(255);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.Department).HasMaxLength(100);
            entity.Property(e => e.Description).HasColumnType("text");
            entity.Property(e => e.EngagementModel).HasMaxLength(100);
            entity.Property(e => e.L1approverEmployeeId).HasColumnName("L1ApproverEmployeeId");
            entity.Property(e => e.L1approverId)
                .HasComment("Legacy L1 approver id")
                .HasColumnName("L1ApproverId");
            entity.Property(e => e.L2approverEmployeeId).HasColumnName("L2ApproverEmployeeId");
            entity.Property(e => e.L2approverId)
                .HasComment("Legacy L2 approver id")
                .HasColumnName("L2ApproverId");
            entity.Property(e => e.ResourceOwnerId).HasComment("Legacy owner id");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Active'");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");

            entity.HasOne(d => d.L1approverEmployee).WithMany(p => p.ProjectL1approverEmployees)
                .HasForeignKey(d => d.L1approverEmployeeId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("project_ibfk_2");

            entity.HasOne(d => d.L2approverEmployee).WithMany(p => p.ProjectL2approverEmployees)
                .HasForeignKey(d => d.L2approverEmployeeId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("project_ibfk_3");

            entity.HasOne(d => d.ResourceOwnerEmployee).WithMany(p => p.ProjectResourceOwnerEmployees)
                .HasForeignKey(d => d.ResourceOwnerEmployeeId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("project_ibfk_1");
        });

        modelBuilder.Entity<Projectemployee>(entity =>
        {
            entity.HasKey(e => new { e.ProjectId, e.EmployeeId })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.ToTable("projectemployees");

            entity.HasIndex(e => e.EmployeeId, "idx_employee");

            entity.HasIndex(e => e.ProjectId, "idx_project");

            entity.HasIndex(e => new { e.ProjectId, e.IsPrimary }, "idx_projectemployees_isPrimary");

            entity.Property(e => e.AssignedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.IsPrimary).HasColumnName("isPrimary");

            entity.HasOne(d => d.Employee).WithMany(p => p.Projectemployees)
                .HasForeignKey(d => d.EmployeeId)
                .HasConstraintName("projectemployees_ibfk_2");

            entity.HasOne(d => d.Project).WithMany(p => p.Projectemployees)
                .HasForeignKey(d => d.ProjectId)
                .HasConstraintName("projectemployees_ibfk_1");
        });

        modelBuilder.Entity<Promotion>(entity =>
        {
            entity.HasKey(e => e.PromotionId).HasName("PRIMARY");

            entity.ToTable("promotions");

            entity.HasIndex(e => e.ApprovedByUserId, "ApprovedByUserId");

            entity.HasIndex(e => e.DepartmentId, "DepartmentId");

            entity.HasIndex(e => e.EmployeeUserId, "idx_employee");

            entity.HasIndex(e => e.PromotionDate, "idx_promotion_date");

            entity.HasIndex(e => e.Status, "idx_status");

            entity.Property(e => e.ApprovedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.IncrementPercentage).HasPrecision(5, 2);
            entity.Property(e => e.Justification).HasColumnType("text");
            entity.Property(e => e.NewRole).HasMaxLength(100);
            entity.Property(e => e.NewSalary).HasPrecision(15, 2);
            entity.Property(e => e.OldRole).HasMaxLength(100);
            entity.Property(e => e.OldSalary).HasPrecision(15, 2);
            entity.Property(e => e.Status).HasColumnType("enum('Pending','Approved','Rejected')");

            entity.HasOne(d => d.ApprovedByUser).WithMany(p => p.PromotionApprovedByUsers)
                .HasForeignKey(d => d.ApprovedByUserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("promotions_ibfk_3");

            entity.HasOne(d => d.Department).WithMany(p => p.Promotions)
                .HasForeignKey(d => d.DepartmentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("promotions_ibfk_2");

            entity.HasOne(d => d.EmployeeUser).WithMany(p => p.PromotionEmployeeUsers)
                .HasForeignKey(d => d.EmployeeUserId)
                .HasConstraintName("promotions_ibfk_1");
        });

        modelBuilder.Entity<Promotionhistory>(entity =>
        {
            entity.HasKey(e => e.HistoryId).HasName("PRIMARY");

            entity.ToTable("promotionhistory");

            entity.HasIndex(e => e.PromotionId, "PromotionId");

            entity.HasIndex(e => e.EmployeeUserId, "idx_employee");

            entity.HasIndex(e => e.PromotionDate, "idx_promotion_date");

            entity.Property(e => e.FromRole).HasMaxLength(100);
            entity.Property(e => e.RecordedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.SalaryChange).HasPrecision(15, 2);
            entity.Property(e => e.ToRole).HasMaxLength(100);

            entity.HasOne(d => d.EmployeeUser).WithMany(p => p.Promotionhistories)
                .HasForeignKey(d => d.EmployeeUserId)
                .HasConstraintName("promotionhistory_ibfk_1");

            entity.HasOne(d => d.Promotion).WithMany(p => p.Promotionhistories)
                .HasForeignKey(d => d.PromotionId)
                .HasConstraintName("promotionhistory_ibfk_2");
        });

        modelBuilder.Entity<Refreshtoken>(entity =>
        {
            entity.HasKey(e => e.TokenId).HasName("PRIMARY");

            entity.ToTable("refreshtokens");

            entity.HasIndex(e => e.CreatedAt, "idx_created_at");

            entity.HasIndex(e => e.ExpiresAt, "idx_expires_at");

            entity.HasIndex(e => e.IsRevoked, "idx_is_revoked");

            entity.HasIndex(e => e.Token, "idx_token")
                .IsUnique()
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 255 });

            entity.HasIndex(e => e.UserId, "idx_user_id");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.ExpiresAt).HasColumnType("datetime");
            entity.Property(e => e.IpAddress).HasMaxLength(50);
            entity.Property(e => e.RevokedAt).HasColumnType("datetime");
            entity.Property(e => e.Token).HasMaxLength(500);

            entity.HasOne(d => d.User).WithMany(p => p.Refreshtokens)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("refreshtokens_ibfk_1");
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.ReviewId).HasName("PRIMARY");

            entity.ToTable("review");

            entity.HasIndex(e => e.GoalId, "idx_goal");

            entity.HasIndex(e => e.SubmittedBy, "idx_submitted_by");

            entity.Property(e => e.Comments).HasColumnType("text");
            entity.Property(e => e.GoalName)
                .HasMaxLength(200)
                .HasComment("Legacy free-text goal name");
            entity.Property(e => e.SubmittedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");

            entity.HasOne(d => d.Goal).WithMany(p => p.Reviews)
                .HasForeignKey(d => d.GoalId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("review_ibfk_1");

            entity.HasOne(d => d.SubmittedByNavigation).WithMany(p => p.Reviews)
                .HasForeignKey(d => d.SubmittedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("review_ibfk_2");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("PRIMARY");

            entity.ToTable("role");

            entity.HasIndex(e => e.RoleCode, "idx_role_code").IsUnique();

            entity.HasIndex(e => e.RoleName, "idx_role_name").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.Description).HasMaxLength(255);
            entity.Property(e => e.IsSystemRole)
                .HasDefaultValueSql("'0'")
                .HasComment("System-defined role (cannot be deleted)");
            entity.Property(e => e.RoleCode).HasMaxLength(20);
            entity.Property(e => e.RoleName).HasMaxLength(50);
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasColumnType("datetime");
        });

        modelBuilder.Entity<Selfassessment>(entity =>
        {
            entity.HasKey(e => e.AssessmentId).HasName("PRIMARY");

            entity.ToTable("selfassessment");

            entity.HasIndex(e => e.EmployeeId, "idx_employee");

            entity.HasIndex(e => e.FormId, "idx_form");

            entity.Property(e => e.AssessmentId).HasColumnName("assessment_id");
            entity.Property(e => e.EmployeeId).HasColumnName("employee_id");
            entity.Property(e => e.FormId).HasColumnName("form_id");
            entity.Property(e => e.Status)
                .HasColumnType("enum('Draft','Submitted')")
                .HasColumnName("status");
            entity.Property(e => e.SubmittedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("submitted_at");

            entity.HasOne(d => d.Employee).WithMany(p => p.Selfassessments)
                .HasForeignKey(d => d.EmployeeId)
                .HasConstraintName("selfassessment_ibfk_2");

            entity.HasOne(d => d.Form).WithMany(p => p.Selfassessments)
                .HasForeignKey(d => d.FormId)
                .HasConstraintName("selfassessment_ibfk_1");
        });

        modelBuilder.Entity<Sla>(entity =>
        {
            entity.HasKey(e => e.Slaid).HasName("PRIMARY");

            entity.ToTable("sla");

            entity.HasIndex(e => e.CreatedByEmployeeId, "CreatedByEmployeeId");

            entity.HasIndex(e => e.Slatype, "idx_sla_type");

            entity.HasIndex(e => e.Status, "idx_status");

            entity.Property(e => e.Slaid).HasColumnName("SLAId");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.CreatedBy).HasComment("Legacy creator id");
            entity.Property(e => e.Slatype)
                .HasMaxLength(100)
                .HasColumnName("SLAType");
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");

            entity.HasOne(d => d.CreatedByEmployee).WithMany(p => p.Slas)
                .HasForeignKey(d => d.CreatedByEmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("sla_ibfk_1");
        });

        modelBuilder.Entity<Slaescalation>(entity =>
        {
            entity.HasKey(e => e.EscalationId).HasName("PRIMARY");

            entity.ToTable("slaescalation");

            entity.HasIndex(e => e.SubmittedByEmployeeId, "SubmittedByEmployeeId");

            entity.HasIndex(e => e.Slaid, "idx_sla");

            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Reason).HasMaxLength(200);
            entity.Property(e => e.Slaid).HasColumnName("SLAId");
            entity.Property(e => e.SubmittedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.SubmittedBy).HasComment("Legacy submitter id");

            entity.HasOne(d => d.Sla).WithMany(p => p.Slaescalations)
                .HasForeignKey(d => d.Slaid)
                .HasConstraintName("slaescalation_ibfk_1");

            entity.HasOne(d => d.SubmittedByEmployee).WithMany(p => p.Slaescalations)
                .HasForeignKey(d => d.SubmittedByEmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("slaescalation_ibfk_2");
        });

        modelBuilder.Entity<Slahistory>(entity =>
        {
            entity.HasKey(e => e.SlahistoryId).HasName("PRIMARY");

            entity.ToTable("slahistory");

            entity.HasIndex(e => e.ChangedByEmployeeId, "ChangedByEmployeeId");

            entity.HasIndex(e => e.ReferenceEscalationId, "ReferenceEscalationId");

            entity.HasIndex(e => e.ChangeType, "idx_change_type");

            entity.HasIndex(e => e.Slaid, "idx_sla");

            entity.Property(e => e.SlahistoryId).HasColumnName("SLAHistoryId");
            entity.Property(e => e.ChangeType)
                .HasMaxLength(100)
                .HasComment("Created, Updated, StatusChanged, Escalated, Closed");
            entity.Property(e => e.ChangedFrom).HasMaxLength(1000);
            entity.Property(e => e.ChangedTo).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.Metadata)
                .HasComment("Browser, IP, request metadata")
                .HasColumnType("json");
            entity.Property(e => e.Reason).HasMaxLength(500);
            entity.Property(e => e.Slaid).HasColumnName("SLAId");

            entity.HasOne(d => d.ChangedByEmployee).WithMany(p => p.Slahistories)
                .HasForeignKey(d => d.ChangedByEmployeeId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("slahistory_ibfk_2");

            entity.HasOne(d => d.ReferenceEscalation).WithMany(p => p.Slahistories)
                .HasForeignKey(d => d.ReferenceEscalationId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("slahistory_ibfk_3");

            entity.HasOne(d => d.Sla).WithMany(p => p.Slahistories)
                .HasForeignKey(d => d.Slaid)
                .HasConstraintName("slahistory_ibfk_1");
        });

        modelBuilder.Entity<Teamworkload>(entity =>
        {
            entity.HasKey(e => e.WorkloadId).HasName("PRIMARY");

            entity.ToTable("teamworkload");

            entity.HasIndex(e => e.ManagerUserId, "idx_manager");

            entity.HasIndex(e => e.Status, "idx_status");

            entity.Property(e => e.AvgWorkload).HasPrecision(5, 2);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.Status).HasColumnType("enum('Balanced','Overloaded','Underutilized')");
            entity.Property(e => e.TeamId).HasComment("Reference to Teams table (create if needed)");
            entity.Property(e => e.WorkloadVariance).HasPrecision(5, 2);

            entity.HasOne(d => d.ManagerUser).WithMany(p => p.Teamworkloads)
                .HasForeignKey(d => d.ManagerUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("teamworkload_ibfk_1");
        });

        modelBuilder.Entity<Userauthentication>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PRIMARY");

            entity.ToTable("userauthentication");

            entity.HasIndex(e => e.Email, "Email").IsUnique();

            entity.HasIndex(e => e.EmployeeId, "EmployeeId").IsUnique();

            entity.HasIndex(e => e.Status, "idx_status");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.IsFirstLogin).HasDefaultValueSql("'1'");
            entity.Property(e => e.LastLoginAt).HasColumnType("datetime");
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(500)
                .HasComment("Hashed password (bcrypt/Argon2)");
            entity.Property(e => e.Status).HasColumnType("enum('Active','Inactive','Locked')");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasColumnType("datetime");

            entity.HasOne(d => d.Employee).WithOne(p => p.Userauthentication)
                .HasForeignKey<Userauthentication>(d => d.EmployeeId)
                .HasConstraintName("userauthentication_ibfk_1");
        });

        modelBuilder.Entity<Userprofile>(entity =>
        {
            entity.HasKey(e => e.ProfileId).HasName("PRIMARY");

            entity.ToTable("userprofile");

            entity.HasIndex(e => e.EmployeeId, "EmployeeId").IsUnique();

            entity.HasIndex(e => new { e.FirstName, e.LastName }, "idx_full_name");

            entity.Property(e => e.AlternateNumber).HasMaxLength(20);
            entity.Property(e => e.CallingName)
                .HasMaxLength(100)
                .HasComment("Preferred/nick name");
            entity.Property(e => e.FirstName).HasMaxLength(100);
            entity.Property(e => e.Gender).HasColumnType("enum('Male','Female','Other','PreferNotToSay')");
            entity.Property(e => e.LastName).HasMaxLength(100);
            entity.Property(e => e.MaritalStatus).HasMaxLength(50);
            entity.Property(e => e.MiddleName).HasMaxLength(100);
            entity.Property(e => e.MobileNumber).HasMaxLength(20);
            entity.Property(e => e.Nationality).HasMaxLength(100);
            entity.Property(e => e.PersonalEmail).HasMaxLength(255);
            entity.Property(e => e.ReferredBy).HasMaxLength(100);

            entity.HasOne(d => d.Employee).WithOne(p => p.Userprofile)
                .HasForeignKey<Userprofile>(d => d.EmployeeId)
                .HasConstraintName("userprofile_ibfk_1");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
