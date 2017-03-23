using System;
using System.IO;

namespace DataCentreWebServer.Helpers
{
    public static class LoggerHelper
    {
        public static void Log(string logText)
        {
            File.AppendAllText("C:\\\\DataCentreLog.txt", logText + Environment.NewLine);
        }
    }
}