namespace Relevantz.EEPZ.Common.Enums
{ 
     // File upload constants
    public static class FILE_UPLOAD
    {
        public const long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
        public const int MAX_FILE_SIZE_MB = 10;
        public const int PROOF_ATTACHMENT_MAX_AGE_DAYS = 30;

        public static readonly string[] ALLOWED_EXTENSIONS =
        {
            ".pdf",
            ".doc",
            ".docx",
            ".xls",
            ".xlsx",
            ".png",
            ".jpg",
            ".jpeg",
            ".txt",
            ".zip",
        };

        public static readonly Dictionary<string, string> CONTENT_TYPES = new()
        {
            { ".pdf", "application/pdf" },
            { ".doc", "application/msword" },
            { ".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
            { ".xls", "application/vnd.ms-excel" },
            { ".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
            { ".png", "image/png" },
            { ".jpg", "image/jpeg" },
            { ".jpeg", "image/jpeg" },
            { ".txt", "text/plain" },
            { ".zip", "application/zip" },
        };

        public static readonly string[] IMAGE_EXTENSIONS = { ".png", ".jpg", ".jpeg" };

        public static readonly string[] DOCUMENT_EXTENSIONS = { ".pdf", ".doc", ".docx", ".txt" };

        public static readonly string[] SPREADSHEET_EXTENSIONS = { ".xls", ".xlsx" };

        public static bool IsValidExtension(string extension)
        {
            return ALLOWED_EXTENSIONS.Contains(extension?.ToLowerInvariant() ?? "");
        }

        public static bool IsImage(string extension)
        {
            return IMAGE_EXTENSIONS.Contains(extension?.ToLowerInvariant() ?? "");
        }

        public static bool IsDocument(string extension)
        {
            return DOCUMENT_EXTENSIONS.Contains(extension?.ToLowerInvariant() ?? "");
        }

        public static bool IsSpreadsheet(string extension)
        {
            return SPREADSHEET_EXTENSIONS.Contains(extension?.ToLowerInvariant() ?? "");
        }

        public static string GetContentType(string extension)
        {
            return CONTENT_TYPES.TryGetValue(
                extension?.ToLowerInvariant() ?? "",
                out var contentType
            )
                ? contentType
                : "application/octet-stream";
        }

        public static bool IsValidFileSize(long fileSizeBytes)
        {
            return fileSizeBytes > 0 && fileSizeBytes <= MAX_FILE_SIZE_BYTES;
        }

        public static string GetAllowedExtensionsString()
        {
            return string.Join(", ", ALLOWED_EXTENSIONS.Select(e => e.ToUpper()));
        }
    }

}