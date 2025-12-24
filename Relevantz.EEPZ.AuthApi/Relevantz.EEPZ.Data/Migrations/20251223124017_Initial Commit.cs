using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Relevantz.EEPZ.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCommit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "employee",
                columns: table => new
                {
                    EmployeeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    EmployeeCompanyId = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EmploymentType = table.Column<string>(type: "enum('Permanent','Contract','Temporary','Intern','Probation')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EmploymentStatus = table.Column<string>(type: "enum('Active','Inactive','Terminated','Resigned','Retired')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    JoiningDate = table.Column<DateOnly>(type: "date", nullable: false),
                    ConfirmationDate = table.Column<DateOnly>(type: "date", nullable: true),
                    ExitDate = table.Column<DateOnly>(type: "date", nullable: true),
                    ReportingManagerEmployeeId = table.Column<int>(type: "int", nullable: true),
                    WorkLocation = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EmployeeType = table.Column<string>(type: "enum('FullTime','PartTime')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NoticePeriodDays = table.Column<int>(type: "int", nullable: true, defaultValueSql: "'30'"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValueSql: "'1'"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: true),
                    UpdatedByUserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.EmployeeId);
                    table.ForeignKey(
                        name: "employee_ibfk_1",
                        column: x => x.ReportingManagerEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "feedbackquestion",
                columns: table => new
                {
                    QuestionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    QuestionCode = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    QuestionText = table.Column<string>(type: "text", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    QuestionDescription = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FeedbackType = table.Column<string>(type: "enum('GoalBased','ProjectBased','PeerFeedback','MentorFeedback','HRForm','OrganizationalGoal','BiasReview')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ResponseType = table.Column<string>(type: "enum('Rating','Boolean','Text','MultipleChoice','Checkbox')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RatingScaleMin = table.Column<int>(type: "int", nullable: true, defaultValueSql: "'1'"),
                    RatingScaleMax = table.Column<int>(type: "int", nullable: true, defaultValueSql: "'5'"),
                    RatingScaleLabels = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ChoiceOptions = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsRequired = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValueSql: "'1'"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValueSql: "'1'"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.QuestionId);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "master_skill",
                columns: table => new
                {
                    SkillId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    SkillName = table.Column<string>(type: "varchar(255)", nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Category = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.SkillId);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.CreateTable(
                name: "otp",
                columns: table => new
                {
                    OtpId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Email = table.Column<string>(type: "varchar(255)", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    OtpCode = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    OtpType = table.Column<string>(type: "enum('Login2FA','ForgotPassword','EmailVerification')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ExpiresAt = table.Column<DateTime>(type: "datetime", nullable: false),
                    IsUsed = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UsedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    IpAddress = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.OtpId);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "role",
                columns: table => new
                {
                    RoleId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    RoleName = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RoleCode = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsSystemRole = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.RoleId);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "address",
                columns: table => new
                {
                    AddressId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    AddressType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DoorNumber = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Street = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Landmark = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Area = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    City = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    State = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Country = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, defaultValueSql: "'India'", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PinCode = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.AddressId);
                    table.ForeignKey(
                        name: "fk_address_employee",
                        column: x => x.EmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "changerequests",
                columns: table => new
                {
                    RequestId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    ChangeType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NewEmployeeCompanyId = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NewEmail = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CurrentValue = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NewValue = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Reason = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RequestedByUserId = table.Column<int>(type: "int", nullable: true),
                    ApprovedByUserId = table.Column<int>(type: "int", nullable: true),
                    AdminRemarks = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RequestedAt = table.Column<DateTime>(type: "datetime(6)", maxLength: 6, nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "datetime(6)", maxLength: 6, nullable: true),
                    CurrentPassword = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.RequestId);
                    table.ForeignKey(
                        name: "FK_ChangeRequests_Employee",
                        column: x => x.EmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "department",
                columns: table => new
                {
                    DepartmentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    DepartmentName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DepartmentCode = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "enum('Active','Inactive')", nullable: false, defaultValueSql: "'Active'", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ParentDepartmentId = table.Column<int>(type: "int", nullable: true),
                    HodEmployeeId = table.Column<int>(type: "int", nullable: true),
                    BudgetAllocated = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: true),
                    CostCenter = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.DepartmentId);
                    table.ForeignKey(
                        name: "fk_department_hod",
                        column: x => x.HodEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_department_parent",
                        column: x => x.ParentDepartmentId,
                        principalTable: "department",
                        principalColumn: "DepartmentId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "lndattachments",
                columns: table => new
                {
                    AttachmentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    FileName = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FilePath = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FileSize = table.Column<long>(type: "bigint", nullable: true),
                    AttachmentType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedByEmployeeId = table.Column<int>(type: "int", nullable: false),
                    CreatedOn = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.AttachmentId);
                    table.ForeignKey(
                        name: "FK_LnDAttachments_CreatedBy",
                        column: x => x.CreatedByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.CreateTable(
                name: "meetingmom",
                columns: table => new
                {
                    MOMId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MeetingTitle = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MeetingDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedBy = table.Column<int>(type: "int", nullable: true),
                    EmployeeId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.MOMId);
                    table.ForeignKey(
                        name: "meetingmom_ibfk_1",
                        column: x => x.EmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "meetings",
                columns: table => new
                {
                    MeetingId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MeetingTitle = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false, comment: "Title/Subject of the meeting", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MeetingType = table.Column<string>(type: "enum('One-on-One','Team Meeting','Presentation','Other')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MeetingDate = table.Column<DateTime>(type: "datetime", nullable: false, comment: "Scheduled date and time"),
                    MeetingLink = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, comment: "Teams/Zoom/Google Meet link", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Agenda = table.Column<string>(type: "text", nullable: true, comment: "Meeting agenda/discussion topics", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ScheduledByEmployeeId = table.Column<int>(type: "int", nullable: false, comment: "Manager/Employee who scheduled the meeting"),
                    Status = table.Column<string>(type: "enum('Scheduled','Completed','Cancelled')", nullable: false, defaultValueSql: "'Scheduled'", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.MeetingId);
                    table.ForeignKey(
                        name: "meetings_ibfk_1",
                        column: x => x.ScheduledByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "mentorfeedback",
                columns: table => new
                {
                    MentorFeedbackId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MentorEmployeeId = table.Column<int>(type: "int", nullable: true),
                    MentorName = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Comments = table.Column<string>(type: "text", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    SubmittedByEmployeeId = table.Column<int>(type: "int", nullable: true),
                    SubmittedByLegacyId = table.Column<int>(type: "int", nullable: true),
                    IsAnonymous = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.MentorFeedbackId);
                    table.ForeignKey(
                        name: "mentorfeedback_ibfk_1",
                        column: x => x.SubmittedByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "userauthentication",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    Email = table.Column<string>(type: "varchar(255)", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PasswordHash = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "enum('Active','Inactive','Locked')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsFirstLogin = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'1'"),
                    LastLoginAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.UserId);
                    table.UniqueConstraint("AK_userauthentication_EmployeeId", x => x.EmployeeId);
                    table.ForeignKey(
                        name: "userauthentication_ibfk_1",
                        column: x => x.EmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "userprofile",
                columns: table => new
                {
                    ProfileId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    FirstName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MiddleName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LastName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CallingName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ProfilePhoto = table.Column<byte[]>(type: "longblob", nullable: true),
                    ReferredBy = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Gender = table.Column<string>(type: "enum('Male','Female','Other','PreferNotToSay')", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DateOfBirthOfficial = table.Column<DateOnly>(type: "date", nullable: true),
                    DateOfBirthActual = table.Column<DateOnly>(type: "date", nullable: true),
                    MobileNumber = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AlternateNumber = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PersonalEmail = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MaritalStatus = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nationality = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ProfileId);
                    table.ForeignKey(
                        name: "userprofile_ibfk_1",
                        column: x => x.EmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "lndemployeeskillmapper",
                columns: table => new
                {
                    MapperId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    SkillId = table.Column<int>(type: "int", nullable: false),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    UpdatedByEmployeeId = table.Column<int>(type: "int", nullable: false),
                    CreatedByEmployeeId = table.Column<int>(type: "int", nullable: false),
                    CreatedOn = table.Column<DateOnly>(type: "date", nullable: true),
                    UpdatedOn = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.MapperId);
                    table.ForeignKey(
                        name: "FK_EmployeeSkillMapper_CreatedBy",
                        column: x => x.CreatedByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId");
                    table.ForeignKey(
                        name: "FK_EmployeeSkillMapper_Employee",
                        column: x => x.EmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EmployeeSkillMapper_Skill",
                        column: x => x.SkillId,
                        principalTable: "master_skill",
                        principalColumn: "SkillId");
                    table.ForeignKey(
                        name: "FK_EmployeeSkillMapper_UpdatedBy",
                        column: x => x.UpdatedByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.CreateTable(
                name: "departmentbudgets",
                columns: table => new
                {
                    BudgetId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    DepartmentId = table.Column<int>(type: "int", nullable: false),
                    FiscalYear = table.Column<int>(type: "int", nullable: false),
                    TotalBudget = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    AllocatedAmount = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: true, defaultValueSql: "'0.00'"),
                    UtilizedAmount = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: true, defaultValueSql: "'0.00'"),
                    UtilizationPercentage = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true, computedColumnSql: "(`UtilizedAmount` / nullif(`TotalBudget`,0)) * 100", stored: true),
                    Headcount = table.Column<int>(type: "int", nullable: true, defaultValueSql: "'0'"),
                    AvgCostPerEmployee = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: true, computedColumnSql: "case when (`Headcount` > 0) then (`UtilizedAmount` / `Headcount`) else 0 end", stored: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.BudgetId);
                    table.ForeignKey(
                        name: "departmentbudgets_ibfk_1",
                        column: x => x.DepartmentId,
                        principalTable: "department",
                        principalColumn: "DepartmentId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "employeedetailsmaster",
                columns: table => new
                {
                    EmployeeMasterId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    DepartmentId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.EmployeeMasterId);
                    table.ForeignKey(
                        name: "employeedetailsmaster_ibfk_1",
                        column: x => x.EmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "employeedetailsmaster_ibfk_2",
                        column: x => x.RoleId,
                        principalTable: "role",
                        principalColumn: "RoleId");
                    table.ForeignKey(
                        name: "employeedetailsmaster_ibfk_3",
                        column: x => x.DepartmentId,
                        principalTable: "department",
                        principalColumn: "DepartmentId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "engagement",
                columns: table => new
                {
                    engagement_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    department_id = table.Column<int>(type: "int", nullable: true),
                    engagement_score = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    period_start = table.Column<DateTime>(type: "datetime", nullable: true),
                    period_end = table.Column<DateTime>(type: "datetime", nullable: true),
                    trend_score = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.engagement_id);
                    table.ForeignKey(
                        name: "engagement_ibfk_1",
                        column: x => x.department_id,
                        principalTable: "department",
                        principalColumn: "DepartmentId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "risk",
                columns: table => new
                {
                    risk_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    department_id = table.Column<int>(type: "int", nullable: true),
                    risk_type = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    trend_graph = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    period_start = table.Column<DateTime>(type: "datetime", nullable: true),
                    period_end = table.Column<DateTime>(type: "datetime", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.risk_id);
                    table.ForeignKey(
                        name: "risk_ibfk_1",
                        column: x => x.department_id,
                        principalTable: "department",
                        principalColumn: "DepartmentId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "sla",
                columns: table => new
                {
                    SLAId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    SLAType = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "enum('Open','InProgress','Closed','Breached','Extended')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    DepartmentId = table.Column<int>(type: "int", nullable: false),
                    AssignedToEmployeeId = table.Column<int>(type: "int", nullable: true),
                    Deadline = table.Column<DateTime>(type: "datetime", nullable: false),
                    ClosedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    ComplianceStatus = table.Column<string>(type: "enum('OnTime','Breached','Extended','Closed')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ReopenedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    ReopenedByEmployeeId = table.Column<int>(type: "int", nullable: true),
                    ReopenExtensionDays = table.Column<int>(type: "int", nullable: true),
                    ReopenReason = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RelatedEntityType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RelatedEntityId = table.Column<int>(type: "int", nullable: true),
                    CreatedBy = table.Column<int>(type: "int", nullable: true),
                    CreatedByEmployeeId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ReopenCount = table.Column<int>(type: "int", nullable: false),
                    IsAutoClosed = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    LastNotificationSent = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.SLAId);
                    table.ForeignKey(
                        name: "fk_sla_assigned_to_employee",
                        column: x => x.AssignedToEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId");
                    table.ForeignKey(
                        name: "fk_sla_department",
                        column: x => x.DepartmentId,
                        principalTable: "department",
                        principalColumn: "DepartmentId");
                    table.ForeignKey(
                        name: "fk_sla_employee",
                        column: x => x.EmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId");
                    table.ForeignKey(
                        name: "fk_sla_reopened_by_employee",
                        column: x => x.ReopenedByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "slacompliance",
                columns: table => new
                {
                    ComplianceId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    DepartmentId = table.Column<int>(type: "int", nullable: false),
                    TeamId = table.Column<int>(type: "int", nullable: true),
                    Period = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PeriodStartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    PeriodEndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    TotalSLAs = table.Column<int>(type: "int", nullable: false),
                    OnTimeSLAs = table.Column<int>(type: "int", nullable: false),
                    BreachedSLAs = table.Column<int>(type: "int", nullable: false),
                    ExtendedSLAs = table.Column<int>(type: "int", nullable: false),
                    PendingSLAs = table.Column<int>(type: "int", nullable: false),
                    CompliancePercentage = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true, computedColumnSql: "case when (`TotalSLAs` > 0) then round(((`OnTimeSLAs` / `TotalSLAs`) * 100),2) else 0 end", stored: true),
                    CalculatedAt = table.Column<DateTime>(type: "datetime", nullable: false),
                    CalculatedBy = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ComplianceId);
                    table.ForeignKey(
                        name: "fk_slacompliance_calculated_by_employee",
                        column: x => x.CalculatedBy,
                        principalTable: "employee",
                        principalColumn: "EmployeeId");
                    table.ForeignKey(
                        name: "fk_slacompliance_department",
                        column: x => x.DepartmentId,
                        principalTable: "department",
                        principalColumn: "DepartmentId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "lndsme",
                columns: table => new
                {
                    SmeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    SkillId = table.Column<int>(type: "int", nullable: false),
                    AttachmentId = table.Column<int>(type: "int", nullable: true),
                    ApprovedByEmployeeId = table.Column<int>(type: "int", nullable: true),
                    ApprovedOn = table.Column<DateOnly>(type: "date", nullable: true),
                    CreatedOn = table.Column<DateOnly>(type: "date", nullable: true),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValueSql: "'1'")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.SmeId);
                    table.ForeignKey(
                        name: "FK_SME_ApprovedBy",
                        column: x => x.ApprovedByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_SME_Attachment",
                        column: x => x.AttachmentId,
                        principalTable: "lndattachments",
                        principalColumn: "AttachmentId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_SME_Employee",
                        column: x => x.EmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SME_Skill",
                        column: x => x.SkillId,
                        principalTable: "master_skill",
                        principalColumn: "SkillId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.CreateTable(
                name: "meetingparticipants",
                columns: table => new
                {
                    ParticipantId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MeetingId = table.Column<int>(type: "int", nullable: false),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    RSVPStatus = table.Column<string>(type: "enum('Pending','Accepted','Declined','Tentative')", nullable: false, defaultValueSql: "'Pending'", comment: "Employee response to meeting invitation", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RSVPResponseDate = table.Column<DateTime>(type: "datetime", nullable: true, comment: "When employee responded to invitation"),
                    RSVPComments = table.Column<string>(type: "text", nullable: true, comment: "Optional comments from employee (e.g., reason for decline)", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    InvitedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP", comment: "When invitation was sent"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ParticipantId);
                    table.ForeignKey(
                        name: "meetingparticipants_ibfk_1",
                        column: x => x.MeetingId,
                        principalTable: "meetings",
                        principalColumn: "MeetingId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "meetingparticipants_ibfk_2",
                        column: x => x.EmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "mom",
                columns: table => new
                {
                    MOMId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MeetingId = table.Column<int>(type: "int", nullable: true, comment: "NULL if instant MOM without pre-scheduled meeting"),
                    MeetingTitle = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MeetingType = table.Column<string>(type: "enum('One-on-One','Team Meeting','Presentation','Other')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MeetingDate = table.Column<DateTime>(type: "datetime", nullable: false),
                    MeetingLink = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, comment: "Teams/Zoom/Google Meet link", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Attendees = table.Column<string>(type: "text", nullable: false, comment: "Comma-separated list or JSON array of attendee names", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CommentsObservations = table.Column<string>(type: "text", nullable: true, comment: "General comments and observations from the meeting", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SubmittedByEmployeeId = table.Column<int>(type: "int", nullable: false),
                    SubmittedByRole = table.Column<string>(type: "enum('Employee','Manager','HR')", nullable: false, comment: "Role of the person submitting MOM", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsEditable = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValueSql: "'1'", comment: "Managers can edit their own MOMs (US077)"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.MOMId);
                    table.ForeignKey(
                        name: "mom_ibfk_1",
                        column: x => x.MeetingId,
                        principalTable: "meetings",
                        principalColumn: "MeetingId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "mom_ibfk_2",
                        column: x => x.SubmittedByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "assessmentform",
                columns: table => new
                {
                    form_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    name = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    type = table.Column<string>(type: "enum('Self','Manager','HR Summary')", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    created_by = table.Column<int>(type: "int", nullable: true),
                    delivery_enablement = table.Column<string>(type: "enum('Delivery','Enablement')", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    created_at = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.form_id);
                    table.ForeignKey(
                        name: "assessmentform_ibfk_1",
                        column: x => x.created_by,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "auditlogs",
                columns: table => new
                {
                    LogId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    Action = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Details = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IpAddress = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Timestamp = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.LogId);
                    table.ForeignKey(
                        name: "auditlogs_ibfk_1",
                        column: x => x.UserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "bulkoperationlogs",
                columns: table => new
                {
                    LogId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    PerformedByUserId = table.Column<int>(type: "int", nullable: false),
                    OperationType = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TotalRecords = table.Column<int>(type: "int", nullable: false),
                    SuccessCount = table.Column<int>(type: "int", nullable: false),
                    FailureCount = table.Column<int>(type: "int", nullable: false),
                    ErrorDetails = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FileName = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PerformedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.LogId);
                    table.ForeignKey(
                        name: "bulkoperationlogs_ibfk_1",
                        column: x => x.PerformedByUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "hrfeedbackforms",
                columns: table => new
                {
                    FormId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    FormName = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FormDescription = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FormType = table.Column<string>(type: "enum('GeneralFeedback','BiasReview','ProfessionalismReview','PerformanceReview')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedByHRId = table.Column<int>(type: "int", nullable: false),
                    DistributedToEmployeeIds = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Deadline = table.Column<DateTime>(type: "datetime", nullable: true),
                    Status = table.Column<string>(type: "enum('Active','Closed','Draft')", nullable: false, defaultValueSql: "'Draft'", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.FormId);
                    table.ForeignKey(
                        name: "FK_HRForm_CreatedBy",
                        column: x => x.CreatedByHRId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "internalopportunities",
                columns: table => new
                {
                    OpportunityId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    OpportunityName = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DepartmentId = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Requirements = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EligibilityCriteria = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Deadline = table.Column<DateOnly>(type: "date", nullable: false),
                    Status = table.Column<string>(type: "enum('Active','Closed','Draft')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PostedByUserId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.OpportunityId);
                    table.ForeignKey(
                        name: "internalopportunities_ibfk_1",
                        column: x => x.DepartmentId,
                        principalTable: "department",
                        principalColumn: "DepartmentId");
                    table.ForeignKey(
                        name: "internalopportunities_ibfk_2",
                        column: x => x.PostedByUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "leadershipauditlog",
                columns: table => new
                {
                    log_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    user_id = table.Column<int>(type: "int", nullable: true),
                    action = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    target_table = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    target_id = table.Column<int>(type: "int", nullable: true),
                    timestamp = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    status = table.Column<string>(type: "enum('Success','Failure')", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.log_id);
                    table.ForeignKey(
                        name: "leadershipauditlog_ibfk_1",
                        column: x => x.user_id,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "loginattempts",
                columns: table => new
                {
                    AttemptId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Email = table.Column<string>(type: "varchar(255)", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AttemptTime = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    IsSuccessful = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    IpAddress = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UserAgent = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FailureReason = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.AttemptId);
                    table.ForeignKey(
                        name: "loginattempts_ibfk_1",
                        column: x => x.UserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "organizationalpolicies",
                columns: table => new
                {
                    PolicyId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    PolicyName = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Category = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ComplianceGuidance = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "enum('Active','Inactive','Draft')", nullable: false, defaultValueSql: "'Draft'", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DocumentUrl = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DocumentName = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DocumentType = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DocumentSize = table.Column<long>(type: "bigint", nullable: true),
                    DocumentUploadedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    IsPublished = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    PublishedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    PublishedBy = table.Column<int>(type: "int", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.PolicyId);
                    table.ForeignKey(
                        name: "organizationalpolicies_ibfk_1",
                        column: x => x.CreatedByUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "organizationalpolicies_ibfk_2",
                        column: x => x.PublishedBy,
                        principalTable: "userauthentication",
                        principalColumn: "UserId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "organizationwideobjective",
                columns: table => new
                {
                    objective_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    title = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    description = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    department_id = table.Column<int>(type: "int", nullable: true),
                    timeline_start = table.Column<DateTime>(type: "datetime", nullable: true),
                    timeline_end = table.Column<DateTime>(type: "datetime", nullable: true),
                    created_by = table.Column<int>(type: "int", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.objective_id);
                    table.ForeignKey(
                        name: "organizationwideobjective_ibfk_1",
                        column: x => x.department_id,
                        principalTable: "department",
                        principalColumn: "DepartmentId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "organizationwideobjective_ibfk_2",
                        column: x => x.created_by,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "payroll",
                columns: table => new
                {
                    PayrollId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    EmployeeUserId = table.Column<int>(type: "int", nullable: false),
                    DepartmentId = table.Column<int>(type: "int", nullable: false),
                    PayrollPeriod = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    OldSalary = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: true),
                    NewSalary = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    IncrementPercentage = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    EffectiveDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Status = table.Column<string>(type: "enum('Pending','Approved','Processed')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ApprovedByUserId = table.Column<int>(type: "int", nullable: true),
                    Notes = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ApprovedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.PayrollId);
                    table.ForeignKey(
                        name: "payroll_ibfk_1",
                        column: x => x.EmployeeUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "payroll_ibfk_2",
                        column: x => x.DepartmentId,
                        principalTable: "department",
                        principalColumn: "DepartmentId");
                    table.ForeignKey(
                        name: "payroll_ibfk_3",
                        column: x => x.ApprovedByUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "peerfeedbackqueue",
                columns: table => new
                {
                    QueueId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    SubmittedByEmployeeId = table.Column<int>(type: "int", nullable: false),
                    RecipientEmployeeId = table.Column<int>(type: "int", nullable: false),
                    FeedbackContent = table.Column<string>(type: "text", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsAnonymous = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    IsProfessional = table.Column<bool>(type: "tinyint(1)", nullable: true),
                    IsRelevant = table.Column<bool>(type: "tinyint(1)", nullable: true),
                    ApprovedByHRId = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<string>(type: "enum('Pending','UnderHRReview','Approved','Rejected')", nullable: false, defaultValueSql: "'Pending'", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ApprovedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.QueueId);
                    table.ForeignKey(
                        name: "FK_PeerQueue_ApprovedBy",
                        column: x => x.ApprovedByHRId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PeerQueue_Recipient",
                        column: x => x.RecipientEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PeerQueue_SubmittedBy",
                        column: x => x.SubmittedByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "profilechangerequests",
                columns: table => new
                {
                    RequestId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    NewEmployeeCompanyId = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NewEmail = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Reason = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "enum('Pending','Approved','Rejected')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ApprovedByUserId = table.Column<int>(type: "int", nullable: true),
                    AdminRemarks = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RequestedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ProcessedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.RequestId);
                    table.ForeignKey(
                        name: "profilechangerequests_ibfk_1",
                        column: x => x.UserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "profilechangerequests_ibfk_2",
                        column: x => x.ApprovedByUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "recognitionrewards",
                columns: table => new
                {
                    reward_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    employee_id = table.Column<int>(type: "int", nullable: false),
                    reward_type = table.Column<string>(type: "enum('Recognition','Monetary','Non-Monetary')", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    amount_grade = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    reason = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    reward_date = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    submitted_by = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.reward_id);
                    table.ForeignKey(
                        name: "recognitionrewards_ibfk_1",
                        column: x => x.employee_id,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "recognitionrewards_ibfk_2",
                        column: x => x.submitted_by,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "refreshtokens",
                columns: table => new
                {
                    TokenId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Token = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ExpiresAt = table.Column<DateTime>(type: "datetime", nullable: false),
                    IsRevoked = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    RevokedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    IpAddress = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.TokenId);
                    table.ForeignKey(
                        name: "refreshtokens_ibfk_1",
                        column: x => x.UserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "reports",
                columns: table => new
                {
                    report_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    title = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    summary = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    generated_by = table.Column<int>(type: "int", nullable: true),
                    submission_date = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    pdf_path = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    excel_path = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.report_id);
                    table.ForeignKey(
                        name: "reports_ibfk_1",
                        column: x => x.generated_by,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "rewardtype",
                columns: table => new
                {
                    RewardTypeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    RewardCategory = table.Column<string>(type: "enum('Recognition','Promotion')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RewardName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValueSql: "'1'"),
                    IsVisibleForManagerNomination = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedBy = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.RewardTypeId);
                    table.ForeignKey(
                        name: "rewardtype_ibfk_1",
                        column: x => x.CreatedBy,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "teamworkload",
                columns: table => new
                {
                    WorkloadId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TeamId = table.Column<int>(type: "int", nullable: false),
                    ManagerUserId = table.Column<int>(type: "int", nullable: false),
                    MemberCount = table.Column<int>(type: "int", nullable: false),
                    AvgWorkload = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    WorkloadVariance = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    TasksDistributed = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "enum('Balanced','Overloaded','Underutilized')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EvaluationDate = table.Column<DateOnly>(type: "date", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.WorkloadId);
                    table.ForeignKey(
                        name: "teamworkload_ibfk_1",
                        column: x => x.ManagerUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "budgetallocations",
                columns: table => new
                {
                    AllocationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    DepartmentId = table.Column<int>(type: "int", nullable: false),
                    EmployeeUserId = table.Column<int>(type: "int", nullable: true),
                    AllocationType = table.Column<string>(type: "enum('Bonus','Promotion','Training','Other')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Amount = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    GoalStatus = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Notes = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AllocatedByUserId = table.Column<int>(type: "int", nullable: false),
                    AllocatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    BudgetId = table.Column<int>(type: "int", nullable: true),
                    UtilizedAmount = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: true, defaultValueSql: "'0.00'"),
                    UtilizationPercentage = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true, defaultValueSql: "'0.00'"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn),
                    Period = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: true, comment: "Q1, Q2, Q3, Q4", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PeriodYear = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.AllocationId);
                    table.ForeignKey(
                        name: "budgetallocations_ibfk_1",
                        column: x => x.DepartmentId,
                        principalTable: "department",
                        principalColumn: "DepartmentId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "budgetallocations_ibfk_2",
                        column: x => x.EmployeeUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "budgetallocations_ibfk_3",
                        column: x => x.AllocatedByUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "budgetallocations_ibfk_4",
                        column: x => x.BudgetId,
                        principalTable: "departmentbudgets",
                        principalColumn: "BudgetId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "budgetperiodallocations",
                columns: table => new
                {
                    PeriodAllocationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    BudgetId = table.Column<int>(type: "int", nullable: false),
                    Period = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: false, comment: "Q1, Q2, Q3, Q4, H1, H2", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PeriodYear = table.Column<int>(type: "int", nullable: false),
                    AllocatedAmount = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    UtilizedAmount = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    UtilizationPercentage = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    AllocatedByUserId = table.Column<int>(type: "int", nullable: false),
                    AllocatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn),
                    Notes = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.PeriodAllocationId);
                    table.ForeignKey(
                        name: "fk_period_allocated_by",
                        column: x => x.AllocatedByUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "fk_period_budget",
                        column: x => x.BudgetId,
                        principalTable: "departmentbudgets",
                        principalColumn: "BudgetId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "oneononediscussion",
                columns: table => new
                {
                    DiscussionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    HostEmployeeId = table.Column<int>(type: "int", nullable: false),
                    ParticipantEmployeeId = table.Column<int>(type: "int", nullable: false),
                    MeetingLink = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Agenda = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ScheduledAt = table.Column<DateTime>(type: "datetime", nullable: false),
                    DurationMinutes = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<string>(type: "enum('Scheduled','Completed','Cancelled')", nullable: false, defaultValueSql: "'Scheduled'", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsPrivate = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValueSql: "'1'"),
                    RecordingLink = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Notes = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedBy = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.DiscussionId);
                    table.ForeignKey(
                        name: "oneononediscussion_ibfk_1",
                        column: x => x.HostEmployeeId,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "oneononediscussion_ibfk_2",
                        column: x => x.ParticipantEmployeeId,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "oneononediscussion_ibfk_3",
                        column: x => x.CreatedBy,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "peerfeedback",
                columns: table => new
                {
                    PeerFeedbackId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    PeerEmployeeId = table.Column<int>(type: "int", nullable: true),
                    PeerName = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Comments = table.Column<string>(type: "text", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsAnonymous = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    SubmittedByEmployeeId = table.Column<int>(type: "int", nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ManagerReviewed = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.PeerFeedbackId);
                    table.ForeignKey(
                        name: "peerfeedback_ibfk_1",
                        column: x => x.PeerEmployeeId,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "peerfeedback_ibfk_2",
                        column: x => x.SubmittedByEmployeeId,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "project",
                columns: table => new
                {
                    ProjectId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ProjectName = table.Column<string>(type: "varchar(255)", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ClientName = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BusinessUnit = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Department = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EngagementModel = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, defaultValueSql: "'Active'", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: true),
                    ResourceOwnerId = table.Column<int>(type: "int", nullable: true),
                    ResourceOwnerEmployeeId = table.Column<int>(type: "int", nullable: true),
                    L1ApproverId = table.Column<int>(type: "int", nullable: true),
                    L1ApproverEmployeeId = table.Column<int>(type: "int", nullable: true),
                    L2ApproverId = table.Column<int>(type: "int", nullable: true),
                    L2ApproverEmployeeId = table.Column<int>(type: "int", nullable: true),
                    IsDeletable = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValueSql: "'1'"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ProjectId);
                    table.ForeignKey(
                        name: "project_ibfk_1",
                        column: x => x.ResourceOwnerEmployeeId,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "project_ibfk_2",
                        column: x => x.L1ApproverEmployeeId,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "project_ibfk_3",
                        column: x => x.L2ApproverEmployeeId,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "slaescalation",
                columns: table => new
                {
                    EscalationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    SLAId = table.Column<int>(type: "int", nullable: false),
                    Reason = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EscalationLevel = table.Column<string>(type: "enum('L1','L2','DeptHead','Leadership')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EscalatedToEmployeeId = table.Column<int>(type: "int", nullable: false),
                    EscalationStatus = table.Column<string>(type: "enum('Pending','InProgress','Resolved','Rejected')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EscalationDeadline = table.Column<DateTime>(type: "datetime", nullable: true),
                    ResolvedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    ResolvedByEmployeeId = table.Column<int>(type: "int", nullable: true),
                    ResolutionComments = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SubmittedBy = table.Column<int>(type: "int", nullable: true),
                    SubmittedByEmployeeId = table.Column<int>(type: "int", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.EscalationId);
                    table.ForeignKey(
                        name: "fk_slaescalation_escalated_to",
                        column: x => x.EscalatedToEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId");
                    table.ForeignKey(
                        name: "fk_slaescalation_resolved_by",
                        column: x => x.ResolvedByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId");
                    table.ForeignKey(
                        name: "fk_slaescalation_sla",
                        column: x => x.SLAId,
                        principalTable: "sla",
                        principalColumn: "SLAId");
                    table.ForeignKey(
                        name: "fk_slaescalation_submitted_by",
                        column: x => x.SubmittedByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "slanotifications",
                columns: table => new
                {
                    NotificationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    SLAId = table.Column<int>(type: "int", nullable: false),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    NotificationType = table.Column<string>(type: "enum('Reminder','Escalation','Breach','Closure','Reopen')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NotificationSubject = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NotificationBody = table.Column<string>(type: "text", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SentAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    DeliveryStatus = table.Column<string>(type: "enum('Sent','Failed','Read','Pending')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ReadAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    Channel = table.Column<string>(type: "enum('Email','InApp','SMS')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.NotificationId);
                    table.ForeignKey(
                        name: "fk_slanotifications_employee",
                        column: x => x.EmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId");
                    table.ForeignKey(
                        name: "fk_slanotifications_sla",
                        column: x => x.SLAId,
                        principalTable: "sla",
                        principalColumn: "SLAId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "lndassignments",
                columns: table => new
                {
                    AssignmentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MenteeEmployeeId = table.Column<int>(type: "int", nullable: false),
                    SmeId = table.Column<int>(type: "int", nullable: false),
                    SkillId = table.Column<int>(type: "int", nullable: false),
                    Deadline = table.Column<DateTime>(type: "datetime", nullable: true),
                    Status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, defaultValueSql: "'IN_PROGRESS'", collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ProofFilePath = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CompletionNotes = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CompletionRating = table.Column<int>(type: "int", nullable: true),
                    CreatedByEmployeeId = table.Column<int>(type: "int", nullable: false),
                    CreatedOn = table.Column<DateOnly>(type: "date", nullable: true),
                    UpdatedByEmployeeId = table.Column<int>(type: "int", nullable: true),
                    UpdatedOn = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.AssignmentId);
                    table.ForeignKey(
                        name: "FK_LnDAssignments_CreatedBy",
                        column: x => x.CreatedByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId");
                    table.ForeignKey(
                        name: "FK_LnDAssignments_Mentee",
                        column: x => x.MenteeEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LnDAssignments_Skill",
                        column: x => x.SkillId,
                        principalTable: "master_skill",
                        principalColumn: "SkillId");
                    table.ForeignKey(
                        name: "FK_LnDAssignments_Sme",
                        column: x => x.SmeId,
                        principalTable: "lndsme",
                        principalColumn: "SmeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LnDAssignments_UpdatedBy",
                        column: x => x.UpdatedByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.CreateTable(
                name: "mentorfeedbacktracking",
                columns: table => new
                {
                    TrackingId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    SmeId = table.Column<int>(type: "int", nullable: false),
                    MentorEmployeeId = table.Column<int>(type: "int", nullable: false),
                    MenteeEmployeeId = table.Column<int>(type: "int", nullable: false),
                    SkillIdReference = table.Column<int>(type: "int", nullable: false),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    FeedbackComments = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SubmittedByEmployeeId = table.Column<int>(type: "int", nullable: false),
                    FeedbackFrom = table.Column<string>(type: "enum('Mentee','HR','Manager')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsAnonymous = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Status = table.Column<string>(type: "enum('Submitted','Acknowledged','Reviewed','Archived')", nullable: false, defaultValueSql: "'Submitted'", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ReviewedByHRId = table.Column<int>(type: "int", nullable: true),
                    HRReviewComments = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ReviewedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.TrackingId);
                    table.ForeignKey(
                        name: "FK_MentorFeedback_Mentee",
                        column: x => x.MenteeEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MentorFeedback_Mentor",
                        column: x => x.MentorEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MentorFeedback_ReviewedBy",
                        column: x => x.ReviewedByHRId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MentorFeedback_SME",
                        column: x => x.SmeId,
                        principalTable: "lndsme",
                        principalColumn: "SmeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MentorFeedback_Skill",
                        column: x => x.SkillIdReference,
                        principalTable: "master_skill",
                        principalColumn: "SkillId");
                    table.ForeignKey(
                        name: "FK_MentorFeedback_SubmittedBy",
                        column: x => x.SubmittedByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "momactionitems",
                columns: table => new
                {
                    ActionItemId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MOMId = table.Column<int>(type: "int", nullable: false),
                    TaskDescription = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false, comment: "Description of the action item/task", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AssignedToEmployeeId = table.Column<int>(type: "int", nullable: false, comment: "Employee responsible for the task"),
                    DueDate = table.Column<DateOnly>(type: "date", nullable: false, comment: "Deadline for completion"),
                    Status = table.Column<string>(type: "enum('Pending','Completed')", nullable: false, defaultValueSql: "'Pending'", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ActionItemId);
                    table.ForeignKey(
                        name: "momactionitems_ibfk_1",
                        column: x => x.MOMId,
                        principalTable: "mom",
                        principalColumn: "MOMId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "momactionitems_ibfk_2",
                        column: x => x.AssignedToEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "momdiscussionpoints",
                columns: table => new
                {
                    PointId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MOMId = table.Column<int>(type: "int", nullable: false),
                    PointText = table.Column<string>(type: "text", nullable: false, comment: "The discussion point content", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PointOrder = table.Column<int>(type: "int", nullable: false, defaultValueSql: "'1'", comment: "Display order of discussion points")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.PointId);
                    table.ForeignKey(
                        name: "momdiscussionpoints_ibfk_1",
                        column: x => x.MOMId,
                        principalTable: "mom",
                        principalColumn: "MOMId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "momsharing",
                columns: table => new
                {
                    SharingId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MOMId = table.Column<int>(type: "int", nullable: false),
                    SharedByEmployeeId = table.Column<int>(type: "int", nullable: false, comment: "Employee who shared the MOM"),
                    SharedWithEmployeeId = table.Column<int>(type: "int", nullable: false, comment: "Employee who received the shared MOM"),
                    SharedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.SharingId);
                    table.ForeignKey(
                        name: "momsharing_ibfk_1",
                        column: x => x.MOMId,
                        principalTable: "mom",
                        principalColumn: "MOMId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "momsharing_ibfk_2",
                        column: x => x.SharedByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "momsharing_ibfk_3",
                        column: x => x.SharedWithEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "assignment",
                columns: table => new
                {
                    assignment_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    form_id = table.Column<int>(type: "int", nullable: false),
                    employee_id = table.Column<int>(type: "int", nullable: false),
                    assigned_by = table.Column<int>(type: "int", nullable: false),
                    assigned_at = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    deadline = table.Column<DateTime>(type: "datetime", nullable: true),
                    action = table.Column<string>(type: "enum('Send','Save as Draft')", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.assignment_id);
                    table.ForeignKey(
                        name: "assignment_ibfk_1",
                        column: x => x.form_id,
                        principalTable: "assessmentform",
                        principalColumn: "form_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "assignment_ibfk_2",
                        column: x => x.employee_id,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "assignment_ibfk_3",
                        column: x => x.assigned_by,
                        principalTable: "userauthentication",
                        principalColumn: "UserId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "competency",
                columns: table => new
                {
                    competency_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    form_id = table.Column<int>(type: "int", nullable: false),
                    name = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    description = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    display_order = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.competency_id);
                    table.ForeignKey(
                        name: "competency_ibfk_1",
                        column: x => x.form_id,
                        principalTable: "assessmentform",
                        principalColumn: "form_id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "selfassessment",
                columns: table => new
                {
                    assessment_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    form_id = table.Column<int>(type: "int", nullable: false),
                    employee_id = table.Column<int>(type: "int", nullable: false),
                    submitted_at = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    status = table.Column<string>(type: "enum('Draft','Submitted')", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.assessment_id);
                    table.ForeignKey(
                        name: "selfassessment_ibfk_1",
                        column: x => x.form_id,
                        principalTable: "assessmentform",
                        principalColumn: "form_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "selfassessment_ibfk_2",
                        column: x => x.employee_id,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "slareviewtracking",
                columns: table => new
                {
                    ReviewTrackingId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    SLAId = table.Column<int>(type: "int", nullable: false),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    ReviewerId = table.Column<int>(type: "int", nullable: false),
                    ReviewType = table.Column<string>(type: "enum('Self','Manager','Peer','HR')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ReviewCycle = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Deadline = table.Column<DateTime>(type: "datetime", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    Status = table.Column<string>(type: "enum('Pending','InProgress','Submitted','Overdue')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ComplianceStatus = table.Column<string>(type: "enum('OnTime','Late','NotStarted')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FormId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    ReviewerRole = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsManagerSelfReview = table.Column<ulong>(type: "bit(1)", nullable: true),
                    ManagerReviewerId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ReviewTrackingId);
                    table.ForeignKey(
                        name: "fk_slareviewtracking_employee",
                        column: x => x.EmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId");
                    table.ForeignKey(
                        name: "fk_slareviewtracking_form",
                        column: x => x.FormId,
                        principalTable: "assessmentform",
                        principalColumn: "form_id");
                    table.ForeignKey(
                        name: "fk_slareviewtracking_reviewer",
                        column: x => x.ReviewerId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId");
                    table.ForeignKey(
                        name: "fk_slareviewtracking_sla",
                        column: x => x.SLAId,
                        principalTable: "sla",
                        principalColumn: "SLAId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "hrfeedbackformresponses",
                columns: table => new
                {
                    ResponseId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    FormId = table.Column<int>(type: "int", nullable: false),
                    SubmittedByEmployeeId = table.Column<int>(type: "int", nullable: false),
                    FormResponse = table.Column<string>(type: "json", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "enum('Draft','Submitted','Reviewed')", nullable: false, defaultValueSql: "'Draft'", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SubmittedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    ReviewedByHRId = table.Column<int>(type: "int", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    HRReviewComments = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ResponseId);
                    table.ForeignKey(
                        name: "FK_FormResponse_Form",
                        column: x => x.FormId,
                        principalTable: "hrfeedbackforms",
                        principalColumn: "FormId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FormResponse_ReviewedBy",
                        column: x => x.ReviewedByHRId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_FormResponse_SubmittedBy",
                        column: x => x.SubmittedByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "nominations",
                columns: table => new
                {
                    NominationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    OpportunityId = table.Column<int>(type: "int", nullable: false),
                    NomineeUserId = table.Column<int>(type: "int", nullable: false),
                    NominationType = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NominatedByUserId = table.Column<int>(type: "int", nullable: false),
                    Justification = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CurrentApprovalLevel = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    L1ManagerUserId = table.Column<int>(type: "int", nullable: true),
                    L1ReviewRemarks = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    L1ReviewedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    L1Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    L2ManagerUserId = table.Column<int>(type: "int", nullable: true),
                    L2ReviewRemarks = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    L2ReviewedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    L2Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DeptHeadUserId = table.Column<int>(type: "int", nullable: true),
                    DeptHeadReviewRemarks = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DeptHeadReviewedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    DeptHeadStatus = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ReviewedByUserId = table.Column<int>(type: "int", nullable: true),
                    ReviewRemarks = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ReviewedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.NominationId);
                    table.ForeignKey(
                        name: "nominations_ibfk_1",
                        column: x => x.OpportunityId,
                        principalTable: "internalopportunities",
                        principalColumn: "OpportunityId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "nominations_ibfk_2",
                        column: x => x.NomineeUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "nominations_ibfk_3",
                        column: x => x.NominatedByUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "nominations_ibfk_4",
                        column: x => x.L1ManagerUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "nominations_ibfk_5",
                        column: x => x.L2ManagerUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "nominations_ibfk_6",
                        column: x => x.DeptHeadUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "nominations_ibfk_7",
                        column: x => x.ReviewedByUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "policyviolations",
                columns: table => new
                {
                    ViolationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    EmployeeUserId = table.Column<int>(type: "int", nullable: false),
                    PolicyId = table.Column<int>(type: "int", nullable: true),
                    ViolationType = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "text", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Severity = table.Column<string>(type: "enum('Low','Medium','High','Critical')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "enum('Reported','UnderReview','Resolved','Escalated')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ReportedByUserId = table.Column<int>(type: "int", nullable: false),
                    ReportedDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EscalatedToUserId = table.Column<int>(type: "int", nullable: true),
                    ResolutionNotes = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ResolvedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ViolationId);
                    table.ForeignKey(
                        name: "policyviolations_ibfk_1",
                        column: x => x.EmployeeUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "policyviolations_ibfk_2",
                        column: x => x.PolicyId,
                        principalTable: "organizationalpolicies",
                        principalColumn: "PolicyId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "policyviolations_ibfk_3",
                        column: x => x.ReportedByUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "policyviolations_ibfk_4",
                        column: x => x.EscalatedToUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "organizationgoalfeedback",
                columns: table => new
                {
                    OrgGoalFeedbackId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    OrganizationObjectiveId = table.Column<int>(type: "int", nullable: false),
                    SubmittedByEmployeeId = table.Column<int>(type: "int", nullable: false),
                    ManagerEmployeeId = table.Column<int>(type: "int", nullable: true),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    FeedbackComments = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FeedbackFrom = table.Column<string>(type: "enum('Employee','Manager','DeptHead','HR')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsAnonymous = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Status = table.Column<string>(type: "enum('Submitted','Reviewed','Archived')", nullable: false, defaultValueSql: "'Submitted'", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.OrgGoalFeedbackId);
                    table.ForeignKey(
                        name: "FK_OrgGoalFeedback_Manager",
                        column: x => x.ManagerEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_OrgGoalFeedback_Objective",
                        column: x => x.OrganizationObjectiveId,
                        principalTable: "organizationwideobjective",
                        principalColumn: "objective_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrgGoalFeedback_SubmittedBy",
                        column: x => x.SubmittedByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "nominationparameter",
                columns: table => new
                {
                    ParameterId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    RewardTypeId = table.Column<int>(type: "int", nullable: false),
                    ParameterName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ParameterType = table.Column<string>(type: "enum('Text','Number','Rating','Date','TextArea')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsRequired = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'1'"),
                    SortOrder = table.Column<int>(type: "int", nullable: true, defaultValueSql: "'1'"),
                    PlaceholderText = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MinimumValue = table.Column<int>(type: "int", nullable: true),
                    MaximumValue = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ParameterId);
                    table.ForeignKey(
                        name: "nominationparameter_ibfk_1",
                        column: x => x.RewardTypeId,
                        principalTable: "rewardtype",
                        principalColumn: "RewardTypeId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "recognitiondetails",
                columns: table => new
                {
                    OpportunityId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    OpportunityName = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DepartmentId = table.Column<int>(type: "int", nullable: false),
                    RewardTypeId = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Requirements = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EligibilityCriteria = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Deadline = table.Column<DateOnly>(type: "date", nullable: false),
                    Status = table.Column<string>(type: "enum('Active','Closed','Draft')", nullable: false, defaultValueSql: "'Draft'", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PostedByUserId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.OpportunityId);
                    table.ForeignKey(
                        name: "recognitiondetails_ibfk_1",
                        column: x => x.DepartmentId,
                        principalTable: "department",
                        principalColumn: "DepartmentId");
                    table.ForeignKey(
                        name: "recognitiondetails_ibfk_2",
                        column: x => x.PostedByUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "recognitiondetails_ibfk_3",
                        column: x => x.RewardTypeId,
                        principalTable: "rewardtype",
                        principalColumn: "RewardTypeId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "goals",
                columns: table => new
                {
                    goal_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    goal_type = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    project_id = table.Column<int>(type: "int", nullable: true),
                    goal_title = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    goal_description = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    goalcreatedat = table.Column<DateTime>(type: "datetime", nullable: true),
                    goalendat = table.Column<DateTime>(type: "datetime", nullable: true),
                    created_by = table.Column<int>(type: "int", nullable: true),
                    goalstatus = table.Column<string>(type: "enum('pending','open','inprogress','completed','closed','expired','reopened')", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    reopened_by = table.Column<int>(type: "int", nullable: true),
                    reopened_on = table.Column<DateTime>(type: "timestamp", nullable: true),
                    reopen_until = table.Column<DateTime>(type: "timestamp", nullable: true),
                    closed_by = table.Column<int>(type: "int", nullable: true),
                    closed_on = table.Column<DateTime>(type: "timestamp", nullable: true),
                    closure_reason = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.goal_id);
                    table.ForeignKey(
                        name: "goals_ibfk_1",
                        column: x => x.project_id,
                        principalTable: "project",
                        principalColumn: "ProjectId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "goals_ibfk_2",
                        column: x => x.created_by,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "goals_ibfk_3",
                        column: x => x.reopened_by,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "goals_ibfk_4",
                        column: x => x.closed_by,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "projectemployees",
                columns: table => new
                {
                    ProjectId = table.Column<int>(type: "int", nullable: false),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    isPrimary = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => new { x.ProjectId, x.EmployeeId })
                        .Annotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                    table.ForeignKey(
                        name: "projectemployees_ibfk_1",
                        column: x => x.ProjectId,
                        principalTable: "project",
                        principalColumn: "ProjectId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "projectemployees_ibfk_2",
                        column: x => x.EmployeeId,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "slahistory",
                columns: table => new
                {
                    SLAHistoryId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    SLAId = table.Column<int>(type: "int", nullable: false),
                    ChangeType = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ChangedFrom = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ChangedTo = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ChangedByEmployeeId = table.Column<int>(type: "int", nullable: true),
                    ReferenceEscalationId = table.Column<int>(type: "int", nullable: true),
                    Reason = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Metadata = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.SLAHistoryId);
                    table.ForeignKey(
                        name: "fk_slahistory_changed_by",
                        column: x => x.ChangedByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId");
                    table.ForeignKey(
                        name: "fk_slahistory_reference_escalation",
                        column: x => x.ReferenceEscalationId,
                        principalTable: "slaescalation",
                        principalColumn: "EscalationId");
                    table.ForeignKey(
                        name: "fk_slahistory_sla",
                        column: x => x.SLAId,
                        principalTable: "sla",
                        principalColumn: "SLAId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "lndapprovals",
                columns: table => new
                {
                    ApprovalId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ApprovalType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AssignmentId = table.Column<int>(type: "int", nullable: true),
                    SkillId = table.Column<int>(type: "int", nullable: true),
                    AttachmentId = table.Column<int>(type: "int", nullable: true),
                    RequesterEmployeeId = table.Column<int>(type: "int", nullable: false),
                    ApproverEmployeeId = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, defaultValueSql: "'PENDING'", collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Notes = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_0900_ai_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RequestedOn = table.Column<DateOnly>(type: "date", nullable: true),
                    UpdatedOn = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ApprovalId);
                    table.ForeignKey(
                        name: "FK_LndApprovals_Approver",
                        column: x => x.ApproverEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_LndApprovals_Assignment",
                        column: x => x.AssignmentId,
                        principalTable: "lndassignments",
                        principalColumn: "AssignmentId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LndApprovals_Attachment",
                        column: x => x.AttachmentId,
                        principalTable: "lndattachments",
                        principalColumn: "AttachmentId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_LndApprovals_Requester",
                        column: x => x.RequesterEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId");
                    table.ForeignKey(
                        name: "FK_LndApprovals_Skill",
                        column: x => x.SkillId,
                        principalTable: "master_skill",
                        principalColumn: "SkillId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.CreateTable(
                name: "formprogresstracker",
                columns: table => new
                {
                    tracker_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    assignment_id = table.Column<int>(type: "int", nullable: false),
                    initiated = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    sent_to_employee = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    employee_completed = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    sent_to_manager = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    manager_completed = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    sent_to_dept_head = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    sent_to_leadership = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    last_updated = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.tracker_id);
                    table.ForeignKey(
                        name: "formprogresstracker_ibfk_1",
                        column: x => x.assignment_id,
                        principalTable: "assignment",
                        principalColumn: "assignment_id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "assessmentdetail",
                columns: table => new
                {
                    detail_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    assessment_id = table.Column<int>(type: "int", nullable: false),
                    competency_id = table.Column<int>(type: "int", nullable: false),
                    employee_rating = table.Column<int>(type: "int", nullable: true),
                    employee_comments = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.detail_id);
                    table.ForeignKey(
                        name: "assessmentdetail_ibfk_1",
                        column: x => x.assessment_id,
                        principalTable: "selfassessment",
                        principalColumn: "assessment_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "assessmentdetail_ibfk_2",
                        column: x => x.competency_id,
                        principalTable: "competency",
                        principalColumn: "competency_id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "departmentheadapprovals",
                columns: table => new
                {
                    ApprovalId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    ProjectId = table.Column<int>(type: "int", nullable: false),
                    AssessmentId = table.Column<int>(type: "int", nullable: false),
                    ApprovedBy = table.Column<int>(type: "int", nullable: false),
                    ApprovedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, defaultValueSql: "'Approved'", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AcknowledgedByEmployee = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    AcknowledgedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    EmployeeComments = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ApprovalId);
                    table.ForeignKey(
                        name: "departmentheadapprovals_ibfk_1",
                        column: x => x.EmployeeId,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "departmentheadapprovals_ibfk_2",
                        column: x => x.ProjectId,
                        principalTable: "project",
                        principalColumn: "ProjectId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "departmentheadapprovals_ibfk_3",
                        column: x => x.AssessmentId,
                        principalTable: "selfassessment",
                        principalColumn: "assessment_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "departmentheadapprovals_ibfk_4",
                        column: x => x.ApprovedBy,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "selfassessmentattachment",
                columns: table => new
                {
                    attachment_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    assessment_id = table.Column<int>(type: "int", nullable: false),
                    uploaded_by = table.Column<int>(type: "int", nullable: true),
                    file_name = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    file_path = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    file_type = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    file_size = table.Column<long>(type: "bigint", nullable: true),
                    attachment_note = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    display_order = table.Column<int>(type: "int", nullable: true, defaultValueSql: "'0'"),
                    uploaded_at = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.attachment_id);
                    table.ForeignKey(
                        name: "selfassessmentattachment_ibfk_1",
                        column: x => x.assessment_id,
                        principalTable: "selfassessment",
                        principalColumn: "assessment_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "selfassessmentattachment_ibfk_2",
                        column: x => x.uploaded_by,
                        principalTable: "userauthentication",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "managernominationtracking",
                columns: table => new
                {
                    TrackingId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    NominationId = table.Column<int>(type: "int", nullable: false),
                    ViewedByUserId = table.Column<int>(type: "int", nullable: false),
                    ViewedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ActionTaken = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.TrackingId);
                    table.ForeignKey(
                        name: "managernominationtracking_ibfk_1",
                        column: x => x.NominationId,
                        principalTable: "nominations",
                        principalColumn: "NominationId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "managernominationtracking_ibfk_2",
                        column: x => x.ViewedByUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "nominationreviewmetrics",
                columns: table => new
                {
                    MetricId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    NominationId = table.Column<int>(type: "int", nullable: false),
                    ReviewedByUserId = table.Column<int>(type: "int", nullable: false),
                    MeritScore = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    DiversityScore = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    ConflictOfInterest = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    ReviewNotes = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ReviewedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.MetricId);
                    table.ForeignKey(
                        name: "nominationreviewmetrics_ibfk_1",
                        column: x => x.NominationId,
                        principalTable: "nominations",
                        principalColumn: "NominationId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "nominationreviewmetrics_ibfk_2",
                        column: x => x.ReviewedByUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "promotions",
                columns: table => new
                {
                    PromotionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    EmployeeUserId = table.Column<int>(type: "int", nullable: false),
                    DepartmentId = table.Column<int>(type: "int", nullable: false),
                    OldRole = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NewRole = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    OldSalary = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: true),
                    NewSalary = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    IncrementPercentage = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    PromotionDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Justification = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ApprovedByUserId = table.Column<int>(type: "int", nullable: true),
                    NominationId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ApprovedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.PromotionId);
                    table.ForeignKey(
                        name: "promotions_ibfk_1",
                        column: x => x.EmployeeUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "promotions_ibfk_2",
                        column: x => x.DepartmentId,
                        principalTable: "department",
                        principalColumn: "DepartmentId");
                    table.ForeignKey(
                        name: "promotions_ibfk_3",
                        column: x => x.ApprovedByUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "promotions_ibfk_4",
                        column: x => x.NominationId,
                        principalTable: "nominations",
                        principalColumn: "NominationId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "recognitionstatus",
                columns: table => new
                {
                    NominationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    OpportunityId = table.Column<int>(type: "int", nullable: false),
                    NomineeEmployeeId = table.Column<int>(type: "int", nullable: false),
                    NominationType = table.Column<string>(type: "enum('SelfNomination','ManagerNomination')", nullable: false, defaultValueSql: "'ManagerNomination'", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NominatedByEmployeeId = table.Column<int>(type: "int", nullable: false),
                    Justification = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "enum('Pending','UnderReview','Approved','Rejected')", nullable: false, defaultValueSql: "'Pending'", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ReviewedByEmployeeId = table.Column<int>(type: "int", nullable: true),
                    ReviewRemarks = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SubmittedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ReviewedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.NominationId);
                    table.ForeignKey(
                        name: "recognitionstatus_ibfk_1",
                        column: x => x.OpportunityId,
                        principalTable: "recognitiondetails",
                        principalColumn: "OpportunityId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "recognitionstatus_ibfk_2",
                        column: x => x.NomineeEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "recognitionstatus_ibfk_3",
                        column: x => x.NominatedByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "recognitionstatus_ibfk_4",
                        column: x => x.ReviewedByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "feedback",
                columns: table => new
                {
                    FeedbackId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    FeedbackType = table.Column<string>(type: "enum('GoalBased','ProjectBased','PeerFeedback','MentorFeedback','HRForm','OrganizationalGoal','BiasReview')", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SubmittedByEmployeeId = table.Column<int>(type: "int", nullable: true),
                    RecipientEmployeeId = table.Column<int>(type: "int", nullable: false),
                    RelatedGoalId = table.Column<int>(type: "int", nullable: true),
                    RelatedProjectId = table.Column<int>(type: "int", nullable: true),
                    RelatedMentorId = table.Column<int>(type: "int", nullable: true),
                    RelatedOrganizationGoalId = table.Column<int>(type: "int", nullable: true),
                    Rating = table.Column<int>(type: "int", nullable: true),
                    Comments = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsAnonymous = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    BiasFlag = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    FairnessFlag = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    IsApprovedForPeerReview = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Status = table.Column<string>(type: "enum('Draft','Submitted','UnderHRReview','Reviewed','Archived')", nullable: false, defaultValueSql: "'Draft'", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ReviewedByHRId = table.Column<int>(type: "int", nullable: true),
                    HRReviewComments = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn),
                    SubmittedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.FeedbackId);
                    table.ForeignKey(
                        name: "FK_Feedback_Goal",
                        column: x => x.RelatedGoalId,
                        principalTable: "goals",
                        principalColumn: "goal_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Feedback_Mentor",
                        column: x => x.RelatedMentorId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Feedback_Project",
                        column: x => x.RelatedProjectId,
                        principalTable: "project",
                        principalColumn: "ProjectId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Feedback_Recipient",
                        column: x => x.RecipientEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Feedback_ReviewedBy",
                        column: x => x.ReviewedByHRId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Feedback_SubmittedBy",
                        column: x => x.SubmittedByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "goal_approvals",
                columns: table => new
                {
                    approval_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    goal_id = table.Column<int>(type: "int", nullable: false),
                    approval_type = table.Column<string>(type: "enum('creation','completion','reopening','delegation','selfgoalactivation','task_acknowledgment','closure','reactivation')", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    requested_by = table.Column<int>(type: "int", nullable: true),
                    requested_on = table.Column<DateTime>(type: "timestamp", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    approved_by = table.Column<int>(type: "int", nullable: true),
                    approved_on = table.Column<DateTime>(type: "timestamp", nullable: true),
                    approval_status = table.Column<string>(type: "enum('pending','approved','rejected')", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.approval_id);
                    table.ForeignKey(
                        name: "goal_approvals_ibfk_1",
                        column: x => x.goal_id,
                        principalTable: "goals",
                        principalColumn: "goal_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "goal_approvals_ibfk_2",
                        column: x => x.requested_by,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "goal_approvals_ibfk_3",
                        column: x => x.approved_by,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "goal_assignment",
                columns: table => new
                {
                    assignment_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    goal_id = table.Column<int>(type: "int", nullable: false),
                    assigned_by = table.Column<int>(type: "int", nullable: true),
                    assigned_to = table.Column<int>(type: "int", nullable: true),
                    assigned_on = table.Column<DateTime>(type: "timestamp", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    is_acknowledged = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    acknowledged_on = table.Column<DateTime>(type: "timestamp", nullable: true),
                    acknowledged_by = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.assignment_id);
                    table.ForeignKey(
                        name: "goal_assignment_ibfk_1",
                        column: x => x.goal_id,
                        principalTable: "goals",
                        principalColumn: "goal_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "goal_assignment_ibfk_2",
                        column: x => x.assigned_by,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "goal_assignment_ibfk_3",
                        column: x => x.assigned_to,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "goal_assignment_ibfk_4",
                        column: x => x.acknowledged_by,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "goal_checklist",
                columns: table => new
                {
                    checklist_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    goal_id = table.Column<int>(type: "int", nullable: false),
                    item_title = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    item_description = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    is_shared = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    added_by = table.Column<int>(type: "int", nullable: true),
                    added_for = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.checklist_id);
                    table.ForeignKey(
                        name: "goal_checklist_ibfk_1",
                        column: x => x.goal_id,
                        principalTable: "goals",
                        principalColumn: "goal_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "goal_checklist_ibfk_2",
                        column: x => x.added_by,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "goal_checklist_ibfk_3",
                        column: x => x.added_for,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "goal_comments",
                columns: table => new
                {
                    goalcommentid = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    goal_id = table.Column<int>(type: "int", nullable: false),
                    goal_comment = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    commented_by = table.Column<int>(type: "int", nullable: true),
                    commented_on = table.Column<DateTime>(type: "timestamp", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.goalcommentid);
                    table.ForeignKey(
                        name: "goal_comments_ibfk_1",
                        column: x => x.goal_id,
                        principalTable: "goals",
                        principalColumn: "goal_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "goal_comments_ibfk_2",
                        column: x => x.commented_by,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "goalprogresslog",
                columns: table => new
                {
                    progress_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    goal_id = table.Column<int>(type: "int", nullable: false),
                    updated_by = table.Column<int>(type: "int", nullable: true),
                    updated_on = table.Column<DateTime>(type: "timestamp", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    progress_percent = table.Column<int>(type: "int", nullable: true),
                    source = table.Column<string>(type: "enum('manual','auto')", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.progress_id);
                    table.ForeignKey(
                        name: "goalprogresslog_ibfk_1",
                        column: x => x.goal_id,
                        principalTable: "goals",
                        principalColumn: "goal_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "goalprogresslog_ibfk_2",
                        column: x => x.updated_by,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "managerreviewcomments",
                columns: table => new
                {
                    ReviewCommentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ManagerEmployeeId = table.Column<int>(type: "int", nullable: false),
                    TargetEmployeeId = table.Column<int>(type: "int", nullable: false),
                    TargetGoalId = table.Column<int>(type: "int", nullable: true),
                    TargetOrganizationGoalId = table.Column<int>(type: "int", nullable: true),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    ReviewComment = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "enum('Draft','Submitted','Modified','Finalized')", nullable: false, defaultValueSql: "'Draft'", collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    SubmittedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ReviewCommentId);
                    table.ForeignKey(
                        name: "FK_ManagerReview_Goal",
                        column: x => x.TargetGoalId,
                        principalTable: "goals",
                        principalColumn: "goal_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ManagerReview_Manager",
                        column: x => x.ManagerEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ManagerReview_Target",
                        column: x => x.TargetEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "projectgoalfeedback",
                columns: table => new
                {
                    FeedbackId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    EmployeeMasterId = table.Column<int>(type: "int", nullable: false),
                    ProjectId = table.Column<int>(type: "int", nullable: false),
                    GoalId = table.Column<int>(type: "int", nullable: false),
                    FeedbackText = table.Column<string>(type: "longtext", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "datetime", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.FeedbackId);
                    table.ForeignKey(
                        name: "FK_Projectgoalfeedback_Employee",
                        column: x => x.EmployeeMasterId,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId");
                    table.ForeignKey(
                        name: "FK_Projectgoalfeedback_Goal",
                        column: x => x.GoalId,
                        principalTable: "goals",
                        principalColumn: "goal_id");
                    table.ForeignKey(
                        name: "FK_Projectgoalfeedback_Project",
                        column: x => x.ProjectId,
                        principalTable: "project",
                        principalColumn: "ProjectId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "review",
                columns: table => new
                {
                    ReviewId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    GoalId = table.Column<int>(type: "int", nullable: true),
                    GoalName = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Comments = table.Column<string>(type: "text", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SubmittedBy = table.Column<int>(type: "int", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ReviewId);
                    table.ForeignKey(
                        name: "review_ibfk_1",
                        column: x => x.GoalId,
                        principalTable: "goals",
                        principalColumn: "goal_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "review_ibfk_2",
                        column: x => x.SubmittedBy,
                        principalTable: "employee",
                        principalColumn: "EmployeeId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "assessmentreview",
                columns: table => new
                {
                    review_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    detail_id = table.Column<int>(type: "int", nullable: false),
                    reviewer_id = table.Column<int>(type: "int", nullable: false),
                    reviewer_role = table.Column<string>(type: "enum('Approver','Reviewer')", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    rating = table.Column<int>(type: "int", nullable: true),
                    comments = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    reviewed_at = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    review_status = table.Column<string>(type: "enum('Approved','Rejected','Pending')", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.review_id);
                    table.ForeignKey(
                        name: "assessmentreview_ibfk_1",
                        column: x => x.detail_id,
                        principalTable: "assessmentdetail",
                        principalColumn: "detail_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "assessmentreview_ibfk_2",
                        column: x => x.reviewer_id,
                        principalTable: "userauthentication",
                        principalColumn: "UserId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "promotionhistory",
                columns: table => new
                {
                    HistoryId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    EmployeeUserId = table.Column<int>(type: "int", nullable: false),
                    PromotionId = table.Column<int>(type: "int", nullable: false),
                    FromRole = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ToRole = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SalaryChange = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    PromotionDate = table.Column<DateOnly>(type: "date", nullable: false),
                    RecordedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.HistoryId);
                    table.ForeignKey(
                        name: "promotionhistory_ibfk_1",
                        column: x => x.EmployeeUserId,
                        principalTable: "userauthentication",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "promotionhistory_ibfk_2",
                        column: x => x.PromotionId,
                        principalTable: "promotions",
                        principalColumn: "PromotionId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "nominationparametervalues",
                columns: table => new
                {
                    ValueId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    NominationId = table.Column<int>(type: "int", nullable: false),
                    ParameterId = table.Column<int>(type: "int", nullable: false),
                    ParameterValue = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ValueId);
                    table.ForeignKey(
                        name: "nominationparametervalues_ibfk_1",
                        column: x => x.NominationId,
                        principalTable: "recognitionstatus",
                        principalColumn: "NominationId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "nominationparametervalues_ibfk_2",
                        column: x => x.ParameterId,
                        principalTable: "nominationparameter",
                        principalColumn: "ParameterId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "nominationvisibilitytracking",
                columns: table => new
                {
                    TrackingId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    NominationId = table.Column<int>(type: "int", nullable: false),
                    ViewedByEmployeeId = table.Column<int>(type: "int", nullable: false),
                    ViewedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ActionTaken = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.TrackingId);
                    table.ForeignKey(
                        name: "nominationvisibilitytracking_ibfk_1",
                        column: x => x.NominationId,
                        principalTable: "recognitionstatus",
                        principalColumn: "NominationId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "nominationvisibilitytracking_ibfk_2",
                        column: x => x.ViewedByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "feedbackedithistory",
                columns: table => new
                {
                    HistoryId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    FeedbackId = table.Column<int>(type: "int", nullable: false),
                    EditedByEmployeeId = table.Column<int>(type: "int", nullable: false),
                    OriginalContent = table.Column<string>(type: "text", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UpdatedContent = table.Column<string>(type: "text", nullable: false, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ChangeReason = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EditedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.HistoryId);
                    table.ForeignKey(
                        name: "FK_EditHistory_EditedBy",
                        column: x => x.EditedByEmployeeId,
                        principalTable: "employee",
                        principalColumn: "EmployeeId");
                    table.ForeignKey(
                        name: "FK_EditHistory_Feedback",
                        column: x => x.FeedbackId,
                        principalTable: "feedback",
                        principalColumn: "FeedbackId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "feedbackquestionresponse",
                columns: table => new
                {
                    ResponseId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    FeedbackId = table.Column<int>(type: "int", nullable: false),
                    QuestionId = table.Column<int>(type: "int", nullable: false),
                    RatingValue = table.Column<int>(type: "int", nullable: true),
                    BooleanValue = table.Column<bool>(type: "tinyint(1)", nullable: true),
                    TextValue = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SelectedOptions = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.ResponseId);
                    table.ForeignKey(
                        name: "FK_Response_Feedback",
                        column: x => x.FeedbackId,
                        principalTable: "feedback",
                        principalColumn: "FeedbackId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Response_Question",
                        column: x => x.QuestionId,
                        principalTable: "feedbackquestion",
                        principalColumn: "QuestionId");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "goal_attachments",
                columns: table => new
                {
                    goalattachmentsid = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    goal_id = table.Column<int>(type: "int", nullable: false),
                    attachment_title = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    attachments = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_unicode_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    attached_by = table.Column<int>(type: "int", nullable: true),
                    attached_on = table.Column<DateTime>(type: "timestamp", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    is_proof_of_completion = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    linked_approval_id = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.goalattachmentsid);
                    table.ForeignKey(
                        name: "goal_attachments_ibfk_1",
                        column: x => x.goal_id,
                        principalTable: "goals",
                        principalColumn: "goal_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "goal_attachments_ibfk_2",
                        column: x => x.attached_by,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "goal_attachments_ibfk_3",
                        column: x => x.linked_approval_id,
                        principalTable: "goal_approvals",
                        principalColumn: "approval_id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateTable(
                name: "goalchecklistprogress",
                columns: table => new
                {
                    checklist_progress_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    checklist_id = table.Column<int>(type: "int", nullable: false),
                    user_id = table.Column<int>(type: "int", nullable: true),
                    is_completed = table.Column<bool>(type: "tinyint(1)", nullable: true, defaultValueSql: "'0'"),
                    completed_on = table.Column<DateTime>(type: "timestamp", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.checklist_progress_id);
                    table.ForeignKey(
                        name: "goalchecklistprogress_ibfk_1",
                        column: x => x.checklist_id,
                        principalTable: "goal_checklist",
                        principalColumn: "checklist_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "goalchecklistprogress_ibfk_2",
                        column: x => x.user_id,
                        principalTable: "employeedetailsmaster",
                        principalColumn: "EmployeeMasterId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_unicode_ci");

            migrationBuilder.CreateIndex(
                name: "idx_address_type",
                table: "address",
                column: "AddressType");

            migrationBuilder.CreateIndex(
                name: "idx_employee",
                table: "address",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "competency_id",
                table: "assessmentdetail",
                column: "competency_id");

            migrationBuilder.CreateIndex(
                name: "idx_assessment",
                table: "assessmentdetail",
                column: "assessment_id");

            migrationBuilder.CreateIndex(
                name: "created_by",
                table: "assessmentform",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "idx_type",
                table: "assessmentform",
                column: "type");

            migrationBuilder.CreateIndex(
                name: "idx_detail",
                table: "assessmentreview",
                column: "detail_id");

            migrationBuilder.CreateIndex(
                name: "idx_reviewer",
                table: "assessmentreview",
                column: "reviewer_id");

            migrationBuilder.CreateIndex(
                name: "assigned_by",
                table: "assignment",
                column: "assigned_by");

            migrationBuilder.CreateIndex(
                name: "idx_employee1",
                table: "assignment",
                column: "employee_id");

            migrationBuilder.CreateIndex(
                name: "idx_form",
                table: "assignment",
                column: "form_id");

            migrationBuilder.CreateIndex(
                name: "idx_timestamp",
                table: "auditlogs",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "idx_user_action",
                table: "auditlogs",
                columns: new[] { "UserId", "Action" });

            migrationBuilder.CreateIndex(
                name: "AllocatedByUserId",
                table: "budgetallocations",
                column: "AllocatedByUserId");

            migrationBuilder.CreateIndex(
                name: "EmployeeUserId",
                table: "budgetallocations",
                column: "EmployeeUserId");

            migrationBuilder.CreateIndex(
                name: "idx_allocation_type",
                table: "budgetallocations",
                column: "AllocationType");

            migrationBuilder.CreateIndex(
                name: "idx_budget",
                table: "budgetallocations",
                column: "BudgetId");

            migrationBuilder.CreateIndex(
                name: "idx_department",
                table: "budgetallocations",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "idx_allocated_by",
                table: "budgetperiodallocations",
                column: "AllocatedByUserId");

            migrationBuilder.CreateIndex(
                name: "idx_budget_period_year",
                table: "budgetperiodallocations",
                columns: new[] { "BudgetId", "Period", "PeriodYear" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_budget1",
                table: "budgetperiodallocations",
                column: "BudgetId");

            migrationBuilder.CreateIndex(
                name: "idx_operation_type",
                table: "bulkoperationlogs",
                column: "OperationType");

            migrationBuilder.CreateIndex(
                name: "idx_performed_at",
                table: "bulkoperationlogs",
                column: "PerformedAt");

            migrationBuilder.CreateIndex(
                name: "idx_performed_by",
                table: "bulkoperationlogs",
                column: "PerformedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ChangeRequests_EmployeeId",
                table: "changerequests",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_form1",
                table: "competency",
                column: "form_id");

            migrationBuilder.CreateIndex(
                name: "idx_department_code",
                table: "department",
                column: "DepartmentCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_department_hod",
                table: "department",
                column: "HodEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_department_name",
                table: "department",
                column: "DepartmentName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_department_parent",
                table: "department",
                column: "ParentDepartmentId");

            migrationBuilder.CreateIndex(
                name: "idx_department_status",
                table: "department",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "idx_department_year",
                table: "departmentbudgets",
                columns: new[] { "DepartmentId", "FiscalYear" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ApprovedBy",
                table: "departmentheadapprovals",
                column: "ApprovedBy");

            migrationBuilder.CreateIndex(
                name: "AssessmentId",
                table: "departmentheadapprovals",
                column: "AssessmentId");

            migrationBuilder.CreateIndex(
                name: "idx_acknowledged",
                table: "departmentheadapprovals",
                column: "AcknowledgedByEmployee");

            migrationBuilder.CreateIndex(
                name: "idx_approved_at",
                table: "departmentheadapprovals",
                column: "ApprovedAt");

            migrationBuilder.CreateIndex(
                name: "idx_employee2",
                table: "departmentheadapprovals",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "ProjectId",
                table: "departmentheadapprovals",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "EmployeeCompanyId",
                table: "employee",
                column: "EmployeeCompanyId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_employment_status",
                table: "employee",
                column: "EmploymentStatus");

            migrationBuilder.CreateIndex(
                name: "idx_is_active",
                table: "employee",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "ReportingManagerEmployeeId",
                table: "employee",
                column: "ReportingManagerEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_department1",
                table: "employeedetailsmaster",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "idx_employee3",
                table: "employeedetailsmaster",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_role",
                table: "employeedetailsmaster",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "idx_department2",
                table: "engagement",
                column: "department_id");

            migrationBuilder.CreateIndex(
                name: "FK_Feedback_Goal",
                table: "feedback",
                column: "RelatedGoalId");

            migrationBuilder.CreateIndex(
                name: "FK_Feedback_Mentor",
                table: "feedback",
                column: "RelatedMentorId");

            migrationBuilder.CreateIndex(
                name: "FK_Feedback_Project",
                table: "feedback",
                column: "RelatedProjectId");

            migrationBuilder.CreateIndex(
                name: "FK_Feedback_ReviewedBy",
                table: "feedback",
                column: "ReviewedByHRId");

            migrationBuilder.CreateIndex(
                name: "idx_anonymous",
                table: "feedback",
                column: "IsAnonymous");

            migrationBuilder.CreateIndex(
                name: "idx_bias_flag",
                table: "feedback",
                column: "BiasFlag");

            migrationBuilder.CreateIndex(
                name: "idx_created_at",
                table: "feedback",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "idx_fairness_flag",
                table: "feedback",
                column: "FairnessFlag");

            migrationBuilder.CreateIndex(
                name: "idx_feedback_type",
                table: "feedback",
                column: "FeedbackType");

            migrationBuilder.CreateIndex(
                name: "idx_rating",
                table: "feedback",
                column: "Rating");

            migrationBuilder.CreateIndex(
                name: "idx_recipient",
                table: "feedback",
                column: "RecipientEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_status",
                table: "feedback",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "idx_submitted_at",
                table: "feedback",
                column: "SubmittedAt");

            migrationBuilder.CreateIndex(
                name: "idx_submitted_by",
                table: "feedback",
                column: "SubmittedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_edited_at",
                table: "feedbackedithistory",
                column: "EditedAt");

            migrationBuilder.CreateIndex(
                name: "idx_edited_by",
                table: "feedbackedithistory",
                column: "EditedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_feedback",
                table: "feedbackedithistory",
                column: "FeedbackId");

            migrationBuilder.CreateIndex(
                name: "idx_feedback_type1",
                table: "feedbackquestion",
                column: "FeedbackType");

            migrationBuilder.CreateIndex(
                name: "idx_is_active1",
                table: "feedbackquestion",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "uniq_question_code",
                table: "feedbackquestion",
                column: "QuestionCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_feedback1",
                table: "feedbackquestionresponse",
                column: "FeedbackId");

            migrationBuilder.CreateIndex(
                name: "idx_question",
                table: "feedbackquestionresponse",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "uniq_feedback_question",
                table: "feedbackquestionresponse",
                columns: new[] { "FeedbackId", "QuestionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_assignment",
                table: "formprogresstracker",
                column: "assignment_id");

            migrationBuilder.CreateIndex(
                name: "approved_by",
                table: "goal_approvals",
                column: "approved_by");

            migrationBuilder.CreateIndex(
                name: "idx_goal",
                table: "goal_approvals",
                column: "goal_id");

            migrationBuilder.CreateIndex(
                name: "idx_status1",
                table: "goal_approvals",
                column: "approval_status");

            migrationBuilder.CreateIndex(
                name: "requested_by",
                table: "goal_approvals",
                column: "requested_by");

            migrationBuilder.CreateIndex(
                name: "acknowledged_by",
                table: "goal_assignment",
                column: "acknowledged_by");

            migrationBuilder.CreateIndex(
                name: "assigned_by1",
                table: "goal_assignment",
                column: "assigned_by");

            migrationBuilder.CreateIndex(
                name: "idx_acknowledged1",
                table: "goal_assignment",
                column: "is_acknowledged");

            migrationBuilder.CreateIndex(
                name: "idx_assigned_to",
                table: "goal_assignment",
                column: "assigned_to");

            migrationBuilder.CreateIndex(
                name: "idx_goal1",
                table: "goal_assignment",
                column: "goal_id");

            migrationBuilder.CreateIndex(
                name: "attached_by",
                table: "goal_attachments",
                column: "attached_by");

            migrationBuilder.CreateIndex(
                name: "idx_goal2",
                table: "goal_attachments",
                column: "goal_id");

            migrationBuilder.CreateIndex(
                name: "idx_linked_approval",
                table: "goal_attachments",
                column: "linked_approval_id");

            migrationBuilder.CreateIndex(
                name: "idx_proof",
                table: "goal_attachments",
                column: "is_proof_of_completion");

            migrationBuilder.CreateIndex(
                name: "added_by",
                table: "goal_checklist",
                column: "added_by");

            migrationBuilder.CreateIndex(
                name: "added_for",
                table: "goal_checklist",
                column: "added_for");

            migrationBuilder.CreateIndex(
                name: "idx_goal3",
                table: "goal_checklist",
                column: "goal_id");

            migrationBuilder.CreateIndex(
                name: "commented_by",
                table: "goal_comments",
                column: "commented_by");

            migrationBuilder.CreateIndex(
                name: "idx_goal4",
                table: "goal_comments",
                column: "goal_id");

            migrationBuilder.CreateIndex(
                name: "idx_checklist",
                table: "goalchecklistprogress",
                column: "checklist_id");

            migrationBuilder.CreateIndex(
                name: "idx_user",
                table: "goalchecklistprogress",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "idx_goal5",
                table: "goalprogresslog",
                column: "goal_id");

            migrationBuilder.CreateIndex(
                name: "idx_updated_on",
                table: "goalprogresslog",
                column: "updated_on");

            migrationBuilder.CreateIndex(
                name: "updated_by",
                table: "goalprogresslog",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "idx_closed_by",
                table: "goals",
                column: "closed_by");

            migrationBuilder.CreateIndex(
                name: "idx_created_by",
                table: "goals",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "idx_goal_status",
                table: "goals",
                column: "goalstatus");

            migrationBuilder.CreateIndex(
                name: "project_id",
                table: "goals",
                column: "project_id");

            migrationBuilder.CreateIndex(
                name: "reopened_by",
                table: "goals",
                column: "reopened_by");

            migrationBuilder.CreateIndex(
                name: "FK_FormResponse_ReviewedBy",
                table: "hrfeedbackformresponses",
                column: "ReviewedByHRId");

            migrationBuilder.CreateIndex(
                name: "idx_form2",
                table: "hrfeedbackformresponses",
                column: "FormId");

            migrationBuilder.CreateIndex(
                name: "idx_status3",
                table: "hrfeedbackformresponses",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "idx_submitted_by1",
                table: "hrfeedbackformresponses",
                column: "SubmittedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_created_by1",
                table: "hrfeedbackforms",
                column: "CreatedByHRId");

            migrationBuilder.CreateIndex(
                name: "idx_form_type",
                table: "hrfeedbackforms",
                column: "FormType");

            migrationBuilder.CreateIndex(
                name: "idx_status2",
                table: "hrfeedbackforms",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "DepartmentId",
                table: "internalopportunities",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "idx_deadline",
                table: "internalopportunities",
                column: "Deadline");

            migrationBuilder.CreateIndex(
                name: "idx_status4",
                table: "internalopportunities",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "PostedByUserId",
                table: "internalopportunities",
                column: "PostedByUserId");

            migrationBuilder.CreateIndex(
                name: "idx_timestamp1",
                table: "leadershipauditlog",
                column: "timestamp");

            migrationBuilder.CreateIndex(
                name: "idx_user1",
                table: "leadershipauditlog",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "FK_LndApprovals_Approver",
                table: "lndapprovals",
                column: "ApproverEmployeeId");

            migrationBuilder.CreateIndex(
                name: "FK_LndApprovals_Attachment",
                table: "lndapprovals",
                column: "AttachmentId");

            migrationBuilder.CreateIndex(
                name: "FK_LndApprovals_Requester",
                table: "lndapprovals",
                column: "RequesterEmployeeId");

            migrationBuilder.CreateIndex(
                name: "FK_LndApprovals_Skill",
                table: "lndapprovals",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "IX_LndApprovals_AssignmentId",
                table: "lndapprovals",
                column: "AssignmentId");

            migrationBuilder.CreateIndex(
                name: "IX_LndApprovals_Type_Status",
                table: "lndapprovals",
                columns: new[] { "ApprovalType", "Status" });

            migrationBuilder.CreateIndex(
                name: "FK_LnDAssignments_CreatedBy",
                table: "lndassignments",
                column: "CreatedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "FK_LnDAssignments_Skill",
                table: "lndassignments",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "FK_LnDAssignments_UpdatedBy",
                table: "lndassignments",
                column: "UpdatedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_LnDAssignments_Mentee_Status",
                table: "lndassignments",
                columns: new[] { "MenteeEmployeeId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_LndAssignments_ProofFilePath",
                table: "lndassignments",
                column: "ProofFilePath");

            migrationBuilder.CreateIndex(
                name: "IX_LnDAssignments_Sme_Status",
                table: "lndassignments",
                columns: new[] { "SmeId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_LndAssignments_Status_Deadline",
                table: "lndassignments",
                columns: new[] { "Status", "Deadline" });

            migrationBuilder.CreateIndex(
                name: "IX_LnDAttachments_CreatedBy_Type",
                table: "lndattachments",
                columns: new[] { "CreatedByEmployeeId", "AttachmentType" });

            migrationBuilder.CreateIndex(
                name: "FK_EmployeeSkillMapper_CreatedBy",
                table: "lndemployeeskillmapper",
                column: "CreatedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "FK_EmployeeSkillMapper_Skill",
                table: "lndemployeeskillmapper",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "FK_EmployeeSkillMapper_UpdatedBy",
                table: "lndemployeeskillmapper",
                column: "UpdatedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeSkillMapper_Rating_Employee",
                table: "lndemployeeskillmapper",
                columns: new[] { "EmployeeId", "Rating" });

            migrationBuilder.CreateIndex(
                name: "UK_Employee_Skill",
                table: "lndemployeeskillmapper",
                columns: new[] { "EmployeeId", "SkillId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "FK_SME_ApprovedBy",
                table: "lndsme",
                column: "ApprovedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "FK_SME_Attachment",
                table: "lndsme",
                column: "AttachmentId");

            migrationBuilder.CreateIndex(
                name: "FK_SME_Employee",
                table: "lndsme",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_SME_Skill_Approved",
                table: "lndsme",
                columns: new[] { "SkillId", "ApprovedByEmployeeId" });

            migrationBuilder.CreateIndex(
                name: "idx_attempt_time",
                table: "loginattempts",
                column: "AttemptTime");

            migrationBuilder.CreateIndex(
                name: "idx_email",
                table: "loginattempts",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "idx_ip_address",
                table: "loginattempts",
                column: "IpAddress");

            migrationBuilder.CreateIndex(
                name: "idx_is_successful",
                table: "loginattempts",
                column: "IsSuccessful");

            migrationBuilder.CreateIndex(
                name: "idx_user_id",
                table: "loginattempts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "idx_nomination",
                table: "managernominationtracking",
                column: "NominationId");

            migrationBuilder.CreateIndex(
                name: "idx_viewed_by",
                table: "managernominationtracking",
                column: "ViewedByUserId");

            migrationBuilder.CreateIndex(
                name: "idx_goal6",
                table: "managerreviewcomments",
                column: "TargetGoalId");

            migrationBuilder.CreateIndex(
                name: "idx_manager",
                table: "managerreviewcomments",
                column: "ManagerEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_rating1",
                table: "managerreviewcomments",
                column: "Rating");

            migrationBuilder.CreateIndex(
                name: "idx_status5",
                table: "managerreviewcomments",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "idx_target_employee",
                table: "managerreviewcomments",
                column: "TargetEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Master_Skill_Name",
                table: "master_skill",
                column: "SkillName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_employee4",
                table: "meetingmom",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_meeting_date1",
                table: "meetingmom",
                column: "MeetingDate");

            migrationBuilder.CreateIndex(
                name: "idx_employee5",
                table: "meetingparticipants",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_meeting",
                table: "meetingparticipants",
                column: "MeetingId");

            migrationBuilder.CreateIndex(
                name: "idx_rsvp_status",
                table: "meetingparticipants",
                column: "RSVPStatus");

            migrationBuilder.CreateIndex(
                name: "unique_meeting_participant",
                table: "meetingparticipants",
                columns: new[] { "MeetingId", "EmployeeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_meeting_date",
                table: "meetings",
                column: "MeetingDate");

            migrationBuilder.CreateIndex(
                name: "idx_meeting_type",
                table: "meetings",
                column: "MeetingType");

            migrationBuilder.CreateIndex(
                name: "idx_scheduled_by",
                table: "meetings",
                column: "ScheduledByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_status6",
                table: "meetings",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "idx_mentor",
                table: "mentorfeedback",
                column: "MentorEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_submitted_by2",
                table: "mentorfeedback",
                column: "SubmittedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "FK_MentorFeedback_ReviewedBy",
                table: "mentorfeedbacktracking",
                column: "ReviewedByHRId");

            migrationBuilder.CreateIndex(
                name: "FK_MentorFeedback_Skill",
                table: "mentorfeedbacktracking",
                column: "SkillIdReference");

            migrationBuilder.CreateIndex(
                name: "FK_MentorFeedback_SubmittedBy",
                table: "mentorfeedbacktracking",
                column: "SubmittedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_feedback_from",
                table: "mentorfeedbacktracking",
                column: "FeedbackFrom");

            migrationBuilder.CreateIndex(
                name: "idx_mentee",
                table: "mentorfeedbacktracking",
                column: "MenteeEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_mentor1",
                table: "mentorfeedbacktracking",
                column: "MentorEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_rating2",
                table: "mentorfeedbacktracking",
                column: "Rating");

            migrationBuilder.CreateIndex(
                name: "idx_sme",
                table: "mentorfeedbacktracking",
                column: "SmeId");

            migrationBuilder.CreateIndex(
                name: "idx_status7",
                table: "mentorfeedbacktracking",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "idx_meeting_date2",
                table: "mom",
                column: "MeetingDate");

            migrationBuilder.CreateIndex(
                name: "idx_meeting_id",
                table: "mom",
                column: "MeetingId");

            migrationBuilder.CreateIndex(
                name: "idx_meeting_type1",
                table: "mom",
                column: "MeetingType");

            migrationBuilder.CreateIndex(
                name: "idx_submitted_by3",
                table: "mom",
                column: "SubmittedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_submitted_role",
                table: "mom",
                column: "SubmittedByRole");

            migrationBuilder.CreateIndex(
                name: "idx_assigned_status",
                table: "momactionitems",
                columns: new[] { "AssignedToEmployeeId", "Status" });

            migrationBuilder.CreateIndex(
                name: "idx_assigned_to1",
                table: "momactionitems",
                column: "AssignedToEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_due_date",
                table: "momactionitems",
                column: "DueDate");

            migrationBuilder.CreateIndex(
                name: "idx_mom",
                table: "momactionitems",
                column: "MOMId");

            migrationBuilder.CreateIndex(
                name: "idx_status8",
                table: "momactionitems",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "idx_mom1",
                table: "momdiscussionpoints",
                column: "MOMId");

            migrationBuilder.CreateIndex(
                name: "idx_point_order",
                table: "momdiscussionpoints",
                column: "PointOrder");

            migrationBuilder.CreateIndex(
                name: "idx_mom2",
                table: "momsharing",
                column: "MOMId");

            migrationBuilder.CreateIndex(
                name: "idx_shared_by",
                table: "momsharing",
                column: "SharedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_shared_with",
                table: "momsharing",
                column: "SharedWithEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_shared_with_date",
                table: "momsharing",
                columns: new[] { "SharedWithEmployeeId", "SharedAt" });

            migrationBuilder.CreateIndex(
                name: "idx_reward_type",
                table: "nominationparameter",
                column: "RewardTypeId");

            migrationBuilder.CreateIndex(
                name: "idx_sort",
                table: "nominationparameter",
                column: "SortOrder");

            migrationBuilder.CreateIndex(
                name: "idx_nomination1",
                table: "nominationparametervalues",
                column: "NominationId");

            migrationBuilder.CreateIndex(
                name: "idx_parameter",
                table: "nominationparametervalues",
                column: "ParameterId");

            migrationBuilder.CreateIndex(
                name: "unique_nomination_parameter",
                table: "nominationparametervalues",
                columns: new[] { "NominationId", "ParameterId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_nomination2",
                table: "nominationreviewmetrics",
                column: "NominationId");

            migrationBuilder.CreateIndex(
                name: "ReviewedByUserId1",
                table: "nominationreviewmetrics",
                column: "ReviewedByUserId");

            migrationBuilder.CreateIndex(
                name: "idx_approval_level",
                table: "nominations",
                columns: new[] { "CurrentApprovalLevel", "Status" });

            migrationBuilder.CreateIndex(
                name: "idx_depthead",
                table: "nominations",
                columns: new[] { "DeptHeadUserId", "CurrentApprovalLevel", "Status" });

            migrationBuilder.CreateIndex(
                name: "idx_l1_manager",
                table: "nominations",
                columns: new[] { "L1ManagerUserId", "CurrentApprovalLevel", "Status" });

            migrationBuilder.CreateIndex(
                name: "idx_l2_manager",
                table: "nominations",
                columns: new[] { "L2ManagerUserId", "CurrentApprovalLevel", "Status" });

            migrationBuilder.CreateIndex(
                name: "idx_nominee",
                table: "nominations",
                column: "NomineeUserId");

            migrationBuilder.CreateIndex(
                name: "idx_opportunity",
                table: "nominations",
                column: "OpportunityId");

            migrationBuilder.CreateIndex(
                name: "idx_status9",
                table: "nominations",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "NominatedByUserId",
                table: "nominations",
                column: "NominatedByUserId");

            migrationBuilder.CreateIndex(
                name: "ReviewedByUserId",
                table: "nominations",
                column: "ReviewedByUserId");

            migrationBuilder.CreateIndex(
                name: "idx_nomination3",
                table: "nominationvisibilitytracking",
                column: "NominationId");

            migrationBuilder.CreateIndex(
                name: "idx_viewed_at",
                table: "nominationvisibilitytracking",
                column: "ViewedAt");

            migrationBuilder.CreateIndex(
                name: "idx_viewed_by1",
                table: "nominationvisibilitytracking",
                column: "ViewedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "CreatedBy",
                table: "oneononediscussion",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "idx_host",
                table: "oneononediscussion",
                column: "HostEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_scheduled_at",
                table: "oneononediscussion",
                column: "ScheduledAt");

            migrationBuilder.CreateIndex(
                name: "idx_status10",
                table: "oneononediscussion",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "ParticipantEmployeeId",
                table: "oneononediscussion",
                column: "ParticipantEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_category",
                table: "organizationalpolicies",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "idx_created_by2",
                table: "organizationalpolicies",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "idx_is_published",
                table: "organizationalpolicies",
                column: "IsPublished");

            migrationBuilder.CreateIndex(
                name: "idx_published_at",
                table: "organizationalpolicies",
                column: "PublishedAt");

            migrationBuilder.CreateIndex(
                name: "idx_status11",
                table: "organizationalpolicies",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "PolicyName",
                table: "organizationalpolicies",
                column: "PolicyName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "PublishedBy",
                table: "organizationalpolicies",
                column: "PublishedBy");

            migrationBuilder.CreateIndex(
                name: "FK_OrgGoalFeedback_Manager",
                table: "organizationgoalfeedback",
                column: "ManagerEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_feedback_from1",
                table: "organizationgoalfeedback",
                column: "FeedbackFrom");

            migrationBuilder.CreateIndex(
                name: "idx_org_objective",
                table: "organizationgoalfeedback",
                column: "OrganizationObjectiveId");

            migrationBuilder.CreateIndex(
                name: "idx_rating3",
                table: "organizationgoalfeedback",
                column: "Rating");

            migrationBuilder.CreateIndex(
                name: "idx_status12",
                table: "organizationgoalfeedback",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "idx_submitted_by4",
                table: "organizationgoalfeedback",
                column: "SubmittedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "created_by1",
                table: "organizationwideobjective",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "idx_department3",
                table: "organizationwideobjective",
                column: "department_id");

            migrationBuilder.CreateIndex(
                name: "idx_email_otp",
                table: "otp",
                columns: new[] { "Email", "OtpCode" });

            migrationBuilder.CreateIndex(
                name: "idx_expires_at",
                table: "otp",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "ApprovedByUserId",
                table: "payroll",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "DepartmentId1",
                table: "payroll",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "idx_employee6",
                table: "payroll",
                column: "EmployeeUserId");

            migrationBuilder.CreateIndex(
                name: "idx_period",
                table: "payroll",
                column: "PayrollPeriod");

            migrationBuilder.CreateIndex(
                name: "idx_status13",
                table: "payroll",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "idx_peer",
                table: "peerfeedback",
                column: "PeerEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_submitted_by5",
                table: "peerfeedback",
                column: "SubmittedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_approved_by",
                table: "peerfeedbackqueue",
                column: "ApprovedByHRId");

            migrationBuilder.CreateIndex(
                name: "idx_recipient1",
                table: "peerfeedbackqueue",
                column: "RecipientEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_status14",
                table: "peerfeedbackqueue",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "idx_submitted_by6",
                table: "peerfeedbackqueue",
                column: "SubmittedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "EscalatedToUserId",
                table: "policyviolations",
                column: "EscalatedToUserId");

            migrationBuilder.CreateIndex(
                name: "idx_employee7",
                table: "policyviolations",
                column: "EmployeeUserId");

            migrationBuilder.CreateIndex(
                name: "idx_severity",
                table: "policyviolations",
                column: "Severity");

            migrationBuilder.CreateIndex(
                name: "idx_status15",
                table: "policyviolations",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "PolicyId",
                table: "policyviolations",
                column: "PolicyId");

            migrationBuilder.CreateIndex(
                name: "ReportedByUserId",
                table: "policyviolations",
                column: "ReportedByUserId");

            migrationBuilder.CreateIndex(
                name: "ApprovedByUserId1",
                table: "profilechangerequests",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "idx_status16",
                table: "profilechangerequests",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "idx_user2",
                table: "profilechangerequests",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "idx_project_name",
                table: "project",
                column: "ProjectName");

            migrationBuilder.CreateIndex(
                name: "idx_status17",
                table: "project",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "L1ApproverEmployeeId",
                table: "project",
                column: "L1ApproverEmployeeId");

            migrationBuilder.CreateIndex(
                name: "L2ApproverEmployeeId",
                table: "project",
                column: "L2ApproverEmployeeId");

            migrationBuilder.CreateIndex(
                name: "ResourceOwnerEmployeeId",
                table: "project",
                column: "ResourceOwnerEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_employee8",
                table: "projectemployees",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_project",
                table: "projectemployees",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "idx_projectemployees_isPrimary",
                table: "projectemployees",
                columns: new[] { "ProjectId", "isPrimary" });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectGoalFeedback_EmployeeMasterId",
                table: "projectgoalfeedback",
                column: "EmployeeMasterId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectGoalFeedback_GoalId",
                table: "projectgoalfeedback",
                column: "GoalId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectGoalFeedback_ProjectGoal",
                table: "projectgoalfeedback",
                columns: new[] { "ProjectId", "GoalId" });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectGoalFeedback_ProjectId",
                table: "projectgoalfeedback",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectGoalFeedback_Rating",
                table: "projectgoalfeedback",
                column: "Rating");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectGoalFeedback_SubmittedAt",
                table: "projectgoalfeedback",
                column: "SubmittedAt",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "idx_employee10",
                table: "promotionhistory",
                column: "EmployeeUserId");

            migrationBuilder.CreateIndex(
                name: "idx_promotion_date1",
                table: "promotionhistory",
                column: "PromotionDate");

            migrationBuilder.CreateIndex(
                name: "PromotionId",
                table: "promotionhistory",
                column: "PromotionId");

            migrationBuilder.CreateIndex(
                name: "ApprovedByUserId2",
                table: "promotions",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "DepartmentId2",
                table: "promotions",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "idx_employee9",
                table: "promotions",
                column: "EmployeeUserId");

            migrationBuilder.CreateIndex(
                name: "idx_promotion_date",
                table: "promotions",
                column: "PromotionDate");

            migrationBuilder.CreateIndex(
                name: "idx_status18",
                table: "promotions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "NominationId",
                table: "promotions",
                column: "NominationId");

            migrationBuilder.CreateIndex(
                name: "idx_deadline1",
                table: "recognitiondetails",
                column: "Deadline");

            migrationBuilder.CreateIndex(
                name: "idx_department4",
                table: "recognitiondetails",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "idx_reward_type1",
                table: "recognitiondetails",
                column: "RewardTypeId");

            migrationBuilder.CreateIndex(
                name: "idx_status19",
                table: "recognitiondetails",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "PostedByUserId1",
                table: "recognitiondetails",
                column: "PostedByUserId");

            migrationBuilder.CreateIndex(
                name: "idx_employee11",
                table: "recognitionrewards",
                column: "employee_id");

            migrationBuilder.CreateIndex(
                name: "idx_reward_type2",
                table: "recognitionrewards",
                column: "reward_type");

            migrationBuilder.CreateIndex(
                name: "submitted_by",
                table: "recognitionrewards",
                column: "submitted_by");

            migrationBuilder.CreateIndex(
                name: "idx_nominator",
                table: "recognitionstatus",
                column: "NominatedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_nominee1",
                table: "recognitionstatus",
                column: "NomineeEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_opportunity1",
                table: "recognitionstatus",
                column: "OpportunityId");

            migrationBuilder.CreateIndex(
                name: "idx_status20",
                table: "recognitionstatus",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "idx_submitted_at1",
                table: "recognitionstatus",
                column: "SubmittedAt");

            migrationBuilder.CreateIndex(
                name: "ReviewedByEmployeeId",
                table: "recognitionstatus",
                column: "ReviewedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_created_at1",
                table: "refreshtokens",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "idx_expires_at1",
                table: "refreshtokens",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "idx_is_revoked",
                table: "refreshtokens",
                column: "IsRevoked");

            migrationBuilder.CreateIndex(
                name: "idx_token",
                table: "refreshtokens",
                column: "Token",
                unique: true)
                .Annotation("MySql:IndexPrefixLength", new[] { 255 });

            migrationBuilder.CreateIndex(
                name: "idx_user_id1",
                table: "refreshtokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "idx_generated_by",
                table: "reports",
                column: "generated_by");

            migrationBuilder.CreateIndex(
                name: "idx_submission_date",
                table: "reports",
                column: "submission_date");

            migrationBuilder.CreateIndex(
                name: "idx_goal7",
                table: "review",
                column: "GoalId");

            migrationBuilder.CreateIndex(
                name: "idx_submitted_by7",
                table: "review",
                column: "SubmittedBy");

            migrationBuilder.CreateIndex(
                name: "CreatedBy1",
                table: "rewardtype",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "idx_active",
                table: "rewardtype",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "idx_category1",
                table: "rewardtype",
                column: "RewardCategory");

            migrationBuilder.CreateIndex(
                name: "idx_manager_visible",
                table: "rewardtype",
                column: "IsVisibleForManagerNomination");

            migrationBuilder.CreateIndex(
                name: "idx_department5",
                table: "risk",
                column: "department_id");

            migrationBuilder.CreateIndex(
                name: "idx_risk_type",
                table: "risk",
                column: "risk_type");

            migrationBuilder.CreateIndex(
                name: "idx_role_code",
                table: "role",
                column: "RoleCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_role_name",
                table: "role",
                column: "RoleName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_employee12",
                table: "selfassessment",
                column: "employee_id");

            migrationBuilder.CreateIndex(
                name: "idx_form3",
                table: "selfassessment",
                column: "form_id");

            migrationBuilder.CreateIndex(
                name: "idx_assessment1",
                table: "selfassessmentattachment",
                column: "assessment_id");

            migrationBuilder.CreateIndex(
                name: "idx_uploaded_at",
                table: "selfassessmentattachment",
                column: "uploaded_at");

            migrationBuilder.CreateIndex(
                name: "idx_uploaded_by",
                table: "selfassessmentattachment",
                column: "uploaded_by");

            migrationBuilder.CreateIndex(
                name: "idx_sla_AssignedToEmployeeId",
                table: "sla",
                column: "AssignedToEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_sla_ComplianceStatus",
                table: "sla",
                column: "ComplianceStatus");

            migrationBuilder.CreateIndex(
                name: "idx_sla_CreatedByEmployeeId",
                table: "sla",
                column: "CreatedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_sla_Deadline",
                table: "sla",
                column: "Deadline");

            migrationBuilder.CreateIndex(
                name: "idx_sla_DepartmentId",
                table: "sla",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "idx_sla_EmployeeId",
                table: "sla",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_sla_RelatedEntityType",
                table: "sla",
                column: "RelatedEntityType");

            migrationBuilder.CreateIndex(
                name: "idx_sla_ReopenedByEmployeeId",
                table: "sla",
                column: "ReopenedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_sla_SLAType",
                table: "sla",
                column: "SLAType");

            migrationBuilder.CreateIndex(
                name: "idx_sla_Status",
                table: "sla",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "idx_slacompliance_CalculatedBy",
                table: "slacompliance",
                column: "CalculatedBy");

            migrationBuilder.CreateIndex(
                name: "idx_slacompliance_DepartmentId",
                table: "slacompliance",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "idx_slacompliance_Period",
                table: "slacompliance",
                column: "Period");

            migrationBuilder.CreateIndex(
                name: "idx_slaescalation_EscalatedToEmployeeId",
                table: "slaescalation",
                column: "EscalatedToEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_slaescalation_EscalationLevel",
                table: "slaescalation",
                column: "EscalationLevel");

            migrationBuilder.CreateIndex(
                name: "idx_slaescalation_EscalationStatus",
                table: "slaescalation",
                column: "EscalationStatus");

            migrationBuilder.CreateIndex(
                name: "idx_slaescalation_ResolvedByEmployeeId",
                table: "slaescalation",
                column: "ResolvedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_slaescalation_SLAId",
                table: "slaescalation",
                column: "SLAId");

            migrationBuilder.CreateIndex(
                name: "idx_slaescalation_SubmittedByEmployeeId",
                table: "slaescalation",
                column: "SubmittedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_slahistory_ChangedByEmployeeId",
                table: "slahistory",
                column: "ChangedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_slahistory_ChangeType",
                table: "slahistory",
                column: "ChangeType");

            migrationBuilder.CreateIndex(
                name: "idx_slahistory_ReferenceEscalationId",
                table: "slahistory",
                column: "ReferenceEscalationId");

            migrationBuilder.CreateIndex(
                name: "idx_slahistory_SLAId",
                table: "slahistory",
                column: "SLAId");

            migrationBuilder.CreateIndex(
                name: "idx_slanotifications_EmployeeId",
                table: "slanotifications",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_slanotifications_NotificationType",
                table: "slanotifications",
                column: "NotificationType");

            migrationBuilder.CreateIndex(
                name: "idx_slanotifications_SLAId",
                table: "slanotifications",
                column: "SLAId");

            migrationBuilder.CreateIndex(
                name: "idx_slareviewtracking_Deadline",
                table: "slareviewtracking",
                column: "Deadline");

            migrationBuilder.CreateIndex(
                name: "idx_slareviewtracking_EmployeeId",
                table: "slareviewtracking",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "idx_slareviewtracking_FormId",
                table: "slareviewtracking",
                column: "FormId");

            migrationBuilder.CreateIndex(
                name: "idx_slareviewtracking_ManagerReviewerId",
                table: "slareviewtracking",
                column: "ManagerReviewerId");

            migrationBuilder.CreateIndex(
                name: "idx_slareviewtracking_ReviewerId",
                table: "slareviewtracking",
                column: "ReviewerId");

            migrationBuilder.CreateIndex(
                name: "idx_slareviewtracking_SLAId",
                table: "slareviewtracking",
                column: "SLAId");

            migrationBuilder.CreateIndex(
                name: "idx_manager1",
                table: "teamworkload",
                column: "ManagerUserId");

            migrationBuilder.CreateIndex(
                name: "idx_status21",
                table: "teamworkload",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "Email",
                table: "userauthentication",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "EmployeeId",
                table: "userauthentication",
                column: "EmployeeId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_status22",
                table: "userauthentication",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "EmployeeId1",
                table: "userprofile",
                column: "EmployeeId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_full_name",
                table: "userprofile",
                columns: new[] { "FirstName", "LastName" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "address");

            migrationBuilder.DropTable(
                name: "assessmentreview");

            migrationBuilder.DropTable(
                name: "auditlogs");

            migrationBuilder.DropTable(
                name: "budgetallocations");

            migrationBuilder.DropTable(
                name: "budgetperiodallocations");

            migrationBuilder.DropTable(
                name: "bulkoperationlogs");

            migrationBuilder.DropTable(
                name: "changerequests");

            migrationBuilder.DropTable(
                name: "departmentheadapprovals");

            migrationBuilder.DropTable(
                name: "engagement");

            migrationBuilder.DropTable(
                name: "feedbackedithistory");

            migrationBuilder.DropTable(
                name: "feedbackquestionresponse");

            migrationBuilder.DropTable(
                name: "formprogresstracker");

            migrationBuilder.DropTable(
                name: "goal_assignment");

            migrationBuilder.DropTable(
                name: "goal_attachments");

            migrationBuilder.DropTable(
                name: "goal_comments");

            migrationBuilder.DropTable(
                name: "goalchecklistprogress");

            migrationBuilder.DropTable(
                name: "goalprogresslog");

            migrationBuilder.DropTable(
                name: "hrfeedbackformresponses");

            migrationBuilder.DropTable(
                name: "leadershipauditlog");

            migrationBuilder.DropTable(
                name: "lndapprovals");

            migrationBuilder.DropTable(
                name: "lndemployeeskillmapper");

            migrationBuilder.DropTable(
                name: "loginattempts");

            migrationBuilder.DropTable(
                name: "managernominationtracking");

            migrationBuilder.DropTable(
                name: "managerreviewcomments");

            migrationBuilder.DropTable(
                name: "meetingmom");

            migrationBuilder.DropTable(
                name: "meetingparticipants");

            migrationBuilder.DropTable(
                name: "mentorfeedback");

            migrationBuilder.DropTable(
                name: "mentorfeedbacktracking");

            migrationBuilder.DropTable(
                name: "momactionitems");

            migrationBuilder.DropTable(
                name: "momdiscussionpoints");

            migrationBuilder.DropTable(
                name: "momsharing");

            migrationBuilder.DropTable(
                name: "nominationparametervalues");

            migrationBuilder.DropTable(
                name: "nominationreviewmetrics");

            migrationBuilder.DropTable(
                name: "nominationvisibilitytracking");

            migrationBuilder.DropTable(
                name: "oneononediscussion");

            migrationBuilder.DropTable(
                name: "organizationgoalfeedback");

            migrationBuilder.DropTable(
                name: "otp");

            migrationBuilder.DropTable(
                name: "payroll");

            migrationBuilder.DropTable(
                name: "peerfeedback");

            migrationBuilder.DropTable(
                name: "peerfeedbackqueue");

            migrationBuilder.DropTable(
                name: "policyviolations");

            migrationBuilder.DropTable(
                name: "profilechangerequests");

            migrationBuilder.DropTable(
                name: "projectemployees");

            migrationBuilder.DropTable(
                name: "projectgoalfeedback");

            migrationBuilder.DropTable(
                name: "promotionhistory");

            migrationBuilder.DropTable(
                name: "recognitionrewards");

            migrationBuilder.DropTable(
                name: "refreshtokens");

            migrationBuilder.DropTable(
                name: "reports");

            migrationBuilder.DropTable(
                name: "review");

            migrationBuilder.DropTable(
                name: "risk");

            migrationBuilder.DropTable(
                name: "selfassessmentattachment");

            migrationBuilder.DropTable(
                name: "slacompliance");

            migrationBuilder.DropTable(
                name: "slahistory");

            migrationBuilder.DropTable(
                name: "slanotifications");

            migrationBuilder.DropTable(
                name: "slareviewtracking");

            migrationBuilder.DropTable(
                name: "teamworkload");

            migrationBuilder.DropTable(
                name: "userprofile");

            migrationBuilder.DropTable(
                name: "assessmentdetail");

            migrationBuilder.DropTable(
                name: "departmentbudgets");

            migrationBuilder.DropTable(
                name: "feedback");

            migrationBuilder.DropTable(
                name: "feedbackquestion");

            migrationBuilder.DropTable(
                name: "assignment");

            migrationBuilder.DropTable(
                name: "goal_approvals");

            migrationBuilder.DropTable(
                name: "goal_checklist");

            migrationBuilder.DropTable(
                name: "hrfeedbackforms");

            migrationBuilder.DropTable(
                name: "lndassignments");

            migrationBuilder.DropTable(
                name: "mom");

            migrationBuilder.DropTable(
                name: "nominationparameter");

            migrationBuilder.DropTable(
                name: "recognitionstatus");

            migrationBuilder.DropTable(
                name: "organizationwideobjective");

            migrationBuilder.DropTable(
                name: "organizationalpolicies");

            migrationBuilder.DropTable(
                name: "promotions");

            migrationBuilder.DropTable(
                name: "slaescalation");

            migrationBuilder.DropTable(
                name: "selfassessment");

            migrationBuilder.DropTable(
                name: "competency");

            migrationBuilder.DropTable(
                name: "goals");

            migrationBuilder.DropTable(
                name: "lndsme");

            migrationBuilder.DropTable(
                name: "meetings");

            migrationBuilder.DropTable(
                name: "recognitiondetails");

            migrationBuilder.DropTable(
                name: "nominations");

            migrationBuilder.DropTable(
                name: "sla");

            migrationBuilder.DropTable(
                name: "assessmentform");

            migrationBuilder.DropTable(
                name: "project");

            migrationBuilder.DropTable(
                name: "lndattachments");

            migrationBuilder.DropTable(
                name: "master_skill");

            migrationBuilder.DropTable(
                name: "rewardtype");

            migrationBuilder.DropTable(
                name: "internalopportunities");

            migrationBuilder.DropTable(
                name: "employeedetailsmaster");

            migrationBuilder.DropTable(
                name: "userauthentication");

            migrationBuilder.DropTable(
                name: "role");

            migrationBuilder.DropTable(
                name: "department");

            migrationBuilder.DropTable(
                name: "employee");
        }
    }
}
