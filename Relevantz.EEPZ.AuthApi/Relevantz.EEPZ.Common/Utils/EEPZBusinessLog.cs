using Serilog;

namespace Relevantz.EEPZ.Common.Utils
{
    public static class EEPZBusinessLog
    {
        public static void Information(string message)
        {
            Log.Information(message);
        }

        public static void Warning(string message)
        {
            Log.Warning(message);
        }

        public static void Error(string message, Exception? exception = null)
        {
            if (exception != null)
                Log.Error(exception, message);
            else
                Log.Error(message);
        }

        public static void Debug(string message)
        {
            Log.Debug(message);
        }
    }
}
