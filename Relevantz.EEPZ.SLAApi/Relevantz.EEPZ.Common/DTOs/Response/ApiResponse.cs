namespace Relevantz.EEPZ.Common.DTOs.Response
{
  public class ApiResponse<T>
{
    public int StatusCode { get; set; }
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }
    public string? CorrelationId { get; set; }
}

}
