using DataCentreWebServer.Helpers;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Web;
using System.Linq;

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
                var rootPath = HttpRuntime.AppDomainAppPath.TrimEnd('\\');
                var filePath = rootPath + Constants.MachineLearning.MachineLearningFile;
                var lines = File.ReadAllLines(filePath);

                List<string[]> totalResults = new List<string[]>();
                //Each line is from a unique node
                foreach (var line in lines)
                {
                    if (line.StartsWith(hostRequestingAllResults))
                    {
                        continue;
                    }

                    //Get components of line
                    var lineWithoutHost = line.Substring(line.LastIndexOf(':') + 1, line.Length - ( line.LastIndexOf(':') + 1));
                    var results = lineWithoutHost.Split(';');
                    foreach(var result in results)
                    {
                        if(result.Length == 0)
                        {
                            continue;
                        }

                        //If the choice has already been recorded in the list
                        var rawChoice = result.Substring(0, result.LastIndexOf(' '));
                        var rawCount = result.Substring(result.LastIndexOf(' '), result.Length - result.LastIndexOf(' '));

                        if (totalResults.FirstOrDefault(x => x[0].Equals(rawChoice)) != null)
                        {
                            var existingRawValue = totalResults.FirstOrDefault(x => x[0].Equals(rawChoice))[1];
                            var existingIntValue = int.Parse(existingRawValue);
                            var countInt = int.Parse(rawCount);
                            var newCount = (existingIntValue + countInt).ToString();

                            //We know this won't be null because of the if statement above
                            totalResults.FirstOrDefault(x => x[0].Equals(rawChoice))[1] = newCount;
                        }
                        else
                        {
                            totalResults.Add(new string[2] { rawChoice, rawCount });
                        }
                    }                    
                }

                return totalResults.ToArray();
            }
            catch(Exception ex)
            {
                LoggerHelper.Log("An error occurred while counting the results: " + ex.Message + "\n" + ex.StackTrace);
            }
            finally
            {
                _readWriteLock.ExitReadLock();
            }

            return null;
        }
    }
}