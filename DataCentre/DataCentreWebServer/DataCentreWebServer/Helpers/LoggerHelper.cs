using System;
using System.IO;

namespace DataCentreWebServer.Helpers
{
    //to help with debugging
    public static class LoggerHelper
    {
        public static void Log(string logText)
        {
            File.AppendAllText("C:\\\\DataCentreLog.txt", logText + Environment.NewLine);
        }
    }
}