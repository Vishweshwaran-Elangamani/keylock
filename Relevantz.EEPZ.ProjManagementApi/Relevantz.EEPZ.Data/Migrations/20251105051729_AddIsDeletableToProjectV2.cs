using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Relevantz.EEPZ.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddIsDeletableToProjectV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDeletable",
                table: "project",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDeletable",
                table: "project");
        }
    }
}
