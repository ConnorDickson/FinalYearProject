using DataCentreWebServer.Helpers;
using System;
using System.IO;
using System.Threading;
using System.Web;

namespace DataCentreWebServer.MachineLearning
{
    public class MachineLearningFileHandler
    {
        private static ReaderWriterLockSlim _readWriteLock = new ReaderWriterLockSlim(); 

        public void StoreNodeResults(string machineName, string[][] results)
        {
            _readWriteLock.EnterWriteLock();

            try
            {
                var rootPath = HttpRuntime.AppDomainAppPath.TrimEnd('\\');
                var filePath = rootPath + Constants.MachineLearning.MachineLearningFile;

                if (!File.Exists(filePath))
                {
                    using (File.Create(filePath)) { }
                }

                var completedLine = string.Empty;

                for(int i = 0; i < results.Length; i++)
                {
                    completedLine += results[i][0] + " " + results[i][1] + ";";
                }

                completedLine = machineName + ":" + completedLine;

                //If the string already exists we need to update it rather than append
                var lines = File.ReadAllLines(filePath);
                var lineUpdated = false;

                for(int lineCount = 0; lineCount < lines.Length; lineCount++)
                {
                    if (lines[lineCount].StartsWith(machineName))
                    {
                        lines[lineCount] = completedLine;
                        lineUpdated = true;
                    }
                }

                if(lineUpdated)
                {
                    File.WriteAllLines(filePath, lines);
                }
                else
                {
                    File.AppendAllText(filePath, completedLine + Environment.NewLine);
                }
            }
            finally
            {
                _readWriteLock.ExitWriteLock();
            }
        }

        public string[][] AllResultsExcept(string hostRequestingAllResults)
        {
            _readWriteLock.EnterReadLock();

            try
            {
            //read all lines except for the machineName of the requesting host
            //Add all other common ones together. So if M1 and M2 both have TTTTT that becomes TTTTT 2
            //We should trim the first bit up to ':' then split by ';' so we have each result and then substring by ' ' so we have the count
            //dfac90f46307: F,T,F,F,F,F 2; F,F,T,F,F,F 2; F,F,F,T,F,F 4; F,F,F,F,T,F 3;

                return null;
            }
            finally
            {
                _readWriteLock.ExitReadLock();
            }
        }
    }
}