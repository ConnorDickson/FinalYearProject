using NLog;
using System;
using System.IO;

namespace DataCentreWebServer.Helpers
{
    public static class LoggerHelper
    {
        private static Logger logger = LogManager.GetCurrentClassLogger();
        public static void Log(string logText)
        {
            logger.Debug(logText);
        }

        public static void LegacyLog(string logText)
        {
            File.AppendAllText("C:\\\\DataCentreLog.txt", logText + Environment.NewLine);
        }
    }
}