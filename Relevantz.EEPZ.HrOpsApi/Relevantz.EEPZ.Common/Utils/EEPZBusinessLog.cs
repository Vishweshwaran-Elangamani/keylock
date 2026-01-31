using Microsoft.Extensions.Logging;

namespace Relevantz.EEPZ.Common.Utils
{
    public static class EEPZBusinessLog
    {
        private static ILoggerFactory? _loggerFactory;
        private static readonly object _lock = new object();

        // Initialize with ILoggerFactory
        public static void Initialize(ILoggerFactory loggerFactory)
        {
            lock (_lock)
            {
                _loggerFactory = loggerFactory ?? throw new ArgumentNullException(nameof(loggerFactory));
            }
        }

        private static ILogger GetLogger(string categoryName)
        {
            if (_loggerFactory == null)
            {
                throw new InvalidOperationException("EEPZBusinessLog has not been initialized. Call Initialize() first.");
            }
            return _loggerFactory.CreateLogger(categoryName);
        }

        // ===========================
        // SERVICE LOGGING METHODS
        // ===========================

        public static void LogServiceInformation(string message, params object?[] args)
        {
            var logger = GetLogger("Service");
            logger.LogInformation(message, args);
        }

        public static void LogServiceWarning(string message, params object?[] args)
        {
            var logger = GetLogger("Service");
            logger.LogWarning(message, args);
        }

        public static void LogServiceError(string message, Exception? exception, params object?[] args)
        {
            var logger = GetLogger("Service");
            if (exception != null) logger.LogError(exception, message, args);
            else logger.LogError(message, args);
        }

        public static void LogServiceDebug(string message, params object?[] args)
        {
            var logger = GetLogger("Service");
            logger.LogDebug(message, args);
        }

        public static void LogServiceTrace(string message, params object?[] args)
        {
            var logger = GetLogger("Service");
            logger.LogTrace(message, args);
        }

        // ===========================
        // BUSINESS LOGGING METHODS
        // ===========================

        public static void LogBusinessInformation(string message, params object?[] args)
        {
            var logger = GetLogger("Business");
            logger.LogInformation(message, args);
        }

        public static void LogBusinessWarning(string message, params object?[] args)
        {
            var logger = GetLogger("Business");
            logger.LogWarning(message, args);
        }

        public static void LogBusinessError(string message, Exception? exception, params object?[] args)
        {
            var logger = GetLogger("Business");
            if (exception != null)
                logger.LogError(exception, message, args);
            else
                logger.LogError(message, args);
        }

        // (Optional existing methods - kept unchanged)
        public static void LogBusinessDebug(string message, params object?[] args)
        {
            var logger = GetLogger("Business");
            logger.LogDebug(message, args);
        }

        public static void LogBusinessTrace(string message, params object?[] args)
        {
            var logger = GetLogger("Business");
            logger.LogTrace(message, args);
        }

        // ===========================
        // REPOSITORY LOGGING METHODS
        // ===========================

        public static void LogRepositoryInformation(string message, params object?[] args)
        {
            var logger = GetLogger("Repository");
            logger.LogInformation(message, args);
        }

        public static void LogRepositoryWarning(string message, params object?[] args)
        {
            var logger = GetLogger("Repository");
            logger.LogWarning(message, args);
        }

        public static void LogRepositoryError(string message, Exception? exception, params object?[] args)
        {
            var logger = GetLogger("Repository");
            if (exception != null) logger.LogError(exception, message, args);
            else logger.LogError(message, args);
        }

        // ===========================
        // GENERAL LOGGING METHODS
        // ===========================

        public static void LogInformation(string message, params object?[] args)
        {
            var logger = GetLogger("Application");
            logger.LogInformation(message, args);
        }

        public static void LogWarning(string message, params object?[] args)
        {
            var logger = GetLogger("Application");
            logger.LogWarning(message, args);
        }

        public static void LogError(string message, Exception? exception, params object?[] args)
        {
            var logger = GetLogger("Application");
            if (exception != null) logger.LogError(exception, message, args);
            else logger.LogError(message, args);
        }

        public static void LogDebug(string message, params object?[] args)
        {
            var logger = GetLogger("Application");
            logger.LogDebug(message, args);
        }

        public static void LogTrace(string message, params object?[] args)
        {
            var logger = GetLogger("Application");
            logger.LogTrace(message, args);
        }

        public static void LogCritical(string message, Exception? exception, params object?[] args)
        {
            var logger = GetLogger("Application");
            if (exception != null) logger.LogCritical(exception, message, args);
            else logger.LogCritical(message, args);
        }
    }
}
