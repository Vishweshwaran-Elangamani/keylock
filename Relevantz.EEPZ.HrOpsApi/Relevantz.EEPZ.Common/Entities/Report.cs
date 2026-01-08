using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Report
{
    public int ReportId { get; set; }
    public string? Title { get; set; }
    public string? Summary { get; set; }
    public int? GeneratedBy { get; set; }
    public DateTime? SubmissionDate { get; set; }
    public string? PdfPath { get; set; }
    public string? ExcelPath { get; set; }
    public virtual Userauthentication? GeneratedByNavigation { get; set; }
}
