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

    public virtual DbSet<Budgetperiodallocation> Budgetperiodallocations { get; set; }

    public virtual DbSet<Bulkoperationlog> Bulkoperationlogs { get; set; }

    public virtual DbSet<Changerequest> Changerequests { get; set; }

    public virtual DbSet<Competency> Competencies { get; set; }

    public virtual DbSet<Department> Departments { get; set; }

    public virtual DbSet<Departmentbudget> Departmentbudgets { get; set; }

    public virtual DbSet<Departmentheadapproval> Departmentheadapprovals { get; set; }

    public virtual DbSet<Employee> Employees { get; set; }

    public virtual DbSet<Employeedetailsmaster> Employeedetailsmasters { get; set; }

    public virtual DbSet<Engagement> Engagements { get; set; }

    public virtual DbSet<Feedback> Feedbacks { get; set; }

    public virtual DbSet<Feedbackedithistory> Feedbackedithistories { get; set; }

    public virtual DbSet<Feedbackquestion> Feedbackquestions { get; set; }

    public virtual DbSet<Feedbackquestionresponse> Feedbackquestionresponses { get; set; }

    public virtual DbSet<Formprogresstracker> Formprogresstrackers { get; set; }

    public virtual DbSet<Goal> Goals { get; set; }

    public virtual DbSet<GoalApproval> GoalApprovals { get; set; }

    public virtual DbSet<GoalAssignment> GoalAssignments { get; set; }

    public virtual DbSet<GoalAttachment> GoalAttachments { get; set; }

    public virtual DbSet<GoalChecklist> GoalChecklists { get; set; }

    public virtual DbSet<GoalComment> GoalComments { get; set; }

    public virtual DbSet<Goalchecklistprogress> Goalchecklistprogresses { get; set; }

    public virtual DbSet<Goalprogresslog> Goalprogresslogs { get; set; }

    public virtual DbSet<Hrfeedbackform> Hrfeedbackforms { get; set; }

    public virtual DbSet<Hrfeedbackformresponse> Hrfeedbackformresponses { get; set; }

    public virtual DbSet<Internalopportunity> Internalopportunities { get; set; }

    public virtual DbSet<Leadershipauditlog> Leadershipauditlogs { get; set; }

    public virtual DbSet<Lndapproval> Lndapprovals { get; set; }

    public virtual DbSet<Lndassignment> Lndassignments { get; set; }

    public virtual DbSet<Lndattachment> Lndattachments { get; set; }

    public virtual DbSet<Lndemployeeskillmapper> Lndemployeeskillmappers { get; set; }

    public virtual DbSet<Lndsme> Lndsmes { get; set; }

    public virtual DbSet<Loginattempt> Loginattempts { get; set; }

    public virtual DbSet<Managernominationtracking> Managernominationtrackings { get; set; }

    public virtual DbSet<Managerreviewcomment> Managerreviewcomments { get; set; }

    public virtual DbSet<MasterSkill> MasterSkills { get; set; }

    public virtual DbSet<Meetingmom> Meetingmoms { get; set; }

    public virtual DbSet<Mentorfeedback> Mentorfeedbacks { get; set; }

    public virtual DbSet<Mentorfeedbacktracking> Mentorfeedbacktrackings { get; set; }

    public virtual DbSet<Nomination> Nominations { get; set; }

    public virtual DbSet<Nominationparameter> Nominationparameters { get; set; }

    public virtual DbSet<Nominationparametervalue> Nominationparametervalues { get; set; }

    public virtual DbSet<Nominationreviewmetric> Nominationreviewmetrics { get; set; }

    public virtual DbSet<Nominationvisibilitytracking> Nominationvisibilitytrackings { get; set; }

    public virtual DbSet<Oneononediscussion> Oneononediscussions { get; set; }

    public virtual DbSet<Organizationalpolicy> Organizationalpolicies { get; set; }

    public virtual DbSet<Organizationgoalfeedback> Organizationgoalfeedbacks { get; set; }

    public virtual DbSet<Organizationwideobjective> Organizationwideobjectives { get; set; }

    public virtual DbSet<Otp> Otps { get; set; }

    public virtual DbSet<Payroll> Payrolls { get; set; }

    public virtual DbSet<Peerfeedback> Peerfeedbacks { get; set; }

    public virtual DbSet<Peerfeedbackqueue> Peerfeedbackqueues { get; set; }

    public virtual DbSet<Policyviolation> Policyviolations { get; set; }

    public virtual DbSet<Profilechangerequest> Profilechangerequests { get; set; }

    public virtual DbSet<Project> Projects { get; set; }

    public virtual DbSet<Projectemployee> Projectemployees { get; set; }

    public virtual DbSet<Projectgoalfeedback> Projectgoalfeedbacks { get; set; }

    public virtual DbSet<Promotion> Promotions { get; set; }

    public virtual DbSet<Promotionhistory> Promotionhistories { get; set; }

    public virtual DbSet<Recognitiondetail> Recognitiondetails { get; set; }

    public virtual DbSet<Recognitionreward> Recognitionrewards { get; set; }

    public virtual DbSet<Recognitionstatus> Recognitionstatuses { get; set; }

    public virtual DbSet<Refreshtoken> Refreshtokens { get; set; }

    public virtual DbSet<Report> Reports { get; set; }

    public virtual DbSet<Review> Reviews { get; set; }

    public virtual DbSet<Rewardtype> Rewardtypes { get; set; }

    public virtual DbSet<Risk> Risks { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<Selfassessment> Selfassessments { get; set; }

    public virtual DbSet<Sla> Slas { get; set; }

    public virtual DbSet<Slacompliance> Slacompliances { get; set; }

    public virtual DbSet<Slaescalation> Slaescalations { get; set; }

    public virtual DbSet<Slahistory> Slahistories { get; set; }

    public virtual DbSet<Slanotification> Slanotifications { get; set; }

    public virtual DbSet<Slareviewtracking> Slareviewtrackings { get; set; }

    public virtual DbSet<Teamworkload> Teamworkloads { get; set; }

    public virtual DbSet<Userauthentication> Userauthentications { get; set; }

    public virtual DbSet<Userprofile> Userprofiles { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseMySql("server=localhost;database=eepzdb;uid=root;pwd=root", Microsoft.EntityFrameworkCore.ServerVersion.Parse("8.0.43-mysql"));

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

            entity.Property(e => e.AddressType).HasMaxLength(50);
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
            entity.Property(e => e.EmployeeRating).HasColumnName("employee_rating");

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
            entity.Property(e => e.Deadline)
                .HasColumnType("datetime")
                .HasColumnName("deadline");
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

            entity.ToTable("budgetallocations", tb => tb.HasComment("HR sub-allocations from department budgets"));

            entity.HasIndex(e => e.AllocatedByUserId, "AllocatedByUserId");

            entity.HasIndex(e => e.EmployeeUserId, "EmployeeUserId");

            entity.HasIndex(e => e.AllocationType, "idx_allocation_type");

            entity.HasIndex(e => e.BudgetId, "idx_budget");

            entity.HasIndex(e => e.DepartmentId, "idx_department");

            entity.Property(e => e.AllocatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.AllocationType).HasColumnType("enum('Bonus','Promotion','Training','Other')");
            entity.Property(e => e.Amount).HasPrecision(15, 2);
            entity.Property(e => e.GoalStatus).HasMaxLength(100);
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.Period)
                .HasMaxLength(10)
                .HasComment("Q1, Q2, Q3, Q4");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.UtilizationPercentage)
                .HasPrecision(5, 2)
                .HasDefaultValueSql("'0.00'");
            entity.Property(e => e.UtilizedAmount)
                .HasPrecision(15, 2)
                .HasDefaultValueSql("'0.00'");

            entity.HasOne(d => d.AllocatedByUser).WithMany(p => p.BudgetallocationAllocatedByUsers)
                .HasForeignKey(d => d.AllocatedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("budgetallocations_ibfk_3");

            entity.HasOne(d => d.Budget).WithMany(p => p.Budgetallocations)
                .HasForeignKey(d => d.BudgetId)
                .HasConstraintName("budgetallocations_ibfk_4");

            entity.HasOne(d => d.Department).WithMany(p => p.Budgetallocations)
                .HasForeignKey(d => d.DepartmentId)
                .HasConstraintName("budgetallocations_ibfk_1");

            entity.HasOne(d => d.EmployeeUser).WithMany(p => p.BudgetallocationEmployeeUsers)
                .HasForeignKey(d => d.EmployeeUserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("budgetallocations_ibfk_2");
        });

        modelBuilder.Entity<Budgetperiodallocation>(entity =>
        {
            entity.HasKey(e => e.PeriodAllocationId).HasName("PRIMARY");

            entity.ToTable("budgetperiodallocations", tb => tb.HasComment("Leadership period-based budget allocations (e.g., 10L in Q1, 20L in Q2)"));

            entity.HasIndex(e => e.AllocatedByUserId, "idx_allocated_by");

            entity.HasIndex(e => e.BudgetId, "idx_budget");

            entity.HasIndex(e => new { e.BudgetId, e.Period, e.PeriodYear }, "idx_budget_period_year").IsUnique();

            entity.Property(e => e.AllocatedAmount).HasPrecision(15, 2);
            entity.Property(e => e.AllocatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.Period)
                .HasMaxLength(10)
                .HasComment("Q1, Q2, Q3, Q4, H1, H2");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasColumnType("datetime");
            entity.Property(e => e.UtilizationPercentage).HasPrecision(5, 2);
            entity.Property(e => e.UtilizedAmount).HasPrecision(15, 2);

            entity.HasOne(d => d.AllocatedByUser).WithMany(p => p.Budgetperiodallocations)
                .HasForeignKey(d => d.AllocatedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_period_allocated_by");

            entity.HasOne(d => d.Budget).WithMany(p => p.Budgetperiodallocations)
                .HasForeignKey(d => d.BudgetId)
                .HasConstraintName("fk_period_budget");
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
            entity.Property(e => e.CostCenter).HasMaxLength(50);
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

        modelBuilder.Entity<Departmentheadapproval>(entity =>
        {
            entity.HasKey(e => e.ApprovalId).HasName("PRIMARY");

            entity.ToTable("departmentheadapprovals");

            entity.HasIndex(e => e.ApprovedBy, "ApprovedBy");

            entity.HasIndex(e => e.AssessmentId, "AssessmentId");

            entity.HasIndex(e => e.ProjectId, "ProjectId");

            entity.HasIndex(e => e.AcknowledgedByEmployee, "idx_acknowledged");

            entity.HasIndex(e => e.ApprovedAt, "idx_approved_at");

            entity.HasIndex(e => e.EmployeeId, "idx_employee");

            entity.Property(e => e.AcknowledgedAt).HasColumnType("datetime");
            entity.Property(e => e.ApprovedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.EmployeeComments).HasColumnType("text");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValueSql("'Approved'");

            entity.HasOne(d => d.ApprovedByNavigation).WithMany(p => p.Departmentheadapprovals)
                .HasForeignKey(d => d.ApprovedBy)
                .HasConstraintName("departmentheadapprovals_ibfk_4");

            entity.HasOne(d => d.Assessment).WithMany(p => p.Departmentheadapprovals)
                .HasForeignKey(d => d.AssessmentId)
                .HasConstraintName("departmentheadapprovals_ibfk_3");

            entity.HasOne(d => d.Employee).WithMany(p => p.Departmentheadapprovals)
                .HasForeignKey(d => d.EmployeeId)
                .HasConstraintName("departmentheadapprovals_ibfk_1");

            entity.HasOne(d => d.Project).WithMany(p => p.Departmentheadapprovals)
                .HasForeignKey(d => d.ProjectId)
                .HasConstraintName("departmentheadapprovals_ibfk_2");
        });

        modelBuilder.Entity<Employee>(entity =>
        {
            entity.HasKey(e => e.EmployeeId).HasName("PRIMARY");

            entity.ToTable("employee");

            entity.HasIndex(e => e.EmployeeCompanyId, "EmployeeCompanyId").IsUnique();

            entity.HasIndex(e => e.ReportingManagerEmployeeId, "ReportingManagerEmployeeId");

            entity.HasIndex(e => e.EmploymentStatus, "idx_employment_status");

            entity.HasIndex(e => e.IsActive, "idx_is_active");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.EmployeeCompanyId).HasMaxLength(50);
            entity.Property(e => e.EmployeeType).HasColumnType("enum('FullTime','PartTime')");
            entity.Property(e => e.EmploymentStatus).HasColumnType("enum('Active','Inactive','Terminated','Resigned','Retired')");
            entity.Property(e => e.EmploymentType).HasColumnType("enum('Permanent','Contract','Temporary','Intern','Probation')");
            entity.Property(e => e.IsActive)
                .IsRequired()
                .HasDefaultValueSql("'1'");
            entity.Property(e => e.NoticePeriodDays).HasDefaultValueSql("'30'");
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

        modelBuilder.Entity<Engagement>(entity =>
        {
            entity.HasKey(e => e.EngagementId).HasName("PRIMARY");

            entity.ToTable("engagement");

            entity.HasIndex(e => e.DepartmentId, "idx_department");

            entity.Property(e => e.EngagementId).HasColumnName("engagement_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.DepartmentId).HasColumnName("department_id");
            entity.Property(e => e.EngagementScore)
                .HasPrecision(5, 2)
                .HasColumnName("engagement_score");
            entity.Property(e => e.PeriodEnd)
                .HasColumnType("datetime")
                .HasColumnName("period_end");
            entity.Property(e => e.PeriodStart)
                .HasColumnType("datetime")
                .HasColumnName("period_start");
            entity.Property(e => e.TrendScore)
                .HasPrecision(5, 2)
                .HasColumnName("trend_score");

            entity.HasOne(d => d.Department).WithMany(p => p.Engagements)
                .HasForeignKey(d => d.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("engagement_ibfk_1");
        });

        modelBuilder.Entity<Feedback>(entity =>
        {
            entity.HasKey(e => e.FeedbackId).HasName("PRIMARY");

            entity.ToTable("feedback");

            entity.HasIndex(e => e.RelatedGoalId, "FK_Feedback_Goal");

            entity.HasIndex(e => e.RelatedMentorId, "FK_Feedback_Mentor");

            entity.HasIndex(e => e.RelatedProjectId, "FK_Feedback_Project");

            entity.HasIndex(e => e.ReviewedByHrid, "FK_Feedback_ReviewedBy");

            entity.HasIndex(e => e.IsAnonymous, "idx_anonymous");

            entity.HasIndex(e => e.BiasFlag, "idx_bias_flag");

            entity.HasIndex(e => e.CreatedAt, "idx_created_at");

            entity.HasIndex(e => e.FairnessFlag, "idx_fairness_flag");

            entity.HasIndex(e => e.FeedbackType, "idx_feedback_type");

            entity.HasIndex(e => e.Rating, "idx_rating");

            entity.HasIndex(e => e.RecipientEmployeeId, "idx_recipient");

            entity.HasIndex(e => e.Status, "idx_status");

            entity.HasIndex(e => e.SubmittedAt, "idx_submitted_at");

            entity.HasIndex(e => e.SubmittedByEmployeeId, "idx_submitted_by");

            entity.Property(e => e.Comments).HasColumnType("text");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.FeedbackType).HasColumnType("enum('GoalBased','ProjectBased','PeerFeedback','MentorFeedback','HRForm','OrganizationalGoal','BiasReview')");
            entity.Property(e => e.HrreviewComments)
                .HasColumnType("text")
                .HasColumnName("HRReviewComments");
            entity.Property(e => e.ReviewedByHrid).HasColumnName("ReviewedByHRId");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'Draft'")
                .HasColumnType("enum('Draft','Submitted','UnderHRReview','Reviewed','Archived')");
            entity.Property(e => e.SubmittedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasColumnType("datetime");

            entity.HasOne(d => d.RecipientEmployee).WithMany(p => p.FeedbackRecipientEmployees)
                .HasForeignKey(d => d.RecipientEmployeeId)
                .HasConstraintName("FK_Feedback_Recipient");

            entity.HasOne(d => d.RelatedGoal).WithMany(p => p.Feedbacks)
                .HasForeignKey(d => d.RelatedGoalId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_Feedback_Goal");

            entity.HasOne(d => d.RelatedMentor).WithMany(p => p.FeedbackRelatedMentors)
                .HasForeignKey(d => d.RelatedMentorId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_Feedback_Mentor");

            entity.HasOne(d => d.RelatedProject).WithMany(p => p.Feedbacks)
                .HasForeignKey(d => d.RelatedProjectId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_Feedback_Project");

            entity.HasOne(d => d.ReviewedByHr).WithMany(p => p.Feedbacks)
                .HasForeignKey(d => d.ReviewedByHrid)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_Feedback_ReviewedBy");

            entity.HasOne(d => d.SubmittedByEmployee).WithMany(p => p.FeedbackSubmittedByEmployees)
                .HasForeignKey(d => d.SubmittedByEmployeeId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_Feedback_SubmittedBy");
        });

        modelBuilder.Entity<Feedbackedithistory>(entity =>
        {
            entity.HasKey(e => e.HistoryId).HasName("PRIMARY");

            entity.ToTable("feedbackedithistory");

            entity.HasIndex(e => e.EditedAt, "idx_edited_at");

            entity.HasIndex(e => e.EditedByEmployeeId, "idx_edited_by");

            entity.HasIndex(e => e.FeedbackId, "idx_feedback");

            entity.Property(e => e.ChangeReason).HasMaxLength(500);
            entity.Property(e => e.EditedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.OriginalContent).HasColumnType("text");
            entity.Property(e => e.UpdatedContent).HasColumnType("text");

            entity.HasOne(d => d.EditedByEmployee).WithMany(p => p.Feedbackedithistories)
                .HasForeignKey(d => d.EditedByEmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_EditHistory_EditedBy");

            entity.HasOne(d => d.Feedback).WithMany(p => p.Feedbackedithistories)
                .HasForeignKey(d => d.FeedbackId)
                .HasConstraintName("FK_EditHistory_Feedback");
        });

        modelBuilder.Entity<Feedbackquestion>(entity =>
        {
            entity.HasKey(e => e.QuestionId).HasName("PRIMARY");

            entity.ToTable("feedbackquestion");

            entity.HasIndex(e => e.FeedbackType, "idx_feedback_type");

            entity.HasIndex(e => e.IsActive, "idx_is_active");

            entity.HasIndex(e => e.QuestionCode, "uniq_question_code").IsUnique();

            entity.Property(e => e.ChoiceOptions).HasColumnType("json");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.FeedbackType).HasColumnType("enum('GoalBased','ProjectBased','PeerFeedback','MentorFeedback','HRForm','OrganizationalGoal','BiasReview')");
            entity.Property(e => e.IsActive)
                .IsRequired()
                .HasDefaultValueSql("'1'");
            entity.Property(e => e.IsRequired)
                .IsRequired()
                .HasDefaultValueSql("'1'");
            entity.Property(e => e.QuestionCode).HasMaxLength(100);
            entity.Property(e => e.QuestionDescription).HasColumnType("text");
            entity.Property(e => e.QuestionText).HasColumnType("text");
            entity.Property(e => e.RatingScaleLabels).HasColumnType("json");
            entity.Property(e => e.RatingScaleMax).HasDefaultValueSql("'5'");
            entity.Property(e => e.RatingScaleMin).HasDefaultValueSql("'1'");
            entity.Property(e => e.ResponseType).HasColumnType("enum('Rating','Boolean','Text','MultipleChoice','Checkbox')");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasColumnType("datetime");
        });

        modelBuilder.Entity<Feedbackquestionresponse>(entity =>
        {
            entity.HasKey(e => e.ResponseId).HasName("PRIMARY");

            entity.ToTable("feedbackquestionresponse");

            entity.HasIndex(e => e.FeedbackId, "idx_feedback");

            entity.HasIndex(e => e.QuestionId, "idx_question");

            entity.HasIndex(e => new { e.FeedbackId, e.QuestionId }, "uniq_feedback_question").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.SelectedOptions).HasColumnType("json");
            entity.Property(e => e.TextValue).HasColumnType("text");

            entity.HasOne(d => d.Feedback).WithMany(p => p.Feedbackquestionresponses)
                .HasForeignKey(d => d.FeedbackId)
                .HasConstraintName("FK_Response_Feedback");

            entity.HasOne(d => d.Question).WithMany(p => p.Feedbackquestionresponses)
                .HasForeignKey(d => d.QuestionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Response_Question");
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

            entity.HasIndex(e => e.ClosedBy, "idx_closed_by");

            entity.HasIndex(e => e.CreatedBy, "idx_created_by");

            entity.HasIndex(e => e.Goalstatus, "idx_goal_status");

            entity.HasIndex(e => e.ProjectId, "project_id");

            entity.HasIndex(e => e.ReopenedBy, "reopened_by");

            entity.Property(e => e.GoalId).HasColumnName("goal_id");
            entity.Property(e => e.ClosedBy).HasColumnName("closed_by");
            entity.Property(e => e.ClosedOn)
                .HasColumnType("timestamp")
                .HasColumnName("closed_on");
            entity.Property(e => e.ClosureReason)
                .HasColumnType("text")
                .HasColumnName("closure_reason");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
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

            entity.HasOne(d => d.ClosedByNavigation).WithMany(p => p.GoalClosedByNavigations)
                .HasForeignKey(d => d.ClosedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("goals_ibfk_4");

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
                .HasColumnType("enum('creation','completion','reopening','delegation','selfgoalactivation','task_acknowledgment','closure','reactivation')")
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

            entity.HasIndex(e => e.AcknowledgedBy, "acknowledged_by");

            entity.HasIndex(e => e.AssignedBy, "assigned_by");

            entity.HasIndex(e => e.IsAcknowledged, "idx_acknowledged");

            entity.HasIndex(e => e.AssignedTo, "idx_assigned_to");

            entity.HasIndex(e => e.GoalId, "idx_goal");

            entity.Property(e => e.AssignmentId).HasColumnName("assignment_id");
            entity.Property(e => e.AcknowledgedBy).HasColumnName("acknowledged_by");
            entity.Property(e => e.AcknowledgedOn)
                .HasColumnType("timestamp")
                .HasColumnName("acknowledged_on");
            entity.Property(e => e.AssignedBy).HasColumnName("assigned_by");
            entity.Property(e => e.AssignedOn)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("assigned_on");
            entity.Property(e => e.AssignedTo).HasColumnName("assigned_to");
            entity.Property(e => e.GoalId).HasColumnName("goal_id");
            entity.Property(e => e.IsAcknowledged)
                .HasDefaultValueSql("'0'")
                .HasColumnName("is_acknowledged");

            entity.HasOne(d => d.AcknowledgedByNavigation).WithMany(p => p.GoalAssignmentAcknowledgedByNavigations)
                .HasForeignKey(d => d.AcknowledgedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("goal_assignment_ibfk_4");

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

            entity.HasIndex(e => e.LinkedApprovalId, "idx_linked_approval");

            entity.HasIndex(e => e.IsProofOfCompletion, "idx_proof");

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
                .HasColumnName("attachments");
            entity.Property(e => e.GoalId).HasColumnName("goal_id");
            entity.Property(e => e.IsProofOfCompletion)
                .HasDefaultValueSql("'0'")
                .HasColumnName("is_proof_of_completion");
            entity.Property(e => e.LinkedApprovalId).HasColumnName("linked_approval_id");

            entity.HasOne(d => d.AttachedByNavigation).WithMany(p => p.GoalAttachments)
                .HasForeignKey(d => d.AttachedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("goal_attachments_ibfk_2");

            entity.HasOne(d => d.Goal).WithMany(p => p.GoalAttachments)
                .HasForeignKey(d => d.GoalId)
                .HasConstraintName("goal_attachments_ibfk_1");

            entity.HasOne(d => d.LinkedApproval).WithMany(p => p.GoalAttachments)
                .HasForeignKey(d => d.LinkedApprovalId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("goal_attachments_ibfk_3");
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

        modelBuilder.Entity<Hrfeedbackform>(entity =>
        {
            entity.HasKey(e => e.FormId).HasName("PRIMARY");

            entity.ToTable("hrfeedbackforms");

            entity.HasIndex(e => e.CreatedByHrid, "idx_created_by");

            entity.HasIndex(e => e.FormType, "idx_form_type");

            entity.HasIndex(e => e.Status, "idx_status");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.CreatedByHrid).HasColumnName("CreatedByHRId");
            entity.Property(e => e.Deadline).HasColumnType("datetime");
            entity.Property(e => e.DistributedToEmployeeIds).HasColumnType("json");
            entity.Property(e => e.FormDescription).HasColumnType("text");
            entity.Property(e => e.FormName).HasMaxLength(200);
            entity.Property(e => e.FormType).HasColumnType("enum('GeneralFeedback','BiasReview','ProfessionalismReview','PerformanceReview')");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'Draft'")
                .HasColumnType("enum('Active','Closed','Draft')");

            entity.HasOne(d => d.CreatedByHr).WithMany(p => p.Hrfeedbackforms)
                .HasForeignKey(d => d.CreatedByHrid)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_HRForm_CreatedBy");
        });

        modelBuilder.Entity<Hrfeedbackformresponse>(entity =>
        {
            entity.HasKey(e => e.ResponseId).HasName("PRIMARY");

            entity.ToTable("hrfeedbackformresponses");

            entity.HasIndex(e => e.ReviewedByHrid, "FK_FormResponse_ReviewedBy");

            entity.HasIndex(e => e.FormId, "idx_form");

            entity.HasIndex(e => e.Status, "idx_status");

            entity.HasIndex(e => e.SubmittedByEmployeeId, "idx_submitted_by");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.FormResponse).HasColumnType("json");
            entity.Property(e => e.HrreviewComments)
                .HasColumnType("text")
                .HasColumnName("HRReviewComments");
            entity.Property(e => e.ReviewedAt).HasColumnType("datetime");
            entity.Property(e => e.ReviewedByHrid).HasColumnName("ReviewedByHRId");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'Draft'")
                .HasColumnType("enum('Draft','Submitted','Reviewed')");
            entity.Property(e => e.SubmittedAt).HasColumnType("datetime");

            entity.HasOne(d => d.Form).WithMany(p => p.Hrfeedbackformresponses)
                .HasForeignKey(d => d.FormId)
                .HasConstraintName("FK_FormResponse_Form");

            entity.HasOne(d => d.ReviewedByHr).WithMany(p => p.Hrfeedbackformresponses)
                .HasForeignKey(d => d.ReviewedByHrid)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_FormResponse_ReviewedBy");

            entity.HasOne(d => d.SubmittedByEmployee).WithMany(p => p.Hrfeedbackformresponses)
                .HasForeignKey(d => d.SubmittedByEmployeeId)
                .HasConstraintName("FK_FormResponse_SubmittedBy");
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

        modelBuilder.Entity<Leadershipauditlog>(entity =>
        {
            entity.HasKey(e => e.LogId).HasName("PRIMARY");

            entity.ToTable("leadershipauditlog");

            entity.HasIndex(e => e.Timestamp, "idx_timestamp");

            entity.HasIndex(e => e.UserId, "idx_user");

            entity.Property(e => e.LogId).HasColumnName("log_id");
            entity.Property(e => e.Action)
                .HasMaxLength(200)
                .HasColumnName("action");
            entity.Property(e => e.Status)
                .HasColumnType("enum('Success','Failure')")
                .HasColumnName("status");
            entity.Property(e => e.TargetId).HasColumnName("target_id");
            entity.Property(e => e.TargetTable)
                .HasMaxLength(100)
                .HasColumnName("target_table");
            entity.Property(e => e.Timestamp)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("timestamp");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.Leadershipauditlogs)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("leadershipauditlog_ibfk_1");
        });

        modelBuilder.Entity<Lndapproval>(entity =>
        {
            entity.HasKey(e => e.ApprovalId).HasName("PRIMARY");

            entity
                .ToTable("lndapprovals")
                .UseCollation("utf8mb4_0900_ai_ci");

            entity.HasIndex(e => e.ApproverEmployeeId, "FK_LndApprovals_Approver");

            entity.HasIndex(e => e.AttachmentId, "FK_LndApprovals_Attachment");

            entity.HasIndex(e => e.RequesterEmployeeId, "FK_LndApprovals_Requester");

            entity.HasIndex(e => e.SkillId, "FK_LndApprovals_Skill");

            entity.HasIndex(e => e.AssignmentId, "IX_LndApprovals_AssignmentId");

            entity.HasIndex(e => new { e.ApprovalType, e.Status }, "IX_LndApprovals_Type_Status");

            entity.Property(e => e.ApprovalType).HasMaxLength(50);
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'PENDING'");

            entity.HasOne(d => d.ApproverEmployee).WithMany(p => p.LndapprovalApproverEmployees)
                .HasForeignKey(d => d.ApproverEmployeeId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_LndApprovals_Approver");

            entity.HasOne(d => d.Assignment).WithMany(p => p.Lndapprovals)
                .HasForeignKey(d => d.AssignmentId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_LndApprovals_Assignment");

            entity.HasOne(d => d.Attachment).WithMany(p => p.Lndapprovals)
                .HasForeignKey(d => d.AttachmentId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_LndApprovals_Attachment");

            entity.HasOne(d => d.RequesterEmployee).WithMany(p => p.LndapprovalRequesterEmployees)
                .HasForeignKey(d => d.RequesterEmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LndApprovals_Requester");

            entity.HasOne(d => d.Skill).WithMany(p => p.Lndapprovals)
                .HasForeignKey(d => d.SkillId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_LndApprovals_Skill");
        });

        modelBuilder.Entity<Lndassignment>(entity =>
        {
            entity.HasKey(e => e.AssignmentId).HasName("PRIMARY");

            entity
                .ToTable("lndassignments")
                .UseCollation("utf8mb4_0900_ai_ci");

            entity.HasIndex(e => e.CreatedByEmployeeId, "FK_LnDAssignments_CreatedBy");

            entity.HasIndex(e => e.SkillId, "FK_LnDAssignments_Skill");

            entity.HasIndex(e => e.UpdatedByEmployeeId, "FK_LnDAssignments_UpdatedBy");

            entity.HasIndex(e => new { e.MenteeEmployeeId, e.Status }, "IX_LnDAssignments_Mentee_Status");

            entity.HasIndex(e => new { e.SmeId, e.Status }, "IX_LnDAssignments_Sme_Status");

            entity.HasIndex(e => e.ProofFilePath, "IX_LndAssignments_ProofFilePath");

            entity.HasIndex(e => new { e.Status, e.Deadline }, "IX_LndAssignments_Status_Deadline");

            entity.Property(e => e.CompletionNotes).HasMaxLength(1000);
            entity.Property(e => e.Deadline).HasColumnType("datetime");
            entity.Property(e => e.ProofFilePath).HasMaxLength(500);
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'IN_PROGRESS'");

            entity.HasOne(d => d.CreatedByEmployee).WithMany(p => p.LndassignmentCreatedByEmployees)
                .HasForeignKey(d => d.CreatedByEmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LnDAssignments_CreatedBy");

            entity.HasOne(d => d.MenteeEmployee).WithMany(p => p.LndassignmentMenteeEmployees)
                .HasForeignKey(d => d.MenteeEmployeeId)
                .HasConstraintName("FK_LnDAssignments_Mentee");

            entity.HasOne(d => d.Skill).WithMany(p => p.Lndassignments)
                .HasForeignKey(d => d.SkillId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LnDAssignments_Skill");

            entity.HasOne(d => d.Sme).WithMany(p => p.Lndassignments)
                .HasForeignKey(d => d.SmeId)
                .HasConstraintName("FK_LnDAssignments_Sme");

            entity.HasOne(d => d.UpdatedByEmployee).WithMany(p => p.LndassignmentUpdatedByEmployees)
                .HasForeignKey(d => d.UpdatedByEmployeeId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_LnDAssignments_UpdatedBy");
        });

        modelBuilder.Entity<Lndattachment>(entity =>
        {
            entity.HasKey(e => e.AttachmentId).HasName("PRIMARY");

            entity
                .ToTable("lndattachments")
                .UseCollation("utf8mb4_0900_ai_ci");

            entity.HasIndex(e => new { e.CreatedByEmployeeId, e.AttachmentType }, "IX_LnDAttachments_CreatedBy_Type");

            entity.Property(e => e.AttachmentType).HasMaxLength(50);
            entity.Property(e => e.FileName).HasMaxLength(255);
            entity.Property(e => e.FilePath).HasMaxLength(500);

            entity.HasOne(d => d.CreatedByEmployee).WithMany(p => p.Lndattachments)
                .HasForeignKey(d => d.CreatedByEmployeeId)
                .HasConstraintName("FK_LnDAttachments_CreatedBy");
        });

        modelBuilder.Entity<Lndemployeeskillmapper>(entity =>
        {
            entity.HasKey(e => e.MapperId).HasName("PRIMARY");

            entity
                .ToTable("lndemployeeskillmapper")
                .UseCollation("utf8mb4_0900_ai_ci");

            entity.HasIndex(e => e.CreatedByEmployeeId, "FK_EmployeeSkillMapper_CreatedBy");

            entity.HasIndex(e => e.SkillId, "FK_EmployeeSkillMapper_Skill");

            entity.HasIndex(e => e.UpdatedByEmployeeId, "FK_EmployeeSkillMapper_UpdatedBy");

            entity.HasIndex(e => new { e.EmployeeId, e.Rating }, "IX_EmployeeSkillMapper_Rating_Employee");

            entity.HasIndex(e => new { e.EmployeeId, e.SkillId }, "UK_Employee_Skill").IsUnique();

            entity.HasOne(d => d.CreatedByEmployee).WithMany(p => p.LndemployeeskillmapperCreatedByEmployees)
                .HasForeignKey(d => d.CreatedByEmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_EmployeeSkillMapper_CreatedBy");

            entity.HasOne(d => d.Employee).WithMany(p => p.LndemployeeskillmapperEmployees)
                .HasForeignKey(d => d.EmployeeId)
                .HasConstraintName("FK_EmployeeSkillMapper_Employee");

            entity.HasOne(d => d.Skill).WithMany(p => p.Lndemployeeskillmappers)
                .HasForeignKey(d => d.SkillId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_EmployeeSkillMapper_Skill");

            entity.HasOne(d => d.UpdatedByEmployee).WithMany(p => p.LndemployeeskillmapperUpdatedByEmployees)
                .HasForeignKey(d => d.UpdatedByEmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_EmployeeSkillMapper_UpdatedBy");
        });

        modelBuilder.Entity<Lndsme>(entity =>
        {
            entity.HasKey(e => e.SmeId).HasName("PRIMARY");

            entity
                .ToTable("lndsme")
                .UseCollation("utf8mb4_0900_ai_ci");

            entity.HasIndex(e => e.ApprovedByEmployeeId, "FK_SME_ApprovedBy");

            entity.HasIndex(e => e.AttachmentId, "FK_SME_Attachment");

            entity.HasIndex(e => e.EmployeeId, "FK_SME_Employee");

            entity.HasIndex(e => new { e.SkillId, e.ApprovedByEmployeeId }, "IX_SME_Skill_Approved");

            entity.Property(e => e.IsActive)
                .IsRequired()
                .HasDefaultValueSql("'1'");

            entity.HasOne(d => d.ApprovedByEmployee).WithMany(p => p.LndsmeApprovedByEmployees)
                .HasForeignKey(d => d.ApprovedByEmployeeId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_SME_ApprovedBy");

            entity.HasOne(d => d.Attachment).WithMany(p => p.Lndsmes)
                .HasForeignKey(d => d.AttachmentId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_SME_Attachment");

            entity.HasOne(d => d.Employee).WithMany(p => p.LndsmeEmployees)
                .HasForeignKey(d => d.EmployeeId)
                .HasConstraintName("FK_SME_Employee");

            entity.HasOne(d => d.Skill).WithMany(p => p.Lndsmes)
                .HasForeignKey(d => d.SkillId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SME_Skill");
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

        modelBuilder.Entity<Managerreviewcomment>(entity =>
        {
            entity.HasKey(e => e.ReviewCommentId).HasName("PRIMARY");

            entity.ToTable("managerreviewcomments");

            entity.HasIndex(e => e.TargetGoalId, "idx_goal");

            entity.HasIndex(e => e.ManagerEmployeeId, "idx_manager");

            entity.HasIndex(e => e.Rating, "idx_rating");

            entity.HasIndex(e => e.Status, "idx_status");

            entity.HasIndex(e => e.TargetEmployeeId, "idx_target_employee");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.ModifiedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasColumnType("datetime");
            entity.Property(e => e.ReviewComment).HasColumnType("text");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'Draft'")
                .HasColumnType("enum('Draft','Submitted','Modified','Finalized')");
            entity.Property(e => e.SubmittedAt).HasColumnType("datetime");

            entity.HasOne(d => d.ManagerEmployee).WithMany(p => p.ManagerreviewcommentManagerEmployees)
                .HasForeignKey(d => d.ManagerEmployeeId)
                .HasConstraintName("FK_ManagerReview_Manager");

            entity.HasOne(d => d.TargetEmployee).WithMany(p => p.ManagerreviewcommentTargetEmployees)
                .HasForeignKey(d => d.TargetEmployeeId)
                .HasConstraintName("FK_ManagerReview_Target");

            entity.HasOne(d => d.TargetGoal).WithMany(p => p.Managerreviewcomments)
                .HasForeignKey(d => d.TargetGoalId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_ManagerReview_Goal");
        });

        modelBuilder.Entity<MasterSkill>(entity =>
        {
            entity.HasKey(e => e.SkillId).HasName("PRIMARY");

            entity
                .ToTable("master_skill")
                .UseCollation("utf8mb4_0900_ai_ci");

            entity.HasIndex(e => e.SkillName, "IX_Master_Skill_Name").IsUnique();

            entity.Property(e => e.Category).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
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
            entity.Property(e => e.MeetingTitle).HasMaxLength(200);
            entity.Property(e => e.Notes).HasColumnType("text");

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
            entity.Property(e => e.MentorName).HasMaxLength(150);
            entity.Property(e => e.SubmittedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasColumnType("datetime");

            entity.HasOne(d => d.SubmittedByEmployee).WithMany(p => p.Mentorfeedbacks)
                .HasForeignKey(d => d.SubmittedByEmployeeId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("mentorfeedback_ibfk_1");
        });

        modelBuilder.Entity<Mentorfeedbacktracking>(entity =>
        {
            entity.HasKey(e => e.TrackingId).HasName("PRIMARY");

            entity.ToTable("mentorfeedbacktracking");

            entity.HasIndex(e => e.ReviewedByHrid, "FK_MentorFeedback_ReviewedBy");

            entity.HasIndex(e => e.SkillIdReference, "FK_MentorFeedback_Skill");

            entity.HasIndex(e => e.SubmittedByEmployeeId, "FK_MentorFeedback_SubmittedBy");

            entity.HasIndex(e => e.FeedbackFrom, "idx_feedback_from");

            entity.HasIndex(e => e.MenteeEmployeeId, "idx_mentee");

            entity.HasIndex(e => e.MentorEmployeeId, "idx_mentor");

            entity.HasIndex(e => e.Rating, "idx_rating");

            entity.HasIndex(e => e.SmeId, "idx_sme");

            entity.HasIndex(e => e.Status, "idx_status");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.FeedbackComments).HasColumnType("text");
            entity.Property(e => e.FeedbackFrom).HasColumnType("enum('Mentee','HR','Manager')");
            entity.Property(e => e.HrreviewComments)
                .HasColumnType("text")
                .HasColumnName("HRReviewComments");
            entity.Property(e => e.ReviewedAt).HasColumnType("datetime");
            entity.Property(e => e.ReviewedByHrid).HasColumnName("ReviewedByHRId");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'Submitted'")
                .HasColumnType("enum('Submitted','Acknowledged','Reviewed','Archived')");

            entity.HasOne(d => d.MenteeEmployee).WithMany(p => p.MentorfeedbacktrackingMenteeEmployees)
                .HasForeignKey(d => d.MenteeEmployeeId)
                .HasConstraintName("FK_MentorFeedback_Mentee");

            entity.HasOne(d => d.MentorEmployee).WithMany(p => p.MentorfeedbacktrackingMentorEmployees)
                .HasForeignKey(d => d.MentorEmployeeId)
                .HasConstraintName("FK_MentorFeedback_Mentor");

            entity.HasOne(d => d.ReviewedByHr).WithMany(p => p.Mentorfeedbacktrackings)
                .HasForeignKey(d => d.ReviewedByHrid)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_MentorFeedback_ReviewedBy");

            entity.HasOne(d => d.SkillIdReferenceNavigation).WithMany(p => p.Mentorfeedbacktrackings)
                .HasForeignKey(d => d.SkillIdReference)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_MentorFeedback_Skill");

            entity.HasOne(d => d.Sme).WithMany(p => p.Mentorfeedbacktrackings)
                .HasForeignKey(d => d.SmeId)
                .HasConstraintName("FK_MentorFeedback_SME");

            entity.HasOne(d => d.SubmittedByEmployee).WithMany(p => p.MentorfeedbacktrackingSubmittedByEmployees)
                .HasForeignKey(d => d.SubmittedByEmployeeId)
                .HasConstraintName("FK_MentorFeedback_SubmittedBy");
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
            entity.Property(e => e.NominationType).HasMaxLength(20);
            entity.Property(e => e.ReviewRemarks).HasMaxLength(500);
            entity.Property(e => e.ReviewedAt).HasColumnType("datetime");
            entity.Property(e => e.Status).HasMaxLength(50);
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

        modelBuilder.Entity<Nominationparameter>(entity =>
        {
            entity.HasKey(e => e.ParameterId).HasName("PRIMARY");

            entity.ToTable("nominationparameter");

            entity.HasIndex(e => e.RewardTypeId, "idx_reward_type");

            entity.HasIndex(e => e.SortOrder, "idx_sort");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.IsRequired).HasDefaultValueSql("'1'");
            entity.Property(e => e.ParameterName).HasMaxLength(100);
            entity.Property(e => e.ParameterType).HasColumnType("enum('Text','Number','Rating','Date','TextArea')");
            entity.Property(e => e.PlaceholderText).HasMaxLength(200);
            entity.Property(e => e.SortOrder).HasDefaultValueSql("'1'");

            entity.HasOne(d => d.RewardType).WithMany(p => p.Nominationparameters)
                .HasForeignKey(d => d.RewardTypeId)
                .HasConstraintName("nominationparameter_ibfk_1");
        });

        modelBuilder.Entity<Nominationparametervalue>(entity =>
        {
            entity.HasKey(e => e.ValueId).HasName("PRIMARY");

            entity.ToTable("nominationparametervalues");

            entity.HasIndex(e => e.NominationId, "idx_nomination");

            entity.HasIndex(e => e.ParameterId, "idx_parameter");

            entity.HasIndex(e => new { e.NominationId, e.ParameterId }, "unique_nomination_parameter").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.ParameterValue).HasColumnType("text");

            entity.HasOne(d => d.Nomination).WithMany(p => p.Nominationparametervalues)
                .HasForeignKey(d => d.NominationId)
                .HasConstraintName("nominationparametervalues_ibfk_1");

            entity.HasOne(d => d.Parameter).WithMany(p => p.Nominationparametervalues)
                .HasForeignKey(d => d.ParameterId)
                .HasConstraintName("nominationparametervalues_ibfk_2");
        });

        modelBuilder.Entity<Nominationreviewmetric>(entity =>
        {
            entity.HasKey(e => e.MetricId).HasName("PRIMARY");

            entity.ToTable("nominationreviewmetrics");

            entity.HasIndex(e => e.ReviewedByUserId, "ReviewedByUserId");

            entity.HasIndex(e => e.NominationId, "idx_nomination");

            entity.Property(e => e.ConflictOfInterest).HasDefaultValueSql("'0'");
            entity.Property(e => e.DiversityScore).HasPrecision(5, 2);
            entity.Property(e => e.MeritScore).HasPrecision(5, 2);
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

        modelBuilder.Entity<Nominationvisibilitytracking>(entity =>
        {
            entity.HasKey(e => e.TrackingId).HasName("PRIMARY");

            entity.ToTable("nominationvisibilitytracking");

            entity.HasIndex(e => e.NominationId, "idx_nomination");

            entity.HasIndex(e => e.ViewedAt, "idx_viewed_at");

            entity.HasIndex(e => e.ViewedByEmployeeId, "idx_viewed_by");

            entity.Property(e => e.ActionTaken).HasMaxLength(100);
            entity.Property(e => e.ViewedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");

            entity.HasOne(d => d.Nomination).WithMany(p => p.Nominationvisibilitytrackings)
                .HasForeignKey(d => d.NominationId)
                .HasConstraintName("nominationvisibilitytracking_ibfk_1");

            entity.HasOne(d => d.ViewedByEmployee).WithMany(p => p.Nominationvisibilitytrackings)
                .HasForeignKey(d => d.ViewedByEmployeeId)
                .HasConstraintName("nominationvisibilitytracking_ibfk_2");
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
            entity.Property(e => e.MeetingLink).HasMaxLength(1000);
            entity.Property(e => e.Notes).HasColumnType("text");
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

            entity.HasIndex(e => e.PolicyName, "PolicyName").IsUnique();

            entity.HasIndex(e => e.PublishedBy, "PublishedBy");

            entity.HasIndex(e => e.Category, "idx_category");

            entity.HasIndex(e => e.CreatedByUserId, "idx_created_by");

            entity.HasIndex(e => e.IsPublished, "idx_is_published");

            entity.HasIndex(e => e.PublishedAt, "idx_published_at");

            entity.HasIndex(e => e.Status, "idx_status");

            entity.Property(e => e.Category).HasMaxLength(100);
            entity.Property(e => e.ComplianceGuidance).HasColumnType("text");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.Description).HasColumnType("text");
            entity.Property(e => e.DocumentName).HasMaxLength(255);
            entity.Property(e => e.DocumentType).HasMaxLength(20);
            entity.Property(e => e.DocumentUploadedAt).HasColumnType("datetime");
            entity.Property(e => e.DocumentUrl).HasMaxLength(500);
            entity.Property(e => e.PolicyName).HasMaxLength(200);
            entity.Property(e => e.PublishedAt).HasColumnType("datetime");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'Draft'")
                .HasColumnType("enum('Active','Inactive','Draft')");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasColumnType("datetime");

            entity.HasOne(d => d.CreatedByUser).WithMany(p => p.OrganizationalpolicyCreatedByUsers)
                .HasForeignKey(d => d.CreatedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("organizationalpolicies_ibfk_1");

            entity.HasOne(d => d.PublishedByNavigation).WithMany(p => p.OrganizationalpolicyPublishedByNavigations)
                .HasForeignKey(d => d.PublishedBy)
                .HasConstraintName("organizationalpolicies_ibfk_2");
        });

        modelBuilder.Entity<Organizationgoalfeedback>(entity =>
        {
            entity.HasKey(e => e.OrgGoalFeedbackId).HasName("PRIMARY");

            entity.ToTable("organizationgoalfeedback");

            entity.HasIndex(e => e.ManagerEmployeeId, "FK_OrgGoalFeedback_Manager");

            entity.HasIndex(e => e.FeedbackFrom, "idx_feedback_from");

            entity.HasIndex(e => e.OrganizationObjectiveId, "idx_org_objective");

            entity.HasIndex(e => e.Rating, "idx_rating");

            entity.HasIndex(e => e.Status, "idx_status");

            entity.HasIndex(e => e.SubmittedByEmployeeId, "idx_submitted_by");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.FeedbackComments).HasColumnType("text");
            entity.Property(e => e.FeedbackFrom).HasColumnType("enum('Employee','Manager','DeptHead','HR')");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'Submitted'")
                .HasColumnType("enum('Submitted','Reviewed','Archived')");

            entity.HasOne(d => d.ManagerEmployee).WithMany(p => p.OrganizationgoalfeedbackManagerEmployees)
                .HasForeignKey(d => d.ManagerEmployeeId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_OrgGoalFeedback_Manager");

            entity.HasOne(d => d.OrganizationObjective).WithMany(p => p.Organizationgoalfeedbacks)
                .HasForeignKey(d => d.OrganizationObjectiveId)
                .HasConstraintName("FK_OrgGoalFeedback_Objective");

            entity.HasOne(d => d.SubmittedByEmployee).WithMany(p => p.OrganizationgoalfeedbackSubmittedByEmployees)
                .HasForeignKey(d => d.SubmittedByEmployeeId)
                .HasConstraintName("FK_OrgGoalFeedback_SubmittedBy");
        });

        modelBuilder.Entity<Organizationwideobjective>(entity =>
        {
            entity.HasKey(e => e.ObjectiveId).HasName("PRIMARY");

            entity.ToTable("organizationwideobjective");

            entity.HasIndex(e => e.CreatedBy, "created_by");

            entity.HasIndex(e => e.DepartmentId, "idx_department");

            entity.Property(e => e.ObjectiveId).HasColumnName("objective_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DepartmentId).HasColumnName("department_id");
            entity.Property(e => e.Description)
                .HasColumnType("text")
                .HasColumnName("description");
            entity.Property(e => e.TimelineEnd)
                .HasColumnType("datetime")
                .HasColumnName("timeline_end");
            entity.Property(e => e.TimelineStart)
                .HasColumnType("datetime")
                .HasColumnName("timeline_start");
            entity.Property(e => e.Title)
                .HasMaxLength(200)
                .HasColumnName("title");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.Organizationwideobjectives)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("organizationwideobjective_ibfk_2");

            entity.HasOne(d => d.Department).WithMany(p => p.Organizationwideobjectives)
                .HasForeignKey(d => d.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("organizationwideobjective_ibfk_1");
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
            entity.Property(e => e.ExpiresAt).HasColumnType("datetime");
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
            entity.Property(e => e.PayrollPeriod).HasMaxLength(50);
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
            entity.Property(e => e.PeerName).HasMaxLength(150);
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

        modelBuilder.Entity<Peerfeedbackqueue>(entity =>
        {
            entity.HasKey(e => e.QueueId).HasName("PRIMARY");

            entity.ToTable("peerfeedbackqueue");

            entity.HasIndex(e => e.ApprovedByHrid, "idx_approved_by");

            entity.HasIndex(e => e.RecipientEmployeeId, "idx_recipient");

            entity.HasIndex(e => e.Status, "idx_status");

            entity.HasIndex(e => e.SubmittedByEmployeeId, "idx_submitted_by");

            entity.Property(e => e.ApprovedAt).HasColumnType("datetime");
            entity.Property(e => e.ApprovedByHrid).HasColumnName("ApprovedByHRId");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.FeedbackContent).HasColumnType("text");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'Pending'")
                .HasColumnType("enum('Pending','UnderHRReview','Approved','Rejected')");

            entity.HasOne(d => d.ApprovedByHr).WithMany(p => p.Peerfeedbackqueues)
                .HasForeignKey(d => d.ApprovedByHrid)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_PeerQueue_ApprovedBy");

            entity.HasOne(d => d.RecipientEmployee).WithMany(p => p.PeerfeedbackqueueRecipientEmployees)
                .HasForeignKey(d => d.RecipientEmployeeId)
                .HasConstraintName("FK_PeerQueue_Recipient");

            entity.HasOne(d => d.SubmittedByEmployee).WithMany(p => p.PeerfeedbackqueueSubmittedByEmployees)
                .HasForeignKey(d => d.SubmittedByEmployeeId)
                .HasConstraintName("FK_PeerQueue_SubmittedBy");
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
            entity.Property(e => e.IsDeletable)
                .IsRequired()
                .HasDefaultValueSql("'1'");
            entity.Property(e => e.L1approverEmployeeId).HasColumnName("L1ApproverEmployeeId");
            entity.Property(e => e.L1approverId).HasColumnName("L1ApproverId");
            entity.Property(e => e.L2approverEmployeeId).HasColumnName("L2ApproverEmployeeId");
            entity.Property(e => e.L2approverId).HasColumnName("L2ApproverId");
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

        modelBuilder.Entity<Projectgoalfeedback>(entity =>
        {
            entity.HasKey(e => e.FeedbackId).HasName("PRIMARY");

            entity.ToTable("projectgoalfeedback");

            entity.HasIndex(e => e.EmployeeMasterId, "IX_ProjectGoalFeedback_EmployeeMasterId");

            entity.HasIndex(e => e.GoalId, "IX_ProjectGoalFeedback_GoalId");

            entity.HasIndex(e => new { e.ProjectId, e.GoalId }, "IX_ProjectGoalFeedback_ProjectGoal");

            entity.HasIndex(e => e.ProjectId, "IX_ProjectGoalFeedback_ProjectId");

            entity.HasIndex(e => e.Rating, "IX_ProjectGoalFeedback_Rating");

            entity.HasIndex(e => e.SubmittedAt, "IX_ProjectGoalFeedback_SubmittedAt").IsDescending();

            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.SubmittedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.EmployeeMaster).WithMany(p => p.Projectgoalfeedbacks)
                .HasForeignKey(d => d.EmployeeMasterId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Projectgoalfeedback_Employee");

            entity.HasOne(d => d.Goal).WithMany(p => p.Projectgoalfeedbacks)
                .HasForeignKey(d => d.GoalId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Projectgoalfeedback_Goal");

            entity.HasOne(d => d.Project).WithMany(p => p.Projectgoalfeedbacks)
                .HasForeignKey(d => d.ProjectId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Projectgoalfeedback_Project");
        });

        modelBuilder.Entity<Promotion>(entity =>
        {
            entity.HasKey(e => e.PromotionId).HasName("PRIMARY");

            entity.ToTable("promotions");

            entity.HasIndex(e => e.ApprovedByUserId, "ApprovedByUserId");

            entity.HasIndex(e => e.DepartmentId, "DepartmentId");

            entity.HasIndex(e => e.NominationId, "NominationId");

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
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasColumnType("datetime");

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

            entity.HasOne(d => d.Nomination).WithMany(p => p.Promotions)
                .HasForeignKey(d => d.NominationId)
                .HasConstraintName("promotions_ibfk_4");
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

        modelBuilder.Entity<Recognitiondetail>(entity =>
        {
            entity.HasKey(e => e.OpportunityId).HasName("PRIMARY");

            entity.ToTable("recognitiondetails");

            entity.HasIndex(e => e.PostedByUserId, "PostedByUserId");

            entity.HasIndex(e => e.Deadline, "idx_deadline");

            entity.HasIndex(e => e.DepartmentId, "idx_department");

            entity.HasIndex(e => e.RewardTypeId, "idx_reward_type");

            entity.HasIndex(e => e.Status, "idx_status");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.Description).HasColumnType("text");
            entity.Property(e => e.EligibilityCriteria).HasColumnType("text");
            entity.Property(e => e.OpportunityName).HasMaxLength(200);
            entity.Property(e => e.Requirements).HasColumnType("text");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'Draft'")
                .HasColumnType("enum('Active','Closed','Draft')");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasColumnType("datetime");

            entity.HasOne(d => d.Department).WithMany(p => p.Recognitiondetails)
                .HasForeignKey(d => d.DepartmentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("recognitiondetails_ibfk_1");

            entity.HasOne(d => d.PostedByUser).WithMany(p => p.Recognitiondetails)
                .HasForeignKey(d => d.PostedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("recognitiondetails_ibfk_2");

            entity.HasOne(d => d.RewardType).WithMany(p => p.Recognitiondetails)
                .HasForeignKey(d => d.RewardTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("recognitiondetails_ibfk_3");
        });

        modelBuilder.Entity<Recognitionreward>(entity =>
        {
            entity.HasKey(e => e.RewardId).HasName("PRIMARY");

            entity.ToTable("recognitionrewards");

            entity.HasIndex(e => e.EmployeeId, "idx_employee");

            entity.HasIndex(e => e.RewardType, "idx_reward_type");

            entity.HasIndex(e => e.SubmittedBy, "submitted_by");

            entity.Property(e => e.RewardId).HasColumnName("reward_id");
            entity.Property(e => e.AmountGrade)
                .HasMaxLength(100)
                .HasColumnName("amount_grade");
            entity.Property(e => e.EmployeeId).HasColumnName("employee_id");
            entity.Property(e => e.Reason)
                .HasColumnType("text")
                .HasColumnName("reason");
            entity.Property(e => e.RewardDate)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("reward_date");
            entity.Property(e => e.RewardType)
                .HasColumnType("enum('Recognition','Monetary','Non-Monetary')")
                .HasColumnName("reward_type");
            entity.Property(e => e.SubmittedBy).HasColumnName("submitted_by");

            entity.HasOne(d => d.Employee).WithMany(p => p.RecognitionrewardEmployees)
                .HasForeignKey(d => d.EmployeeId)
                .HasConstraintName("recognitionrewards_ibfk_1");

            entity.HasOne(d => d.SubmittedByNavigation).WithMany(p => p.RecognitionrewardSubmittedByNavigations)
                .HasForeignKey(d => d.SubmittedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("recognitionrewards_ibfk_2");
        });

        modelBuilder.Entity<Recognitionstatus>(entity =>
        {
            entity.HasKey(e => e.NominationId).HasName("PRIMARY");

            entity.ToTable("recognitionstatus");

            entity.HasIndex(e => e.ReviewedByEmployeeId, "ReviewedByEmployeeId");

            entity.HasIndex(e => e.NominatedByEmployeeId, "idx_nominator");

            entity.HasIndex(e => e.NomineeEmployeeId, "idx_nominee");

            entity.HasIndex(e => e.OpportunityId, "idx_opportunity");

            entity.HasIndex(e => e.Status, "idx_status");

            entity.HasIndex(e => e.SubmittedAt, "idx_submitted_at");

            entity.Property(e => e.Justification).HasColumnType("text");
            entity.Property(e => e.NominationType)
                .HasDefaultValueSql("'ManagerNomination'")
                .HasColumnType("enum('SelfNomination','ManagerNomination')");
            entity.Property(e => e.ReviewRemarks).HasMaxLength(500);
            entity.Property(e => e.ReviewedAt).HasColumnType("datetime");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'Pending'")
                .HasColumnType("enum('Pending','UnderReview','Approved','Rejected')");
            entity.Property(e => e.SubmittedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");

            entity.HasOne(d => d.NominatedByEmployee).WithMany(p => p.RecognitionstatusNominatedByEmployees)
                .HasForeignKey(d => d.NominatedByEmployeeId)
                .HasConstraintName("recognitionstatus_ibfk_3");

            entity.HasOne(d => d.NomineeEmployee).WithMany(p => p.RecognitionstatusNomineeEmployees)
                .HasForeignKey(d => d.NomineeEmployeeId)
                .HasConstraintName("recognitionstatus_ibfk_2");

            entity.HasOne(d => d.Opportunity).WithMany(p => p.Recognitionstatuses)
                .HasForeignKey(d => d.OpportunityId)
                .HasConstraintName("recognitionstatus_ibfk_1");

            entity.HasOne(d => d.ReviewedByEmployee).WithMany(p => p.RecognitionstatusReviewedByEmployees)
                .HasForeignKey(d => d.ReviewedByEmployeeId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("recognitionstatus_ibfk_4");
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

        modelBuilder.Entity<Report>(entity =>
        {
            entity.HasKey(e => e.ReportId).HasName("PRIMARY");

            entity.ToTable("reports");

            entity.HasIndex(e => e.GeneratedBy, "idx_generated_by");

            entity.HasIndex(e => e.SubmissionDate, "idx_submission_date");

            entity.Property(e => e.ReportId).HasColumnName("report_id");
            entity.Property(e => e.ExcelPath)
                .HasMaxLength(500)
                .HasColumnName("excel_path");
            entity.Property(e => e.GeneratedBy).HasColumnName("generated_by");
            entity.Property(e => e.PdfPath)
                .HasMaxLength(500)
                .HasColumnName("pdf_path");
            entity.Property(e => e.SubmissionDate)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("submission_date");
            entity.Property(e => e.Summary)
                .HasColumnType("text")
                .HasColumnName("summary");
            entity.Property(e => e.Title)
                .HasMaxLength(200)
                .HasColumnName("title");

            entity.HasOne(d => d.GeneratedByNavigation).WithMany(p => p.Reports)
                .HasForeignKey(d => d.GeneratedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("reports_ibfk_1");
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.ReviewId).HasName("PRIMARY");

            entity.ToTable("review");

            entity.HasIndex(e => e.GoalId, "idx_goal");

            entity.HasIndex(e => e.SubmittedBy, "idx_submitted_by");

            entity.Property(e => e.Comments).HasColumnType("text");
            entity.Property(e => e.GoalName).HasMaxLength(200);
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

        modelBuilder.Entity<Rewardtype>(entity =>
        {
            entity.HasKey(e => e.RewardTypeId).HasName("PRIMARY");

            entity.ToTable("rewardtype");

            entity.HasIndex(e => e.CreatedBy, "CreatedBy");

            entity.HasIndex(e => e.IsActive, "idx_active");

            entity.HasIndex(e => e.RewardCategory, "idx_category");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.Description).HasColumnType("text");
            entity.Property(e => e.IsActive)
                .IsRequired()
                .HasDefaultValueSql("'1'");
            entity.Property(e => e.RewardCategory).HasColumnType("enum('Recognition','Promotion')");
            entity.Property(e => e.RewardName).HasMaxLength(100);

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.Rewardtypes)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("rewardtype_ibfk_1");
        });

        modelBuilder.Entity<Risk>(entity =>
        {
            entity.HasKey(e => e.RiskId).HasName("PRIMARY");

            entity.ToTable("risk");

            entity.HasIndex(e => e.DepartmentId, "idx_department");

            entity.HasIndex(e => e.RiskType, "idx_risk_type");

            entity.Property(e => e.RiskId).HasColumnName("risk_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.DepartmentId).HasColumnName("department_id");
            entity.Property(e => e.PeriodEnd)
                .HasColumnType("datetime")
                .HasColumnName("period_end");
            entity.Property(e => e.PeriodStart)
                .HasColumnType("datetime")
                .HasColumnName("period_start");
            entity.Property(e => e.RiskType)
                .HasMaxLength(100)
                .HasColumnName("risk_type");
            entity.Property(e => e.TrendGraph)
                .HasColumnType("text")
                .HasColumnName("trend_graph");

            entity.HasOne(d => d.Department).WithMany(p => p.Risks)
                .HasForeignKey(d => d.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("risk_ibfk_1");
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
            entity.Property(e => e.IsSystemRole).HasDefaultValueSql("'0'");
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

            entity.HasIndex(e => e.AssignedToEmployeeId, "idx_sla_AssignedToEmployeeId");

            entity.HasIndex(e => e.ComplianceStatus, "idx_sla_ComplianceStatus");

            entity.HasIndex(e => e.CreatedByEmployeeId, "idx_sla_CreatedByEmployeeId");

            entity.HasIndex(e => e.Deadline, "idx_sla_Deadline");

            entity.HasIndex(e => e.DepartmentId, "idx_sla_DepartmentId");

            entity.HasIndex(e => e.EmployeeId, "idx_sla_EmployeeId");

            entity.HasIndex(e => e.RelatedEntityType, "idx_sla_RelatedEntityType");

            entity.HasIndex(e => e.ReopenedByEmployeeId, "idx_sla_ReopenedByEmployeeId");

            entity.HasIndex(e => e.Slatype, "idx_sla_SLAType");

            entity.HasIndex(e => e.Status, "idx_sla_Status");

            entity.Property(e => e.Slaid).HasColumnName("SLAId");
            entity.Property(e => e.ClosedAt).HasColumnType("datetime");
            entity.Property(e => e.ComplianceStatus).HasColumnType("enum('OnTime','Breached','Extended','Closed')");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.Deadline).HasColumnType("datetime");
            entity.Property(e => e.LastNotificationSent).HasColumnType("datetime");
            entity.Property(e => e.RelatedEntityType).HasMaxLength(50);
            entity.Property(e => e.ReopenReason).HasMaxLength(500);
            entity.Property(e => e.ReopenedAt).HasColumnType("datetime");
            entity.Property(e => e.Slatype)
                .HasMaxLength(100)
                .HasColumnName("SLAType");
            entity.Property(e => e.Status).HasColumnType("enum('Open','InProgress','Closed','Breached','Extended')");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");

            entity.HasOne(d => d.AssignedToEmployee).WithMany(p => p.SlaAssignedToEmployees)
                .HasForeignKey(d => d.AssignedToEmployeeId)
                .HasConstraintName("fk_sla_assigned_to_employee");

            entity.HasOne(d => d.Department).WithMany(p => p.Slas)
                .HasForeignKey(d => d.DepartmentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_sla_department");

            entity.HasOne(d => d.Employee).WithMany(p => p.SlaEmployees)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_sla_employee");

            entity.HasOne(d => d.ReopenedByEmployee).WithMany(p => p.SlaReopenedByEmployees)
                .HasForeignKey(d => d.ReopenedByEmployeeId)
                .HasConstraintName("fk_sla_reopened_by_employee");
        });

        modelBuilder.Entity<Slacompliance>(entity =>
        {
            entity.HasKey(e => e.ComplianceId).HasName("PRIMARY");

            entity.ToTable("slacompliance");

            entity.HasIndex(e => e.CalculatedBy, "idx_slacompliance_CalculatedBy");

            entity.HasIndex(e => e.DepartmentId, "idx_slacompliance_DepartmentId");

            entity.HasIndex(e => e.Period, "idx_slacompliance_Period");

            entity.Property(e => e.BreachedSlas).HasColumnName("BreachedSLAs");
            entity.Property(e => e.CalculatedAt).HasColumnType("datetime");
            entity.Property(e => e.CompliancePercentage)
                .HasPrecision(5, 2)
                .HasComputedColumnSql("case when (`TotalSLAs` > 0) then round(((`OnTimeSLAs` / `TotalSLAs`) * 100),2) else 0 end", true);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.ExtendedSlas).HasColumnName("ExtendedSLAs");
            entity.Property(e => e.OnTimeSlas).HasColumnName("OnTimeSLAs");
            entity.Property(e => e.PendingSlas).HasColumnName("PendingSLAs");
            entity.Property(e => e.Period).HasMaxLength(50);
            entity.Property(e => e.TotalSlas).HasColumnName("TotalSLAs");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.CalculatedByNavigation).WithMany(p => p.Slacompliances)
                .HasForeignKey(d => d.CalculatedBy)
                .HasConstraintName("fk_slacompliance_calculated_by_employee");

            entity.HasOne(d => d.Department).WithMany(p => p.Slacompliances)
                .HasForeignKey(d => d.DepartmentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_slacompliance_department");
        });

        modelBuilder.Entity<Slaescalation>(entity =>
        {
            entity.HasKey(e => e.EscalationId).HasName("PRIMARY");

            entity.ToTable("slaescalation");

            entity.HasIndex(e => e.EscalatedToEmployeeId, "idx_slaescalation_EscalatedToEmployeeId");

            entity.HasIndex(e => e.EscalationLevel, "idx_slaescalation_EscalationLevel");

            entity.HasIndex(e => e.EscalationStatus, "idx_slaescalation_EscalationStatus");

            entity.HasIndex(e => e.ResolvedByEmployeeId, "idx_slaescalation_ResolvedByEmployeeId");

            entity.HasIndex(e => e.Slaid, "idx_slaescalation_SLAId");

            entity.HasIndex(e => e.SubmittedByEmployeeId, "idx_slaescalation_SubmittedByEmployeeId");

            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.EscalationDeadline).HasColumnType("datetime");
            entity.Property(e => e.EscalationLevel).HasColumnType("enum('L1','L2','DeptHead','Leadership')");
            entity.Property(e => e.EscalationStatus).HasColumnType("enum('Pending','InProgress','Resolved','Rejected')");
            entity.Property(e => e.Reason).HasMaxLength(200);
            entity.Property(e => e.ResolutionComments).HasColumnType("text");
            entity.Property(e => e.ResolvedAt).HasColumnType("datetime");
            entity.Property(e => e.Slaid).HasColumnName("SLAId");
            entity.Property(e => e.SubmittedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");

            entity.HasOne(d => d.EscalatedToEmployee).WithMany(p => p.SlaescalationEscalatedToEmployees)
                .HasForeignKey(d => d.EscalatedToEmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_slaescalation_escalated_to");

            entity.HasOne(d => d.ResolvedByEmployee).WithMany(p => p.SlaescalationResolvedByEmployees)
                .HasForeignKey(d => d.ResolvedByEmployeeId)
                .HasConstraintName("fk_slaescalation_resolved_by");

            entity.HasOne(d => d.Sla).WithMany(p => p.Slaescalations)
                .HasForeignKey(d => d.Slaid)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_slaescalation_sla");

            entity.HasOne(d => d.SubmittedByEmployee).WithMany(p => p.SlaescalationSubmittedByEmployees)
                .HasForeignKey(d => d.SubmittedByEmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_slaescalation_submitted_by");
        });

        modelBuilder.Entity<Slahistory>(entity =>
        {
            entity.HasKey(e => e.SlahistoryId).HasName("PRIMARY");

            entity.ToTable("slahistory");

            entity.HasIndex(e => e.ChangeType, "idx_slahistory_ChangeType");

            entity.HasIndex(e => e.ChangedByEmployeeId, "idx_slahistory_ChangedByEmployeeId");

            entity.HasIndex(e => e.ReferenceEscalationId, "idx_slahistory_ReferenceEscalationId");

            entity.HasIndex(e => e.Slaid, "idx_slahistory_SLAId");

            entity.Property(e => e.SlahistoryId).HasColumnName("SLAHistoryId");
            entity.Property(e => e.ChangeType).HasMaxLength(100);
            entity.Property(e => e.ChangedFrom).HasMaxLength(1000);
            entity.Property(e => e.ChangedTo).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.Metadata).HasColumnType("json");
            entity.Property(e => e.Reason).HasMaxLength(500);
            entity.Property(e => e.Slaid).HasColumnName("SLAId");

            entity.HasOne(d => d.ChangedByEmployee).WithMany(p => p.Slahistories)
                .HasForeignKey(d => d.ChangedByEmployeeId)
                .HasConstraintName("fk_slahistory_changed_by");

            entity.HasOne(d => d.ReferenceEscalation).WithMany(p => p.Slahistories)
                .HasForeignKey(d => d.ReferenceEscalationId)
                .HasConstraintName("fk_slahistory_reference_escalation");

            entity.HasOne(d => d.Sla).WithMany(p => p.Slahistories)
                .HasForeignKey(d => d.Slaid)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_slahistory_sla");
        });

        modelBuilder.Entity<Slanotification>(entity =>
        {
            entity.HasKey(e => e.NotificationId).HasName("PRIMARY");

            entity.ToTable("slanotifications");

            entity.HasIndex(e => e.EmployeeId, "idx_slanotifications_EmployeeId");

            entity.HasIndex(e => e.NotificationType, "idx_slanotifications_NotificationType");

            entity.HasIndex(e => e.Slaid, "idx_slanotifications_SLAId");

            entity.Property(e => e.Channel).HasColumnType("enum('Email','InApp','SMS')");
            entity.Property(e => e.DeliveryStatus).HasColumnType("enum('Sent','Failed','Read','Pending')");
            entity.Property(e => e.NotificationBody).HasColumnType("text");
            entity.Property(e => e.NotificationSubject).HasMaxLength(200);
            entity.Property(e => e.NotificationType).HasColumnType("enum('Reminder','Escalation','Breach','Closure','Reopen')");
            entity.Property(e => e.ReadAt).HasColumnType("datetime");
            entity.Property(e => e.SentAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.Slaid).HasColumnName("SLAId");

            entity.HasOne(d => d.Employee).WithMany(p => p.Slanotifications)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_slanotifications_employee");

            entity.HasOne(d => d.Sla).WithMany(p => p.Slanotifications)
                .HasForeignKey(d => d.Slaid)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_slanotifications_sla");
        });

        modelBuilder.Entity<Slareviewtracking>(entity =>
        {
            entity.HasKey(e => e.ReviewTrackingId).HasName("PRIMARY");

            entity.ToTable("slareviewtracking");

            entity.HasIndex(e => e.Deadline, "idx_slareviewtracking_Deadline");

            entity.HasIndex(e => e.EmployeeId, "idx_slareviewtracking_EmployeeId");

            entity.HasIndex(e => e.FormId, "idx_slareviewtracking_FormId");

            entity.HasIndex(e => e.ManagerReviewerId, "idx_slareviewtracking_ManagerReviewerId");

            entity.HasIndex(e => e.ReviewerId, "idx_slareviewtracking_ReviewerId");

            entity.HasIndex(e => e.Slaid, "idx_slareviewtracking_SLAId");

            entity.Property(e => e.ComplianceStatus).HasColumnType("enum('OnTime','Late','NotStarted')");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("datetime");
            entity.Property(e => e.Deadline).HasColumnType("datetime");
            entity.Property(e => e.IsManagerSelfReview).HasColumnType("bit(1)");
            entity.Property(e => e.ReviewCycle).HasMaxLength(50);
            entity.Property(e => e.ReviewType).HasColumnType("enum('Self','Manager','Peer','HR')");
            entity.Property(e => e.ReviewerRole).HasMaxLength(50);
            entity.Property(e => e.Slaid).HasColumnName("SLAId");
            entity.Property(e => e.Status).HasColumnType("enum('Pending','InProgress','Submitted','Overdue')");
            entity.Property(e => e.SubmittedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.Employee).WithMany(p => p.SlareviewtrackingEmployees)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_slareviewtracking_employee");

            entity.HasOne(d => d.Form).WithMany(p => p.Slareviewtrackings)
                .HasForeignKey(d => d.FormId)
                .HasConstraintName("fk_slareviewtracking_form");

            entity.HasOne(d => d.Reviewer).WithMany(p => p.SlareviewtrackingReviewers)
                .HasForeignKey(d => d.ReviewerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_slareviewtracking_reviewer");

            entity.HasOne(d => d.Sla).WithMany(p => p.Slareviewtrackings)
                .HasForeignKey(d => d.Slaid)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_slareviewtracking_sla");
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
            entity.Property(e => e.PasswordHash).HasMaxLength(500);
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
            entity.Property(e => e.CallingName).HasMaxLength(100);
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
